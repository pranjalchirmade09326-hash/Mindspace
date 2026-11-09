import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5001),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  JWT_ISSUER: z.string().url(),
  JWT_AUDIENCE: z.string().min(1),
  TRUSTED_ORIGINS: z.string().default("http://localhost:4000"),
  MINDSPACE_API_DATABASE_URL: z.string().url().optional(),
  SEED_MINDSPACE_API: z.enum(["true", "false"]).default("true"),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(`Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
}

const data = result.data;

export const config = {
  environment: data.NODE_ENV,
  isProduction: data.NODE_ENV === "production",
  host: data.HOST,
  port: data.PORT,
  databaseUrl: data.DATABASE_URL,
  baseUrl: data.BETTER_AUTH_URL,
  secret: data.BETTER_AUTH_SECRET,
  jwtIssuer: data.JWT_ISSUER,
  jwtAudience: data.JWT_AUDIENCE,
  trustedOrigins: data.TRUSTED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
  mindspaceApiDatabaseUrl: data.MINDSPACE_API_DATABASE_URL,
  seedMindspaceApi: data.SEED_MINDSPACE_API === "true",
} as const;

if (config.seedMindspaceApi && !config.mindspaceApiDatabaseUrl) {
  throw new Error("MINDSPACE_API_DATABASE_URL is required when SEED_MINDSPACE_API=true");
}

if (config.isProduction && new URL(config.baseUrl).protocol !== "https:") {
  throw new Error("BETTER_AUTH_URL must use HTTPS in production");
}
