ALTER TABLE "mood_entries"
  ADD CONSTRAINT "mood_entries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "mood_entries_source_type_check" CHECK ("source_type" IN ('member', 'imported'));

ALTER TABLE "journal_entries"
  ADD CONSTRAINT "journal_entries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "journal_entries_visibility_check" CHECK ("visibility" IN ('private', 'explicitly_shared'));

ALTER TABLE "wellbeing_goals"
  ADD CONSTRAINT "wellbeing_goals_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "wellbeing_goals_status_check" CHECK ("status" IN ('active', 'paused', 'completed', 'closed'));

ALTER TABLE "goal_checkins"
  ADD CONSTRAINT "goal_checkins_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "goal_checkins_state_check" CHECK ("checkin_state" IN ('reported', 'skipped'));

ALTER TABLE "wellbeing_sessions"
  ADD CONSTRAINT "wellbeing_sessions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "wellbeing_sessions_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "consent_records"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "wellbeing_sessions_type_check" CHECK ("session_type" IN ('ai_companion', 'reflection', 'guided_activity')),
  ADD CONSTRAINT "wellbeing_sessions_status_check" CHECK ("status" IN ('active', 'completed', 'abandoned', 'deleted'));

ALTER TABLE "wellbeing_messages"
  ADD CONSTRAINT "wellbeing_messages_speaker_check" CHECK ("speaker_type" IN ('member', 'ai', 'system')),
  ADD CONSTRAINT "wellbeing_messages_delivery_check" CHECK ("delivery_state" IN ('stored', 'failed', 'redacted')),
  ADD CONSTRAINT "wellbeing_messages_sequence_check" CHECK ("sequence_no" > 0);

ALTER TABLE "self_help_content"
  ADD CONSTRAINT "self_help_content_author_fkey" FOREIGN KEY ("author_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL,
  ADD CONSTRAINT "self_help_content_reviewer_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL,
  ADD CONSTRAINT "self_help_content_type_check" CHECK ("content_type" IN ('exercise', 'article', 'prompt', 'resource')),
  ADD CONSTRAINT "self_help_content_review_check" CHECK ("review_state" IN ('draft', 'approved', 'withdrawn', 'expired')),
  ADD CONSTRAINT "self_help_content_version_check" CHECK ("content_version" > 0);

ALTER TABLE "exercise_sessions"
  ADD CONSTRAINT "exercise_sessions_content_fkey" FOREIGN KEY ("content_id") REFERENCES "self_help_content"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "exercise_sessions_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "exercise_sessions_state_check" CHECK ("progress_state" IN ('started', 'paused', 'completed', 'abandoned'));

ALTER TABLE "wellbeing_reflections"
  ADD CONSTRAINT "wellbeing_reflections_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "wellbeing_reflections_status_check" CHECK ("status" IN ('in_progress', 'completed', 'withdrawn'));

ALTER TABLE "wellbeing_activities"
  ADD CONSTRAINT "wellbeing_activities_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "wellbeing_activities_content_fkey" FOREIGN KEY ("content_id") REFERENCES "self_help_content"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "wellbeing_activities_status_check" CHECK ("status" IN ('started', 'paused', 'completed', 'abandoned'));

ALTER TABLE "wellbeing_summaries"
  ADD CONSTRAINT "wellbeing_summaries_intake_fkey" FOREIGN KEY ("intake_id") REFERENCES "intake_sessions"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "wellbeing_summaries_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "wellbeing_summaries_generated_by_check" CHECK ("generated_by" IN ('ai', 'member')),
  ADD CONSTRAINT "wellbeing_summaries_review_check" CHECK ("review_state" IN ('pending', 'reviewed', 'edited', 'rejected')),
  ADD CONSTRAINT "wellbeing_summaries_version_check" CHECK ("version_no" > 0);

ALTER TABLE "support_recommendations"
  ADD CONSTRAINT "support_recommendations_intake_fkey" FOREIGN KEY ("intake_id") REFERENCES "intake_sessions"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "support_recommendations_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "support_recommendations_level_check" CHECK ("support_level" IN ('peer', 'self_help', 'urgent_resource')),
  ADD CONSTRAINT "support_recommendations_availability_check" CHECK ("availability_state" IN ('available', 'unavailable', 'ineligible'));

ALTER TABLE "listener_profiles"
  ADD CONSTRAINT "listener_profiles_user_fkey" FOREIGN KEY ("user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_profiles_application_check" CHECK ("application_state" IN ('pending', 'approved', 'rejected', 'suspended')),
  ADD CONSTRAINT "listener_profiles_eligibility_check" CHECK ("eligibility_state" IN ('eligible', 'ineligible', 'expired')),
  ADD CONSTRAINT "listener_profiles_capacity_check" CHECK ("capacity_limit" > 0);

ALTER TABLE "listener_training_records"
  ADD CONSTRAINT "listener_training_listener_fkey" FOREIGN KEY ("listener_id") REFERENCES "listener_profiles"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_training_reviewer_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL,
  ADD CONSTRAINT "listener_training_state_check" CHECK ("completion_state" IN ('assigned', 'in_progress', 'passed', 'failed', 'expired'));

ALTER TABLE "listener_supervisor_assignments"
  ADD CONSTRAINT "listener_supervisor_listener_fkey" FOREIGN KEY ("listener_id") REFERENCES "listener_profiles"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_supervisor_user_fkey" FOREIGN KEY ("supervisor_user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_supervisor_grantor_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_supervisor_state_check" CHECK ("assignment_state" IN ('active', 'ended', 'revoked'));

ALTER TABLE "listener_availability"
  ADD CONSTRAINT "listener_availability_listener_fkey" FOREIGN KEY ("listener_id") REFERENCES "listener_profiles"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_availability_state_check" CHECK ("availability_state" IN ('available', 'paused', 'unavailable')),
  ADD CONSTRAINT "listener_availability_range_check" CHECK ("ends_at" > "starts_at");

ALTER TABLE "listener_match_requests"
  ADD CONSTRAINT "listener_match_requests_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_match_requests_summary_fkey" FOREIGN KEY ("shared_summary_id") REFERENCES "wellbeing_summaries"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_match_requests_consent_fkey" FOREIGN KEY ("consent_id") REFERENCES "consent_records"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_match_requests_state_check" CHECK ("request_state" IN ('queued', 'matched', 'cancelled', 'expired', 'no_match'));

ALTER TABLE "listener_matches"
  ADD CONSTRAINT "listener_matches_request_fkey" FOREIGN KEY ("request_id") REFERENCES "listener_match_requests"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_matches_listener_fkey" FOREIGN KEY ("listener_id") REFERENCES "listener_profiles"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_matches_state_check" CHECK ("match_state" IN ('offered', 'accepted', 'declined', 'ended', 'cancelled'));

ALTER TABLE "peer_conversations"
  ADD CONSTRAINT "peer_conversations_match_fkey" FOREIGN KEY ("match_id") REFERENCES "listener_matches"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "peer_conversations_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "peer_conversations_listener_fkey" FOREIGN KEY ("listener_id") REFERENCES "listener_profiles"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "peer_conversations_closed_by_fkey" FOREIGN KEY ("closed_by_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL,
  ADD CONSTRAINT "peer_conversations_channel_check" CHECK ("channel" IN ('text', 'voice')),
  ADD CONSTRAINT "peer_conversations_state_check" CHECK ("conversation_state" IN ('open', 'closed', 'reported', 'escalated'));

ALTER TABLE "peer_messages"
  ADD CONSTRAINT "peer_messages_sender_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "peer_messages_state_check" CHECK ("delivery_state" IN ('queued', 'delivered', 'failed', 'redacted')),
  ADD CONSTRAINT "peer_messages_sequence_check" CHECK ("sequence_no" > 0);

ALTER TABLE "conduct_reports"
  ADD CONSTRAINT "conduct_reports_conversation_fkey" FOREIGN KEY ("conversation_id") REFERENCES "peer_conversations"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "conduct_reports_reporter_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "conduct_reports_reported_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "conduct_reports_assignee_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL,
  ADD CONSTRAINT "conduct_reports_state_check" CHECK ("report_state" IN ('open', 'reviewing', 'resolved', 'closed'));

ALTER TABLE "listener_feedback"
  ADD CONSTRAINT "listener_feedback_conversation_fkey" FOREIGN KEY ("conversation_id") REFERENCES "peer_conversations"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_feedback_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "listener_feedback_reviewer_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL,
  ADD CONSTRAINT "listener_feedback_rating_check" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "listener_feedback_state_check" CHECK ("review_state" IN ('received', 'reviewing', 'closed', 'escalated'));

ALTER TABLE "safety_cases"
  ADD CONSTRAINT "safety_cases_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "safety_cases_responder_fkey" FOREIGN KEY ("assigned_responder_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL,
  ADD CONSTRAINT "safety_cases_source_check" CHECK ("source_type" IN ('intake', 'ai_session', 'peer_conversation', 'manual')),
  ADD CONSTRAINT "safety_cases_state_check" CHECK ("case_state" IN ('new', 'queued', 'assigned', 'in_progress', 'handed_off', 'closed')),
  ADD CONSTRAINT "safety_cases_priority_check" CHECK ("priority_code" IN ('routine', 'urgent', 'emergency'));

ALTER TABLE "safety_case_actions"
  ADD CONSTRAINT "safety_case_actions_case_fkey" FOREIGN KEY ("case_id") REFERENCES "safety_cases"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "safety_case_actions_actor_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL,
  ADD CONSTRAINT "safety_case_actions_resource_fkey" FOREIGN KEY ("resource_id") REFERENCES "crisis_resources"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "safety_case_actions_state_check" CHECK ("action_state" IN ('attempted', 'completed', 'failed'));

ALTER TABLE "crisis_resources"
  ADD CONSTRAINT "crisis_resources_reviewer_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "app_principals"("user_id") ON DELETE SET NULL,
  ADD CONSTRAINT "crisis_resources_type_check" CHECK ("resource_type" IN ('emergency', 'crisis_line', 'community_support')),
  ADD CONSTRAINT "crisis_resources_state_check" CHECK ("verification_state" IN ('pending', 'verified', 'withdrawn', 'expired'));

ALTER TABLE "followups"
  ADD CONSTRAINT "followups_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "followups_source_check" CHECK ("source_type" IN ('goal', 'support_session', 'member_requested')),
  ADD CONSTRAINT "followups_state_check" CHECK ("followup_state" IN ('scheduled', 'sent', 'responded', 'skipped', 'cancelled'));

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_user_fkey" FOREIGN KEY ("user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "notifications_channel_check" CHECK ("channel" IN ('email', 'sms', 'push', 'in_app')),
  ADD CONSTRAINT "notifications_state_check" CHECK ("delivery_state" IN ('queued', 'sent', 'delivered', 'failed', 'cancelled')),
  ADD CONSTRAINT "notifications_attempt_count_check" CHECK ("attempt_count" >= 0);

ALTER TABLE "ai_processing_runs"
  ADD CONSTRAINT "ai_processing_runs_member_fkey" FOREIGN KEY ("member_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "ai_processing_runs_consent_fkey" FOREIGN KEY ("consent_id") REFERENCES "consent_records"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "ai_processing_runs_state_check" CHECK ("run_state" IN ('started', 'succeeded', 'failed', 'blocked'));

ALTER TABLE "workflow_executions"
  ADD CONSTRAINT "workflow_executions_definition_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "workflow_executions_status_check" CHECK ("status" IN ('running', 'waiting', 'completed', 'failed', 'cancelled', 'timed_out'));

ALTER TABLE "workflow_tasks"
  ADD CONSTRAINT "workflow_tasks_execution_fkey" FOREIGN KEY ("execution_id") REFERENCES "workflow_executions"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "workflow_tasks_assignee_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "workflow_tasks_status_check" CHECK ("status" IN ('queued', 'assigned', 'acknowledged', 'completed', 'cancelled', 'expired'));

ALTER TABLE "workflow_steps"
  ADD CONSTRAINT "workflow_steps_execution_fkey" FOREIGN KEY ("execution_id") REFERENCES "workflow_executions"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "workflow_steps_status_check" CHECK ("status" IN ('pending', 'running', 'completed', 'failed', 'compensated')),
  ADD CONSTRAINT "workflow_steps_attempt_check" CHECK ("attempt_no" > 0);

ALTER TABLE "workflow_timers"
  ADD CONSTRAINT "workflow_timers_execution_fkey" FOREIGN KEY ("execution_id") REFERENCES "workflow_executions"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "workflow_timers_status_check" CHECK ("status" IN ('scheduled', 'fired', 'cancelled', 'failed'));

ALTER TABLE "workflow_events"
  ADD CONSTRAINT "workflow_events_execution_fkey" FOREIGN KEY ("execution_id") REFERENCES "workflow_executions"("id") ON DELETE RESTRICT;

ALTER TABLE "human_approvals"
  ADD CONSTRAINT "human_approvals_execution_fkey" FOREIGN KEY ("execution_id") REFERENCES "workflow_executions"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "human_approvals_task_fkey" FOREIGN KEY ("task_id") REFERENCES "workflow_tasks"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "human_approvals_approver_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "app_principals"("user_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "human_approvals_decision_check" CHECK ("decision" IN ('approved', 'rejected', 'returned'));

ALTER TABLE "workflow_compensations"
  ADD CONSTRAINT "workflow_compensations_execution_fkey" FOREIGN KEY ("execution_id") REFERENCES "workflow_executions"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "workflow_compensations_step_fkey" FOREIGN KEY ("step_id") REFERENCES "workflow_steps"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "workflow_compensations_status_check" CHECK ("status" IN ('pending', 'running', 'completed', 'failed', 'not_required'));

ALTER TABLE "agent_tool_invocations"
  ADD CONSTRAINT "agent_tool_invocations_run_fkey" FOREIGN KEY ("agent_run_id") REFERENCES "ai_processing_runs"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "agent_tool_invocations_status_check" CHECK ("status" IN ('requested', 'authorized', 'denied', 'succeeded', 'failed'));

ALTER TABLE "event_consumer_receipts"
  ADD CONSTRAINT "event_consumer_receipts_event_fkey" FOREIGN KEY ("event_id") REFERENCES "outbox_events"("id") ON DELETE RESTRICT;
