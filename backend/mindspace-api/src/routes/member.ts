import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Prisma } from "@prisma/client";
import { recordAudit } from "../audit.js";
import {
  recognizedRoleCodes,
  requireActivePrincipal,
  requireMember,
  requireVerifiedIdentity,
  type RoleCode,
} from "../auth.js";
import { prisma } from "../db.js";

const protectedOperation = { security: [{ bearerAuth: [] }] };
const errorResponse = { $ref: "ErrorResponse#" };
const objectValueSchema = {
  type: "object",
  maxProperties: 30,
  additionalProperties: {
    anyOf: [
      { type: "string", maxLength: 200 },
      { type: "boolean" },
      { type: "number" },
      { type: "array", maxItems: 20, items: { type: "string", maxLength: 100 } },
    ],
  },
} as const;

type ProfileBody = { displayName: string };
type PreferencesBody = {
  locale: string;
  timezone: string;
  preferredLanguages: string[];
  accessibility: Prisma.InputJsonObject;
  communication: Prisma.InputJsonObject;
  supportPreferences: Prisma.InputJsonObject;
};
type CreateConsentBody = {
  purposeCode: string;
  policyVersion: string;
  consentState: "granted" | "denied" | "withdrawn";
  dataScope?: Prisma.InputJsonObject;
  recipientScope?: string;
};
type CreatePrivacyRequestBody = { requestType: "export" | "correction" | "deletion" | "access" };

function actorId(request: FastifyRequest): string {
  if (!request.userId) {
    throw new Error("Authenticated MindSpace identity is missing");
  }
  return request.userId;
}

function sendApiError(reply: FastifyReply, statusCode: number, code: string, message: string) {
  return reply.code(statusCode).send({ error: { code, message } });
}

function serializeConsent(consent: {
  id: string;
  purposeCode: string;
  recipientScope: string | null;
  dataScope: Prisma.JsonValue;
  policyVersion: string;
  consentState: string;
  capturedAt: Date;
  expiresAt: Date | null;
  supersedesId: string | null;
}) {
  return {
    id: consent.id,
    purposeCode: consent.purposeCode,
    recipientScope: consent.recipientScope,
    dataScope: consent.dataScope,
    policyVersion: consent.policyVersion,
    consentState: consent.consentState,
    capturedAt: consent.capturedAt,
    expiresAt: consent.expiresAt,
    supersedesId: consent.supersedesId,
  };
}

export async function registerMemberRoutes(app: FastifyInstance) {
  app.post("/api/v1/members/me/provision", {
    preHandler: requireVerifiedIdentity,
    schema: {
      ...protectedOperation,
      tags: ["Identity & Access"],
      summary: "Provision a verified identity as a MindSpace member",
      description: "Creates only the authenticated user's member principal and default member role. It cannot grant other roles.",
      response: {
        200: {
          type: "object",
          properties: {
            userId: { type: "string" },
            roles: { type: "array", items: { type: "string" } },
            displayName: { type: "string" },
          },
          required: ["userId", "roles", "displayName"],
        },
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const claimedName = request.identityClaims?.name;
    const displayName = typeof claimedName === "string" && claimedName.trim().length > 0
      ? claimedName.trim().slice(0, 100)
      : userId.slice(0, 100);

    const provisioned = await prisma.$transaction(async (transaction) => {
      const createdPrincipal = await transaction.appPrincipal.createMany({
        data: [{ userId }],
        skipDuplicates: true,
      });

      if (createdPrincipal.count === 1) {
        await transaction.roleAssignment.create({
          data: {
            userId,
            roleCode: "member",
            assignmentState: "active",
            decisionReason: "Initial member enrollment from a verified identity provider",
          },
        });
      }

      const principal = await transaction.appPrincipal.findUnique({
        where: { userId },
        select: {
          accountState: true,
          roles: {
            where: {
              assignmentState: "active",
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            select: { roleCode: true },
          },
        },
      });
      if (!principal || principal.accountState !== "active") {
        return { error: "ACTIVE_ACCOUNT_REQUIRED" as const };
      }

      const roles = principal.roles
        .map(({ roleCode }) => roleCode)
        .filter((role): role is RoleCode => recognizedRoleCodes.has(role));
      if (!roles.includes("member")) {
        return { error: "MEMBER_ROLE_REQUIRED" as const };
      }

      const profile = await transaction.memberProfile.upsert({
        where: { userId },
        create: { userId, displayName },
        update: {},
        select: { displayName: true },
      });
      return { userId, roles, displayName: profile.displayName };
    });

    if ("error" in provisioned && provisioned.error) {
      return sendApiError(reply, 403, provisioned.error, "An active MindSpace member account is required.");
    }

    await recordAudit({
      actorUserId: userId,
      actionCode: "identity.provision_member",
      resourceType: "app_principal",
      resourceId: userId,
      correlationId: request.id,
    });
    return provisioned;
  });

  app.get("/api/v1/me", {
    preHandler: requireActivePrincipal,
    schema: {
      ...protectedOperation,
      tags: ["Identity & Access"],
      summary: "Get the authenticated MindSpace principal and active roles",
      response: {
        200: {
          type: "object",
          properties: {
            userId: { type: "string" },
            roles: { type: "array", items: { type: "string" } },
          },
          required: ["userId", "roles"],
        },
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, async (request) => {
    const userId = actorId(request);
    await recordAudit({
      actorUserId: userId,
      actionCode: "identity.read_self",
      resourceType: "app_principal",
      resourceId: userId,
      correlationId: request.id,
    });
    return { userId, roles: request.roleCodes ?? [] };
  });

  app.get("/api/v1/members/me/profile", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Members"],
      summary: "Get the authenticated member's profile",
      response: {
        200: {
          type: "object",
          properties: {
            userId: { type: "string" },
            displayName: { type: "string" },
            eligibilityState: { type: "string" },
            profileState: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["userId", "displayName", "eligibilityState", "profileState", "createdAt", "updatedAt"],
        },
        404: errorResponse,
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const profile = await prisma.memberProfile.findUnique({ where: { userId } });
    if (!profile) {
      return sendApiError(reply, 404, "PROFILE_NOT_FOUND", "Create a member profile before requesting it.");
    }
    await recordAudit({
      actorUserId: userId,
      actionCode: "member.profile.read",
      resourceType: "member_profile",
      resourceId: userId,
      correlationId: request.id,
    });
    return profile;
  });

  app.put<{ Body: ProfileBody }>("/api/v1/members/me/profile", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Members"],
      summary: "Create or update the authenticated member's display name",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["displayName"],
        properties: { displayName: { type: "string", minLength: 1, maxLength: 100 } },
      },
      response: {
        200: {
          type: "object",
          properties: {
            userId: { type: "string" },
            displayName: { type: "string" },
            eligibilityState: { type: "string" },
            profileState: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["userId", "displayName", "eligibilityState", "profileState", "createdAt", "updatedAt"],
        },
        400: errorResponse,
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const displayName = request.body.displayName.trim();
    if (displayName.length === 0) {
      return sendApiError(reply, 400, "INVALID_DISPLAY_NAME", "Display name cannot be blank.");
    }
    const profile = await prisma.memberProfile.upsert({
      where: { userId },
      create: { userId, displayName },
      update: { displayName },
    });
    await recordAudit({
      actorUserId: userId,
      actionCode: "member.profile.update",
      resourceType: "member_profile",
      resourceId: userId,
      correlationId: request.id,
    });
    return profile;
  });

  app.get("/api/v1/members/me/preferences", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Members"],
      summary: "Get the authenticated member's preferences",
      response: {
        200: {
          type: "object",
          properties: {
            userId: { type: "string" },
            locale: { type: "string" },
            timezone: { type: "string" },
            preferredLanguages: { type: "array", items: { type: "string" } },
            accessibility: { type: "object", additionalProperties: true },
            communication: { type: "object", additionalProperties: true },
            supportPreferences: { type: "object", additionalProperties: true },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["userId", "locale", "timezone", "preferredLanguages", "accessibility", "communication", "supportPreferences", "updatedAt"],
        },
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, async (request) => {
    const userId = actorId(request);
    const preferences = await prisma.memberPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    await recordAudit({
      actorUserId: userId,
      actionCode: "member.preferences.read",
      resourceType: "member_preferences",
      resourceId: userId,
      correlationId: request.id,
    });
    return preferences;
  });

  app.put<{ Body: PreferencesBody }>("/api/v1/members/me/preferences", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Members"],
      summary: "Replace the authenticated member's preferences",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["locale", "timezone", "preferredLanguages", "accessibility", "communication", "supportPreferences"],
        properties: {
          locale: { type: "string", minLength: 2, maxLength: 20 },
          timezone: { type: "string", minLength: 1, maxLength: 80 },
          preferredLanguages: { type: "array", maxItems: 10, uniqueItems: true, items: { type: "string", minLength: 2, maxLength: 20 } },
          accessibility: objectValueSchema,
          communication: objectValueSchema,
          supportPreferences: objectValueSchema,
        },
      },
      response: { 200: { type: "object", additionalProperties: true }, 400: errorResponse, 401: errorResponse, 403: errorResponse },
    },
  }, async (request) => {
    const userId = actorId(request);
    const preferences = await prisma.memberPreference.upsert({
      where: { userId },
      create: { userId, ...request.body },
      update: request.body,
    });
    await recordAudit({
      actorUserId: userId,
      actionCode: "member.preferences.update",
      resourceType: "member_preferences",
      resourceId: userId,
      correlationId: request.id,
    });
    return preferences;
  });

  app.get("/api/v1/consents", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Consent & Privacy"],
      summary: "List the authenticated member's consent history",
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              purposeCode: { type: "string" },
              recipientScope: { type: ["string", "null"] },
              dataScope: { type: "object", additionalProperties: true },
              policyVersion: { type: "string" },
              consentState: { type: "string", enum: ["granted", "withdrawn", "denied", "expired"] },
              capturedAt: { type: "string", format: "date-time" },
              expiresAt: { type: ["string", "null"], format: "date-time" },
              supersedesId: { type: ["string", "null"], format: "uuid" },
            },
            required: ["id", "purposeCode", "dataScope", "policyVersion", "consentState", "capturedAt"],
          },
        },
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, async (request) => {
    const userId = actorId(request);
    const consents = await prisma.consentRecord.findMany({
      where: { userId },
      orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
      take: 100,
    });
    await recordAudit({
      actorUserId: userId,
      actionCode: "consent.list",
      resourceType: "consent_record_collection",
      correlationId: request.id,
    });
    return consents.map(serializeConsent);
  });

  app.post<{ Body: CreateConsentBody }>("/api/v1/consents", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Consent & Privacy"],
      summary: "Record a member consent decision",
      description: "Consent history is append-only. A new decision supersedes the latest decision for that purpose.",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["purposeCode", "policyVersion", "consentState"],
        properties: {
          purposeCode: { type: "string", pattern: "^[a-z][a-z0-9_]{1,63}$" },
          policyVersion: { type: "string", minLength: 1, maxLength: 40 },
          consentState: { type: "string", enum: ["granted", "denied", "withdrawn"] },
          dataScope: objectValueSchema,
          recipientScope: { type: "string", minLength: 1, maxLength: 80 },
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            purposeCode: { type: "string" },
            recipientScope: { type: ["string", "null"] },
            dataScope: { type: "object", additionalProperties: true },
            policyVersion: { type: "string" },
            consentState: { type: "string" },
            capturedAt: { type: "string", format: "date-time" },
            expiresAt: { type: ["string", "null"], format: "date-time" },
            supersedesId: { type: ["string", "null"], format: "uuid" },
          },
          required: ["id", "purposeCode", "dataScope", "policyVersion", "consentState", "capturedAt"],
        },
        400: errorResponse,
        401: errorResponse,
        403: errorResponse,
        409: errorResponse,
      },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const latest = await prisma.consentRecord.findFirst({
      where: { userId, purposeCode: request.body.purposeCode },
      orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
    });
    if (request.body.consentState === "withdrawn" && latest?.consentState !== "granted") {
      return sendApiError(reply, 409, "NO_ACTIVE_CONSENT", "There is no current granted consent to withdraw.");
    }

    const consent = await prisma.consentRecord.create({
      data: {
        userId,
        purposeCode: request.body.purposeCode,
        policyVersion: request.body.policyVersion,
        consentState: request.body.consentState,
        capturedBy: "member",
        dataScope: request.body.dataScope ?? {},
        recipientScope: request.body.recipientScope,
        supersedesId: latest?.id,
      },
    });
    await recordAudit({
      actorUserId: userId,
      actionCode: `consent.${request.body.consentState}`,
      resourceType: "consent_record",
      resourceId: consent.id,
      correlationId: request.id,
    });
    return reply.code(201).send(serializeConsent(consent));
  });

  app.get("/api/v1/privacy-requests", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Consent & Privacy"],
      summary: "List the authenticated member's privacy requests",
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } }, 401: errorResponse, 403: errorResponse },
    },
  }, async (request) => {
    const userId = actorId(request);
    const requests = await prisma.privacyRequest.findMany({
      where: { userId },
      orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
      take: 100,
      select: {
        id: true,
        requestType: true,
        requestState: true,
        verificationState: true,
        requestedAt: true,
        dueAt: true,
        completedAt: true,
        resolutionCode: true,
      },
    });
    await recordAudit({
      actorUserId: userId,
      actionCode: "privacy_request.list",
      resourceType: "privacy_request_collection",
      correlationId: request.id,
    });
    return requests;
  });

  app.post<{ Body: CreatePrivacyRequestBody }>("/api/v1/privacy-requests", {
    preHandler: requireMember,
    schema: {
      ...protectedOperation,
      tags: ["Consent & Privacy"],
      summary: "Submit a privacy request",
      description: "Creates a request for review. It does not automatically export, correct, or erase data.",
      body: {
        type: "object",
        additionalProperties: false,
        required: ["requestType"],
        properties: { requestType: { type: "string", enum: ["export", "correction", "deletion", "access"] } },
      },
      response: {
        201: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            requestType: { type: "string" },
            requestState: { type: "string" },
            verificationState: { type: "string" },
            requestedAt: { type: "string", format: "date-time" },
          },
          required: ["id", "requestType", "requestState", "verificationState", "requestedAt"],
        },
        400: errorResponse,
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, async (request, reply) => {
    const userId = actorId(request);
    const privacyRequest = await prisma.privacyRequest.create({
      data: { userId, requestType: request.body.requestType },
      select: {
        id: true,
        requestType: true,
        requestState: true,
        verificationState: true,
        requestedAt: true,
      },
    });
    await recordAudit({
      actorUserId: userId,
      actionCode: "privacy_request.create",
      resourceType: "privacy_request",
      resourceId: privacyRequest.id,
      correlationId: request.id,
    });
    return reply.code(201).send(privacyRequest);
  });
}
