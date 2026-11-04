import "fastify";
import type { JWTPayload } from "jose";

declare module "fastify" {
  interface FastifyRequest {
    memberId: string | null;
    userId: string | null;
    roleCodes: string[] | null;
    identityClaims: JWTPayload | null;
  }
}
