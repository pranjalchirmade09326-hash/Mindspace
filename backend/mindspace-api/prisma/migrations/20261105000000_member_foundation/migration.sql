CREATE TABLE "member_profiles" (
  "user_id" TEXT PRIMARY KEY
    REFERENCES "app_principals" ("user_id") ON DELETE RESTRICT,
  "display_name" TEXT NOT NULL,
  "eligibility_state" TEXT NOT NULL DEFAULT 'unverified'
    CHECK ("eligibility_state" IN ('unverified', 'eligible', 'ineligible', 'review_required', 'expired')),
  "profile_state" TEXT NOT NULL DEFAULT 'active'
    CHECK ("profile_state" IN ('active', 'deactivated', 'deletion_pending')),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "member_preferences" (
  "user_id" TEXT PRIMARY KEY
    REFERENCES "app_principals" ("user_id") ON DELETE RESTRICT,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "preferred_languages" TEXT[] NOT NULL DEFAULT '{}',
  "accessibility" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "communication" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "support_preferences" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "privacy_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL
    REFERENCES "app_principals" ("user_id") ON DELETE RESTRICT,
  "request_type" TEXT NOT NULL
    CHECK ("request_type" IN ('export', 'correction', 'deletion', 'access')),
  "request_state" TEXT NOT NULL DEFAULT 'received'
    CHECK ("request_state" IN ('received', 'verifying', 'in_progress', 'blocked', 'completed', 'rejected')),
  "verification_state" TEXT NOT NULL DEFAULT 'pending'
    CHECK ("verification_state" IN ('pending', 'verified', 'failed')),
  "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "due_at" TIMESTAMPTZ(6),
  "completed_at" TIMESTAMPTZ(6),
  "resolution_code" TEXT,
  "operator_user_id" TEXT
    REFERENCES "app_principals" ("user_id") ON DELETE SET NULL
);

CREATE INDEX "privacy_requests_user_requested_idx"
  ON "privacy_requests" ("user_id", "requested_at" DESC);
CREATE INDEX "privacy_requests_state_requested_idx"
  ON "privacy_requests" ("request_state", "requested_at");
