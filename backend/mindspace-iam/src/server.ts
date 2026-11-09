import { createServer, type ServerResponse } from "node:http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { config } from "./config.js";
import { prisma } from "./db.js";

const authHandler = toNodeHandler(auth);

function sendJson(reply: ServerResponse, statusCode: number, body: unknown) {
  reply.statusCode = statusCode;
  reply.setHeader("Content-Type", "application/json; charset=utf-8");
  reply.setHeader("Cache-Control", "no-store");
  reply.end(JSON.stringify(body));
}

function applyCors(origin: string | undefined, reply: ServerResponse) {
  if (origin && config.trustedOrigins.includes(origin)) {
    reply.setHeader("Access-Control-Allow-Origin", origin);
    reply.setHeader("Vary", "Origin");
    reply.setHeader("Access-Control-Allow-Credentials", "true");
  }
  reply.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  reply.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  reply.setHeader("Access-Control-Max-Age", "600");
}

const server = createServer(async (request, response) => {
  applyCors(request.headers.origin, response);
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", config.baseUrl);

  if (url.pathname === "/health" || url.pathname === "/health/live") {
    return sendJson(response, 200, { status: "ok", service: "mindspace-iam" });
  }

  if (url.pathname === "/health/ready") {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return sendJson(response, 200, { status: "ready" });
    } catch {
      return sendJson(response, 503, { status: "not_ready" });
    }
  }

  if (url.pathname.startsWith("/api/auth/")) {
    await authHandler(request, response);
    return;
  }

  sendJson(response, 404, { error: { code: "NOT_FOUND", message: "Route not found." } });
});

server.listen(config.port, config.host, () => {
  console.log(`MindSpace IAM listening on ${config.baseUrl} (${config.environment})`);
  console.log(`JWT issuer ${config.jwtIssuer} · audience ${config.jwtAudience}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}; shutting down MindSpace IAM`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
