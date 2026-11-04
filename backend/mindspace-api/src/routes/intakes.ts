import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { recordAudit } from "../audit.js";
import { prisma } from "../db.js";
import { requireMember } from "../auth.js";
import { intakeContentCipher } from "../security/intake-content-cipher.js";
import {
  createTranscriber,
  TranscriptionNotConfiguredError,
  TranscriptionServiceError,
} from "../services/transcription.js";
import { config } from "../config.js";

const transcribeAudio = createTranscriber({
  endpoint: config.transcriptionApiUrl,
  apiKey: config.transcriptionApiKey,
  model: config.transcriptionModel,
});
const acceptedAudioTypes = new Map([
  ["audio/webm", "intake.webm"],
  ["audio/ogg", "intake.ogg"],
  ["audio/wav", "intake.wav"],
  ["audio/mpeg", "intake.mp3"],
  ["audio/mp4", "intake.mp4"],
]);
const maximumAudioBytes = 10 * 1024 * 1024;

const uuidPattern = "^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
const protectedOperation = { security: [{ bearerAuth: [] }] };

type CreateIntakeBody = {
  channel: "text" | "voice";
  locale: string;
  consentId: string;
};

type UpdateIntakeBody = {
  locale?: string;
  status?: "completed" | "abandoned";
};

type ListIntakesQuery = {
  page?: number;
  limit?: number;
};

type IntakeParams = { intakeId: string };
type ResponseParams = { intakeId: string; responseId: string };

type CreateResponseBody = {
  sequenceNo: number;
  topicCode?: string;
  responseState: "answered" | "skipped" | "declined";
  sourceType?: "member" | "ai";
  content?: string;
};

function memberIdOf(request: FastifyRequest): string {
  if (!request.memberId) {
    throw new Error("Authenticated member context is missing");
  }
  return request.memberId;
}

function sendApiError(reply: FastifyReply, statusCode: number, code: string, message: string) {
  return reply.code(statusCode).send({ error: { code, message } });
}

async function hasCurrentConsent(memberId: string, purposeCode: string, consentId?: string) {
  const latest = await prisma.consentRecord.findFirst({
    where: { userId: memberId, purposeCode },
    orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
  });
  if (!latest || latest.consentState !== "granted" || (latest.expiresAt && latest.expiresAt <= new Date())) {
    return false;
  }
  return consentId === undefined || latest.id === consentId;
}

function serializeResponse(response: {
  id: string;
  intakeId: string;
  sequenceNo: number;
  topicCode: string | null;
  responseState: string;
  sourceType: string;
  contentCiphertext: Uint8Array | null;
  keyVersion: string | null;
  createdAt: Date;
}) {
  return {
    id: response.id,
    intakeId: response.intakeId,
    sequenceNo: response.sequenceNo,
    topicCode: response.topicCode,
    responseState: response.responseState,
    sourceType: response.sourceType,
    content: response.contentCiphertext && response.keyVersion
      ? intakeContentCipher.decrypt(response.contentCiphertext, response.keyVersion)
      : null,
    createdAt: response.createdAt,
  };
}

function serializeIntake(intake: {
  id: string;
  channel: string;
  status: string;
  locale: string;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}, responses?: ReturnType<typeof serializeResponse>[]) {
  return {
    id: intake.id,
    channel: intake.channel,
    status: intake.status,
    locale: intake.locale,
    startedAt: intake.startedAt,
    completedAt: intake.completedAt,
    createdAt: intake.createdAt,
    updatedAt: intake.updatedAt,
    ...(responses === undefined ? {} : { responses }),
  };
}

const memberResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    intakeId: { type: "string", format: "uuid" },
    sequenceNo: { type: "integer" },
    topicCode: { type: ["string", "null"] },
    responseState: { type: "string", enum: ["answered", "skipped", "declined"] },
    sourceType: { type: "string", enum: ["member", "ai", "system"] },
    content: { type: ["string", "null"], description: "Decrypted only for the authenticated owner." },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "intakeId", "sequenceNo", "responseState", "sourceType", "content", "createdAt"],
} as const;

const intakeResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    channel: { type: "string", enum: ["text", "voice"] },
    status: { type: "string", enum: ["in_progress", "completed", "abandoned", "deleted"] },
    locale: { type: "string" },
    startedAt: { type: "string", format: "date-time" },
    completedAt: { type: ["string", "null"], format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    responses: { type: "array", items: memberResponseSchema },
  },
  required: ["id", "channel", "status", "locale", "startedAt", "completedAt", "createdAt", "updatedAt"],
} as const;

export async function registerIntakeRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateIntakeBody }>("/api/v1/intakes", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Intakes"],
      summary: "Start a chat or voice intake",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["channel", "locale", "consentId"],
        properties: {
          channel: { type: "string", enum: ["text", "voice"] },
          locale: { type: "string", minLength: 2, maxLength: 20 },
          consentId: { type: "string", pattern: uuidPattern },
        },
      },
      response: {
        201: intakeResponseSchema,
        401: { $ref: "ErrorResponse#" },
        403: { $ref: "ErrorResponse#" },
        409: { $ref: "ErrorResponse#" },
      },
    },
  }, async (request, reply) => {
    const memberId = memberIdOf(request);
    if (!await hasCurrentConsent(memberId, "intake", request.body.consentId)) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.create",
        resourceType: "intake_session",
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 403, "INTAKE_CONSENT_REQUIRED", "Current consent for intake is required.");
    }
    if (request.body.channel === "voice" && !await hasCurrentConsent(memberId, "transcription")) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.create",
        resourceType: "intake_session",
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 403, "TRANSCRIPTION_CONSENT_REQUIRED", "Current consent for voice transcription is required.");
    }

    const intake = await prisma.intakeSession.create({
      data: {
        memberId,
        channel: request.body.channel,
        locale: request.body.locale,
        consentId: request.body.consentId,
      },
    });
    await recordAudit({
      actorUserId: memberId,
      actionCode: "intake.create",
      resourceType: "intake_session",
      resourceId: intake.id,
      correlationId: request.id,
    });
    return reply.code(201).send(serializeIntake(intake, []));
  });

  app.get<{ Querystring: ListIntakesQuery }>("/api/v1/intakes", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Intakes"],
      summary: "List the authenticated member's intakes",
      querystring: {
        type: "object",
        additionalProperties: false,
        properties: {
          page: { type: "integer", minimum: 1, maximum: 10000, default: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            items: { type: "array", items: intakeResponseSchema },
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
          },
          required: ["items", "page", "limit", "total"],
        },
        401: { $ref: "ErrorResponse#" },
      },
    },
  }, async (request) => {
    const memberId = memberIdOf(request);
    const page = request.query.page ?? 1;
    const limit = request.query.limit ?? 20;
    const where = { memberId, status: { not: "deleted" } };
    const [items, total] = await Promise.all([
      prisma.intakeSession.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.intakeSession.count({ where }),
    ]);
    await recordAudit({
      actorUserId: memberId,
      actionCode: "intake.list",
      resourceType: "intake_session_collection",
      correlationId: request.id,
    });
    return { items: items.map((item) => serializeIntake(item)), page, limit, total };
  });

  app.get<{ Params: IntakeParams }>("/api/v1/intakes/:intakeId", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Intakes"],
      summary: "Get an intake and its responses",
      params: { type: "object", required: ["intakeId"], properties: { intakeId: { type: "string", pattern: uuidPattern } } },
      response: { 200: intakeResponseSchema, 404: { $ref: "ErrorResponse#" } },
    },
  }, async (request, reply) => {
    const intake = await prisma.intakeSession.findFirst({
      where: { id: request.params.intakeId, memberId: memberIdOf(request), status: { not: "deleted" } },
      include: { responses: { orderBy: { sequenceNo: "asc" } } },
    });
    if (!intake) {
      await recordAudit({
        actorUserId: memberIdOf(request),
        actionCode: "intake.read",
        resourceType: "intake_session",
        resourceId: request.params.intakeId,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 404, "INTAKE_NOT_FOUND", "Intake not found.");
    }
    await recordAudit({
      actorUserId: memberIdOf(request),
      actionCode: "intake.read",
      resourceType: "intake_session",
      resourceId: intake.id,
      correlationId: request.id,
    });
    return serializeIntake(intake, intake.responses.map(serializeResponse));
  });

  app.patch<{ Params: IntakeParams; Body: UpdateIntakeBody }>("/api/v1/intakes/:intakeId", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Intakes"],
      summary: "Update an in-progress intake",
      params: { type: "object", required: ["intakeId"], properties: { intakeId: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
          locale: { type: "string", minLength: 2, maxLength: 20 },
          status: { type: "string", enum: ["completed", "abandoned"] },
        },
      },
      response: { 200: intakeResponseSchema, 404: { $ref: "ErrorResponse#" }, 409: { $ref: "ErrorResponse#" } },
    },
  }, async (request, reply) => {
    const memberId = memberIdOf(request);
    const current = await prisma.intakeSession.findFirst({
      where: { id: request.params.intakeId, memberId, status: { not: "deleted" } },
    });
    if (!current) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.update",
        resourceType: "intake_session",
        resourceId: request.params.intakeId,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 404, "INTAKE_NOT_FOUND", "Intake not found.");
    }
    if (current.status !== "in_progress") {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.update",
        resourceType: "intake_session",
        resourceId: current.id,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 409, "INTAKE_NOT_EDITABLE", "Only an in-progress intake can be updated.");
    }

    const data = {
      ...(request.body.locale === undefined ? {} : { locale: request.body.locale }),
      ...(request.body.status === undefined ? {} : {
        status: request.body.status,
        completedAt: new Date(),
      }),
    };
    const result = await prisma.intakeSession.updateMany({
      where: { id: current.id, memberId, status: "in_progress" },
      data,
    });
    if (result.count !== 1) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.update",
        resourceType: "intake_session",
        resourceId: current.id,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 409, "INTAKE_CHANGED", "The intake changed; reload it and try again.");
    }
    const updated = await prisma.intakeSession.findUniqueOrThrow({ where: { id: current.id } });
    await recordAudit({
      actorUserId: memberId,
      actionCode: "intake.update",
      resourceType: "intake_session",
      resourceId: current.id,
      correlationId: request.id,
    });
    return serializeIntake(updated);
  });

  app.delete<{ Params: IntakeParams }>("/api/v1/intakes/:intakeId", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Intakes"],
      summary: "Mark an intake for deletion",
      description: "Soft-deletes the intake. Sensitive response data is retained until an approved purge policy runs.",
      params: { type: "object", required: ["intakeId"], properties: { intakeId: { type: "string", pattern: uuidPattern } } },
      response: { 204: { type: "null" }, 404: { $ref: "ErrorResponse#" } },
    },
  }, async (request, reply) => {
    const memberId = memberIdOf(request);
    const result = await prisma.intakeSession.updateMany({
      where: {
        id: request.params.intakeId,
        memberId,
        status: { not: "deleted" },
      },
      data: { status: "deleted" },
    });
    if (result.count !== 1) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.delete",
        resourceType: "intake_session",
        resourceId: request.params.intakeId,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 404, "INTAKE_NOT_FOUND", "Intake not found.");
    }
    await recordAudit({
      actorUserId: memberId,
      actionCode: "intake.delete",
      resourceType: "intake_session",
      resourceId: request.params.intakeId,
      correlationId: request.id,
    });
    return reply.code(204).send();
  });

  app.post<{ Params: IntakeParams; Body: CreateResponseBody }>("/api/v1/intakes/:intakeId/responses", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Intakes"],
      summary: "Add a member response to an in-progress intake",
      params: { type: "object", required: ["intakeId"], properties: { intakeId: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["sequenceNo", "responseState"],
        properties: {
          sequenceNo: { type: "integer", minimum: 1 },
          topicCode: { type: "string", maxLength: 100 },
          responseState: { type: "string", enum: ["answered", "skipped", "declined"] },
          sourceType: { type: "string", enum: ["member", "ai"] },
          content: { type: "string", minLength: 1, maxLength: 12000 },
        },
      },
      response: {
        200: memberResponseSchema,
        201: memberResponseSchema,
        400: { $ref: "ErrorResponse#" },
        401: { $ref: "ErrorResponse#" },
        403: { $ref: "ErrorResponse#" },
        404: { $ref: "ErrorResponse#" },
        409: { $ref: "ErrorResponse#" },
      },
    },
  }, async (request, reply) => {
    const memberId = memberIdOf(request);
    const intake = await prisma.intakeSession.findFirst({
      where: { id: request.params.intakeId, memberId, status: "in_progress" },
    });
    if (!intake) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.response.create",
        resourceType: "intake_session",
        resourceId: request.params.intakeId,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 404, "INTAKE_NOT_FOUND", "In-progress intake not found.");
    }
    if (!await hasCurrentConsent(memberId, "intake", intake.consentId ?? undefined)) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.response.create",
        resourceType: "intake_session",
        resourceId: intake.id,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 403, "INTAKE_CONSENT_REQUIRED", "Current consent for intake is required.");
    }
    if (intake.channel === "voice" && !await hasCurrentConsent(memberId, "transcription")) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.response.create",
        resourceType: "intake_session",
        resourceId: intake.id,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 403, "TRANSCRIPTION_CONSENT_REQUIRED", "Current consent for voice transcription is required.");
    }

    const { responseState, content, sequenceNo, topicCode } = request.body;
    const sourceType = request.body.sourceType ?? "member";
    if ((responseState === "answered" && (!content || !content.trim())) || (responseState !== "answered" && content !== undefined)) {
      return sendApiError(reply, 400, "INVALID_RESPONSE_CONTENT", "Answered responses require content; skipped or declined responses must not include it.");
    }

    const existing = await prisma.intakeResponse.findUnique({
      where: { intakeId_sequenceNo: { intakeId: intake.id, sequenceNo } },
    });
    if (existing) {
      const existingContent = existing.contentCiphertext && existing.keyVersion
        ? intakeContentCipher.decrypt(existing.contentCiphertext, existing.keyVersion)
        : null;
      if (
        existing.topicCode !== (topicCode ?? null)
        || existing.responseState !== responseState
        || existing.sourceType !== sourceType
        || existingContent !== (content ?? null)
      ) {
        return sendApiError(reply, 409, "RESPONSE_SEQUENCE_CONFLICT", "A different response already uses this sequence number.");
      }
      return reply.code(200).send(serializeResponse(existing));
    }

    const encrypted = content ? intakeContentCipher.encrypt(content) : null;
    const response = await prisma.intakeResponse.create({
      data: {
        intakeId: intake.id,
        sequenceNo,
        topicCode,
        responseState,
        sourceType,
        contentCiphertext: encrypted?.ciphertext,
        keyVersion: encrypted?.keyVersion,
      },
    });
    await recordAudit({
      actorUserId: memberId,
      actionCode: "intake.response.create",
      resourceType: "intake_response",
      resourceId: response.id,
      correlationId: request.id,
    });
    return reply.code(201).send(serializeResponse(response));
  });

  app.post<{ Params: IntakeParams }>("/api/v1/intakes/:intakeId/transcription", {
    preHandler: requireMember,
    config: { rateLimit: { max: 8, timeWindow: "1 minute" } },
    schema: {
      ...protectedOperation,
      tags: ["Intakes"],
      summary: "Transcribe a member's voice intake",
      description: "Accepts a short audio recording, sends it to the configured speech-to-text provider, stores only the encrypted transcript, and never saves the uploaded audio.",
      consumes: ["multipart/form-data"],
      params: {
        type: "object",
        required: ["intakeId"],
        properties: { intakeId: { type: "string", pattern: uuidPattern } },
      },
      response: {
        201: memberResponseSchema,
        400: { $ref: "ErrorResponse#" },
        401: { $ref: "ErrorResponse#" },
        403: { $ref: "ErrorResponse#" },
        404: { $ref: "ErrorResponse#" },
        409: { $ref: "ErrorResponse#" },
        502: { $ref: "ErrorResponse#" },
        503: { $ref: "ErrorResponse#" },
        413: { $ref: "ErrorResponse#" },
        429: { $ref: "ErrorResponse#" },
      },
    },
  }, async (request, reply) => {
    const memberId = memberIdOf(request);
    const intake = await prisma.intakeSession.findFirst({
      where: {
        id: request.params.intakeId,
        memberId,
        channel: "voice",
        status: "in_progress",
      },
    });
    if (!intake) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.transcription",
        resourceType: "intake_session",
        resourceId: request.params.intakeId,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 404, "VOICE_INTAKE_NOT_FOUND", "In-progress voice intake not found.");
    }

    if (
      !await hasCurrentConsent(memberId, "intake", intake.consentId ?? undefined)
      || !await hasCurrentConsent(memberId, "transcription")
    ) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.transcription",
        resourceType: "intake_session",
        resourceId: intake.id,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 403, "TRANSCRIPTION_CONSENT_REQUIRED", "Current intake and transcription consent are required.");
    }

    const uploaded = await request.file({
      limits: { fileSize: maximumAudioBytes, files: 1, fields: 0, parts: 1 },
    });
    if (!uploaded) {
      return sendApiError(reply, 400, "AUDIO_REQUIRED", "Attach one audio file to transcribe.");
    }
    const mimeType = uploaded.mimetype.split(";")[0]?.trim().toLowerCase();
    if (!mimeType) {
      return sendApiError(reply, 400, "UNSUPPORTED_AUDIO_TYPE", "Use WebM, Ogg, WAV, MPEG, or MP4 audio.");
    }
    const filename = acceptedAudioTypes.get(mimeType);
    if (!filename) {
      return sendApiError(reply, 400, "UNSUPPORTED_AUDIO_TYPE", "Use WebM, Ogg, WAV, MPEG, or MP4 audio.");
    }

    let audio: Buffer;
    try {
      audio = await uploaded.toBuffer();
    } catch (error) {
      if (uploaded.file?.truncated) {
        return sendApiError(reply, 413, "AUDIO_TOO_LARGE", "The audio file exceeds the 10 MiB limit.");
      }
      throw error;
    }
    if (uploaded.file?.truncated || audio.byteLength === 0) {
      const tooLarge = uploaded.file?.truncated ?? false;
      audio.fill(0);
      return sendApiError(reply, tooLarge ? 413 : 400,
        tooLarge ? "AUDIO_TOO_LARGE" : "EMPTY_AUDIO",
        tooLarge ? "The audio file exceeds the 10 MiB limit." : "The audio file is empty.");
    }

    let transcript: string;
    try {
      transcript = await transcribeAudio({
        audio,
        mimeType,
        filename,
        locale: intake.locale,
      });
    } catch (error) {
      await recordAudit({
        actorUserId: memberId,
        actionCode: "intake.transcription",
        resourceType: "intake_session",
        resourceId: intake.id,
        correlationId: request.id,
        outcome: "failure",
      });
      if (error instanceof TranscriptionNotConfiguredError) {
        return sendApiError(reply, 503, "TRANSCRIPTION_UNAVAILABLE", "Voice transcription is not configured.");
      }
      if (error instanceof TranscriptionServiceError) {
        const statusCode = error.code === "provider_unavailable" ? 503 : 502;
        const message = error.code === "provider_unavailable"
          ? "The transcription service is temporarily unavailable."
          : "The transcription service returned an invalid response.";
        return sendApiError(reply, statusCode, "TRANSCRIPTION_FAILED", message);
      }
      throw error;
    } finally {
      audio.fill(0);
    }

    const latestResponse = await prisma.intakeResponse.aggregate({
      where: { intakeId: intake.id },
      _max: { sequenceNo: true },
    });
    const encrypted = intakeContentCipher.encrypt(transcript);
    const response = await prisma.intakeResponse.create({
      data: {
        intakeId: intake.id,
        sequenceNo: (latestResponse._max.sequenceNo ?? 0) + 1,
        topicCode: "voice_transcription",
        responseState: "answered",
        sourceType: "member",
        contentCiphertext: encrypted.ciphertext,
        keyVersion: encrypted.keyVersion,
      },
    });
    await recordAudit({
      actorUserId: memberId,
      actionCode: "intake.transcription",
      resourceType: "intake_response",
      resourceId: response.id,
      correlationId: request.id,
    });
    return reply.code(201).send(serializeResponse(response));
  });

  app.get<{ Params: ResponseParams }>("/api/v1/intakes/:intakeId/responses/:responseId", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Intakes"],
      summary: "Get a response belonging to the authenticated member",
      params: {
        type: "object",
        required: ["intakeId", "responseId"],
        properties: {
          intakeId: { type: "string", pattern: uuidPattern },
          responseId: { type: "string", pattern: uuidPattern },
        },
      },
      response: {
        200: memberResponseSchema,
        401: { $ref: "ErrorResponse#" },
        404: { $ref: "ErrorResponse#" },
      },
    },
  }, async (request, reply) => {
    const response = await prisma.intakeResponse.findFirst({
      where: {
        id: request.params.responseId,
        intakeId: request.params.intakeId,
        intake: {
          memberId: memberIdOf(request),
          status: { not: "deleted" },
        },
      },
    });
    if (!response) {
      await recordAudit({
        actorUserId: memberIdOf(request),
        actionCode: "intake.response.read",
        resourceType: "intake_response",
        resourceId: request.params.responseId,
        correlationId: request.id,
        outcome: "denied",
      });
      return sendApiError(reply, 404, "RESPONSE_NOT_FOUND", "Response not found.");
    }
    await recordAudit({
      actorUserId: memberIdOf(request),
      actionCode: "intake.response.read",
      resourceType: "intake_response",
      resourceId: response.id,
      correlationId: request.id,
    });
    return serializeResponse(response);
  });
}
