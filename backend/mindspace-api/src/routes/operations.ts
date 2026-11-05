import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Prisma } from "@prisma/client";
import { recordAudit } from "../audit.js";
import { requireActivePrincipal, requireMember, requireRoles } from "../auth.js";
import { prisma } from "../db.js";
import { intakeContentCipher } from "../security/intake-content-cipher.js";

const security = { security: [{ bearerAuth: [] }] };
const errorSchema = { $ref: "ErrorResponse#" };
const uuidPattern = "^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
const roleCodes = ["member", "listener", "listener_supervisor", "safety_operations_specialist", "platform_administrator", "ai_agent_service"] as const;
type RoleCode = (typeof roleCodes)[number];
type RoleBody = { userId: string; roleCode: RoleCode; expiresAt?: string };
type ListenerTrainingBody = { moduleCode: string; moduleVersion: string; completionState: "assigned" | "in_progress" | "passed" | "failed" | "expired"; expiresAt?: string };
type ListenerApprovalBody = { applicationState: "approved" | "rejected" | "suspended"; eligibilityState: "eligible" | "ineligible" | "expired"; eligibilityExpiresAt?: string; capacityLimit?: number };
type AvailabilityBody = { startsAt: string; endsAt: string; state: "available" | "paused" | "unavailable"; timezone: string };
type SafetyCaseBody = { memberId?: string; sourceType: "intake" | "ai_session" | "peer_conversation" | "manual"; sourceRecordId?: string; triggerCode: string; policyVersion: string; priorityCode: "routine" | "urgent" | "emergency"; jurisdiction?: string };
type CaseStateBody = { caseState: "queued" | "assigned" | "in_progress" | "handed_off" | "closed"; resolutionCode?: string };
type ActionBody = { actionType: string; actionState: "attempted" | "completed" | "failed"; details?: string; resourceId?: string };
type ResourceBody = { regionCode: string; locale: string; resourceType: "emergency" | "crisis_line" | "community_support"; displayName: string; contactDetails: Prisma.InputJsonObject; sourceUrl?: string };
type IdParams = { id: string };
type ResourceQuery = { regionCode: string; locale: string };
type ContentBody = { contentCode: string; contentType: "exercise" | "article" | "prompt" | "resource"; title: string; locale: string; contentVersion: number; body: Prisma.InputJsonObject };
type WorkflowDefinitionBody = { processCode: string; version: string; policyVersion: string };
type WorkflowExecutionBody = { definitionId: string; temporalWorkflowId: string; subjectType: string; subjectId: string };
type WorkflowTaskBody = { executionId: string; taskCode: string; requiredRole: RoleCode; assigneeUserId?: string; dueAt?: string };
type WorkflowDecisionBody = { decision: "approved" | "rejected" | "returned"; decisionReasonCode?: string; policyVersion: string };
type AgentInvocationBody = { agentRunId: string; toolCode: string; toolVersion: string; scope: string[]; inputDigest: string };
type OutboxBody = {
  eventType: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  payload: { resourceId?: string; state?: string; correlationId?: string };
};
type ReceiptBody = { eventId: string; eventVersion: number; outcomeCode: string };
type NotificationBody = { userId: string; notificationType: string; channel: "email" | "sms" | "push" | "in_app"; payloadReference: string; scheduledAt: string; deduplicationKey: string };

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

export async function registerOperationRoutes(app: FastifyInstance) {
  app.get("/api/v1/admin/roles", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Administration"],
      summary: "List role assignments",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const assignments = await prisma.roleAssignment.findMany({
      orderBy: [{ userId: "asc" }, { grantedAt: "desc" }],
      take: 500,
    });
    await audit(request, userId, "admin.roles.list", "role_assignment");
    return assignments;
  });

  app.post<{ Body: RoleBody }>("/api/v1/admin/roles", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Administration"],
      summary: "Grant a MindSpace role",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["userId", "roleCode"],
        properties: {
          userId: { type: "string", minLength: 1, maxLength: 200 },
          roleCode: { type: "string", enum: roleCodes },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const actorUserId = actorId(request);
    const principal = await prisma.appPrincipal.findUnique({
      where: { userId: request.body.userId },
      select: { accountState: true },
    });
    if (!principal || principal.accountState !== "active") {
      return apiError(reply, 404, "ACTIVE_PRINCIPAL_NOT_FOUND", "An active MindSpace principal was not found.");
    }
    const assignment = await prisma.roleAssignment.create({
      data: {
        userId: request.body.userId,
        roleCode: request.body.roleCode,
        assignmentState: "active",
        grantedByUserId: actorUserId,
        expiresAt: request.body.expiresAt ? new Date(request.body.expiresAt) : null,
      },
    });
    await audit(request, actorUserId, "admin.role.grant", "role_assignment", assignment.id);
    return reply.code(201).send(assignment);
  });

  app.post<{ Params: IdParams }>("/api/v1/admin/roles/:id/revoke", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Administration"],
      summary: "Revoke a role assignment",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const actorUserId = actorId(request);
    const updated = await prisma.roleAssignment.updateMany({
      where: { id: request.params.id, assignmentState: "active" },
      data: { assignmentState: "revoked", revokedAt: new Date() },
    });
    if (!updated.count) return apiError(reply, 404, "ROLE_ASSIGNMENT_NOT_FOUND", "Active role assignment was not found.");
    await audit(request, actorUserId, "admin.role.revoke", "role_assignment", request.params.id);
    return { id: request.params.id, assignmentState: "revoked" };
  });

  app.post("/api/v1/listeners/me/profile", {
    preHandler: requireRoles(["listener"]),
    schema: {
      ...security,
      tags: ["Listener Operations"],
      summary: "Submit or retrieve the authenticated listener's application profile",
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const profile = await prisma.listenerProfile.upsert({
      where: { userId },
      create: { userId, applicationState: "pending", eligibilityState: "ineligible" },
      update: {},
    });
    await audit(request, userId, "listener.profile.apply", "listener_profile", profile.id);
    return reply.code(201).send(profile);
  });

  app.get("/api/v1/listeners/me/profile", {
    preHandler: requireRoles(["listener"]),
    schema: {
      ...security,
      tags: ["Listener Operations"],
      summary: "Get the authenticated listener's application profile",
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const profile = await prisma.listenerProfile.findUnique({ where: { userId } });
    if (!profile) {
      return apiError(reply, 404, "LISTENER_PROFILE_NOT_FOUND", "Listener profile was not found.");
    }
    return profile;
  });

  app.post<{ Params: IdParams; Body: ListenerApprovalBody }>("/api/v1/operations/listeners/:id/decision", {
    preHandler: requireRoles(["listener_supervisor", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Listener Operations"],
      summary: "Record an administrative listener application decision",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["applicationState", "eligibilityState"],
        properties: {
          applicationState: { type: "string", enum: ["approved", "rejected", "suspended"] },
          eligibilityState: { type: "string", enum: ["eligible", "ineligible", "expired"] },
          eligibilityExpiresAt: { type: "string", format: "date-time" },
          capacityLimit: { type: "integer", minimum: 1, maximum: 100 },
        },
      },
      response: { 200: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const actorUserId = actorId(request);
    const current = await prisma.listenerProfile.findUnique({ where: { id: request.params.id } });
    if (!current) return apiError(reply, 404, "LISTENER_PROFILE_NOT_FOUND", "Listener profile was not found.");
    if (request.body.applicationState === "approved" && request.body.eligibilityState === "eligible") {
      const activeRole = await prisma.roleAssignment.findFirst({
        where: { userId: current.userId, roleCode: "listener", assignmentState: "active" },
      });
      const training = await prisma.listenerTrainingRecord.findFirst({
        where: {
          listenerId: current.id,
          completionState: "passed",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (!activeRole || !training) {
        return apiError(reply, 409, "LISTENER_REQUIREMENTS_INCOMPLETE", "An active listener role and current passed training are required for approval.");
      }
    }
    const profile = await prisma.listenerProfile.update({
      where: { id: current.id },
      data: {
        applicationState: request.body.applicationState,
        eligibilityState: request.body.eligibilityState,
        eligibilityExpiresAt: request.body.eligibilityExpiresAt ? new Date(request.body.eligibilityExpiresAt) : null,
        approvedAt: request.body.applicationState === "approved" ? new Date() : null,
        capacityLimit: request.body.capacityLimit,
      },
    });
    await audit(request, actorUserId, "listener.application.decision", "listener_profile", profile.id);
    return profile;
  });

  app.post<{ Params: IdParams; Body: ListenerTrainingBody }>("/api/v1/operations/listeners/:id/training", {
    preHandler: requireRoles(["listener_supervisor", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Listener Operations"],
      summary: "Record listener training assignment or completion",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["moduleCode", "moduleVersion", "completionState"],
        properties: {
          moduleCode: { type: "string", minLength: 1, maxLength: 100 },
          moduleVersion: { type: "string", minLength: 1, maxLength: 100 },
          completionState: { type: "string", enum: ["assigned", "in_progress", "passed", "failed", "expired"] },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const actorUserId = actorId(request);
    const listener = await prisma.listenerProfile.findUnique({ where: { id: request.params.id }, select: { id: true } });
    if (!listener) return apiError(reply, 404, "LISTENER_PROFILE_NOT_FOUND", "Listener profile was not found.");
    const training = await prisma.listenerTrainingRecord.create({
      data: {
        listenerId: listener.id,
        moduleCode: request.body.moduleCode,
        moduleVersion: request.body.moduleVersion,
        completionState: request.body.completionState,
        completedAt: request.body.completionState === "passed" ? new Date() : null,
        expiresAt: request.body.expiresAt ? new Date(request.body.expiresAt) : null,
        reviewedByUserId: actorUserId,
      },
    });
    await audit(request, actorUserId, "listener.training.record", "listener_training_record", training.id);
    return reply.code(201).send(training);
  });

  app.get("/api/v1/listeners/me/availability", {
    preHandler: requireRoles(["listener"]),
    schema: {
      ...security,
      tags: ["Listener Operations"],
      summary: "List the authenticated listener's availability intervals",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const profile = await prisma.listenerProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return apiError(reply, 404, "LISTENER_PROFILE_NOT_FOUND", "Listener profile was not found.");
    return prisma.listenerAvailability.findMany({
      where: { listenerId: profile.id, endsAt: { gt: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 100,
    });
  });

  app.post<{ Body: AvailabilityBody }>("/api/v1/listeners/me/availability", {
    preHandler: requireRoles(["listener"]),
    schema: {
      ...security,
      tags: ["Listener Operations"],
      summary: "Set a listener availability interval",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["startsAt", "endsAt", "state", "timezone"],
        properties: {
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
          state: { type: "string", enum: ["available", "paused", "unavailable"] },
          timezone: { type: "string", minLength: 1, maxLength: 100 },
        },
      },
      response: { 201: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const startsAt = new Date(request.body.startsAt);
    const endsAt = new Date(request.body.endsAt);
    if (endsAt <= startsAt) return apiError(reply, 400, "INVALID_AVAILABILITY_RANGE", "Availability end must be after its start.");
    const profile = await prisma.listenerProfile.findFirst({
      where: { userId, applicationState: "approved", eligibilityState: "eligible" },
    });
    if (!profile) return apiError(reply, 404, "APPROVED_LISTENER_NOT_FOUND", "An approved, eligible listener profile was not found.");
    const interval = await prisma.listenerAvailability.create({
      data: {
        listenerId: profile.id,
        startsAt,
        endsAt,
        availabilityState: request.body.state,
        timezone: request.body.timezone,
      },
    });
    await audit(request, userId, "listener.availability.create", "listener_availability", interval.id);
    return reply.code(201).send(interval);
  });

  app.get<{ Querystring: ResourceQuery }>("/api/v1/safety/resources", {
    preHandler: requireActivePrincipal,
    schema: {
      ...security,
      tags: ["Safety Resources"],
      summary: "List verified and currently effective safety resources for a region and locale",
      querystring: {
        type: "object",
        additionalProperties: false,
        required: ["regionCode", "locale"],
        properties: {
          regionCode: { type: "string", minLength: 2, maxLength: 20 },
          locale: { type: "string", minLength: 2, maxLength: 20 },
        },
      },
      response: { 200: { type: "array", items: { type: "object" } }, 400: errorSchema, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const now = new Date();
    const resources = await prisma.crisisResource.findMany({
      where: {
        regionCode: request.query.regionCode,
        locale: request.query.locale,
        verificationState: "verified",
        AND: [
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] },
          { OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] },
        ],
      },
      orderBy: { resourceType: "asc" },
      take: 100,
    });
    return resources;
  });

  app.post<{ Body: ResourceBody }>("/api/v1/operations/safety/resources", {
    preHandler: requireRoles(["safety_operations_specialist", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Safety Operations"],
      summary: "Create a pending-review safety resource; it is not shown to members until verified",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["regionCode", "locale", "resourceType", "displayName", "contactDetails"],
        properties: {
          regionCode: { type: "string", minLength: 2, maxLength: 20 },
          locale: { type: "string", minLength: 2, maxLength: 20 },
          resourceType: { type: "string", enum: ["emergency", "crisis_line", "community_support"] },
          displayName: { type: "string", minLength: 1, maxLength: 200 },
          contactDetails: { type: "object", maxProperties: 20 },
          sourceUrl: { type: "string", format: "uri", maxLength: 2000 },
        },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request, reply) => {
    const actorUserId = actorId(request);
    const resource = await prisma.crisisResource.create({
      data: {
        regionCode: request.body.regionCode,
        locale: request.body.locale,
        resourceType: request.body.resourceType,
        displayName: request.body.displayName,
        contactDetails: request.body.contactDetails,
        sourceUrl: request.body.sourceUrl,
      },
    });
    await audit(request, actorUserId, "safety.resource.create", "crisis_resource", resource.id);
    return reply.code(201).send(resource);
  });

  app.post<{ Params: IdParams }>("/api/v1/operations/safety/resources/:id/verify", {
    preHandler: requireRoles(["safety_operations_specialist", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Safety Operations"],
      summary: "Verify a safety resource with a recorded human reviewer",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const actorUserId = actorId(request);
    const resource = await prisma.crisisResource.update({
      where: { id: request.params.id },
      data: { verificationState: "verified", verifiedByUserId: actorUserId, lastVerifiedAt: new Date() },
    }).catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && error.code === "P2025") return null;
      throw error;
    });
    if (!resource) return apiError(reply, 404, "RESOURCE_NOT_FOUND", "Safety resource was not found.");
    await audit(request, actorUserId, "safety.resource.verify", "crisis_resource", resource.id);
    return resource;
  });

  app.post<{ Body: SafetyCaseBody }>("/api/v1/operations/safety/cases", {
    preHandler: requireRoles(["safety_operations_specialist"]),
    schema: {
      ...security,
      tags: ["Safety Operations"],
      summary: "Open a human-created safety case; this does not dispatch services or imply monitoring",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["sourceType", "triggerCode", "policyVersion", "priorityCode"],
        properties: {
          memberId: { type: "string", maxLength: 200 },
          sourceType: { type: "string", enum: ["intake", "ai_session", "peer_conversation", "manual"] },
          sourceRecordId: { type: "string", pattern: uuidPattern },
          triggerCode: { type: "string", minLength: 1, maxLength: 100 },
          policyVersion: { type: "string", minLength: 1, maxLength: 100 },
          priorityCode: { type: "string", enum: ["routine", "urgent", "emergency"] },
          jurisdiction: { type: "string", maxLength: 100 },
        },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const responderId = actorId(request);
    if (request.body.memberId && !await prisma.appPrincipal.findUnique({ where: { userId: request.body.memberId }, select: { userId: true } })) {
      return apiError(reply, 404, "MEMBER_NOT_FOUND", "MindSpace member was not found.");
    }
    const safetyCase = await prisma.safetyCase.create({
      data: {
        memberId: request.body.memberId,
        sourceType: request.body.sourceType,
        sourceRecordId: request.body.sourceRecordId,
        triggerCode: request.body.triggerCode,
        policyVersion: request.body.policyVersion,
        priorityCode: request.body.priorityCode,
        jurisdiction: request.body.jurisdiction,
        caseState: "assigned",
        assignedResponderUserId: responderId,
        acknowledgedAt: new Date(),
      },
    });
    await audit(request, responderId, "safety.case.create", "safety_case", safetyCase.id);
    return reply.code(201).send(safetyCase);
  });

  app.get("/api/v1/operations/safety/cases", {
    preHandler: requireRoles(["safety_operations_specialist", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Safety Operations"],
      summary: "List safety cases for authorized human responders",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const actorUserId = actorId(request);
    const cases = await prisma.safetyCase.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    await audit(request, actorUserId, "safety.case.list", "safety_case");
    return cases;
  });

  app.patch<{ Params: IdParams; Body: CaseStateBody }>("/api/v1/operations/safety/cases/:id", {
    preHandler: requireRoles(["safety_operations_specialist", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Safety Operations"],
      summary: "Advance a safety case through human-operated states",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["caseState"],
        properties: {
          caseState: { type: "string", enum: ["queued", "assigned", "in_progress", "handed_off", "closed"] },
          resolutionCode: { type: "string", maxLength: 100 },
        },
      },
      response: { 200: { type: "object" }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const actorUserId = actorId(request);
    const current = await prisma.safetyCase.findUnique({ where: { id: request.params.id } });
    if (!current) return apiError(reply, 404, "SAFETY_CASE_NOT_FOUND", "Safety case was not found.");
    const transitions: Record<string, string[]> = {
      new: ["queued", "assigned", "closed"],
      queued: ["assigned", "closed"],
      assigned: ["in_progress", "queued", "closed"],
      in_progress: ["handed_off", "closed"],
      handed_off: ["in_progress", "closed"],
      closed: [],
    };
    if (!transitions[current.caseState]?.includes(request.body.caseState)) {
      return apiError(reply, 409, "INVALID_CASE_TRANSITION", "The requested safety case transition is not allowed.");
    }
    const updated = await prisma.safetyCase.update({
      where: { id: current.id },
      data: {
        caseState: request.body.caseState,
        assignedResponderUserId: request.body.caseState === "assigned" ? actorUserId : current.assignedResponderUserId,
        acknowledgedAt: current.acknowledgedAt ?? new Date(),
        closedAt: request.body.caseState === "closed" ? new Date() : null,
        resolutionCode: request.body.caseState === "closed" ? request.body.resolutionCode : null,
      },
    });
    await audit(request, actorUserId, "safety.case.transition", "safety_case", updated.id);
    return updated;
  });

  app.post<{ Params: IdParams; Body: ActionBody }>("/api/v1/operations/safety/cases/:id/actions", {
    preHandler: requireRoles(["safety_operations_specialist", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Safety Operations"],
      summary: "Record a human safety-case action with an optional encrypted note",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["actionType", "actionState"],
        properties: {
          actionType: { type: "string", minLength: 1, maxLength: 100 },
          actionState: { type: "string", enum: ["attempted", "completed", "failed"] },
          details: { type: "string", maxLength: 4000 },
          resourceId: { type: "string", pattern: uuidPattern },
        },
      },
      response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const actorUserId = actorId(request);
    const safetyCase = await prisma.safetyCase.findUnique({ where: { id: request.params.id }, select: { id: true, caseState: true } });
    if (!safetyCase) return apiError(reply, 404, "SAFETY_CASE_NOT_FOUND", "Safety case was not found.");
    const encrypted = request.body.details ? intakeContentCipher.encrypt(request.body.details) : null;
    const action = await prisma.safetyCaseAction.create({
      data: {
        caseId: safetyCase.id,
        actorUserId,
        actionType: request.body.actionType,
        actionState: request.body.actionState,
        resourceId: request.body.resourceId,
        detailsCiphertext: encrypted?.ciphertext,
        keyVersion: encrypted?.keyVersion,
      },
    });
    await audit(request, actorUserId, "safety.case.action", "safety_case_action", action.id);
    return reply.code(201).send({
      id: action.id,
      caseId: action.caseId,
      actionType: action.actionType,
      actionState: action.actionState,
      occurredAt: action.occurredAt,
    });
  });

  app.get("/api/v1/notifications", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Notifications"],
      summary: "List the authenticated member's notification status without sensitive message content",
      response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    return prisma.notification.findMany({
      where: { userId },
      select: {
        id: true,
        notificationType: true,
        channel: true,
        scheduledAt: true,
        sentAt: true,
        deliveryState: true,
        attemptCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });

    app.get("/api/v1/admin/self-help/content", {
      preHandler: requireRoles(["platform_administrator"]),
      schema: {
        ...security,
        tags: ["Administration"],
        summary: "List all self-help content versions including drafts",
        response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
      },
    }, async (request) => {
      const actorUserId = actorId(request);
      await audit(request, actorUserId, "admin.self_help.list", "self_help_content");
      return prisma.selfHelpContent.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    });

    app.post<{ Body: ContentBody }>("/api/v1/admin/self-help/content", {
      preHandler: requireRoles(["platform_administrator"]),
      schema: {
        ...security,
        tags: ["Administration"],
        summary: "Create a draft self-help content version",
        body: {
          type: "object",
          additionalProperties: false,
          required: ["contentCode", "contentType", "title", "locale", "contentVersion", "body"],
          properties: {
            contentCode: { type: "string", minLength: 1, maxLength: 100 },
            contentType: { type: "string", enum: ["exercise", "article", "prompt", "resource"] },
            title: { type: "string", minLength: 1, maxLength: 200 },
            locale: { type: "string", minLength: 2, maxLength: 20 },
            contentVersion: { type: "integer", minimum: 1 },
            body: { type: "object", maxProperties: 100 },
          },
        },
        response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 409: errorSchema },
      },
    }, async (request, reply) => {
      const userId = actorId(request);
      const content = await prisma.selfHelpContent.create({
        data: {
          ...request.body,
          body: request.body.body,
          reviewState: "draft",
          authorUserId: userId,
        },
      });
      await audit(request, userId, "admin.self_help.create", "self_help_content", content.id);
      return reply.code(201).send(content);
    });

    app.post<{ Params: IdParams }>("/api/v1/admin/self-help/content/:id/approve", {
      preHandler: requireRoles(["platform_administrator"]),
      schema: {
        ...security,
        tags: ["Administration"],
        summary: "Approve a draft self-help content version",
        params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
        response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
    }, async (request, reply) => {
      const userId = actorId(request);
      const content = await prisma.selfHelpContent.findFirst({
        where: { id: request.params.id, reviewState: "draft", authorUserId: { not: userId } },
      });
      if (!content) return apiError(reply, 404, "REVIEWABLE_CONTENT_NOT_FOUND", "A draft authored by another user was not found.");
      const approved = await prisma.selfHelpContent.update({
        where: { id: content.id },
        data: { reviewState: "approved", reviewerUserId: userId, effectiveFrom: new Date() },
      });
      await audit(request, userId, "admin.self_help.approve", "self_help_content", approved.id);
      return approved;
    });

    app.post<{ Body: WorkflowDefinitionBody }>("/api/v1/admin/workflow-definitions", {
      preHandler: requireRoles(["platform_administrator"]),
      schema: {
        ...security,
        tags: ["Workflow Registry"],
        summary: "Register a draft workflow definition; this endpoint does not execute workflows",
        body: {
          type: "object",
          additionalProperties: false,
          required: ["processCode", "version", "policyVersion"],
          properties: {
            processCode: { type: "string", minLength: 1, maxLength: 100 },
            version: { type: "string", minLength: 1, maxLength: 100 },
            policyVersion: { type: "string", minLength: 1, maxLength: 100 },
          },
        },
        response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 409: errorSchema },
      },
    }, async (request, reply) => {
      const userId = actorId(request);
      const definition = await prisma.workflowDefinition.create({
        data: { ...request.body, status: "draft" },
      });
      await audit(request, userId, "workflow.definition.create", "workflow_definition", definition.id);
      return reply.code(201).send(definition);
    });

    app.post<{ Params: IdParams }>("/api/v1/admin/workflow-definitions/:id/activate", {
      preHandler: requireRoles(["platform_administrator"]),
      schema: {
        ...security,
        tags: ["Workflow Registry"],
        summary: "Activate a registered workflow definition version",
        params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
        response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
      },
    }, async (request, reply) => {
      const userId = actorId(request);
      const definition = await prisma.workflowDefinition.findUnique({ where: { id: request.params.id } });
      if (!definition) return apiError(reply, 404, "WORKFLOW_DEFINITION_NOT_FOUND", "Workflow definition was not found.");
      if (definition.status !== "draft" && definition.status !== "active") {
        return apiError(reply, 409, "WORKFLOW_DEFINITION_RETIRED", "A retired workflow definition cannot be activated.");
      }
      const activated = await prisma.workflowDefinition.update({
        where: { id: definition.id },
        data: { status: "active" },
      });
      await audit(request, userId, "workflow.definition.activate", "workflow_definition", activated.id);
      return activated;
    });

    app.post<{ Body: WorkflowExecutionBody }>("/api/v1/admin/workflow-executions", {
      preHandler: requireRoles(["platform_administrator"]),
      schema: {
        ...security,
        tags: ["Workflow Registry"],
        summary: "Register an execution reference from an external workflow engine",
        body: {
          type: "object",
          additionalProperties: false,
          required: ["definitionId", "temporalWorkflowId", "subjectType", "subjectId"],
          properties: {
            definitionId: { type: "string", pattern: uuidPattern },
            temporalWorkflowId: { type: "string", minLength: 1, maxLength: 255 },
            subjectType: { type: "string", minLength: 1, maxLength: 100 },
            subjectId: { type: "string", minLength: 1, maxLength: 255 },
          },
        },
        response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
      },
    }, async (request, reply) => {
      const userId = actorId(request);
      const definition = await prisma.workflowDefinition.findFirst({
        where: { id: request.body.definitionId, status: "active" },
      });
      if (!definition) return apiError(reply, 404, "ACTIVE_WORKFLOW_DEFINITION_NOT_FOUND", "An active workflow definition was not found.");
      const execution = await prisma.workflowExecution.create({
        data: {
          ...request.body,
          status: "running",
          correlationId: request.id,
        },
      });
      await audit(request, userId, "workflow.execution.register", "workflow_execution", execution.id);
      return reply.code(201).send(execution);
    });

    app.post<{ Body: WorkflowTaskBody }>("/api/v1/admin/workflow-tasks", {
      preHandler: requireRoles(["platform_administrator"]),
      schema: {
        ...security,
        tags: ["Workflow Registry"],
        summary: "Create a human task for a registered workflow execution",
        body: {
          type: "object",
          additionalProperties: false,
          required: ["executionId", "taskCode", "requiredRole"],
          properties: {
            executionId: { type: "string", pattern: uuidPattern },
            taskCode: { type: "string", minLength: 1, maxLength: 100 },
            requiredRole: { type: "string", enum: roleCodes },
            assigneeUserId: { type: "string", maxLength: 200 },
            dueAt: { type: "string", format: "date-time" },
          },
        },
        response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
    }, async (request, reply) => {
      const userId = actorId(request);
      const execution = await prisma.workflowExecution.findUnique({ where: { id: request.body.executionId }, select: { id: true } });
      if (!execution) return apiError(reply, 404, "WORKFLOW_EXECUTION_NOT_FOUND", "Workflow execution was not found.");
      if (request.body.assigneeUserId) {
        const assigned = await prisma.roleAssignment.findFirst({
          where: {
            userId: request.body.assigneeUserId,
            roleCode: request.body.requiredRole,
            assignmentState: "active",
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: { id: true },
        });
        if (!assigned) return apiError(reply, 400, "ASSIGNEE_ROLE_REQUIRED", "The assignee does not have the required active role.");
      }
      const task = await prisma.workflowTask.create({
        data: {
          ...request.body,
          status: request.body.assigneeUserId ? "assigned" : "queued",
          dueAt: request.body.dueAt ? new Date(request.body.dueAt) : null,
        },
      });
      await audit(request, userId, "workflow.task.create", "workflow_task", task.id);
      return reply.code(201).send(task);
    });

    app.get("/api/v1/operations/workflow-tasks", {
      preHandler: requireRoles(["listener_supervisor", "safety_operations_specialist", "platform_administrator"]),
      schema: {
        ...security,
        tags: ["Workflow Registry"],
        summary: "List human workflow tasks for operations",
        response: { 200: { type: "array", items: { type: "object" } }, 401: errorSchema, 403: errorSchema },
      },
    }, async () => prisma.workflowTask.findMany({
      where: { status: { in: ["queued", "assigned", "acknowledged"] } },
      orderBy: [{ dueAt: "asc" }, { id: "asc" }],
      take: 200,
    }));

    app.post<{ Params: IdParams }>("/api/v1/operations/workflow-tasks/:id/acknowledge", {
      preHandler: requireRoles(["listener_supervisor", "safety_operations_specialist", "platform_administrator"]),
      schema: {
        ...security,
        tags: ["Workflow Registry"],
        summary: "Acknowledge an assigned workflow task",
        params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
        response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
      },
    }, async (request, reply) => {
      const userId = actorId(request);
      const task = await prisma.workflowTask.findUnique({ where: { id: request.params.id } });
      if (!task || (task.assigneeUserId && task.assigneeUserId !== userId)) {
        return apiError(reply, 404, "ASSIGNED_TASK_NOT_FOUND", "A task assigned to the authenticated user was not found.");
      }
      if (task.status !== "assigned" && task.status !== "acknowledged") {
        return apiError(reply, 409, "TASK_NOT_ACKNOWLEDGEABLE", "Only assigned tasks can be acknowledged.");
      }
      const assignment = await prisma.roleAssignment.findFirst({
        where: { userId, roleCode: task.requiredRole, assignmentState: "active", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        select: { id: true },
      });
      if (!assignment) return apiError(reply, 403, "TASK_ROLE_REQUIRED", "The current required task role is not assigned.");
      const updated = await prisma.workflowTask.update({
        where: { id: task.id },
        data: { assigneeUserId: userId, status: "acknowledged" },
      });
      await audit(request, userId, "workflow.task.acknowledge", "workflow_task", task.id);
      return updated;
    });

    app.post<{ Params: IdParams; Body: WorkflowDecisionBody }>("/api/v1/operations/workflow-tasks/:id/decision", {
      preHandler: requireRoles(["listener_supervisor", "safety_operations_specialist", "platform_administrator"]),
      schema: {
        ...security,
        tags: ["Workflow Registry"],
        summary: "Record a human decision for an acknowledged workflow task",
        params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
        body: {
          type: "object",
          additionalProperties: false,
          required: ["decision", "policyVersion"],
          properties: {
            decision: { type: "string", enum: ["approved", "rejected", "returned"] },
            decisionReasonCode: { type: "string", maxLength: 100 },
            policyVersion: { type: "string", minLength: 1, maxLength: 100 },
          },
        },
        response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
      },
    }, async (request, reply) => {
      const userId = actorId(request);
      const task = await prisma.workflowTask.findUnique({ where: { id: request.params.id } });
      if (!task || (task.assigneeUserId && task.assigneeUserId !== userId)) {
        return apiError(reply, 404, "ASSIGNED_TASK_NOT_FOUND", "A task assigned to the authenticated user was not found.");
      }
      if (task.status !== "acknowledged") return apiError(reply, 409, "TASK_NOT_ACKNOWLEDGED", "A task must be acknowledged before a decision.");
      const role = await prisma.roleAssignment.findFirst({
        where: { userId, roleCode: task.requiredRole, assignmentState: "active", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        select: { roleCode: true },
      });
      if (!role) return apiError(reply, 403, "TASK_ROLE_REQUIRED", "The required task role is not assigned.");
      const result = await prisma.$transaction(async (tx) => {
        const approval = await tx.humanApproval.create({
          data: {
            executionId: task.executionId,
            taskId: task.id,
            approverUserId: userId,
            requiredRole: task.requiredRole,
            decision: request.body.decision,
            decisionReasonCode: request.body.decisionReasonCode,
            policyVersion: request.body.policyVersion,
          },
        });
        await tx.workflowTask.update({
          where: { id: task.id },
          data: {
            status: request.body.decision === "returned" ? "queued" : "completed",
            completedAt: request.body.decision === "returned" ? null : new Date(),
          },
        });
        return approval;
      });
      await audit(request, userId, "workflow.task.decision", "human_approval", result.id);
      return reply.code(201).send(result);
    });

    app.post<{ Body: AgentInvocationBody }>("/api/v1/agent/tool-invocations", {
      preHandler: requireRoles(["ai_agent_service"]),
      schema: {
        ...security,
        tags: ["AI Agent Tools"],
        summary: "Record a requested agent tool invocation digest; this API does not execute or authorize tools",
        body: {
          type: "object",
          additionalProperties: false,
          required: ["agentRunId", "toolCode", "toolVersion", "scope", "inputDigest"],
          properties: {
            agentRunId: { type: "string", pattern: uuidPattern },
            toolCode: { type: "string", minLength: 1, maxLength: 100 },
            toolVersion: { type: "string", minLength: 1, maxLength: 100 },
            scope: { type: "array", maxItems: 30, uniqueItems: true, items: { type: "string", maxLength: 100 } },
            inputDigest: { type: "string", pattern: "^[0-9a-f]{64}$" },
          },
        },
        response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
    }, async (request, reply) => {
      const run = await prisma.aiProcessingRun.findUnique({ where: { id: request.body.agentRunId }, select: { id: true } });
      if (!run) return apiError(reply, 404, "AI_RUN_NOT_FOUND", "AI processing run was not found.");
      const invocation = await prisma.agentToolInvocation.create({
        data: {
          agentRunId: run.id,
          toolCode: request.body.toolCode,
          toolVersion: request.body.toolVersion,
          scope: request.body.scope,
          inputDigest: Buffer.from(request.body.inputDigest, "hex"),
          status: "requested",
          correlationId: request.id,
        },
      });
      return reply.code(201).send({
        id: invocation.id,
        status: invocation.status,
        toolCode: invocation.toolCode,
        startedAt: invocation.startedAt,
      });
    });

    app.post<{ Body: OutboxBody }>("/api/v1/admin/outbox-events", {
      preHandler: requireRoles(["platform_administrator"]),
      schema: {
        ...security,
        tags: ["Eventing"],
        summary: "Register a minimized outbox event for integration testing",
        body: {
          type: "object",
          additionalProperties: false,
          required: ["eventType", "eventVersion", "aggregateType", "aggregateId", "payload"],
          properties: {
            eventType: { type: "string", minLength: 1, maxLength: 100 },
            eventVersion: { type: "integer", minimum: 1 },
            aggregateType: { type: "string", minLength: 1, maxLength: 100 },
            aggregateId: { type: "string", minLength: 1, maxLength: 200 },
            payload: {
              type: "object",
              additionalProperties: false,
              properties: {
                resourceId: { type: "string", maxLength: 200 },
                state: { type: "string", maxLength: 100 },
                correlationId: { type: "string", maxLength: 100 },
              },
            },
          },
        },
        response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema },
      },
    }, async (request, reply) => {
      const event = await prisma.outboxEvent.create({
        data: { ...request.body, payload: request.body.payload },
      });
      await audit(request, actorId(request), "event.outbox.create", "outbox_event", event.id);
      return reply.code(201).send({
        id: event.id,
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        occurredAt: event.occurredAt,
        publishedAt: event.publishedAt,
      });
    });

    app.post<{ Params: IdParams; Body: ReceiptBody }>("/api/v1/admin/event-consumer-receipts/:id", {
      preHandler: requireRoles(["platform_administrator"]),
      schema: {
        ...security,
        tags: ["Eventing"],
        summary: "Record an idempotent event-consumer receipt",
        params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
        body: {
          type: "object",
          additionalProperties: false,
          required: ["eventId", "eventVersion", "outcomeCode"],
          properties: {
            eventId: { type: "string", pattern: uuidPattern },
            eventVersion: { type: "integer", minimum: 1 },
            outcomeCode: { type: "string", minLength: 1, maxLength: 100 },
          },
        },
        response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema },
      },
    }, async (request, reply) => {
      const receipt = await prisma.eventConsumerReceipt.upsert({
        where: { consumerCode_eventId: { consumerCode: request.params.id, eventId: request.body.eventId } },
        create: {
          consumerCode: request.params.id,
          eventId: request.body.eventId,
          eventVersion: request.body.eventVersion,
          outcomeCode: request.body.outcomeCode,
        },
        update: {},
      });
      await audit(request, actorId(request), "event.consumer.receipt", "event_consumer_receipt", receipt.id);
      return reply.code(201).send(receipt);
    });

    app.post<{ Body: NotificationBody }>("/api/v1/admin/notifications", {
      preHandler: requireRoles(["platform_administrator"]),
      schema: {
        ...security,
        tags: ["Notifications"],
        summary: "Queue a non-sensitive notification reference without claiming delivery",
        body: {
          type: "object",
          additionalProperties: false,
          required: ["userId", "notificationType", "channel", "payloadReference", "scheduledAt", "deduplicationKey"],
          properties: {
            userId: { type: "string", maxLength: 200 },
            notificationType: { type: "string", minLength: 1, maxLength: 100 },
            channel: { type: "string", enum: ["email", "sms", "push", "in_app"] },
            payloadReference: { type: "string", minLength: 1, maxLength: 200 },
            scheduledAt: { type: "string", format: "date-time" },
            deduplicationKey: { type: "string", minLength: 1, maxLength: 200 },
          },
        },
        response: { 201: { type: "object" }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
    }, async (request, reply) => {
      const principal = await prisma.appPrincipal.findUnique({
        where: { userId: request.body.userId },
        select: { userId: true, accountState: true },
      });
      if (!principal || principal.accountState !== "active") return apiError(reply, 404, "ACTIVE_PRINCIPAL_NOT_FOUND", "An active MindSpace principal was not found.");
      const notification = await prisma.notification.create({
        data: {
          ...request.body,
          scheduledAt: new Date(request.body.scheduledAt),
          deliveryState: "queued",
        },
      });
      await audit(request, actorId(request), "notification.queue", "notification", notification.id);
      return reply.code(201).send({
        id: notification.id,
        deliveryState: notification.deliveryState,
        scheduledAt: notification.scheduledAt,
      });
    });

  app.get("/api/v1/auth/session-policy", {
    preHandler: requireActivePrincipal,
    schema: {
      ...security,
      tags: ["Identity & Access"],
      summary: "Explain the external identity provider session-management boundary",
      response: { 200: { type: "object" }, 401: errorSchema, 403: errorSchema },
    },
  }, async () => ({
    sessionManagement: "external_identity_provider",
    logout: "Use the MindSpace identity provider to end the current session.",
  }));
}
