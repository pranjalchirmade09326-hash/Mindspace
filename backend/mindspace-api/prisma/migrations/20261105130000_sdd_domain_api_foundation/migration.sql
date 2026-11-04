-- Add MindSpace wellbeing, peer-support, safety, and operations schema.

-- DropForeignKey
ALTER TABLE "audit_events" DROP CONSTRAINT "audit_events_actor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "consent_records" DROP CONSTRAINT "consent_records_recipient_user_id_fkey";

-- DropForeignKey
ALTER TABLE "consent_records" DROP CONSTRAINT "consent_records_supersedes_id_fkey";

-- DropForeignKey
ALTER TABLE "consent_records" DROP CONSTRAINT "consent_records_user_id_fkey";

-- DropForeignKey
ALTER TABLE "intake_responses" DROP CONSTRAINT "intake_responses_intake_id_fkey";

-- DropForeignKey
ALTER TABLE "intake_responses" DROP CONSTRAINT "intake_responses_supersedes_id_fkey";

-- DropForeignKey
ALTER TABLE "intake_sessions" DROP CONSTRAINT "intake_sessions_consent_id_fkey";

-- DropForeignKey
ALTER TABLE "intake_sessions" DROP CONSTRAINT "intake_sessions_member_id_fkey";

-- DropForeignKey
ALTER TABLE "member_preferences" DROP CONSTRAINT "member_preferences_user_id_fkey";

-- DropForeignKey
ALTER TABLE "member_profiles" DROP CONSTRAINT "member_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "privacy_requests" DROP CONSTRAINT "privacy_requests_operator_user_id_fkey";

-- DropForeignKey
ALTER TABLE "privacy_requests" DROP CONSTRAINT "privacy_requests_user_id_fkey";

-- DropForeignKey
ALTER TABLE "role_assignments" DROP CONSTRAINT "role_assignments_granted_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "role_assignments" DROP CONSTRAINT "role_assignments_user_id_fkey";

-- AlterTable
ALTER TABLE "audit_events" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "consent_records" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "intake_responses" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "intake_sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "privacy_requests" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "role_assignments" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "mood_code" TEXT NOT NULL,
    "scale_code" TEXT,
    "scale_value" DECIMAL(6,2),
    "note_ciphertext" BYTEA,
    "key_version" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'member',
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "title_ciphertext" BYTEA,
    "body_ciphertext" BYTEA NOT NULL,
    "key_version" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellbeing_goals" (
    "id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "goal_ciphertext" BYTEA NOT NULL,
    "key_version" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'active',
    "target_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "wellbeing_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_checkins" (
    "id" UUID NOT NULL,
    "goal_id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "checkin_state" TEXT NOT NULL,
    "note_ciphertext" BYTEA,
    "key_version" TEXT,
    "reported_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellbeing_sessions" (
    "id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "session_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "locale" TEXT NOT NULL,
    "consent_id" UUID,
    "agent_version" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "wellbeing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellbeing_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "sequence_no" INTEGER NOT NULL,
    "speaker_type" TEXT NOT NULL,
    "content_ciphertext" BYTEA NOT NULL,
    "key_version" TEXT NOT NULL,
    "delivery_state" TEXT NOT NULL DEFAULT 'stored',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "wellbeing_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_help_content" (
    "id" UUID NOT NULL,
    "content_code" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "content_version" INTEGER NOT NULL,
    "body" JSONB NOT NULL,
    "review_state" TEXT NOT NULL,
    "author_user_id" TEXT,
    "reviewer_user_id" TEXT,
    "effective_from" TIMESTAMPTZ(6),
    "effective_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "self_help_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_profiles" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "application_state" TEXT NOT NULL DEFAULT 'pending',
    "eligibility_state" TEXT NOT NULL DEFAULT 'ineligible',
    "approved_at" TIMESTAMPTZ(6),
    "eligibility_expires_at" TIMESTAMPTZ(6),
    "capacity_limit" SMALLINT NOT NULL DEFAULT 1,
    "profile_languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listener_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_training_records" (
    "id" UUID NOT NULL,
    "listener_id" UUID NOT NULL,
    "module_code" TEXT NOT NULL,
    "module_version" TEXT NOT NULL,
    "completion_state" TEXT NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "reviewed_by_user_id" TEXT,

    CONSTRAINT "listener_training_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_availability" (
    "id" UUID NOT NULL,
    "listener_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "availability_state" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listener_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_match_requests" (
    "id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "request_state" TEXT NOT NULL DEFAULT 'queued',
    "preferred_languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "shared_summary_id" UUID,
    "consent_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "listener_match_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_matches" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "listener_id" UUID NOT NULL,
    "match_state" TEXT NOT NULL DEFAULT 'offered',
    "offered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "end_reason_code" TEXT,
    "match_rationale" JSONB,

    CONSTRAINT "listener_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_conversations" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "listener_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "conversation_state" TEXT NOT NULL DEFAULT 'open',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "closed_by_user_id" TEXT,

    CONSTRAINT "peer_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sequence_no" BIGINT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "content_ciphertext" BYTEA NOT NULL,
    "key_version" TEXT NOT NULL,
    "delivery_state" TEXT NOT NULL DEFAULT 'queued',
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMPTZ(6),

    CONSTRAINT "peer_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conduct_reports" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "reported_user_id" TEXT,
    "category_code" TEXT NOT NULL,
    "details_ciphertext" BYTEA,
    "key_version" TEXT,
    "report_state" TEXT NOT NULL DEFAULT 'open',
    "assigned_to_user_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "conduct_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_feedback" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "rating" SMALLINT,
    "feedback_ciphertext" BYTEA,
    "key_version" TEXT,
    "review_state" TEXT NOT NULL DEFAULT 'received',
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by_user_id" TEXT,

    CONSTRAINT "listener_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_cases" (
    "id" UUID NOT NULL,
    "member_id" TEXT,
    "source_type" TEXT NOT NULL,
    "source_record_id" UUID,
    "trigger_code" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL,
    "case_state" TEXT NOT NULL DEFAULT 'new',
    "priority_code" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "assigned_responder_user_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "resolution_code" TEXT,

    CONSTRAINT "safety_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_case_actions" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "actor_user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "action_state" TEXT NOT NULL,
    "resource_id" UUID,
    "details_ciphertext" BYTEA,
    "key_version" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_case_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crisis_resources" (
    "id" UUID NOT NULL,
    "region_code" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "contact_details" JSONB NOT NULL,
    "source_url" TEXT,
    "verification_state" TEXT NOT NULL DEFAULT 'pending',
    "verified_by_user_id" TEXT,
    "last_verified_at" TIMESTAMPTZ(6),
    "effective_from" TIMESTAMPTZ(6),
    "effective_to" TIMESTAMPTZ(6),

    CONSTRAINT "crisis_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followups" (
    "id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_record_id" UUID,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "followup_state" TEXT NOT NULL DEFAULT 'scheduled',
    "response_ciphertext" BYTEA,
    "key_version" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload_reference" TEXT,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "delivery_state" TEXT NOT NULL DEFAULT 'queued',
    "attempt_count" SMALLINT NOT NULL DEFAULT 0,
    "deduplication_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_processing_runs" (
    "id" UUID NOT NULL,
    "member_id" TEXT,
    "purpose_code" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_record_id" UUID,
    "consent_id" UUID,
    "model_version" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL,
    "run_state" TEXT NOT NULL DEFAULT 'started',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "error_code" TEXT,

    CONSTRAINT "ai_processing_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" UUID NOT NULL,
    "process_code" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "policy_version" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" UUID NOT NULL,
    "definition_id" UUID NOT NULL,
    "temporal_workflow_id" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),
    "correlation_id" UUID,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_tasks" (
    "id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "task_code" TEXT NOT NULL,
    "assignee_user_id" TEXT,
    "required_role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "due_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "reason_code" TEXT,

    CONSTRAINT "workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_events" (
    "id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "event_code" TEXT NOT NULL,
    "event_version" INTEGER NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "payload_metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "workflow_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tool_invocations" (
    "id" UUID NOT NULL,
    "agent_run_id" UUID NOT NULL,
    "tool_code" TEXT NOT NULL,
    "tool_version" TEXT NOT NULL,
    "scope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "input_digest" BYTEA NOT NULL,
    "output_digest" BYTEA,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "correlation_id" UUID,

    CONSTRAINT "agent_tool_invocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_version" INTEGER NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6),
    "last_error_code" TEXT,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_consumer_receipts" (
    "id" UUID NOT NULL,
    "consumer_code" TEXT NOT NULL,
    "event_id" UUID NOT NULL,
    "event_version" INTEGER NOT NULL,
    "processed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome_code" TEXT NOT NULL,

    CONSTRAINT "event_consumer_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mood_entries_member_id_recorded_at_idx" ON "mood_entries"("member_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "journal_entries_member_id_created_at_idx" ON "journal_entries"("member_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "wellbeing_goals_member_id_status_created_at_idx" ON "wellbeing_goals"("member_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "goal_checkins_goal_id_reported_at_idx" ON "goal_checkins"("goal_id", "reported_at" DESC);

-- CreateIndex
CREATE INDEX "goal_checkins_member_id_reported_at_idx" ON "goal_checkins"("member_id", "reported_at" DESC);

-- CreateIndex
CREATE INDEX "wellbeing_sessions_member_id_started_at_idx" ON "wellbeing_sessions"("member_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "wellbeing_messages_session_id_created_at_idx" ON "wellbeing_messages"("session_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "wellbeing_messages_session_id_sequence_no_key" ON "wellbeing_messages"("session_id", "sequence_no");

-- CreateIndex
CREATE UNIQUE INDEX "self_help_content_content_code_key" ON "self_help_content"("content_code");

-- CreateIndex
CREATE INDEX "self_help_content_review_state_locale_content_type_idx" ON "self_help_content"("review_state", "locale", "content_type");

-- CreateIndex
CREATE UNIQUE INDEX "listener_profiles_user_id_key" ON "listener_profiles"("user_id");

-- CreateIndex
CREATE INDEX "listener_training_records_listener_id_completion_state_expi_idx" ON "listener_training_records"("listener_id", "completion_state", "expires_at");

-- CreateIndex
CREATE INDEX "listener_availability_listener_id_starts_at_ends_at_idx" ON "listener_availability"("listener_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "listener_match_requests_member_id_created_at_idx" ON "listener_match_requests"("member_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "listener_match_requests_request_state_created_at_idx" ON "listener_match_requests"("request_state", "created_at");

-- CreateIndex
CREATE INDEX "listener_matches_request_id_match_state_idx" ON "listener_matches"("request_id", "match_state");

-- CreateIndex
CREATE INDEX "listener_matches_listener_id_match_state_idx" ON "listener_matches"("listener_id", "match_state");

-- CreateIndex
CREATE UNIQUE INDEX "peer_conversations_match_id_key" ON "peer_conversations"("match_id");

-- CreateIndex
CREATE INDEX "peer_conversations_member_id_started_at_idx" ON "peer_conversations"("member_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "peer_conversations_listener_id_started_at_idx" ON "peer_conversations"("listener_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "peer_messages_conversation_id_sent_at_idx" ON "peer_messages"("conversation_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "peer_messages_conversation_id_sequence_no_key" ON "peer_messages"("conversation_id", "sequence_no");

-- CreateIndex
CREATE INDEX "conduct_reports_report_state_created_at_idx" ON "conduct_reports"("report_state", "created_at");

-- CreateIndex
CREATE INDEX "conduct_reports_reporter_user_id_created_at_idx" ON "conduct_reports"("reporter_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "listener_feedback_review_state_submitted_at_idx" ON "listener_feedback"("review_state", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "listener_feedback_conversation_id_member_id_key" ON "listener_feedback"("conversation_id", "member_id");

-- CreateIndex
CREATE INDEX "safety_cases_case_state_priority_code_created_at_idx" ON "safety_cases"("case_state", "priority_code", "created_at");

-- CreateIndex
CREATE INDEX "safety_cases_member_id_created_at_idx" ON "safety_cases"("member_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "safety_case_actions_case_id_occurred_at_idx" ON "safety_case_actions"("case_id", "occurred_at");

-- CreateIndex
CREATE INDEX "crisis_resources_region_code_locale_verification_state_idx" ON "crisis_resources"("region_code", "locale", "verification_state");

-- CreateIndex
CREATE INDEX "followups_member_id_scheduled_at_idx" ON "followups"("member_id", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_deduplication_key_key" ON "notifications"("deduplication_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_delivery_state_scheduled_at_idx" ON "notifications"("delivery_state", "scheduled_at");

-- CreateIndex
CREATE INDEX "ai_processing_runs_member_id_started_at_idx" ON "ai_processing_runs"("member_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "ai_processing_runs_run_state_started_at_idx" ON "ai_processing_runs"("run_state", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_process_code_key" ON "workflow_definitions"("process_code");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_process_code_version_key" ON "workflow_definitions"("process_code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_executions_temporal_workflow_id_key" ON "workflow_executions"("temporal_workflow_id");

-- CreateIndex
CREATE INDEX "workflow_executions_subject_type_subject_id_started_at_idx" ON "workflow_executions"("subject_type", "subject_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "workflow_executions_status_started_at_idx" ON "workflow_executions"("status", "started_at");

-- CreateIndex
CREATE INDEX "workflow_tasks_required_role_status_due_at_idx" ON "workflow_tasks"("required_role", "status", "due_at");

-- CreateIndex
CREATE INDEX "workflow_tasks_assignee_user_id_status_idx" ON "workflow_tasks"("assignee_user_id", "status");

-- CreateIndex
CREATE INDEX "workflow_events_execution_id_occurred_at_idx" ON "workflow_events"("execution_id", "occurred_at");

-- CreateIndex
CREATE INDEX "agent_tool_invocations_agent_run_id_started_at_idx" ON "agent_tool_invocations"("agent_run_id", "started_at");

-- CreateIndex
CREATE INDEX "outbox_events_published_at_next_attempt_at_occurred_at_idx" ON "outbox_events"("published_at", "next_attempt_at", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_consumer_receipts_consumer_code_event_id_key" ON "event_consumer_receipts"("consumer_code", "event_id");

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_granted_by_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "consent_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_preferences" ADD CONSTRAINT "member_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_operator_user_id_fkey" FOREIGN KEY ("operator_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_sessions" ADD CONSTRAINT "intake_sessions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_sessions" ADD CONSTRAINT "intake_sessions_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "consent_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_responses" ADD CONSTRAINT "intake_responses_intake_id_fkey" FOREIGN KEY ("intake_id") REFERENCES "intake_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_responses" ADD CONSTRAINT "intake_responses_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "intake_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_checkins" ADD CONSTRAINT "goal_checkins_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "wellbeing_goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wellbeing_messages" ADD CONSTRAINT "wellbeing_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "wellbeing_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_messages" ADD CONSTRAINT "peer_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "peer_conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "audit_events_actor_occurred_idx" RENAME TO "audit_events_actor_user_id_occurred_at_idx";

-- RenameIndex
ALTER INDEX "audit_events_resource_occurred_idx" RENAME TO "audit_events_resource_type_resource_id_occurred_at_idx";

-- RenameIndex
ALTER INDEX "consent_records_user_purpose_time_idx" RENAME TO "consent_records_user_id_purpose_code_captured_at_idx";

-- RenameIndex
ALTER INDEX "intake_responses_intake_created_idx" RENAME TO "intake_responses_intake_id_created_at_idx";

-- RenameIndex
ALTER INDEX "intake_responses_intake_sequence_key" RENAME TO "intake_responses_intake_id_sequence_no_key";

-- RenameIndex
ALTER INDEX "intake_sessions_member_created_idx" RENAME TO "intake_sessions_member_id_created_at_idx";

-- RenameIndex
ALTER INDEX "intake_sessions_status_updated_idx" RENAME TO "intake_sessions_status_updated_at_idx";

-- RenameIndex
ALTER INDEX "privacy_requests_state_requested_idx" RENAME TO "privacy_requests_request_state_requested_at_idx";

-- RenameIndex
ALTER INDEX "privacy_requests_user_requested_idx" RENAME TO "privacy_requests_user_id_requested_at_idx";

-- RenameIndex
ALTER INDEX "role_assignments_user_role_state_idx" RENAME TO "role_assignments_user_id_role_code_assignment_state_idx";
