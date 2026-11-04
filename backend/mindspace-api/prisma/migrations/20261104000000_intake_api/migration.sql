CREATE TABLE "app_principals" (
  "user_id" TEXT PRIMARY KEY,
  "account_state" TEXT NOT NULL DEFAULT 'active'
    CHECK ("account_state" IN ('active', 'suspended', 'closed')),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deactivated_at" TIMESTAMPTZ(6)
);

CREATE TABLE "role_assignments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "app_principals" ("user_id") ON DELETE RESTRICT,
  "role_code" TEXT NOT NULL
    CHECK ("role_code" IN ('member', 'listener', 'listener_supervisor', 'safety_operations_specialist', 'platform_administrator', 'ai_agent_service')),
  "assignment_state" TEXT NOT NULL
    CHECK ("assignment_state" IN ('pending', 'active', 'suspended', 'revoked')),
  "granted_by_user_id" TEXT REFERENCES "app_principals" ("user_id") ON DELETE SET NULL,
  "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "expires_at" TIMESTAMPTZ(6),
  "revoked_at" TIMESTAMPTZ(6),
  "decision_reason" TEXT
);

CREATE UNIQUE INDEX "role_assignments_active_user_role_key"
  ON "role_assignments" ("user_id", "role_code")
  WHERE "assignment_state" = 'active';
CREATE INDEX "role_assignments_user_role_state_idx"
  ON "role_assignments" ("user_id", "role_code", "assignment_state");

CREATE TABLE "consent_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "app_principals" ("user_id") ON DELETE RESTRICT,
  "purpose_code" TEXT NOT NULL,
  "recipient_user_id" TEXT REFERENCES "app_principals" ("user_id") ON DELETE SET NULL,
  "recipient_scope" TEXT,
  "data_scope" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "policy_version" TEXT NOT NULL,
  "consent_state" TEXT NOT NULL
    CHECK ("consent_state" IN ('granted', 'withdrawn', 'denied', 'expired')),
  "captured_by" TEXT NOT NULL
    CHECK ("captured_by" IN ('member', 'guardian', 'system')),
  "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "expires_at" TIMESTAMPTZ(6),
  "supersedes_id" UUID REFERENCES "consent_records" ("id") ON DELETE SET NULL
);
CREATE INDEX "consent_records_user_purpose_time_idx"
  ON "consent_records" ("user_id", "purpose_code", "captured_at" DESC);

CREATE TABLE "intake_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" TEXT NOT NULL REFERENCES "app_principals" ("user_id") ON DELETE RESTRICT,
  "channel" TEXT NOT NULL CHECK ("channel" IN ('text', 'voice')),
  "status" TEXT NOT NULL DEFAULT 'in_progress'
    CHECK ("status" IN ('in_progress', 'completed', 'abandoned', 'deleted')),
  "locale" TEXT NOT NULL,
  "consent_id" UUID REFERENCES "consent_records" ("id") ON DELETE RESTRICT,
  "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "completed_at" TIMESTAMPTZ(6),
  "last_resumed_at" TIMESTAMPTZ(6),
  "agent_version" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX "intake_sessions_member_created_idx"
  ON "intake_sessions" ("member_id", "created_at" DESC);
CREATE INDEX "intake_sessions_status_updated_idx"
  ON "intake_sessions" ("status", "updated_at");

CREATE TABLE "intake_responses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "intake_id" UUID NOT NULL REFERENCES "intake_sessions" ("id") ON DELETE RESTRICT,
  "sequence_no" INTEGER NOT NULL CHECK ("sequence_no" > 0),
  "topic_code" TEXT,
  "response_state" TEXT NOT NULL CHECK ("response_state" IN ('answered', 'skipped', 'declined')),
  "source_type" TEXT NOT NULL DEFAULT 'member' CHECK ("source_type" IN ('member', 'ai', 'system')),
  "content_ciphertext" BYTEA,
  "key_version" TEXT,
  "structured_value" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "supersedes_id" UUID REFERENCES "intake_responses" ("id") ON DELETE SET NULL,
  CONSTRAINT "intake_responses_content_state_check" CHECK (
    ("response_state" = 'answered' AND "content_ciphertext" IS NOT NULL AND "key_version" IS NOT NULL)
    OR ("response_state" IN ('skipped', 'declined') AND "content_ciphertext" IS NULL AND "key_version" IS NULL)
  ),
  CONSTRAINT "intake_responses_intake_sequence_key" UNIQUE ("intake_id", "sequence_no")
);
CREATE INDEX "intake_responses_intake_created_idx"
  ON "intake_responses" ("intake_id", "created_at");

CREATE TABLE "audit_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_user_id" TEXT REFERENCES "app_principals" ("user_id") ON DELETE SET NULL,
  "actor_type" TEXT NOT NULL CHECK ("actor_type" IN ('user', 'service', 'administrator')),
  "action_code" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT,
  "purpose_code" TEXT,
  "outcome" TEXT NOT NULL CHECK ("outcome" IN ('success', 'denied', 'failure')),
  "correlation_id" UUID,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX "audit_events_actor_occurred_idx"
  ON "audit_events" ("actor_user_id", "occurred_at" DESC);
CREATE INDEX "audit_events_resource_occurred_idx"
  ON "audit_events" ("resource_type", "resource_id", "occurred_at" DESC);
