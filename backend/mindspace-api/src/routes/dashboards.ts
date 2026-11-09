import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { recordAudit } from "../audit.js";
import { requireMember, requireRoles } from "../auth.js";
import { prisma } from "../db.js";

const security = { security: [{ bearerAuth: [] }] };
const errorSchema = { $ref: "ErrorResponse#" };
const uuidPattern = "^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
const hexDigestPattern = "^[0-9a-f]{64}$";

type IdParams = { id: string };
type AuditQuery = { actionCode?: string; actorUserId?: string; resourceType?: string; limit?: number };
type ConductQuery = { reportState?: string };
type AgentRunQuery = { runState?: string; memberId?: string };
type InvocationQuery = { agentRunId?: string; status?: string };
type WorkflowTaskQuery = { status?: string };

type ConductUpdateBody = {
  reportState: "open" | "in_review" | "resolved" | "closed";
  assignedToUserId?: string;
};

type SupervisorAssignmentBody = {
  listenerProfileId: string;
  supervisorUserId: string;
  reasonCode: string;
};

type AgentRunBody = {
  memberId?: string;
  purposeCode: string;
  sourceType: string;
  sourceRecordId?: string;
  consentId?: string;
  modelVersion: string;
  policyVersion: string;
};

type AgentRunStateBody = { runState: "completed" | "failed"; errorCode?: string };

type AgentInvocationStateBody = { status: "completed" | "failed"; outputDigest?: string };

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

function startOfWeek(now = new Date()): Date {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  return start;
}

async function activeListenerProfile(userId: string) {
  return prisma.listenerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      applicationState: true,
      eligibilityState: true,
      eligibilityExpiresAt: true,
      capacityLimit: true,
      profileLanguages: true,
    },
  });
}

export async function registerDashboardRoutes(app: FastifyInstance) {
  app.get("/api/v1/members/me/summary", {
    preHandler: requireMember,
    schema: {
      ...security,
      tags: ["Member Dashboard"],
      summary: "Aggregate the authenticated member's own dashboard counts without exposing record content",
      response: { 200: { type: "object", additionalProperties: true }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const weekStart = startOfWeek();
    const [
      checkinsThisWeek,
      savedReflections,
      activeGoals,
      openSupportRequests,
      openConversations,
      queuedNotifications,
      openPrivacyRequests,
    ] = await Promise.all([
      prisma.moodEntry.count({ where: { memberId: userId, recordedAt: { gte: weekStart } } }),
      prisma.journalEntry.count({ where: { memberId: userId, deletedAt: null } }),
      prisma.wellbeingGoal.count({ where: { memberId: userId, status: "active" } }),
      prisma.listenerMatchRequest.count({
        where: { memberId: userId, requestState: { in: ["queued", "offered", "accepted"] } },
      }),
      prisma.peerConversation.count({ where: { memberId: userId, conversationState: "open" } }),
      prisma.notification.count({ where: { userId, deliveryState: "queued" } }),
      prisma.privacyRequest.count({
        where: { userId, requestState: { notIn: ["completed", "rejected", "cancelled"] } },
      }),
    ]);
    await audit(request, userId, "member.dashboard.summary", "app_principal", userId);
    return {
      checkinsThisWeek,
      savedReflections,
      activeGoals,
      openSupportRequests,
      openConversations,
      queuedNotifications,
      openPrivacyRequests,
    };
  });

  app.get("/api/v1/listeners/me/profile", {
    preHandler: requireRoles(["listener"]),
    schema: {
      ...security,
      tags: ["Listener Dashboard"],
      summary: "Read the authenticated listener's application and eligibility profile",
      response: { 200: { type: "object", additionalProperties: true }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const profile = await prisma.listenerProfile.findUnique({ where: { userId } });
    if (!profile) return apiError(reply, 404, "LISTENER_PROFILE_NOT_FOUND", "Listener profile was not found.");
    return profile;
  });

  app.get("/api/v1/listeners/me/training", {
    preHandler: requireRoles(["listener"]),
    schema: {
      ...security,
      tags: ["Listener Dashboard"],
      summary: "List the authenticated listener's training records",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const profile = await activeListenerProfile(userId);
    if (!profile) return apiError(reply, 404, "LISTENER_PROFILE_NOT_FOUND", "Listener profile was not found.");
    return prisma.listenerTrainingRecord.findMany({
      where: { listenerId: profile.id },
      orderBy: [{ completedAt: "desc" }, { id: "desc" }],
      take: 100,
    });
  });

  app.get("/api/v1/listeners/me/summary", {
    preHandler: requireRoles(["listener"]),
    schema: {
      ...security,
      tags: ["Listener Dashboard"],
      summary: "Aggregate the authenticated listener's workload, offers, training, and availability",
      response: { 200: { type: "object", additionalProperties: true }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const profile = await activeListenerProfile(userId);
    if (!profile) return apiError(reply, 404, "LISTENER_PROFILE_NOT_FOUND", "Listener profile was not found.");

    const weekStart = startOfWeek();
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    const [openConversations, offers, training, availability, upcomingFollowups] = await Promise.all([
      prisma.peerConversation.count({ where: { listenerId: profile.id, conversationState: "open" } }),
      prisma.listenerMatch.count({ where: { listenerId: profile.id, matchState: "offered" } }),
      prisma.listenerTrainingRecord.findMany({
        where: { listenerId: profile.id },
        orderBy: [{ completedAt: "desc" }, { id: "desc" }],
        take: 20,
      }),
      prisma.listenerAvailability.findMany({
        where: { listenerId: profile.id, endsAt: { gt: weekStart }, startsAt: { lt: weekEnd } },
        select: { startsAt: true, endsAt: true, availabilityState: true },
      }),
      prisma.followup.count({ where: { memberId: userId, followupState: "scheduled" } }),
    ]);

    const availableHours = availability.reduce((total, interval) => {
      if (interval.availabilityState !== "available") return total;
      return total + (interval.endsAt.getTime() - interval.startsAt.getTime()) / 3_600_000;
    }, 0);
    const passedTraining = training.filter(
      (record) => record.completionState === "passed" && (!record.expiresAt || record.expiresAt > new Date()),
    ).length;

    await audit(request, userId, "listener.dashboard.summary", "listener_profile", profile.id);
    return {
      applicationState: profile.applicationState,
      eligibilityState: profile.eligibilityState,
      capacityLimit: profile.capacityLimit,
      openConversations,
      openOffers: offers,
      passedTraining,
      trainingRecords: training.length,
      availableHoursThisWeek: Math.round(availableHours * 10) / 10,
      scheduledFollowups: upcomingFollowups,
    };
  });

  app.get("/api/v1/operations/supervisor/summary", {
    preHandler: requireRoles(["listener_supervisor", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Listener Supervision"],
      summary: "Aggregate listener readiness, conduct, and training review counts",
      response: { 200: { type: "object", additionalProperties: true }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const [activeListeners, pendingApplications, trainingDue, openConductReports, openConversations] = await Promise.all([
      prisma.listenerProfile.count({ where: { applicationState: "approved", eligibilityState: "eligible" } }),
      prisma.listenerProfile.count({ where: { applicationState: "pending" } }),
      prisma.listenerTrainingRecord.count({
        where: { completionState: { in: ["assigned", "in_progress"] } },
      }),
      prisma.conductReport.count({ where: { reportState: { in: ["open", "in_review"] } } }),
      prisma.peerConversation.count({ where: { conversationState: "open" } }),
    ]);
    await audit(request, userId, "supervisor.dashboard.summary", "listener_profile");
    return { activeListeners, pendingApplications, trainingDue, openConductReports, openConversations };
  });

  app.get("/api/v1/operations/supervisor/listeners", {
    preHandler: requireRoles(["listener_supervisor", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Listener Supervision"],
      summary: "List the listener roster with readiness, training, and open-conversation counts",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const profiles = await prisma.listenerProfile.findMany({
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    const profileIds = profiles.map((profile) => profile.id);
    const userIds = profiles.map((profile) => profile.userId);

    const [memberProfiles, training, conversationCounts, activeAssignments] = await Promise.all([
      prisma.memberProfile.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, displayName: true },
      }),
      prisma.listenerTrainingRecord.findMany({
        where: { listenerId: { in: profileIds } },
        orderBy: [{ completedAt: "desc" }, { id: "desc" }],
      }),
      prisma.peerConversation.groupBy({
        by: ["listenerId"],
        where: { listenerId: { in: profileIds }, conversationState: "open" },
        _count: { _all: true },
      }),
      prisma.listenerSupervisorAssignment.findMany({
        where: { listenerId: { in: profileIds }, assignmentState: "active" },
        select: { listenerId: true, supervisorUserId: true },
      }),
    ]);

    const nameByUserId = new Map(memberProfiles.map((profile) => [profile.userId, profile.displayName]));
    const latestTraining = new Map<string, (typeof training)[number]>();
    for (const record of training) {
      if (!latestTraining.has(record.listenerId)) latestTraining.set(record.listenerId, record);
    }
    const openByListener = new Map(conversationCounts.map((row) => [row.listenerId, row._count._all]));
    const supervisorByListener = new Map(activeAssignments.map((row) => [row.listenerId, row.supervisorUserId]));

    await audit(request, userId, "supervisor.listener.list", "listener_profile");
    return profiles.map((profile) => ({
      listenerProfileId: profile.id,
      userId: profile.userId,
      displayName: nameByUserId.get(profile.userId) ?? null,
      applicationState: profile.applicationState,
      eligibilityState: profile.eligibilityState,
      eligibilityExpiresAt: profile.eligibilityExpiresAt,
      capacityLimit: profile.capacityLimit,
      profileLanguages: profile.profileLanguages,
      approvedAt: profile.approvedAt,
      openConversations: openByListener.get(profile.id) ?? 0,
      latestTraining: latestTraining.get(profile.id) ?? null,
      supervisorUserId: supervisorByListener.get(profile.id) ?? null,
    }));
  });

  app.get("/api/v1/operations/supervisor/training-records", {
    preHandler: requireRoles(["listener_supervisor", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Listener Supervision"],
      summary: "List listener training records for review",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const records = await prisma.listenerTrainingRecord.findMany({
      orderBy: [{ completedAt: "desc" }, { id: "desc" }],
      take: 200,
    });
    await audit(request, userId, "supervisor.training.list", "listener_training_record");
    return records;
  });

  app.get<{ Querystring: ConductQuery }>("/api/v1/operations/supervisor/conduct-reports", {
    preHandler: requireRoles(["listener_supervisor", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Listener Supervision"],
      summary: "List conduct reports without encrypted details",
      querystring: {
        type: "object",
        additionalProperties: false,
        properties: { reportState: { type: "string", enum: ["open", "in_review", "resolved", "closed"] } },
      },
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const reports = await prisma.conductReport.findMany({
      where: request.query.reportState ? { reportState: request.query.reportState } : undefined,
      select: {
        id: true,
        conversationId: true,
        reporterUserId: true,
        reportedUserId: true,
        categoryCode: true,
        reportState: true,
        assignedToUserId: true,
        createdAt: true,
        resolvedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    await audit(request, userId, "supervisor.conduct.list", "conduct_report");
    return reports;
  });

  app.patch<{ Params: IdParams; Body: ConductUpdateBody }>("/api/v1/operations/supervisor/conduct-reports/:id", {
    preHandler: requireRoles(["listener_supervisor", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Listener Supervision"],
      summary: "Advance a conduct report through supervisor review states",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["reportState"],
        properties: {
          reportState: { type: "string", enum: ["open", "in_review", "resolved", "closed"] },
          assignedToUserId: { type: "string", minLength: 1, maxLength: 200 },
        },
      },
      response: { 200: { type: "object", additionalProperties: true }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const report = await prisma.conductReport.findUnique({ where: { id: request.params.id } });
    if (!report) return apiError(reply, 404, "CONDUCT_REPORT_NOT_FOUND", "Conduct report was not found.");
    const transitions: Record<string, string[]> = {
      open: ["in_review", "resolved", "closed"],
      in_review: ["open", "resolved", "closed"],
      resolved: ["closed", "open"],
      closed: [],
    };
    if (!transitions[report.reportState]?.includes(request.body.reportState)) {
      return apiError(reply, 409, "INVALID_REPORT_TRANSITION", "The requested conduct report transition is not allowed.");
    }
    if (request.body.assignedToUserId) {
      const assignee = await prisma.roleAssignment.findFirst({
        where: {
          userId: request.body.assignedToUserId,
          roleCode: "listener_supervisor",
          assignmentState: "active",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true },
      });
      if (!assignee) return apiError(reply, 400, "SUPERVISOR_ROLE_REQUIRED", "The assignee needs an active listener supervisor role.");
    }
    const updated = await prisma.conductReport.update({
      where: { id: report.id },
      data: {
        reportState: request.body.reportState,
        assignedToUserId: request.body.assignedToUserId ?? report.assignedToUserId ?? userId,
        resolvedAt: request.body.reportState === "resolved" || request.body.reportState === "closed" ? new Date() : null,
      },
    });
    await audit(request, userId, "supervisor.conduct.transition", "conduct_report", updated.id);
    return updated;
  });

  app.get("/api/v1/operations/supervisor/assignments", {
    preHandler: requireRoles(["listener_supervisor", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Listener Supervision"],
      summary: "List active listener-to-supervisor assignments",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const assignments = await prisma.listenerSupervisorAssignment.findMany({
      where: { assignmentState: "active" },
      orderBy: { assignedAt: "desc" },
      take: 200,
    });
    await audit(request, userId, "supervisor.assignment.list", "listener_supervisor_assignment");
    return assignments;
  });

  app.post<{ Body: SupervisorAssignmentBody }>("/api/v1/operations/supervisor/assignments", {
    preHandler: requireRoles(["listener_supervisor", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Listener Supervision"],
      summary: "Assign a listener to a supervisor for readiness and quality support",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["listenerProfileId", "supervisorUserId", "reasonCode"],
        properties: {
          listenerProfileId: { type: "string", pattern: uuidPattern },
          supervisorUserId: { type: "string", minLength: 1, maxLength: 200 },
          reasonCode: { type: "string", minLength: 1, maxLength: 100 },
        },
      },
      response: { 201: { type: "object", additionalProperties: true }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const [listener, supervisor, existing] = await Promise.all([
      prisma.listenerProfile.findUnique({ where: { id: request.body.listenerProfileId }, select: { id: true } }),
      prisma.roleAssignment.findFirst({
        where: {
          userId: request.body.supervisorUserId,
          roleCode: "listener_supervisor",
          assignmentState: "active",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true },
      }),
      prisma.listenerSupervisorAssignment.findFirst({
        where: { listenerId: request.body.listenerProfileId, assignmentState: "active" },
        select: { id: true },
      }),
    ]);
    if (!listener) return apiError(reply, 404, "LISTENER_PROFILE_NOT_FOUND", "Listener profile was not found.");
    if (!supervisor) return apiError(reply, 400, "SUPERVISOR_ROLE_REQUIRED", "The supervisor needs an active listener supervisor role.");
    if (existing) return apiError(reply, 409, "SUPERVISOR_ALREADY_ASSIGNED", "The listener already has an active supervisor assignment.");
    const assignment = await prisma.listenerSupervisorAssignment.create({
      data: {
        listenerId: listener.id,
        supervisorUserId: request.body.supervisorUserId,
        assignmentState: "active",
        assignedByUserId: userId,
        reasonCode: request.body.reasonCode,
      },
    });
    await audit(request, userId, "supervisor.assignment.create", "listener_supervisor_assignment", assignment.id);
    return reply.code(201).send(assignment);
  });

  app.get<{ Params: IdParams }>("/api/v1/operations/safety/cases/:id/actions", {
    preHandler: requireRoles(["safety_operations_specialist", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Safety Operations"],
      summary: "List the human action timeline for a safety case without encrypted notes",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const safetyCase = await prisma.safetyCase.findUnique({ where: { id: request.params.id }, select: { id: true } });
    if (!safetyCase) return apiError(reply, 404, "SAFETY_CASE_NOT_FOUND", "Safety case was not found.");
    const actions = await prisma.safetyCaseAction.findMany({
      where: { caseId: safetyCase.id },
      select: {
        id: true,
        caseId: true,
        actorUserId: true,
        actionType: true,
        actionState: true,
        resourceId: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: "desc" },
      take: 200,
    });
    await audit(request, userId, "safety.case.actions.list", "safety_case", safetyCase.id);
    return actions;
  });

  app.get("/api/v1/operations/safety/followups", {
    preHandler: requireRoles(["safety_operations_specialist", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Safety Operations"],
      summary: "List scheduled and completed safety follow-ups without response content",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const followups = await prisma.followup.findMany({
      select: {
        id: true,
        memberId: true,
        sourceType: true,
        sourceRecordId: true,
        scheduledAt: true,
        followupState: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: { scheduledAt: "asc" },
      take: 200,
    });
    await audit(request, userId, "safety.followup.list", "followup");
    return followups;
  });

  app.get("/api/v1/operations/safety/summary", {
    preHandler: requireRoles(["safety_operations_specialist", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["Safety Operations"],
      summary: "Aggregate assigned safety cases, handoffs, follow-ups, and resource verification",
      response: { 200: { type: "object", additionalProperties: true }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const [assignedToMe, openCases, handoffsPending, followupsDue, pendingResources] = await Promise.all([
      prisma.safetyCase.count({ where: { assignedResponderUserId: userId, caseState: { not: "closed" } } }),
      prisma.safetyCase.count({ where: { caseState: { in: ["new", "queued", "assigned", "in_progress"] } } }),
      prisma.safetyCase.count({ where: { caseState: "handed_off" } }),
      prisma.followup.count({ where: { followupState: "scheduled", scheduledAt: { lte: new Date() } } }),
      prisma.crisisResource.count({ where: { verificationState: { not: "verified" } } }),
    ]);
    await audit(request, userId, "safety.dashboard.summary", "safety_case");
    return { assignedToMe, openCases, handoffsPending, followupsDue, pendingResources };
  });

  app.get<{ Querystring: AuditQuery }>("/api/v1/admin/audit-events", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Administration"],
      summary: "Read audit events for administrative review",
      querystring: {
        type: "object",
        additionalProperties: false,
        properties: {
          actionCode: { type: "string", maxLength: 100 },
          actorUserId: { type: "string", maxLength: 200 },
          resourceType: { type: "string", maxLength: 100 },
          limit: { type: "integer", minimum: 1, maximum: 200, default: 100 },
        },
      },
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const events = await prisma.auditEvent.findMany({
      where: {
        actionCode: request.query.actionCode,
        actorUserId: request.query.actorUserId,
        resourceType: request.query.resourceType,
      },
      orderBy: { occurredAt: "desc" },
      take: request.query.limit ?? 100,
    });
    await audit(request, userId, "admin.audit.list", "audit_event");
    return events;
  });

  app.get("/api/v1/admin/platform/overview", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Administration"],
      summary: "Aggregate platform access, workflow, safety, eventing, and AI operational counts",
      response: { 200: { type: "object", additionalProperties: true }, 401: errorSchema, 403: errorSchema, 503: errorSchema },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const [principals, roles, openCases, pendingTasks, queuedNotifications, outboxBacklog, aiRuns, auditEvents] = await Promise.all([
        prisma.appPrincipal.count({ where: { accountState: "active" } }),
        prisma.roleAssignment.groupBy({
          by: ["roleCode"],
          where: {
            assignmentState: "active",
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          _count: { _all: true },
        }),
        prisma.safetyCase.count({ where: { caseState: { not: "closed" } } }),
        prisma.workflowTask.count({ where: { status: { in: ["queued", "assigned", "acknowledged"] } } }),
        prisma.notification.count({ where: { deliveryState: "queued" } }),
        prisma.outboxEvent.count({ where: { publishedAt: null } }),
        prisma.aiProcessingRun.count({ where: { startedAt: { gte: since } } }),
        prisma.auditEvent.count({ where: { occurredAt: { gte: since } } }),
      ]);
      await prisma.$queryRaw`SELECT 1`;
      await audit(request, userId, "admin.platform.overview", "platform");
      return {
        database: "operational",
        activePrincipals: principals,
        activeRolesByCode: Object.fromEntries(roles.map((row) => [row.roleCode, row._count._all])),
        openSafetyCases: openCases,
        pendingWorkflowTasks: pendingTasks,
        queuedNotifications,
        unpublishedOutboxEvents: outboxBacklog,
        aiRunsLast24h: aiRuns,
        auditEventsLast24h: auditEvents,
        generatedAt: new Date().toISOString(),
      };
    } catch {
      return reply.code(503).send({
        database: "unavailable",
        generatedAt: new Date().toISOString(),
      });
    }
  });

  app.get("/api/v1/admin/workflow-definitions", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Workflow Registry"],
      summary: "List registered workflow definitions",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async () => prisma.workflowDefinition.findMany({
    orderBy: [{ processCode: "asc" }, { version: "desc" }],
    take: 200,
  }));

  app.get("/api/v1/admin/workflow-executions", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Workflow Registry"],
      summary: "List registered workflow executions",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async () => prisma.workflowExecution.findMany({
    orderBy: { startedAt: "desc" },
    take: 200,
  }));

  app.get<{ Querystring: WorkflowTaskQuery }>("/api/v1/admin/workflow-tasks", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Workflow Registry"],
      summary: "List human workflow tasks across all states",
      querystring: {
        type: "object",
        additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["queued", "assigned", "acknowledged", "completed", "cancelled"] },
        },
      },
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => prisma.workflowTask.findMany({
    where: request.query.status ? { status: request.query.status } : undefined,
    orderBy: [{ dueAt: "asc" }, { id: "asc" }],
    take: 200,
  }));

  app.get("/api/v1/admin/notifications", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Notifications"],
      summary: "List queued and recent notifications without sensitive payload content",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async () => prisma.notification.findMany({
    select: {
      id: true,
      userId: true,
      notificationType: true,
      channel: true,
      payloadReference: true,
      scheduledAt: true,
      sentAt: true,
      deliveryState: true,
      attemptCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  }));

  app.get("/api/v1/admin/self-help/content", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Administration"],
      summary: "List self-help content versions for review",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async () => prisma.selfHelpContent.findMany({
    orderBy: [{ contentCode: "asc" }, { contentVersion: "desc" }],
    take: 200,
  }));

  app.get("/api/v1/admin/outbox-events", {
    preHandler: requireRoles(["platform_administrator"]),
    schema: {
      ...security,
      tags: ["Eventing"],
      summary: "List unpublished outbox events for operations",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async () => prisma.outboxEvent.findMany({
    where: { publishedAt: null },
    orderBy: { occurredAt: "asc" },
    take: 200,
  }));

  app.post<{ Body: AgentRunBody }>("/api/v1/agent/runs", {
    preHandler: requireRoles(["ai_agent_service"]),
    schema: {
      ...security,
      tags: ["AI Agent Tools"],
      summary: "Register an AI processing run reference; this API does not call a model provider",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["purposeCode", "sourceType", "modelVersion", "policyVersion"],
        properties: {
          memberId: { type: "string", maxLength: 200 },
          purposeCode: { type: "string", minLength: 1, maxLength: 100 },
          sourceType: { type: "string", minLength: 1, maxLength: 100 },
          sourceRecordId: { type: "string", pattern: uuidPattern },
          consentId: { type: "string", pattern: uuidPattern },
          modelVersion: { type: "string", minLength: 1, maxLength: 100 },
          policyVersion: { type: "string", minLength: 1, maxLength: 100 },
        },
      },
      response: { 201: { type: "object", additionalProperties: true }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    if (request.body.memberId) {
      const member = await prisma.appPrincipal.findUnique({
        where: { userId: request.body.memberId },
        select: { accountState: true },
      });
      if (!member || member.accountState !== "active") {
        return apiError(reply, 404, "ACTIVE_MEMBER_NOT_FOUND", "An active member was not found.");
      }
      if (request.body.consentId) {
        const consent = await prisma.consentRecord.findFirst({
          where: {
            id: request.body.consentId,
            userId: request.body.memberId,
            consentState: "granted",
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: { id: true },
        });
        if (!consent) return apiError(reply, 409, "CONSENT_REQUIRED", "A current granted consent is required for this member.");
      }
    }
    const run = await prisma.aiProcessingRun.create({
      data: {
        memberId: request.body.memberId,
        purposeCode: request.body.purposeCode,
        sourceType: request.body.sourceType,
        sourceRecordId: request.body.sourceRecordId,
        consentId: request.body.consentId,
        modelVersion: request.body.modelVersion,
        policyVersion: request.body.policyVersion,
        runState: "started",
      },
    });
    await audit(request, actorId(request), "ai.run.create", "ai_processing_run", run.id);
    return reply.code(201).send(run);
  });

  app.get<{ Querystring: AgentRunQuery }>("/api/v1/agent/runs", {
    preHandler: requireRoles(["ai_agent_service", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["AI Agent Tools"],
      summary: "List AI processing run metadata without prompts or private content",
      querystring: {
        type: "object",
        additionalProperties: false,
        properties: {
          runState: { type: "string", maxLength: 40 },
          memberId: { type: "string", maxLength: 200 },
        },
      },
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => prisma.aiProcessingRun.findMany({
    where: { runState: request.query.runState, memberId: request.query.memberId },
    orderBy: { startedAt: "desc" },
    take: 200,
  }));

  app.patch<{ Params: IdParams; Body: AgentRunStateBody }>("/api/v1/agent/runs/:id", {
    preHandler: requireRoles(["ai_agent_service"]),
    schema: {
      ...security,
      tags: ["AI Agent Tools"],
      summary: "Record the terminal state of an AI processing run",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["runState"],
        properties: {
          runState: { type: "string", enum: ["completed", "failed"] },
          errorCode: { type: "string", maxLength: 100 },
        },
      },
      response: { 200: { type: "object", additionalProperties: true }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const run = await prisma.aiProcessingRun.findUnique({ where: { id: request.params.id } });
    if (!run) return apiError(reply, 404, "AI_RUN_NOT_FOUND", "AI processing run was not found.");
    if (run.runState === "completed" || run.runState === "failed") {
      return apiError(reply, 409, "AI_RUN_ALREADY_CLOSED", "The AI processing run is already closed.");
    }
    const updated = await prisma.aiProcessingRun.update({
      where: { id: run.id },
      data: {
        runState: request.body.runState,
        completedAt: new Date(),
        errorCode: request.body.runState === "failed" ? request.body.errorCode ?? "unspecified" : null,
      },
    });
    await audit(request, actorId(request), "ai.run.complete", "ai_processing_run", updated.id);
    return updated;
  });

  app.get<{ Querystring: InvocationQuery }>("/api/v1/agent/tool-invocations", {
    preHandler: requireRoles(["ai_agent_service", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["AI Agent Tools"],
      summary: "List agent tool invocation metadata; digests and scopes are summarized, not executed",
      querystring: {
        type: "object",
        additionalProperties: false,
        properties: {
          agentRunId: { type: "string", pattern: uuidPattern },
          status: { type: "string", maxLength: 40 },
        },
      },
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 400: errorSchema, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const invocations = await prisma.agentToolInvocation.findMany({
      where: { agentRunId: request.query.agentRunId, status: request.query.status },
      select: {
        id: true,
        agentRunId: true,
        toolCode: true,
        toolVersion: true,
        scope: true,
        status: true,
        startedAt: true,
        completedAt: true,
        correlationId: true,
      },
      orderBy: { startedAt: "desc" },
      take: 200,
    });
    return invocations;
  });

  app.patch<{ Params: IdParams; Body: AgentInvocationStateBody }>("/api/v1/agent/tool-invocations/:id", {
    preHandler: requireRoles(["ai_agent_service"]),
    schema: {
      ...security,
      tags: ["AI Agent Tools"],
      summary: "Record the outcome digest of a requested agent tool invocation",
      params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: uuidPattern } } },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["completed", "failed"] },
          outputDigest: { type: "string", pattern: hexDigestPattern },
        },
      },
      response: { 200: { type: "object", additionalProperties: true }, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const invocation = await prisma.agentToolInvocation.findUnique({ where: { id: request.params.id } });
    if (!invocation) return apiError(reply, 404, "TOOL_INVOCATION_NOT_FOUND", "Agent tool invocation was not found.");
    if (invocation.status !== "requested" && invocation.status !== "started") {
      return apiError(reply, 409, "TOOL_INVOCATION_ALREADY_CLOSED", "The tool invocation is already closed.");
    }
    const updated = await prisma.agentToolInvocation.update({
      where: { id: invocation.id },
      data: {
        status: request.body.status,
        outputDigest: request.body.outputDigest ? Buffer.from(request.body.outputDigest, "hex") : null,
        completedAt: new Date(),
      },
    });
    await audit(request, actorId(request), "ai.tool.complete", "agent_tool_invocation", updated.id);
    return {
      id: updated.id,
      status: updated.status,
      toolCode: updated.toolCode,
      completedAt: updated.completedAt,
    };
  });

  app.get("/api/v1/agent/summary", {
    preHandler: requireRoles(["ai_agent_service", "platform_administrator"]),
    schema: {
      ...security,
      tags: ["AI Agent Tools"],
      summary: "Aggregate AI service identities, run volume, tool breadth, and failures",
      response: { 200: { type: "object", additionalProperties: true }, 401: errorSchema, 403: errorSchema },
    },
  }, async (request) => {
    const userId = actorId(request);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [identities, runsLast24h, invocationsLast24h, failedInvocations, tools, runningRuns] = await Promise.all([
      prisma.roleAssignment.findMany({
        where: {
          roleCode: "ai_agent_service",
          assignmentState: "active",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.aiProcessingRun.count({ where: { startedAt: { gte: since } } }),
      prisma.agentToolInvocation.count({ where: { startedAt: { gte: since } } }),
      prisma.agentToolInvocation.count({ where: { status: "failed", startedAt: { gte: since } } }),
      prisma.agentToolInvocation.findMany({ distinct: ["toolCode"], select: { toolCode: true } }),
      prisma.aiProcessingRun.count({ where: { runState: "started" } }),
    ]);
    await audit(request, userId, "ai.dashboard.summary", "ai_processing_run");
    return {
      registeredIdentities: identities.length,
      authorizedTools: tools.length,
      toolCodes: tools.map((tool) => tool.toolCode).sort(),
      runsLast24h,
      invocationsLast24h,
      failedInvocationsLast24h: failedInvocations,
      runningRuns,
    };
  });
}
