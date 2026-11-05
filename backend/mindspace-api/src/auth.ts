import { errors, createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import type { JWTPayload } from "jose";
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { config } from "./config.js";
import { prisma } from "./db.js";

const jwks = createRemoteJWKSet(new URL(config.authJwksUrl));
const localSecret = new TextEncoder().encode(
  process.env.JWT_SECRET || "mindspace-local-dev-jwt-signing-secret-32b!!"
);

export async function signLocalToken(userId: string, roles: string[]): Promise<string> {
  return await new SignJWT({
    sub: userId,
    roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(config.authIssuer)
    .setAudience(config.authAudience)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(localSecret);
}

export const roleCodes = [
  "member",
  "listener",
  "listener_supervisor",
  "safety_operations_specialist",
  "platform_administrator",
  "ai_agent_service",
] as const;
export type RoleCode = (typeof roleCodes)[number];
export const recognizedRoleCodes: ReadonlySet<string> = new Set(roleCodes);

async function verifyIdentity(request: FastifyRequest, reply: FastifyReply): Promise<JWTPayload | null> {
  const authorization = request.headers.authorization;
  const [scheme, token, ...extra] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token || extra.length > 0) {
    await reply.code(401).send({
      error: { code: "UNAUTHENTICATED", message: "A valid bearer token is required." },
    });
    return null;
  }

  let payload: JWTPayload | null = null;
  try {
    const verified = await jwtVerify(token, localSecret, {
      issuer: config.authIssuer,
      audience: config.authAudience,
    });
    payload = verified.payload;
  } catch {
    try {
      const verified = await jwtVerify(token, jwks, {
        issuer: config.authIssuer,
        audience: config.authAudience,
      });
      payload = verified.payload;
    } catch (jwksError) {
      if (jwksError instanceof errors.JOSEError) {
        await reply.code(401).send({
          error: { code: "INVALID_TOKEN", message: "The bearer token is invalid or expired." },
        });
        return null;
      }
      throw jwksError;
    }
  }

  if (typeof payload?.sub !== "string" || payload.sub.length === 0) {
    await reply.code(401).send({
      error: { code: "INVALID_TOKEN", message: "The bearer token is invalid." },
    });
    return null;
  }
  request.userId = payload.sub;
  request.identityClaims = payload;
  return payload;
}

export const requireVerifiedIdentity: preHandlerHookHandler = async (request, reply) => {
  await verifyIdentity(request, reply);
};

async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const identity = await verifyIdentity(request, reply);
  if (!identity?.sub) return null;
  const subject = identity.sub;

  const principal = await prisma.appPrincipal.findUnique({
    where: { userId: subject },
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
    await reply.code(403).send({
      error: { code: "ACTIVE_ACCOUNT_REQUIRED", message: "An active MindSpace account is required." },
    });
    return null;
  }

  const activeRoles = principal.roles
    .map(({ roleCode }) => roleCode)
    .filter((role): role is RoleCode => recognizedRoleCodes.has(role));
  request.userId = subject;
  request.roleCodes = activeRoles;
  request.memberId = activeRoles.includes("member") ? subject : null;
  return activeRoles;
}

export const requireActivePrincipal: preHandlerHookHandler = async (request, reply) => {
  await authenticate(request, reply);
};

export function requireRoles(requiredRoles: readonly RoleCode[]): preHandlerHookHandler {
  return async (request, reply) => {
    const activeRoles = await authenticate(request, reply);
    if (!activeRoles || reply.sent) return;

    if (!requiredRoles.some((role) => activeRoles.includes(role))) {
      return reply.code(403).send({
        error: {
          code: "ROLE_ACCESS_REQUIRED",
          message: "An active role assignment is required for this operation.",
        },
      });
    }
  };
}

export const requireMember = requireRoles(["member"]);
