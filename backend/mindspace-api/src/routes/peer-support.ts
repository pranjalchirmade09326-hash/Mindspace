import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Prisma } from "@prisma/client";
import { recordAudit } from "../audit.js";
import { requireMember, requireRoles } from "../auth.js";
import { prisma } from "../db.js";
import { intakeContentCipher } from "../security/intake-content-cipher.js";

const security = { security: [{ bearerAuth: [] }] };
const errorSchema = { $ref: "ErrorResponse#" };
const uuidPattern = "^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
type MatchRequestBody = { preferredLanguages: string[]; preferences?: Record<string, unknown> };
type IdParams = { id: string };
type MessageBody = { content: string };
type ReportBody = { categoryCode: string; details?: string };
type FeedbackBody = { rating?: number; feedback?: string };
type OfferBody = { requestId: string; listenerId: string };

function actorId(request: FastifyRequest): string {
  if (!request.userId) throw new Error("Authenticated MindSpace identity is missing");
  return request.userId;
}

function apiError(reply: FastifyReply, status: number, code: string, message: string) {
  return reply.code(status).send({ error: { code, message } });
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

async function hasCurrentConsent(
  client: Pick<Prisma.TransactionClient, "consentRecord">,
  memberId: string,
  consentId: string | null,
  purpose: string,
) {
  if (!consentId) return false;
  const consent = await client.consentRecord.findFirst({
    where: {
      userId: memberId,
      purposeCode: purpose,
    },
    orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
    select: { id: true, consentState: true, expiresAt: true },
  });
  return Boolean(consent && consent.id === consentId && consent.consentState === "granted"
    && (!consent.expiresAt || consent.expiresAt > new Date()));
}

export async function registerPeerSupportRoutes(app: FastifyInstance) {
  app.post<{ Body: MatchRequestBody }>("/api/v1/peer/match-requests", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "Request peer support without triggering automatic matching",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["preferredLanguages"],
        properties: {
          preferredLanguages: { type: "array", maxItems: 10, uniqueItems: true, items: { type: "string", minLength: 2, maxLength: 20 } },
          preferences: {
            type: "object",
            maxProperties: 20,
            additionalProperties: {
              anyOf: [
                { type: "string", maxLength: 100 },
                { type: "boolean" },
                { type: "array", maxItems: 10, items: { type: "string", maxLength: 80 } },
              ],
            },
          },
        },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const consent = await prisma.consentRecord.findFirst({
      where: {
        userId: memberId,
        purposeCode: "peer_matching",
      },
      orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
      select: { id: true, consentState: true, expiresAt: true },
    });
    if (!consent || consent.consentState !== "granted" || (consent.expiresAt && consent.expiresAt <= new Date())) {
      return apiError(reply, 403, "PEER_MATCHING_CONSENT_REQUIRED", "Current peer-matching consent is required.");
    }
    const matchRequest = await prisma.listenerMatchRequest.create({
      data: {
        memberId,
        preferredLanguages: request.body.preferredLanguages,
        preferences: (request.body.preferences ?? {}) as Prisma.InputJsonObject,
        consentId: consent.id,
      },
    });
    await audit(request, memberId, "peer.match_request.create", "listener_match_request", matchRequest.id);
    return reply.code(201).send(matchRequest);
  });

  app.get("/api/v1/peer/match-requests", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "List the authenticated member's peer-support requests",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const memberId = actorId(request);
    const requests = await prisma.listenerMatchRequest.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    await audit(request, memberId, "peer.match_request.list", "listener_match_request");
    return requests;
  });

  app.post<{ Params: IdParams }>("/api/v1/peer/match-requests/:id/cancel", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "Cancel an open peer-support request",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const changed = await prisma.$transaction(async (tx) => {
      const requestRecord = await tx.listenerMatchRequest.findFirst({
        where: { id: request.params.id, memberId, requestState: "queued" },
        select: { id: true },
      });
      if (!requestRecord) return false;
      await tx.listenerMatchRequest.update({
        where: { id: requestRecord.id },
        data: { requestState: "cancelled", closedAt: new Date() },
      });
      await tx.listenerMatch.updateMany({
        where: { requestId: requestRecord.id, matchState: "offered" },
        data: { matchState: "cancelled", endedAt: new Date(), endReasonCode: "member_cancelled" },
      });
      return true;
    });
    if (!changed) {
      const existing = await prisma.listenerMatchRequest.findFirst({ where: { id: request.params.id, memberId } });
      if (!existing) return apiError(reply, 404, "MATCH_REQUEST_NOT_FOUND", "Peer-support request was not found.");
      return apiError(reply, 409, "MATCH_REQUEST_NOT_CANCELLABLE", "Only queued requests can be cancelled.");
    }
    await audit(request, memberId, "peer.match_request.cancel", "listener_match_request", request.params.id);
    return { id: request.params.id, requestState: "cancelled" };
  });

  app.post<{ Body: OfferBody }>("/api/v1/operations/matches", {
    preHandler: requireRoles(["listener_supervisor", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Listener Operations"],
      summary: "Offer a queued request to an eligible, trained, available listener",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["requestId", "listenerId"],
        properties: {
          requestId: { type: "string", pattern: uuidPattern },
          listenerId: { type: "string", pattern: uuidPattern },
        },
      },
      response: { 201: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const operatorId = actorId(request);
    const result = await prisma.$transaction(async (tx) => {
      const matchRequest = await tx.listenerMatchRequest.findFirst({
        where: { id: request.body.requestId, requestState: "queued" },
      });
      if (!matchRequest || !await hasCurrentConsent(tx, matchRequest.memberId, matchRequest.consentId, "peer_matching")) {
        return { error: "request" as const };
      }
      const listener = await tx.listenerProfile.findFirst({
        where: {
          id: request.body.listenerId,
          applicationState: "approved",
          eligibilityState: "eligible",
          OR: [{ eligibilityExpiresAt: null }, { eligibilityExpiresAt: { gt: new Date() } }],
        },
      });
      if (!listener) return { error: "listener" as const };
      const assignment = await tx.roleAssignment.findFirst({
        where: { userId: listener.userId, roleCode: "listener", assignmentState: "active" },
        select: { id: true },
      });
      const training = await tx.listenerTrainingRecord.findFirst({
        where: {
          listenerId: listener.id,
          completionState: "passed",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true },
      });
      const now = new Date();
      const availability = await tx.listenerAvailability.findFirst({
        where: {
          listenerId: listener.id,
          availabilityState: "available",
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        select: { id: true },
      });
      if (!assignment || !training || !availability) return { error: "eligibility" as const };
      const activeMatches = await tx.listenerMatch.count({
        where: { listenerId: listener.id, matchState: { in: ["offered", "accepted"] } },
      });
      if (activeMatches >= listener.capacityLimit) return { error: "capacity" as const };
      const alreadyOffered = await tx.listenerMatch.findFirst({
        where: { requestId: matchRequest.id, matchState: { in: ["offered", "accepted"] } },
        select: { id: true },
      });
      if (alreadyOffered) return { error: "duplicate" as const };
      const match = await tx.listenerMatch.create({
        data: { requestId: matchRequest.id, listenerId: listener.id, matchState: "offered" },
      });
      return { match };
    }, { isolationLevel: "Serializable" });
    if ("error" in result) {
      if (result.error === "request") return apiError(reply, 404, "MATCH_REQUEST_NOT_FOUND", "An open request with current consent was not found.");
      if (result.error === "listener") return apiError(reply, 404, "LISTENER_NOT_ELIGIBLE", "An approved listener was not found.");
      if (result.error === "capacity") return apiError(reply, 409, "LISTENER_AT_CAPACITY", "The listener has no remaining match capacity.");
      if (result.error === "duplicate") return apiError(reply, 409, "MATCH_ALREADY_OFFERED", "An active offer already exists for this request.");
      return apiError(reply, 409, "LISTENER_NOT_READY", "The listener lacks an active role, current training, or availability.");
    }
    await audit(request, operatorId, "peer.match.offer", "listener_match", result.match.id);
    return reply.code(201).send(result.match);
  });

  app.post<{ Params: IdParams }>("/api/v1/peer/matches/:id/accept", {
    preHandler: requireRoles(["listener"]),
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "Accept an offer assigned to the authenticated listener",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const listenerUserId = actorId(request);
    const profile = await prisma.listenerProfile.findFirst({
      where: {
        userId: listenerUserId,
        applicationState: "approved",
        eligibilityState: "eligible",
        OR: [{ eligibilityExpiresAt: null }, { eligibilityExpiresAt: { gt: new Date() } }],
      },
    });
    if (!profile) return apiError(reply, 403, "LISTENER_NOT_READY", "An approved listener profile is required.");
    const activeRole = await prisma.roleAssignment.findFirst({
      where: { userId: listenerUserId, roleCode: "listener", assignmentState: "active", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      select: { id: true },
    });
    if (!activeRole) return apiError(reply, 403, "LISTENER_NOT_READY", "An active listener role is required.");
    const match = await prisma.$transaction(async (tx) => {
      const offered = await tx.listenerMatch.findFirst({
        where: { id: request.params.id, listenerId: profile.id, matchState: "offered" },
      });
      if (!offered) return null;
      const currentTraining = await tx.listenerTrainingRecord.findFirst({
        where: {
          listenerId: profile.id,
          completionState: "passed",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true },
      });
      const now = new Date();
      const availability = await tx.listenerAvailability.findFirst({
        where: {
          listenerId: profile.id,
          availabilityState: "available",
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        select: { id: true },
      });
      if (!currentTraining || !availability) return null;
      const requestRecord = await tx.listenerMatchRequest.findUnique({
        where: { id: offered.requestId },
      });
      if (!requestRecord || requestRecord.requestState !== "queued"
        || !await hasCurrentConsent(tx, requestRecord.memberId, requestRecord.consentId, "peer_matching")) {
        return null;
      }
      const accepted = await tx.listenerMatch.updateMany({
        where: { id: offered.id, matchState: "offered" },
        data: { matchState: "accepted", acceptedAt: new Date() },
      });
      if (!accepted.count) return null;
      await tx.listenerMatchRequest.update({
        where: { id: requestRecord.id },
        data: { requestState: "matched" },
      });
      const conversation = await tx.peerConversation.create({
        data: {
          matchId: offered.id,
          memberId: requestRecord.memberId,
          listenerId: profile.id,
          channel: "text",
        },
      });
      return { matchId: offered.id, conversation };
    }, { isolationLevel: "Serializable" });
    if (!match) return apiError(reply, 409, "MATCH_NOT_ACCEPTABLE", "The offer is no longer available or listener training has expired.");
    await audit(request, listenerUserId, "peer.match.accept", "listener_match", match.matchId);
    return reply.code(201).send(match.conversation);
  });

  app.get("/api/v1/listeners/me/offers", {
    preHandler: requireRoles(["listener"]),
    schema: {
      ...security,
      tags: ["Listener Operations"],
      summary: "List peer-support offers assigned to the authenticated listener",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const profile = await prisma.listenerProfile.findFirst({
      where: { userId, applicationState: "approved", eligibilityState: "eligible" },
      select: { id: true },
    });
    if (!profile) return apiError(reply, 404, "LISTENER_PROFILE_NOT_FOUND", "Approved listener profile was not found.");
    const offers = await prisma.listenerMatch.findMany({
      where: { listenerId: profile.id, matchState: "offered" },
      orderBy: { offeredAt: "asc" },
      take: 100,
    });
    const requests = await prisma.listenerMatchRequest.findMany({
      where: { id: { in: offers.map(({ requestId }) => requestId) }, requestState: "queued" },
      select: { id: true, preferredLanguages: true, preferences: true, createdAt: true, expiresAt: true },
    });
    const requestById = new Map(requests.map((matchRequest) => [matchRequest.id, matchRequest]));
    await audit(request, userId, "peer.match_offer.list", "listener_profile", profile.id);
    return offers.flatMap((offer) => {
      const matchRequest = requestById.get(offer.requestId);
      return matchRequest ? [{ ...offer, request: matchRequest }] : [];
    });
  });

  app.post<{ Params: IdParams }>("/api/v1/peer/matches/:id/decline", {
    preHandler: requireRoles(["listener"]),
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "Decline an offer assigned to the authenticated listener",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const profile = await prisma.listenerProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return apiError(reply, 404, "LISTENER_PROFILE_NOT_FOUND", "Listener profile was not found.");
    const declined = await prisma.listenerMatch.updateMany({
      where: { id: request.params.id, listenerId: profile.id, matchState: "offered" },
      data: { matchState: "declined", endedAt: new Date(), endReasonCode: "listener_declined" },
    });
    if (!declined.count) return apiError(reply, 404, "MATCH_OFFER_NOT_FOUND", "An open offer assigned to this listener was not found.");
    await audit(request, userId, "peer.match.decline", "listener_match", request.params.id);
    return { id: request.params.id, matchState: "declined" };
  });

  app.get("/api/v1/peer/conversations", {
    preHandler: requireRoles(["member", "listener"]),
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "List conversations in which the authenticated user participates",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const listener = await prisma.listenerProfile.findUnique({ where: { userId }, select: { id: true } });
    const conversations = await prisma.peerConversation.findMany({
      where: { OR: [{ memberId: userId }, ...(listener ? [{ listenerId: listener.id }] : [])] },
      orderBy: { startedAt: "desc" },
      take: 100,
    });
    await audit(request, userId, "peer.conversation.list", "peer_conversation");
    return conversations;
  });

  app.get<{ Params: IdParams }>("/api/v1/peer/conversations/:id/messages", {
    preHandler: requireRoles(["member", "listener"]),
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "Read messages for a participant-owned conversation",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const listener = await prisma.listenerProfile.findUnique({ where: { userId }, select: { id: true } });
    const conversation = await prisma.peerConversation.findFirst({
      where: {
        id: request.params.id,
        OR: [{ memberId: userId }, ...(listener ? [{ listenerId: listener.id }] : [])],
      },
      select: { id: true },
    });
    if (!conversation) return apiError(reply, 404, "CONVERSATION_NOT_FOUND", "Conversation was not found.");
    const messages = await prisma.peerMessage.findMany({
      where: { conversationId: conversation.id, deliveryState: { not: "redacted" } },
      orderBy: { sequenceNo: "asc" },
      take: 500,
    });
    await audit(request, userId, "peer.message.list", "peer_conversation", conversation.id);
    return messages.map((message) => ({
      id: message.id,
      sequenceNo: message.sequenceNo.toString(),
      senderUserId: message.senderUserId,
      content: intakeContentCipher.decrypt(message.contentCiphertext, message.keyVersion),
      deliveryState: message.deliveryState,
      sentAt: message.sentAt,
      deliveredAt: message.deliveredAt,
    }));
  });

  app.post<{ Params: IdParams; Body: MessageBody }>("/api/v1/peer/conversations/:id/messages", {
    preHandler: requireRoles(["member", "listener"]),
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "Send an encrypted text message as a conversation participant",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["content"],
        properties: { content: { type: "string", minLength: 1, maxLength: 12000 } },
      },
      response: { 201: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const listener = await prisma.listenerProfile.findUnique({ where: { userId }, select: { id: true } });
    const content = request.body.content.trim();
    if (!content) return apiError(reply, 400, "EMPTY_MESSAGE", "Message cannot be blank.");
    const encrypted = intakeContentCipher.encrypt(content);
    const result = await prisma.$transaction(async (tx) => {
      const conversation = await tx.peerConversation.findFirst({
        where: {
          id: request.params.id,
          conversationState: "open",
          OR: [{ memberId: userId }, ...(listener ? [{ listenerId: listener.id }] : [])],
        },
        select: { id: true },
      });
      if (!conversation) return null;
      const lastMessage = await tx.peerMessage.findFirst({
        where: { conversationId: conversation.id },
        orderBy: { sequenceNo: "desc" },
        select: { sequenceNo: true },
      });
      const message = await tx.peerMessage.create({
        data: {
          conversationId: conversation.id,
          sequenceNo: (lastMessage?.sequenceNo ?? 0n) + 1n,
          senderUserId: userId,
          contentCiphertext: encrypted.ciphertext,
          keyVersion: encrypted.keyVersion,
          deliveryState: "delivered",
          deliveredAt: new Date(),
        },
      });
      return message;
    }, { isolationLevel: "Serializable" });
    if (!result) return apiError(reply, 404, "CONVERSATION_NOT_OPEN", "An open conversation in which you participate was not found.");
    await audit(request, userId, "peer.message.create", "peer_message", result.id);
    return reply.code(201).send({
      id: result.id,
      conversationId: result.conversationId,
      sequenceNo: result.sequenceNo.toString(),
      senderUserId: userId,
      content,
      deliveryState: result.deliveryState,
      sentAt: result.sentAt,
      deliveredAt: result.deliveredAt,
    });
  });

  app.post<{ Params: IdParams }>("/api/v1/peer/conversations/:id/close", {
    preHandler: requireRoles(["member", "listener"]),
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "Close a conversation as one of its participants",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const listener = await prisma.listenerProfile.findUnique({ where: { userId }, select: { id: true } });
    const updated = await prisma.peerConversation.updateMany({
      where: {
        id: request.params.id,
        conversationState: "open",
        OR: [{ memberId: userId }, ...(listener ? [{ listenerId: listener.id }] : [])],
      },
      data: { conversationState: "closed", endedAt: new Date(), closedByUserId: userId },
    });
    if (!updated.count) return apiError(reply, 404, "CONVERSATION_NOT_OPEN", "An open conversation in which you participate was not found.");
    await audit(request, userId, "peer.conversation.close", "peer_conversation", request.params.id);
    return { id: request.params.id, conversationState: "closed" };
  });

  app.post<{ Params: IdParams; Body: ReportBody }>("/api/v1/peer/conversations/:id/reports", {
    preHandler: requireRoles(["member", "listener"]),
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "Submit an encrypted conduct report for a participant conversation",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["categoryCode"],
        properties: {
          categoryCode: { type: "string", minLength: 1, maxLength: 60 },
          details: { type: "string", maxLength: 8000 },
        },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const listener = await prisma.listenerProfile.findUnique({ where: { userId }, select: { id: true } });
    const conversation = await prisma.peerConversation.findFirst({
      where: {
        id: request.params.id,
        OR: [{ memberId: userId }, ...(listener ? [{ listenerId: listener.id }] : [])],
      },
    });
    if (!conversation) return apiError(reply, 404, "CONVERSATION_NOT_FOUND", "Conversation was not found.");
    const reportedUserId = conversation.memberId === userId
      ? (await prisma.listenerProfile.findUnique({ where: { id: conversation.listenerId }, select: { userId: true } }))?.userId
      : conversation.memberId;
    const encrypted = request.body.details ? intakeContentCipher.encrypt(request.body.details) : null;
    const report = await prisma.conductReport.create({
      data: {
        conversationId: conversation.id,
        reporterUserId: userId,
        reportedUserId,
        categoryCode: request.body.categoryCode,
        detailsCiphertext: encrypted?.ciphertext,
        keyVersion: encrypted?.keyVersion,
      },
    });
    await audit(request, userId, "peer.conduct_report.create", "conduct_report", report.id);
    return reply.code(201).send({
      id: report.id,
      conversationId: report.conversationId,
      categoryCode: report.categoryCode,
      reportState: report.reportState,
      createdAt: report.createdAt,
    });
  });

  app.post<{ Params: IdParams; Body: FeedbackBody }>("/api/v1/peer/conversations/:id/feedback", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Peer Support"],
      summary: "Submit optional private feedback for an owned conversation",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        properties: {
          rating: { type: "integer", minimum: 1, maximum: 5 },
          feedback: { type: "string", maxLength: 8000 },
        },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const memberId = actorId(request);
    const conversation = await prisma.peerConversation.findFirst({
      where: { id: request.params.id, memberId },
      select: { id: true },
    });
    if (!conversation) return apiError(reply, 404, "CONVERSATION_NOT_FOUND", "Conversation was not found.");
    if (request.body.rating === undefined && !request.body.feedback?.trim()) {
      return apiError(reply, 400, "EMPTY_FEEDBACK", "Provide a rating or feedback.");
    }
    const encrypted = request.body.feedback?.trim()
      ? intakeContentCipher.encrypt(request.body.feedback.trim())
      : null;
    const feedback = await prisma.listenerFeedback.create({
      data: {
        conversationId: conversation.id,
        memberId,
        rating: request.body.rating,
        feedbackCiphertext: encrypted?.ciphertext,
        keyVersion: encrypted?.keyVersion,
      },
    });
    await audit(request, memberId, "peer.feedback.create", "listener_feedback", feedback.id);
    return reply.code(201).send({
      id: feedback.id,
      conversationId: feedback.conversationId,
      rating: feedback.rating,
      reviewState: feedback.reviewState,
      submittedAt: feedback.submittedAt,
    });
  });
}
