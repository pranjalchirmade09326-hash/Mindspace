import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  DATABASE_URL: z.string().url(),
  AUTH_ISSUER: z.string().url(),
  AUTH_AUDIENCE: z.string().min(1),
  AUTH_JWKS_URL: z.string().url(),
  CORS_ORIGINS: z.string().default("http://localhost:4000"),
  INTAKE_ENCRYPTION_KEYS_JSON: z.string(),
  INTAKE_CURRENT_ENCRYPTION_KEY_VERSION: z.string().min(1),
  TRANSCRIPTION_API_URL: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().url().optional(),
  ),
  TRANSCRIPTION_API_KEY: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().min(1).optional(),
  ),
  TRANSCRIPTION_MODEL: z.string().min(1).default("whisper-1"),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(`Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
}

const parsedKeys = (() => {
  try {
    return z.record(z.string().min(1)).parse(JSON.parse(result.data.INTAKE_ENCRYPTION_KEYS_JSON));
  } catch {
    throw new Error("INTAKE_ENCRYPTION_KEYS_JSON must be a JSON object of version-to-base64-key entries");
  }
})();

const encryptionKeys = new Map<string, Buffer>();
for (const [version, encoded] of Object.entries(parsedKeys)) {
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error(`Encryption key ${version} must decode to exactly 32 bytes`);
  }
  encryptionKeys.set(version, key);
}

if (!encryptionKeys.has(result.data.INTAKE_CURRENT_ENCRYPTION_KEY_VERSION)) {
  throw new Error("INTAKE_CURRENT_ENCRYPTION_KEY_VERSION must exist in INTAKE_ENCRYPTION_KEYS_JSON");
}

if (result.data.NODE_ENV === "production" && result.data.TRANSCRIPTION_API_URL) {
  const transcriptionUrl = new URL(result.data.TRANSCRIPTION_API_URL);
  if (transcriptionUrl.protocol !== "https:" || transcriptionUrl.username || transcriptionUrl.password) {
    throw new Error("Production transcription endpoint must use HTTPS and must not embed credentials in its URL");
  }
}
if (!result.data.TRANSCRIPTION_API_URL && result.data.TRANSCRIPTION_API_KEY) {
  throw new Error("TRANSCRIPTION_API_KEY cannot be set without TRANSCRIPTION_API_URL");
}

export const config = {
  environment: result.data.NODE_ENV,
  host: result.data.HOST,
  port: result.data.PORT,
  databaseUrl: result.data.DATABASE_URL,
  authIssuer: result.data.AUTH_ISSUER,
  authAudience: result.data.AUTH_AUDIENCE,
  authJwksUrl: result.data.AUTH_JWKS_URL,
  corsOrigins: result.data.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
  encryptionKeys,
  currentEncryptionKeyVersion: result.data.INTAKE_CURRENT_ENCRYPTION_KEY_VERSION,
  transcriptionApiUrl: result.data.TRANSCRIPTION_API_URL,
  transcriptionApiKey: result.data.TRANSCRIPTION_API_KEY,
  transcriptionModel: result.data.TRANSCRIPTION_MODEL,
} as const;
