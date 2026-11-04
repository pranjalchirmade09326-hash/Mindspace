import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { recordAudit } from "../audit.js";
import { requireMember } from "../auth.js";
import { prisma } from "../db.js";
import { intakeContentCipher } from "../security/intake-content-cipher.js";

const security = { security: [{ bearerAuth: [] }] };
const errorSchema = { $ref: "ErrorResponse#" };
const uuidPattern = "^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";

type MoodBody = { moodCode: string; scaleCode?: string; scaleValue?: number; note?: string; recordedAt?: string };
type JournalBody = { title?: string; body: string };
type GoalBody = { goal: string; targetDate?: string };
type CheckinBody = { state: "reported" | "skipped"; note?: string };
type SessionBody = { sessionType: "ai_companion" | "reflection" | "guided_activity"; locale: string; consentId?: string };
type MessageBody = { content: string; sequenceNo: number };
type SessionStateBody = { status: "completed" | "abandoned" };
type IdParams = { id: string };
type SessionParams = { sessionId: string };
type IntakeParams = { intakeId: string };
type SummaryBody = { summary: string };
type RecommendationParams = { intakeId: string; recommendationId: string };
type ReflectionBody = { reflectionType: string; promptVersion: string; locale: string };
type ReflectionParams = { id: string };
type ExerciseBody = { reflection?: string };
type FollowupBody = { scheduledAt: string };
type FollowupParams = { id: string };

function actorId(request: FastifyRequest): string {
  if (!request.memberId) throw new Error("Authenticated member context is missing");
  return request.memberId;
}

function apiError(reply: FastifyReply, status: number, code: string, message: string) {
  return reply.code(status).send({ error: { code, message } });
}

function decrypt(ciphertext: Uint8Array | null, version: string | null): string | null {
  if (!ciphertext || !version) return null;
  return intakeContentCipher.decrypt(ciphertext, version);
}

async function audit(request: FastifyRequest, userId: string, action: string, type: string, id?: string) {
  await recordAudit({
    actorUserId: userId,
    actionCode: action,
    resourceType: type,
    resourceId: id,
    correlationId: request.id,
  });
}

export async function registerWellbeingRoutes(app: FastifyInstance) {
  app.get<{ Params: IntakeParams }>("/api/v1/intakes/:intakeId/summaries", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Intakes"],
      summary: "List encrypted non-diagnostic summaries owned by the authenticated member",
      params: { type: "object", required: ["intakeId"], properties: { intakeId: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const intake = await prisma.intakeSession.findFirst({
      where: { id: request.params.intakeId, memberId },
      select: { id: true },
    });
    if (!intake) return apiError(reply, 404, "INTAKE_NOT_FOUND", "Intake was not found.");
    const summaries = await prisma.wellbeingSummary.findMany({
      where: { intakeId: intake.id, memberId },
      orderBy: { versionNo: "desc" },
    });
    await audit(request, memberId, "wellbeing.summary.list", "intake_session", intake.id);
    return summaries.map((summary) => ({
      id: summary.id,
      versionNo: summary.versionNo,
      summary: intakeContentCipher.decrypt(summary.summaryCiphertext, summary.keyVersion),
      generatedBy: summary.generatedBy,
      reviewState: summary.reviewState,
      reviewedAt: summary.reviewedAt,
      createdAt: summary.createdAt,
    }));
  });

  app.post<{ Params: IntakeParams; Body: SummaryBody }>("/api/v1/intakes/:intakeId/summaries", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Intakes"],
      summary: "Save a member-authored, non-diagnostic intake summary",
      params: { type: "object", required: ["intakeId"], properties: { intakeId: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["summary"],
        properties: { summary: { type: "string", minLength: 1, maxLength: 12000 } },
      },
      response: { 201: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const intake = await prisma.intakeSession.findFirst({
      where: { id: request.params.intakeId, memberId },
      select: { id: true },
    });
    if (!intake) return apiError(reply, 404, "INTAKE_NOT_FOUND", "Intake was not found.");
    const summary = request.body.summary.trim();
    if (!summary) return apiError(reply, 400, "EMPTY_SUMMARY", "Summary cannot be blank.");
    const encrypted = intakeContentCipher.encrypt(summary);
    const created = await prisma.$transaction(async (tx) => {
      const last = await tx.wellbeingSummary.findFirst({
        where: { intakeId: intake.id },
        orderBy: { versionNo: "desc" },
        select: { versionNo: true },
      });
      return tx.wellbeingSummary.create({
        data: {
          intakeId: intake.id,
          memberId,
          versionNo: (last?.versionNo ?? 0) + 1,
          summaryCiphertext: encrypted.ciphertext,
          keyVersion: encrypted.keyVersion,
          generatedBy: "member",
          reviewState: "reviewed",
          reviewedAt: new Date(),
        },
      });
    }, { isolationLevel: "Serializable" });
    await audit(request, memberId, "wellbeing.summary.create", "wellbeing_summary", created.id);
    return reply.code(201).send({
      id: created.id,
      intakeId: created.intakeId,
      versionNo: created.versionNo,
      summary,
      generatedBy: created.generatedBy,
      reviewState: created.reviewState,
      reviewedAt: created.reviewedAt,
      createdAt: created.createdAt,
    });
  });

  app.get<{ Params: IntakeParams }>("/api/v1/intakes/:intakeId/recommendations", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Intakes"],
      summary: "List member-visible support options recorded for an owned intake",
      params: { type: "object", required: ["intakeId"], properties: { intakeId: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const intake = await prisma.intakeSession.findFirst({
      where: { id: request.params.intakeId, memberId },
      select: { id: true },
    });
    if (!intake) return apiError(reply, 404, "INTAKE_NOT_FOUND", "Intake was not found.");
    const recommendations = await prisma.supportRecommendation.findMany({
      where: { intakeId: intake.id, memberId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return recommendations.map((recommendation) => ({
      id: recommendation.id,
      supportLevel: recommendation.supportLevel,
      optionCode: recommendation.optionCode,
      availabilityState: recommendation.availabilityState,
      rationale: decrypt(recommendation.rationaleCiphertext, recommendation.keyVersion),
      selectedAt: recommendation.selectedAt,
      createdAt: recommendation.createdAt,
    }));
  });

  app.post<{ Params: RecommendationParams }>("/api/v1/intakes/:intakeId/recommendations/:recommendationId/select", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Intakes"],
      summary: "Select an available support option from an owned intake",
      params: {
        type: "object",
        required: ["intakeId", "recommendationId"],
        properties: {
          intakeId: { type: "string", pattern: uuidPattern },
          recommendationId: { type: "string", pattern: uuidPattern },
        },
      },
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const recommendation = await prisma.supportRecommendation.findFirst({
      where: {
        id: request.params.recommendationId,
        intakeId: request.params.intakeId,
        memberId,
        availabilityState: "available",
      },
    });
    if (!recommendation) {
      const ownedIntake = await prisma.intakeSession.findFirst({
        where: { id: request.params.intakeId, memberId },
        select: { id: true },
      });
      if (!ownedIntake) return apiError(reply, 404, "INTAKE_NOT_FOUND", "Intake was not found.");
      return apiError(reply, 409, "OPTION_UNAVAILABLE", "The requested support option is unavailable.");
    }
    const selected = await prisma.supportRecommendation.update({
      where: { id: recommendation.id },
      data: { selectedAt: new Date() },
    });
    await audit(request, memberId, "wellbeing.recommendation.select", "support_recommendation", selected.id);
    return {
      id: selected.id,
      supportLevel: selected.supportLevel,
      optionCode: selected.optionCode,
      selectedAt: selected.selectedAt,
    };
  });

  app.post<{ Body: ReflectionBody }>("/api/v1/wellbeing/reflections", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Start a member-selected, non-clinical wellbeing reflection",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["reflectionType", "promptVersion", "locale"],
        properties: {
          reflectionType: { type: "string", minLength: 1, maxLength: 100 },
          promptVersion: { type: "string", minLength: 1, maxLength: 100 },
          locale: { type: "string", minLength: 2, maxLength: 20 },
        },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const reflection = await prisma.wellbeingReflection.create({
      data: { ...request.body, memberId, sourceType: "member" },
    });
    await audit(request, memberId, "wellbeing.reflection.create", "wellbeing_reflection", reflection.id);
    return reply.code(201).send(reflection);
  });

  app.get("/api/v1/wellbeing/reflections", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "List the authenticated member's reflection metadata",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const memberId = actorId(request);
    return prisma.wellbeingReflection.findMany({
      where: { memberId },
      orderBy: { startedAt: "desc" },
      take: 100,
    });
  });

  app.patch<{ Params: ReflectionParams }>("/api/v1/wellbeing/reflections/:id/complete", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Complete an owned reflection",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const updated = await prisma.wellbeingReflection.updateMany({
      where: { id: request.params.id, memberId, status: "in_progress" },
      data: { status: "completed", completedAt: new Date() },
    });
    if (!updated.count) return apiError(reply, 404, "REFLECTION_NOT_FOUND", "An in-progress reflection was not found.");
    await audit(request, memberId, "wellbeing.reflection.complete", "wellbeing_reflection", request.params.id);
    return prisma.wellbeingReflection.findUniqueOrThrow({ where: { id: request.params.id } });
  });

  app.post<{ Params: IdParams; Body: ExerciseBody }>("/api/v1/self-help/content/:id/sessions", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Self-help"],
      summary: "Start an exercise using an approved self-help content version",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        properties: { reflection: { type: "string", maxLength: 8000 } },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const content = await prisma.selfHelpContent.findFirst({
      where: { id: request.params.id, reviewState: "approved" },
      select: { id: true, contentVersion: true, effectiveFrom: true, effectiveTo: true },
    });
    const now = new Date();
    if (!content || (content.effectiveFrom && content.effectiveFrom > now) || (content.effectiveTo && content.effectiveTo <= now)) {
      return apiError(reply, 404, "APPROVED_CONTENT_NOT_FOUND", "Approved self-help content was not found.");
    }
    const encrypted = request.body.reflection ? intakeContentCipher.encrypt(request.body.reflection) : null;
    const session = await prisma.exerciseSession.create({
      data: {
        contentId: content.id,
        memberId,
        contentVersion: content.contentVersion,
        reflectionCiphertext: encrypted?.ciphertext,
        keyVersion: encrypted?.keyVersion,
      },
    });
    await audit(request, memberId, "self_help.exercise.start", "exercise_session", session.id);
    return reply.code(201).send({
      id: session.id,
      contentId: session.contentId,
      contentVersion: session.contentVersion,
      progressState: session.progressState,
      reflection: request.body.reflection ?? null,
      startedAt: session.startedAt,
    });
  });

  app.patch<{ Params: IdParams; Body: ExerciseBody & { progressState: "paused" | "completed" | "abandoned" } }>("/api/v1/self-help/sessions/:id", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Self-help"],
      summary: "Update an owned self-help exercise's progress or private reflection",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["progressState"],
        properties: {
          progressState: { type: "string", enum: ["paused", "completed", "abandoned"] },
          reflection: { type: "string", maxLength: 8000 },
        },
      },
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const current = await prisma.exerciseSession.findFirst({
      where: { id: request.params.id, memberId },
    });
    if (!current) return apiError(reply, 404, "EXERCISE_SESSION_NOT_FOUND", "Exercise session was not found.");
    if (!["started", "paused"].includes(current.progressState)) {
      return apiError(reply, 409, "EXERCISE_SESSION_CLOSED", "Only active exercise sessions can be updated.");
    }
    const encrypted = request.body.reflection ? intakeContentCipher.encrypt(request.body.reflection) : null;
    const session = await prisma.exerciseSession.update({
      where: { id: current.id },
      data: {
        progressState: request.body.progressState,
        reflectionCiphertext: encrypted?.ciphertext,
        keyVersion: encrypted?.keyVersion,
        completedAt: request.body.progressState === "completed" ? new Date() : null,
      },
    });
    await audit(request, memberId, "self_help.exercise.update", "exercise_session", session.id);
    return {
      id: session.id,
      progressState: session.progressState,
      reflection: decrypt(session.reflectionCiphertext, session.keyVersion),
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    };
  });

  app.get("/api/v1/followups", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Follow-ups"],
      summary: "List the authenticated member's follow-up records",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const memberId = actorId(request);
    const followups = await prisma.followup.findMany({
      where: { memberId },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    });
    return followups.map((followup) => ({
      id: followup.id,
      sourceType: followup.sourceType,
      sourceRecordId: followup.sourceRecordId,
      scheduledAt: followup.scheduledAt,
      followupState: followup.followupState,
      response: decrypt(followup.responseCiphertext, followup.keyVersion),
      completedAt: followup.completedAt,
    }));
  });

  app.post<{ Body: FollowupBody }>("/api/v1/followups", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Follow-ups"],
      summary: "Schedule a member-requested follow-up record without sending a notification",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["scheduledAt"],
        properties: { scheduledAt: { type: "string", format: "date-time" } },
      },
      response: { 201: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const scheduledAt = new Date(request.body.scheduledAt);
    if (scheduledAt <= new Date()) return apiError(reply, 400, "INVALID_FOLLOWUP_TIME", "Follow-up time must be in the future.");
    const followup = await prisma.followup.create({
      data: { memberId, sourceType: "member_requested", scheduledAt },
    });
    await audit(request, memberId, "followup.create", "followup", followup.id);
    return reply.code(201).send(followup);
  });

  app.post<{ Params: FollowupParams; Body: { state: "responded" | "skipped" | "cancelled"; response?: string } }>("/api/v1/followups/:id/complete", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Follow-ups"],
      summary: "Respond to, skip, or cancel an owned follow-up",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["state"],
        properties: {
          state: { type: "string", enum: ["responded", "skipped", "cancelled"] },
          response: { type: "string", maxLength: 4000 },
        },
      },
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const current = await prisma.followup.findFirst({
      where: { id: request.params.id, memberId, followupState: "scheduled" },
      select: { id: true },
    });
    if (!current) return apiError(reply, 404, "FOLLOWUP_NOT_FOUND", "A scheduled follow-up was not found.");
    const encrypted = request.body.response ? intakeContentCipher.encrypt(request.body.response) : null;
    const followup = await prisma.followup.update({
      where: { id: current.id },
      data: {
        followupState: request.body.state,
        responseCiphertext: encrypted?.ciphertext,
        keyVersion: encrypted?.keyVersion,
        completedAt: new Date(),
      },
    });
    await audit(request, memberId, "followup.complete", "followup", followup.id);
    return {
      id: followup.id,
      followupState: followup.followupState,
      scheduledAt: followup.scheduledAt,
      response: request.body.response ?? null,
      completedAt: followup.completedAt,
    };
  });

  app.get("/api/v1/wellbeing/moods", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "List the authenticated member's mood entries",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const memberId = actorId(request);
    const entries = await prisma.moodEntry.findMany({
      where: { memberId },
      orderBy: { recordedAt: "desc" },
      take: 100,
    });
    await audit(request, memberId, "wellbeing.mood.list", "mood_entry");
    return entries.map((entry) => ({
      id: entry.id,
      moodCode: entry.moodCode,
      scaleCode: entry.scaleCode,
      scaleValue: entry.scaleValue?.toNumber() ?? null,
      note: decrypt(entry.noteCiphertext, entry.keyVersion),
      sourceType: entry.sourceType,
      recordedAt: entry.recordedAt,
      createdAt: entry.createdAt,
    }));
  });

  app.post<{ Body: MoodBody }>("/api/v1/wellbeing/moods", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Record a member-reported mood entry",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["moodCode"],
        properties: {
          moodCode: { type: "string", minLength: 1, maxLength: 60 },
          scaleCode: { type: "string", minLength: 1, maxLength: 40 },
          scaleValue: { type: "number", minimum: 0, maximum: 100 },
          note: { type: "string", maxLength: 4000 },
          recordedAt: { type: "string", format: "date-time" },
        },
      },
      response: { 201: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const { moodCode, scaleCode, scaleValue, note, recordedAt } = request.body;
    const encrypted = note ? intakeContentCipher.encrypt(note) : null;
    const entry = await prisma.moodEntry.create({
      data: {
        memberId,
        moodCode: moodCode.trim(),
        scaleCode,
        scaleValue,
        noteCiphertext: encrypted?.ciphertext,
        keyVersion: encrypted?.keyVersion,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });
    await audit(request, memberId, "wellbeing.mood.create", "mood_entry", entry.id);
    return reply.code(201).send({
      id: entry.id,
      moodCode: entry.moodCode,
      scaleCode: entry.scaleCode,
      scaleValue: entry.scaleValue?.toNumber() ?? null,
      note,
      recordedAt: entry.recordedAt,
      createdAt: entry.createdAt,
    });
  });

  app.get("/api/v1/wellbeing/journal", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "List the authenticated member's private journal entries",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const memberId = actorId(request);
    const entries = await prisma.journalEntry.findMany({
      where: { memberId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    await audit(request, memberId, "wellbeing.journal.list", "journal_entry");
    return entries.map((entry) => ({
      id: entry.id,
      title: decrypt(entry.titleCiphertext, entry.keyVersion),
      body: decrypt(entry.bodyCiphertext, entry.keyVersion),
      visibility: entry.visibility,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));
  });

  app.post<{ Body: JournalBody }>("/api/v1/wellbeing/journal", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Create a private encrypted journal entry",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["body"],
        properties: {
          title: { type: "string", maxLength: 200 },
          body: { type: "string", minLength: 1, maxLength: 20000 },
        },
      },
      response: { 201: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const body = request.body.body.trim();
    if (!body) return apiError(reply, 400, "EMPTY_JOURNAL_ENTRY", "Journal entry cannot be blank.");
    const title = request.body.title?.trim();
    const bodyEncrypted = intakeContentCipher.encrypt(body);
    const titleEncrypted = title ? intakeContentCipher.encrypt(title) : null;
    const entry = await prisma.journalEntry.create({
      data: {
        memberId,
        titleCiphertext: titleEncrypted?.ciphertext,
        bodyCiphertext: bodyEncrypted.ciphertext,
        keyVersion: bodyEncrypted.keyVersion,
      },
    });
    await audit(request, memberId, "wellbeing.journal.create", "journal_entry", entry.id);
    return reply.code(201).send({
      id: entry.id,
      title: title ?? null,
      body,
      visibility: entry.visibility,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  });

  app.put<{ Params: IdParams; Body: JournalBody }>("/api/v1/wellbeing/journal/:id", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Replace an owned private journal entry",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["body"],
        properties: { title: { type: "string", maxLength: 200 }, body: { type: "string", minLength: 1, maxLength: 20000 } },
      },
      response: { 200: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const prior = await prisma.journalEntry.findFirst({
      where: { id: request.params.id, memberId, deletedAt: null },
    });
    if (!prior) return apiError(reply, 404, "JOURNAL_ENTRY_NOT_FOUND", "Journal entry was not found.");
    const body = request.body.body.trim();
    if (!body) return apiError(reply, 400, "EMPTY_JOURNAL_ENTRY", "Journal entry cannot be blank.");
    const title = request.body.title?.trim();
    const bodyEncrypted = intakeContentCipher.encrypt(body);
    const titleEncrypted = title ? intakeContentCipher.encrypt(title) : null;
    const entry = await prisma.journalEntry.update({
      where: { id: prior.id },
      data: {
        titleCiphertext: titleEncrypted?.ciphertext,
        bodyCiphertext: bodyEncrypted.ciphertext,
        keyVersion: bodyEncrypted.keyVersion,
      },
    });
    await audit(request, memberId, "wellbeing.journal.update", "journal_entry", entry.id);
    return {
      id: entry.id,
      title: title ?? null,
      body,
      visibility: entry.visibility,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  });

  app.delete<{ Params: IdParams }>("/api/v1/wellbeing/journal/:id", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Soft-delete an owned journal entry",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      response: { 204: { type: "null" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const result = await prisma.journalEntry.updateMany({
      where: { id: request.params.id, memberId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!result.count) return apiError(reply, 404, "JOURNAL_ENTRY_NOT_FOUND", "Journal entry was not found.");
    await audit(request, memberId, "wellbeing.journal.delete", "journal_entry", request.params.id);
    return reply.code(204).send();
  });

  app.get("/api/v1/wellbeing/goals", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "List the authenticated member's wellbeing goals",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const memberId = actorId(request);
    const goals = await prisma.wellbeingGoal.findMany({
      where: { memberId },
      include: { checkins: { orderBy: { reportedAt: "desc" }, take: 20 } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    await audit(request, memberId, "wellbeing.goal.list", "wellbeing_goal");
    return goals.map((goal) => ({
      id: goal.id,
      goal: intakeContentCipher.decrypt(goal.goalCiphertext, goal.keyVersion),
      status: goal.status,
      targetDate: goal.targetDate,
      createdAt: goal.createdAt,
      checkins: goal.checkins.map((checkin) => ({
        id: checkin.id,
        state: checkin.checkinState,
        note: decrypt(checkin.noteCiphertext, checkin.keyVersion),
        reportedAt: checkin.reportedAt,
      })),
    }));
  });

  app.post<{ Body: GoalBody }>("/api/v1/wellbeing/goals", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Create a member-selected wellbeing goal",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["goal"],
        properties: { goal: { type: "string", minLength: 1, maxLength: 2000 }, targetDate: { type: "string", format: "date" } },
      },
      response: { 201: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const text = request.body.goal.trim();
    if (!text) return apiError(reply, 400, "EMPTY_GOAL", "Goal cannot be blank.");
    const encrypted = intakeContentCipher.encrypt(text);
    const goal = await prisma.wellbeingGoal.create({
      data: {
        memberId,
        goalCiphertext: encrypted.ciphertext,
        keyVersion: encrypted.keyVersion,
        targetDate: request.body.targetDate ? new Date(`${request.body.targetDate}T00:00:00.000Z`) : undefined,
      },
    });
    await audit(request, memberId, "wellbeing.goal.create", "wellbeing_goal", goal.id);
    return reply.code(201).send({
      id: goal.id,
      goal: text,
      status: goal.status,
      targetDate: goal.targetDate,
      createdAt: goal.createdAt,
    });
  });

  app.post<{ Params: IdParams; Body: CheckinBody }>("/api/v1/wellbeing/goals/:id/checkins", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Record a check-in for an owned goal",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["state"],
        properties: {
          state: { type: "string", enum: ["reported", "skipped"] },
          note: { type: "string", maxLength: 4000 },
        },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const goal = await prisma.wellbeingGoal.findFirst({
      where: { id: request.params.id, memberId, status: { in: ["active", "paused"] } },
      select: { id: true },
    });
    if (!goal) return apiError(reply, 404, "GOAL_NOT_FOUND", "An active goal was not found.");
    const encrypted = request.body.note ? intakeContentCipher.encrypt(request.body.note) : null;
    const checkin = await prisma.goalCheckin.create({
      data: {
        goalId: goal.id,
        memberId,
        checkinState: request.body.state,
        noteCiphertext: encrypted?.ciphertext,
        keyVersion: encrypted?.keyVersion,
      },
    });
    await audit(request, memberId, "wellbeing.goal.checkin", "goal_checkin", checkin.id);
    return reply.code(201).send({
      id: checkin.id,
      goalId: goal.id,
      state: checkin.checkinState,
      note: request.body.note ?? null,
      reportedAt: checkin.reportedAt,
    });
  });

  app.get<{ Querystring: { locale?: string; type?: string } }>("/api/v1/self-help/content", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Self-help"],
      summary: "List currently approved self-help content",
      querystring: {
        type: "object",
        additionalProperties: false,
        properties: { locale: { type: "string", minLength: 2, maxLength: 20 }, type: { type: "string", enum: ["exercise", "article", "prompt", "resource"] } },
      },
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const now = new Date();
    const items = await prisma.selfHelpContent.findMany({
      where: {
        reviewState: "approved",
        ...(request.query.locale ? { locale: request.query.locale } : {}),
        ...(request.query.type ? { contentType: request.query.type } : {}),
        OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }],
        AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] }],
      },
      orderBy: [{ contentCode: "asc" }, { contentVersion: "desc" }],
      take: 100,
    });
    return items;
  });

  app.post<{ Body: SessionBody }>("/api/v1/wellbeing/sessions", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Start a wellbeing reflection, activity, or AI companion session record",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["sessionType", "locale"],
        properties: {
          sessionType: { type: "string", enum: ["ai_companion", "reflection", "guided_activity"] },
          locale: { type: "string", minLength: 2, maxLength: 20 },
          consentId: { type: "string", pattern: uuidPattern },
        },
      },
      response: { 201: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    if (request.body.sessionType === "ai_companion") {
      if (!request.body.consentId) return apiError(reply, 403, "AI_CONSENT_REQUIRED", "Current AI wellbeing consent is required.");
      const consent = await prisma.consentRecord.findFirst({
        where: {
          id: request.body.consentId,
          userId: memberId,
          purposeCode: "ai_wellbeing",
          consentState: "granted",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (!consent) return apiError(reply, 403, "AI_CONSENT_REQUIRED", "Current AI wellbeing consent is required.");
      return apiError(reply, 503, "AI_PROVIDER_UNAVAILABLE", "AI companion processing is not configured.");
    }
    const session = await prisma.wellbeingSession.create({
      data: {
        memberId,
        sessionType: request.body.sessionType,
        locale: request.body.locale,
        consentId: request.body.consentId,
      },
    });
    await audit(request, memberId, "wellbeing.session.create", "wellbeing_session", session.id);
    return reply.code(201).send(session);
  });

  app.get("/api/v1/wellbeing/sessions", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "List the authenticated member's wellbeing session metadata",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const memberId = actorId(request);
    const sessions = await prisma.wellbeingSession.findMany({
      where: { memberId },
      select: {
        id: true,
        sessionType: true,
        status: true,
        locale: true,
        startedAt: true,
        endedAt: true,
      },
      orderBy: { startedAt: "desc" },
      take: 100,
    });
    await audit(request, memberId, "wellbeing.session.list", "wellbeing_session");
    return sessions;
  });

  app.patch<{ Params: SessionParams; Body: SessionStateBody }>("/api/v1/wellbeing/sessions/:sessionId", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Complete or abandon an owned wellbeing session",
      params: { type: "object", required: ["sessionId"], properties: { sessionId: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["status"],
        properties: { status: { type: "string", enum: ["completed", "abandoned"] } },
      },
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const updated = await prisma.wellbeingSession.updateMany({
      where: { id: request.params.sessionId, memberId, status: "active" },
      data: { status: request.body.status, endedAt: new Date() },
    });
    if (!updated.count) {
      const session = await prisma.wellbeingSession.findFirst({
        where: { id: request.params.sessionId, memberId },
        select: { id: true },
      });
      if (!session) return apiError(reply, 404, "SESSION_NOT_FOUND", "Wellbeing session was not found.");
      return apiError(reply, 409, "SESSION_NOT_ACTIVE", "Only active wellbeing sessions can be closed.");
    }
    await audit(request, memberId, "wellbeing.session.close", "wellbeing_session", request.params.sessionId);
    return prisma.wellbeingSession.findUniqueOrThrow({ where: { id: request.params.sessionId } });
  });

  app.post<{ Params: SessionParams; Body: MessageBody }>("/api/v1/wellbeing/sessions/:sessionId/messages", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Store a member message in an owned wellbeing session",
      params: { type: "object", required: ["sessionId"], properties: { sessionId: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["content", "sequenceNo"],
        properties: { content: { type: "string", minLength: 1, maxLength: 12000 }, sequenceNo: { type: "integer", minimum: 1 } },
      },
      response: { 201: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const session = await prisma.wellbeingSession.findFirst({
      where: { id: request.params.sessionId, memberId, status: "active" },
      select: { id: true },
    });
    if (!session) return apiError(reply, 404, "SESSION_NOT_FOUND", "An active wellbeing session was not found.");
    const encrypted = intakeContentCipher.encrypt(request.body.content);
    const message = await prisma.wellbeingMessage.create({
      data: {
        sessionId: session.id,
        sequenceNo: request.body.sequenceNo,
        speakerType: "member",
        contentCiphertext: encrypted.ciphertext,
        keyVersion: encrypted.keyVersion,
      },
    });
    await audit(request, memberId, "wellbeing.message.create", "wellbeing_message", message.id);
    return reply.code(201).send({
      id: message.id,
      sessionId: message.sessionId,
      sequenceNo: message.sequenceNo,
      speakerType: message.speakerType,
      content: request.body.content,
      createdAt: message.createdAt,
    });
  });

  app.get<{ Params: SessionParams }>("/api/v1/wellbeing/sessions/:sessionId/messages", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Wellbeing"],
      summary: "Read messages from an owned wellbeing session",
      params: { type: "object", required: ["sessionId"], properties: { sessionId: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const session = await prisma.wellbeingSession.findFirst({
      where: { id: request.params.sessionId, memberId },
      select: { id: true },
    });
    if (!session) return apiError(reply, 404, "SESSION_NOT_FOUND", "Wellbeing session was not found.");
    const messages = await prisma.wellbeingMessage.findMany({
      where: { sessionId: session.id, deletedAt: null },
      orderBy: { sequenceNo: "asc" },
    });
    await audit(request, memberId, "wellbeing.message.list", "wellbeing_session", session.id);
    return messages.map((message) => ({
      id: message.id,
      sequenceNo: message.sequenceNo,
      speakerType: message.speakerType,
      content: intakeContentCipher.decrypt(message.contentCiphertext, message.keyVersion),
      deliveryState: message.deliveryState,
      createdAt: message.createdAt,
    }));
  });
}
