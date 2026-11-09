import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { registerIntakeRoutes } from "./routes/intakes.js";
import { registerMemberRoutes } from "./routes/member.js";
import { registerWellbeingRoutes } from "./routes/wellbeing.js";
import { registerPeerSupportRoutes } from "./routes/peer-support.js";
import { registerOperationRoutes } from "./routes/operations.js";
import { registerDashboardRoutes } from "./routes/dashboards.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.environment === "development" ? "debug" : "info",
      redact: {
        paths: ["req.headers.authorization", "req.headers.cookie", "res.headers.set-cookie"],
        censor: "[REDACTED]",
      },
    },
    genReqId: () => randomUUID(),
    bodyLimit: 11 * 1024 * 1024,
  });

  app.decorateRequest("memberId", null);
  app.decorateRequest("userId", null);
  app.decorateRequest("roleCodes", null);
  app.decorateRequest("identityClaims", null);

  await app.register(helmet);
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
      fields: 0,
      parts: 1,
    },
  });
  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });
  await app.register(swagger, {
    transform: ({ schema, url }) => url === "/api/v1/intakes/:intakeId/transcription"
      ? {
          schema: {
            ...schema,
            body: {
              type: "object",
              required: ["audio"],
              properties: {
                audio: {
                  type: "string",
                  format: "binary",
                  description: "WebM, Ogg, WAV, MPEG, or MP4 audio; maximum 10 MiB.",
                },
              },
            },
          },
          url,
        }
      : { schema, url },
    openapi: {
      info: {
        title: "MindSpace API",
        description: "Standalone MindSpace REST API for identity, member wellbeing, peer support, and operations. This is not a clinical-care or EMR service.",
        version: "1.0.0",
      },
      servers: [{ url: "/" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  app.addSchema({
    $id: "ErrorResponse",
    type: "object",
    properties: {
      error: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
        },
        required: ["code", "message"],
      },
    },
    required: ["error"],
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  app.get("/health/live", {
    config: { rateLimit: false },
    schema: { tags: ["System"], summary: "Liveness probe" },
  }, async () => ({ status: "ok" }));

  app.get("/health/ready", {
    config: { rateLimit: false },
    schema: { tags: ["System"], summary: "Readiness probe" },
  }, async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready" };
    } catch (error) {
      app.log.error({ err: error }, "Readiness check failed");
      return reply.code(503).send({ status: "not_ready" });
    }
  });

  await registerMemberRoutes(app);
  await registerIntakeRoutes(app);
  await registerWellbeingRoutes(app);
  await registerPeerSupportRoutes(app);
  await registerOperationRoutes(app);
  await registerDashboardRoutes(app);
  await app.register(swaggerUi, {
    routePrefix: "/api-docs",
    staticCSP: true,
    uiConfig: {
      deepLinking: true,
      docExpansion: "list",
    },
  });

  app.setErrorHandler((error, request, reply) => {
    const hasValidationErrors = error && typeof error === "object" && "validation" in error
      && error.validation !== undefined;
    if (hasValidationErrors) {
      return reply.code(400).send({
        error: { code: "VALIDATION_ERROR", message: "Request validation failed." },
      });
    }
    const errorCode = error && typeof error === "object" && "code" in error
      && typeof error.code === "string"
      ? error.code
      : undefined;
    if (errorCode === "FST_REQ_FILE_TOO_LARGE") {
      return reply.code(413).send({
        error: { code: "AUDIO_TOO_LARGE", message: "The audio file exceeds the 10 MiB limit." },
      });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.code(409).send({
          error: { code: "CONFLICT", message: "A record with the supplied values already exists." },
        });
      }
      if (error.code === "P2025") {
        return reply.code(404).send({
          error: { code: "NOT_FOUND", message: "The requested record was not found." },
        });
      }
    }

    request.log.error({ err: error, requestId: request.id }, "Request failed");
    return reply.code(500).send({
      error: { code: "INTERNAL_ERROR", message: "The request could not be completed." },
    });
  });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}
