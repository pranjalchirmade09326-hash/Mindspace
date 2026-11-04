-- Add remaining conceptual SDD entities.

-- CreateTable
CREATE TABLE "wellbeing_summaries" (
    "id" UUID NOT NULL,
    "intake_id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "version_no" INTEGER NOT NULL,
    "summary_ciphertext" BYTEA NOT NULL,
    "key_version" TEXT NOT NULL,
    "generated_by" TEXT NOT NULL,
    "agent_version" TEXT,
    "review_state" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wellbeing_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_recommendations" (
    "id" UUID NOT NULL,
    "intake_id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "support_level" TEXT NOT NULL,
    "option_code" TEXT NOT NULL,
    "availability_state" TEXT NOT NULL,
    "rationale_ciphertext" BYTEA,
    "key_version" TEXT,
    "selected_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_sessions" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "content_version" INTEGER NOT NULL,
    "progress_state" TEXT NOT NULL DEFAULT 'started',
    "reflection_ciphertext" BYTEA,
    "key_version" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "exercise_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellbeing_reflections" (
    "id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "reflection_type" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "source_type" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "wellbeing_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellbeing_activities" (
    "id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "content_id" UUID NOT NULL,
    "content_version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "reflection_ciphertext" BYTEA,
    "key_version" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "wellbeing_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_supervisor_assignments" (
    "id" UUID NOT NULL,
    "listener_id" UUID NOT NULL,
    "supervisor_user_id" TEXT NOT NULL,
    "assignment_state" TEXT NOT NULL DEFAULT 'active',
    "assigned_by_user_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "reason_code" TEXT NOT NULL,

    CONSTRAINT "listener_supervisor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "step_code" TEXT NOT NULL,
    "attempt_no" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "failure_code" TEXT,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_timers" (
    "id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "timer_code" TEXT NOT NULL,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "fired_at" TIMESTAMPTZ(6),
    "policy_version" TEXT NOT NULL,

    CONSTRAINT "workflow_timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "human_approvals" (
    "id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "approver_user_id" TEXT NOT NULL,
    "required_role" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decision_reason_code" TEXT,
    "decided_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "policy_version" TEXT NOT NULL,

    CONSTRAINT "human_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_compensations" (
    "id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "step_id" UUID NOT NULL,
    "compensation_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "idempotency_key" TEXT NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "failure_code" TEXT,

    CONSTRAINT "workflow_compensations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wellbeing_summaries_member_id_created_at_idx" ON "wellbeing_summaries"("member_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "wellbeing_summaries_intake_id_version_no_key" ON "wellbeing_summaries"("intake_id", "version_no");

-- CreateIndex
CREATE INDEX "support_recommendations_member_id_created_at_idx" ON "support_recommendations"("member_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "exercise_sessions_member_id_started_at_idx" ON "exercise_sessions"("member_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "wellbeing_reflections_member_id_started_at_idx" ON "wellbeing_reflections"("member_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "wellbeing_activities_member_id_started_at_idx" ON "wellbeing_activities"("member_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "listener_supervisor_assignments_listener_id_assignment_stat_idx" ON "listener_supervisor_assignments"("listener_id", "assignment_state");

-- CreateIndex
CREATE INDEX "listener_supervisor_assignments_supervisor_user_id_assignme_idx" ON "listener_supervisor_assignments"("supervisor_user_id", "assignment_state");

-- CreateIndex
CREATE INDEX "workflow_steps_execution_id_status_idx" ON "workflow_steps"("execution_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_steps_execution_id_step_code_attempt_no_key" ON "workflow_steps"("execution_id", "step_code", "attempt_no");

-- CreateIndex
CREATE INDEX "workflow_timers_status_due_at_idx" ON "workflow_timers"("status", "due_at");

-- CreateIndex
CREATE INDEX "human_approvals_execution_id_decided_at_idx" ON "human_approvals"("execution_id", "decided_at");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_compensations_idempotency_key_key" ON "workflow_compensations"("idempotency_key");
