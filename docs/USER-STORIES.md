# MindSpace — Product User Stories
## Product vision and scope

MindSpace is a peer-support-centered wellbeing platform, inspired at a high level by listener-support services such as 7 Cups. It should help a member find an appropriate next step through these support routes:

1. **Peer emotional support:** Trained volunteer listeners offer non-clinical conversations.
2. **AI-guided self-help:** A wellbeing companion supports reflection, journaling, and guided exercises.
3. **Safety resources:** Human-led safety workflows connect people to appropriate local help when the service is staffed.

MindSpace does not provide licensed clinical care or maintain clinical records. AI may support navigation and summarization, but it must not diagnose, prescribe, or present itself as a human. Peer-support, AI/self-help, and safety records require separate permissions and governance.

### Intended user roles

- **Member:** A person seeking emotional wellbeing or mental-health support.
- **Listener:** A trained volunteer who provides non-clinical peer support.
- **Listener supervisor:** An authorized operator supervising listener eligibility, training, workload, and conduct.
- **Safety operations specialist:** An authorized human who handles assigned safety cases and handoffs according to approved policy.
- **Platform administrator:** An operator managing platform configuration without default access to conversation content.
- **AI agent service identity:** A non-human principal limited to authorized typed application tools; never a direct database user.

### Priority legend

- **P1:** Foundational member journey and essential safety/privacy controls.
- **P2:** Human support operations and ongoing care capabilities.
- **P3:** Advanced personalization, analytics, and service optimization.

## Assumptions and boundaries

- Users must be authenticated for private intake, messaging, journaling, and wellbeing records.
- Intake questions are optional where possible; members can pause and resume.
- Listener conversations are peer support, not therapy or clinical treatment.
- The service must not claim emergency-response availability unless a staffed, jurisdiction-specific service is actually operating.
- Age eligibility, supported jurisdictions, retention periods, crisis scripts, consent language, and regulatory obligations must be confirmed before launch.
- Data fields below are logical planning fields, not a final database schema. Use stable IDs, timestamps, explicit status values, and audit history where appropriate; avoid storing unnecessary sensitive data.
- MindSpace is a standalone project with its own product design, application, identity, services, and database. Peer-listening product references are inspiration only; MindSpace's code, content, workflows, schema, and user accounts are its own.
- **Backend Technology Baseline:** All backend workflows, member profile persistence, intake processing, peer match routing, and safety incident handling are powered by a **Python** backend (FastAPI, SQLAlchemy Async, Clean Architecture under `backend/mindspace-fastapi`), exposing authenticated `/api/v1` REST APIs and MCP tools.
- Peer Support and Wellbeing are separate authoritative data domains; sharing requires purpose, authorization, consent where applicable, and provenance.

---

## Epic 1 — Account, profile, and informed consent

### US-001 — Create an account (Priority: P1)

**Story:** As a prospective member, I want to create a MindSpace account so that I can access private wellbeing support.

**Acceptance criteria**

- **Given** I provide valid registration details and accept the required terms, **when** I submit the form, **then** an account is created and I am taken to onboarding.
- **Given** I submit invalid or already-used credentials, **when** registration is attempted, **then** I see a clear error without revealing another user’s private account details.
- **Given** the minimum age or supported location requirement is not met, **when** I try to register, **then** access is handled according to the approved eligibility policy.

**Data fields:** `user_id`, `email`, `email_verified_at`, `credential_reference` (never plaintext password), `account_status`, `created_at`, `updated_at`, `eligibility_status`, `terms_version`, `terms_accepted_at`.

### US-002 — Sign in and recover account access (Priority: P1)

**Story:** As a returning member, listener, or administrator, I want to securely sign in and recover access so that I can use my account safely.

**Acceptance criteria**

- **Given** my credentials are valid, **when** I sign in, **then** I am taken to the correct role-specific workspace.
- **Given** credentials are invalid or an account is disabled, **when** sign-in fails, **then** I receive a safe, understandable message and no private account details are exposed.
- **Given** I request account recovery, **when** the recovery flow completes, **then** the recovery link is time-limited, single-use, and the event is recorded.

**Data fields:** `user_id`, `role_assignments`, `auth_provider`, `last_sign_in_at`, `failed_sign_in_count`, `recovery_token_hash`, `recovery_expires_at`, `recovery_used_at`, `security_event_id`, `created_at`.

### US-003 — Set up wellbeing profile and preferences (Priority: P1)

**Story:** As a member, I want to set my profile and support preferences so that MindSpace can present relevant, accessible options.

**Acceptance criteria**

- **Given** I am completing onboarding, **when** I provide profile or preference details, **then** I can save the information and edit it later.
- **Given** a preference is optional, **when** I skip it, **then** I can still use the core member journey.
- **Given** I request a language, accessibility, or communication preference, **when** support options are shown, **then** the system uses that preference where available and indicates when it cannot.

**Data fields:** `profile_id`, `user_id`, `display_name`, `date_of_birth` (only if needed for eligibility), `locale`, `timezone`, `preferred_language`, `accessibility_preferences`, `communication_preferences`, `support_preferences`, `profile_completed_at`, `updated_at`.

### US-004 — Review consent and privacy choices (Priority: P1)

**Story:** As a member, I want to understand and control how my information is used so that I can make informed choices about sensitive wellbeing data.

**Acceptance criteria**

- **Given** a feature needs consent, **when** it is first used, **then** the purpose, data involved, and sharing recipients are explained before collection or sharing.
- **Given** I grant or withdraw optional consent, **when** I confirm the choice, **then** the choice and policy version are recorded and applied to future use.
- **Given** I choose not to share my intake with a listener, **when** I continue, **then** the information is not shared and I am told what functionality is affected.

**Data fields:** `consent_id`, `user_id`, `consent_type`, `purpose`, `recipient_scope`, `granted`, `policy_version`, `granted_at`, `withdrawn_at`, `capture_method`, `audit_event_id`.

### US-005 — Export or request deletion of personal data (Priority: P2)

**Story:** As a member, I want to request a copy or deletion of my personal data so that I can exercise control over my information.

**Acceptance criteria**

- **Given** I request an export, **when** the request is verified and processed, **then** I receive an access-controlled copy of the data I am entitled to receive.
- **Given** I request deletion, **when** the request is submitted, **then** I receive its status and any required explanation of legally retained records.
- **Given** a deletion or export request is fulfilled, **when** it completes, **then** the completion is auditable and downstream copies are handled according to the retention policy.

**Data fields:** `privacy_request_id`, `user_id`, `request_type`, `verification_status`, `requested_at`, `status`, `completed_at`, `retention_exception`, `resolution_summary`, `audit_event_id`.

---

## Epic 2 — Mental-wellbeing intake and support summary

### US-006 — Start a compassionate intake in chat or voice (Priority: P1)

**Story:** As a member, I want to explain what I am experiencing by chat or voice so that I can begin without facing a rigid medical questionnaire.

**Acceptance criteria**

- **Given** I choose chat or voice, **when** intake begins, **then** the system identifies itself as AI and explains it is not a human or emergency service.
- **Given** I share a concern, **when** the intake responds, **then** the conversation uses supportive, nonjudgmental language and asks relevant follow-up questions without demanding every answer.
- **Given** I choose voice, **when** microphone access is unavailable or denied, **then** I can switch to text without losing the intake already provided.
- **Given** an AI service is unavailable, **when** I try to continue, **then** I see an explicit retry or save-and-return option rather than a fabricated response.

**Data fields:** `intake_id`, `user_id`, `channel`, `status`, `started_at`, `completed_at`, `language`, `conversation_id`, `consent_id`, `agent_version`, `error_status`.

### US-007 — Pause, resume, or skip intake questions (Priority: P1)

**Story:** As a member, I want to skip questions or pause and resume intake so that I remain in control of how much I share.

**Acceptance criteria**

- **Given** I do not want to answer a question, **when** I skip it, **then** intake continues without treating the unanswered value as a negative response.
- **Given** I leave an incomplete intake, **when** I return, **then** I can resume from the saved point or start over.
- **Given** I ask to correct an earlier answer, **when** I edit it, **then** the current summary uses the corrected answer and the change is traceable.

**Data fields:** `intake_id`, `question_or_topic_id`, `response_reference`, `response_status` (`answered`, `skipped`, `declined`), `sequence_number`, `saved_at`, `last_resumed_at`, `revision_number`.

### US-008 — Capture member-reported wellbeing context (Priority: P1)

**Story:** As a member, I want to share concerns, feelings, duration, triggers, impacts, supports, and goals in my own words so that my next support step reflects my situation.

**Acceptance criteria**

- **Given** I choose to share context, **when** I describe it, **then** the system can record the member’s own words and distinguish them from AI-generated interpretation.
- **Given** I do not know or do not want to answer a topic, **when** that topic is reached, **then** I can leave it unknown or decline.
- **Given** information is summarized, **when** I review it, **then** I can correct inaccuracies before sharing it with another person.

**Data fields:** `intake_id`, `presenting_concerns`, `member_reported_emotions`, `duration`, `frequency`, `self_reported_distress`, `triggers`, `functional_impact`, `support_network_summary`, `previous_support_summary`, `member_goals`, `source_type`, `captured_at`.

### US-009 — Review and control an AI-generated wellbeing summary (Priority: P1)

**Story:** As a member, I want to review and edit an AI-generated support summary so that I can decide what is accurate and what may be shared.

**Acceptance criteria**

- **Given** intake is complete, **when** a summary is generated, **then** it is labeled as an AI-generated, non-diagnostic summary.
- **Given** the summary contains an error, **when** I edit or reject it, **then** my version becomes the one used for any later sharing.
- **Given** I have not consented to share the summary, **when** I request peer or professional support, **then** it is not shared automatically.

**Data fields:** `summary_id`, `intake_id`, `user_id`, `summary_text`, `support_needs`, `suggested_next_steps`, `generation_source`, `model_or_agent_version`, `member_review_status`, `member_edits`, `created_at`, `reviewed_at`, `sharing_consent_id`.

### US-010 — Receive appropriate next-step options (Priority: P1)

**Story:** As a member, I want to see available support options after intake so that I can choose a next step that feels right for me.

**Acceptance criteria**

- **Given** intake is complete, **when** options are shown, **then** peer support and self-guided support are clearly distinguished.
- **Given** a service is unavailable in my location or at that time, **when** options are shown, **then** the limitation is clear and unavailable options are not represented as available.
- **Given** I choose an option, **when** I proceed, **then** only information authorized for that option is used.

**Data fields:** `recommendation_id`, `user_id`, `intake_id`, `support_level`, `option_type`, `eligibility_status`, `availability_status`, `rationale`, `generated_at`, `member_selection`, `selection_at`.

---

## Epic 3 — AI-guided self-help and wellbeing activities

### US-011 — Talk with the AI wellbeing companion (Priority: P1)

**Story:** As a member, I want to have a supportive AI-guided conversation so that I can reflect on what I am feeling between human-support sessions.

**Acceptance criteria**

- **Given** I begin an AI conversation, **when** the companion responds, **then** it is transparent that it is AI and does not claim to be a licensed professional.
- **Given** I ask for diagnosis, medication, or emergency intervention, **when** the companion responds, **then** it does not provide a diagnosis or prescription and presents an appropriate human-support or urgent-help route.
- **Given** I end or delete a conversation, **when** I review my activity, **then** its status and available data controls are clear.

**Data fields:** `wellbeing_session_id`, `user_id`, `channel`, `started_at`, `ended_at`, `session_status`, `consent_id`, `agent_version`, `message_id`, `message_role`, `message_content_reference`, `created_at`, `deletion_status`.

### US-012 — Record a private journal entry (Priority: P2)

**Story:** As a member, I want to write private journal entries so that I can reflect on patterns and feelings over time.

**Acceptance criteria**

- **Given** I create an entry, **when** I save it, **then** it is private by default and visible only to me unless I explicitly share it.
- **Given** I edit or delete an entry, **when** I confirm, **then** the user-facing journal reflects that action.
- **Given** AI reflection on a journal entry is offered, **when** I use it, **then** the system explains the processing and does not silently reuse the entry for unrelated purposes.

**Data fields:** `journal_entry_id`, `user_id`, `title`, `content_reference`, `mood_label` (optional), `created_at`, `updated_at`, `sharing_status`, `ai_processing_consent_id`, `deleted_at`.

### US-013 — Complete a guided self-help exercise (Priority: P2)

**Story:** As a member, I want to choose a guided reflection or wellbeing exercise so that I can practice a useful skill at my own pace.

**Acceptance criteria**

- **Given** I browse exercises, **when** I select one, **then** I can see its purpose, expected duration, and any relevant limitations before starting.
- **Given** I start an exercise, **when** I pause or finish, **then** my progress is saved and I can choose whether to save a reflection.
- **Given** an exercise is not appropriate for my selected language or eligibility, **when** I browse, **then** it is not presented as supported.

**Data fields:** `exercise_id`, `title`, `category`, `content_version`, `language`, `eligibility_rules`, `exercise_session_id`, `user_id`, `started_at`, `completed_at`, `progress_status`, `reflection_reference`.

### US-014 — Track personal wellbeing goals (Priority: P2)

**Story:** As a member, I want to set and review personal wellbeing goals so that I can notice progress in areas I choose.

**Acceptance criteria**

- **Given** I create a goal, **when** I save it, **then** it is recorded as member-authored.
- **Given** I record a check-in, **when** I review my progress, **then** I see my own reported updates and can change or close the goal.

**Data fields:** `goal_id`, `user_id`, `goal_text`, `goal_source`, `status`, `target_date` (optional), `check_in_id`, `progress_note`, `created_at`, `updated_at`, `closed_at`.

---

## Epic 4 — Peer support and listener operations

### US-015 — Find a trained peer listener (Priority: P1)

**Story:** As a member, I want to request a trained volunteer listener so that I can have a non-clinical, empathetic conversation with another person.

**Acceptance criteria**

- **Given** I request a listener, **when** matching runs, **then** only eligible, active, trained, available listeners are considered.
- **Given** I set optional preferences, **when** matches are presented, **then** supported preferences such as language and availability are applied and unmet preferences are explained.
- **Given** no listener is available, **when** matching completes, **then** I can wait, try later, or choose another available support option without losing my request.
- **Given** a match is offered, **when** I accept, **then** only the member-approved context is shared.

**Data fields:** `listener_match_request_id`, `member_id`, `preferred_language`, `availability_window`, `optional_preferences`, `consented_context_reference`, `request_status`, `match_id`, `matched_listener_id`, `created_at`, `matched_at`, `declined_at`, `match_rationale`.

### US-016 — Have a private peer-support conversation (Priority: P1)

**Story:** As a member, I want to message or speak with my matched listener so that I can receive human peer support.

**Acceptance criteria**

- **Given** a match is accepted, **when** a conversation begins, **then** both participants see that it is peer support, not therapy or clinical treatment.
- **Given** either participant sends a message or voice note, **when** the conversation is available, **then** it is delivered only to authorized participants and stored under the peer-support record class.
- **Given** the conversation ends, **when** it is closed, **then** the member can report a concern and request another listener.

**Data fields:** `peer_conversation_id`, `match_id`, `member_id`, `listener_id`, `channel`, `status`, `started_at`, `ended_at`, `message_id`, `sender_id`, `content_reference`, `sent_at`, `delivery_status`, `report_id`.

### US-017 — Keep or change a listener relationship (Priority: P2)

**Story:** As a member, I want to request continuity with a previous listener or change listeners so that I can choose the kind of peer-support relationship I prefer.

**Acceptance criteria**

- **Given** continuity is available and both parties are eligible, **when** I request the same listener, **then** the system attempts continuity without guaranteeing availability.
- **Given** I request a new listener or block a prior match, **when** the request is confirmed, **then** future matching respects that choice.
- **Given** a listener becomes unavailable, **when** a follow-up is scheduled, **then** I am notified and can select another option.

**Data fields:** `member_id`, `listener_id`, `continuity_preference`, `blocked_listener_ids`, `match_history_reference`, `preference_updated_at`, `availability_notice_id`.

### US-018 — Apply to become a listener (Priority: P2)

**Story:** As a prospective volunteer, I want to apply and complete listener training so that I can provide safe, bounded peer support.

**Acceptance criteria**

- **Given** I apply, **when** I submit required information and acknowledgements, **then** my application remains pending until authorized review is complete.
- **Given** training is required, **when** I complete it, **then** completion and any required assessment are recorded before I can accept matches.
- **Given** I am not approved or my training expires, **when** I attempt to accept a conversation, **then** access is denied and the reason is visible to authorized staff.

**Data fields:** `listener_application_id`, `user_id`, `application_status`, `training_module_id`, `training_version`, `training_status`, `assessment_result`, `completed_at`, `reviewer_id`, `review_decision`, `decision_at`, `eligibility_expires_at`.

### US-019 — Manage listener availability and wellbeing boundaries (Priority: P2)

**Story:** As a listener, I want to set availability, capacity, and time away so that I can support members without exceeding my boundaries.

**Acceptance criteria**

- **Given** I set availability or capacity, **when** matching occurs, **then** requests respect those settings and my active assignment limit.
- **Given** I pause or take time away, **when** the change is saved, **then** I receive no new matches during that period.
- **Given** I report an urgent safety concern, **when** I use the escalation flow, **then** the case is routed to the approved human process or the product clearly states that human response is unavailable.

**Data fields:** `listener_id`, `availability_rule`, `timezone`, `capacity_limit`, `active_assignment_count`, `pause_start`, `pause_end`, `boundary_status`, `escalation_case_id`, `updated_at`.

### US-020 — Use a listener copilot with clear boundaries (Priority: P3)

**Story:** As a listener, I want optional, non-clinical response suggestions so that I can communicate empathetically while remaining responsible for my own messages.

**Acceptance criteria**

- **Given** copilot suggestions are enabled, **when** I request a suggestion, **then** it is clearly labeled as AI-generated and requires my review before sending.
- **Given** a suggested response includes diagnosis, treatment, or unsafe advice, **when** policy checks detect it, **then** it is withheld or redirected to an approved safety workflow.
- **Given** the member’s conversation data is used for suggestions, **when** the feature is enabled, **then** the applicable consent and access policy are enforced.

**Data fields:** `copilot_request_id`, `peer_conversation_id`, `listener_id`, `input_reference`, `suggestion_reference`, `agent_version`, `policy_result`, `accepted_or_edited_status`, `created_at`, `consent_id`.

---

## Epic 5 — Safety, escalation, and crisis support

### US-021 — Recognize and route an urgent safety concern (Priority: P1)

**Story:** As a member, I want the service to respond appropriately if I express immediate danger so that I am directed to human and local emergency support.

**Acceptance criteria**

- **Given** a message or interaction meets an approved safety trigger, **when** it is detected, **then** the member receives the approved supportive response and location-appropriate urgent-help options.
- **Given** human escalation is offered or required by policy, **when** an authorized responder is available, **then** the case is routed to that responder with only necessary information.
- **Given** no staffed response is available, **when** an escalation is triggered, **then** the system does not imply a human is monitoring or that emergency response has been dispatched.
- **Given** a safety signal is uncertain, **when** the policy requires clarification, **then** the system follows the approved protocol and does not claim a diagnosis or definitive risk classification.

**Data fields:** `safety_case_id`, `user_id`, `source_channel`, `trigger_type`, `triggered_at`, `policy_version`, `assessment_status`, `human_review_status`, `responder_id`, `jurisdiction`, `resource_offered`, `resolution_status`, `closed_at`, `audit_event_id`.

### US-022 — Provide location-appropriate crisis resources (Priority: P1)

**Story:** As a member in urgent distress, I want clear, locally relevant emergency and crisis resources so that I can contact appropriate help.

**Acceptance criteria**

- **Given** my location is known with permission, **when** urgent resources are shown, **then** they are appropriate for that location and their source or last verification is recorded.
- **Given** my location is not known, **when** resources are shown, **then** the service asks for a location only when necessary or gives a clear way to find local emergency help.
- **Given** a resource is unavailable or unverified, **when** it is requested, **then** it is not presented as guaranteed or staffed.

**Data fields:** `resource_id`, `country_or_region`, `resource_type`, `contact_method`, `display_instructions`, `source`, `verification_status`, `last_verified_at`, `effective_from`, `effective_to`, `locale`.

### US-023 — Review and close a human safety escalation (Priority: P1)

**Story:** As an authorized safety responder, I want to review assigned escalations and document actions so that urgent concerns receive accountable human handling.

**Acceptance criteria**

- **Given** I am an authorized responder, **when** I open a case, **then** I see only the minimum information required for the assigned action.
- **Given** I take an action, **when** I record it, **then** the action, timestamp, actor, and outcome are auditable.
- **Given** a case is transferred or closed, **when** the status changes, **then** the assigned parties and member-facing follow-up follow the approved policy.

**Data fields:** `safety_case_id`, `assigned_responder_id`, `assignment_at`, `priority`, `action_type`, `action_note_reference`, `action_at`, `handoff_target`, `handoff_at`, `outcome`, `closure_reason`, `closed_at`.

---

## Epic 6 — Follow-up, notifications, and member workspace

### US-024 — View a private member dashboard (Priority: P1)

**Story:** As a member, I want a private dashboard showing my next steps and support activity so that I can continue my care journey.

**Acceptance criteria**

- **Given** I sign in, **when** my dashboard loads, **then** it shows only my selected support activities and member-visible records.
- **Given** a section has no data, **when** the dashboard loads, **then** it provides a useful next action rather than misleading placeholder records.
- **Given** I have multiple roles, **when** I navigate, **then** role-specific pages and actions remain separated.

**Data fields:** `user_id`, `dashboard_preferences`, `active_support_request_ids`, `member_visible_record_ids`, `last_viewed_at`.

### US-025 — Receive reminders and follow-up check-ins (Priority: P2)

**Story:** As a member, I want configurable reminders and supportive follow-up check-ins so that I can remember chosen goals and activities.

**Acceptance criteria**

- **Given** I enable reminders, **when** a check-in or goal reminder is due, **then** I receive it through my chosen channel and within my quiet hours.
- **Given** I disable or change a reminder, **when** the preference is saved, **then** future notifications use the updated setting.
- **Given** a follow-up asks about wellbeing, **when** I choose not to respond, **then** I am not treated as having reported a negative or positive status.

**Data fields:** `notification_id`, `user_id`, `notification_type`, `channel`, `scheduled_at`, `sent_at`, `delivery_status`, `quiet_hours`, `notification_preferences`, `check_in_id`, `response_status`, `response_reference`.

### US-026 — Review a longitudinal wellbeing timeline (Priority: P2)

**Story:** As a member, I want to review my own wellbeing activity over time so that I can reflect on changes and share selected information when I choose.

**Acceptance criteria**

- **Given** I open my timeline, **when** entries are displayed, **then** each item identifies its source, date, and whether it is member-reported or AI-generated.
- **Given** I choose to share an item, **when** I select a recipient, **then** only that item and the authorized recipient are included.
- **Given** a record is not member-visible or has been deleted, **when** the timeline is shown, **then** it is not exposed.

**Data fields:** `timeline_item_id`, `user_id`, `item_type`, `source_type`, `source_record_id`, `event_at`, `visibility`, `sharing_status`, `consent_id`.

---

## Epic 7 — Listener and platform administration

### US-027 — Manage listener eligibility and quality (Priority: P2)

**Story:** As an administrator, I want to review listener applications, training, availability, and reports so that only eligible volunteers can provide peer support.

**Acceptance criteria**

- **Given** an application is pending, **when** an authorized administrator reviews it, **then** the administrator can approve, reject, or request more information with a recorded reason.
- **Given** training, eligibility, or a conduct review expires or fails, **when** matching occurs, **then** the listener is not eligible until resolved.
- **Given** a member reports a listener, **when** the report is reviewed, **then** access to the report is limited and all administrative actions are auditable.

**Data fields:** `listener_application_id`, `listener_id`, `review_status`, `reviewer_id`, `decision_reason`, `training_status`, `eligibility_status`, `conduct_report_id`, `resolution_status`, `reviewed_at`.

### US-028 — Manage support content and AI safety policies (Priority: P2)

**Story:** As an authorized administrator, I want to manage approved exercises, resource directories, and AI safety policies so that member-facing content remains reviewed and current.

**Acceptance criteria**

- **Given** content or a policy is changed, **when** it is published, **then** author, reviewer, version, effective date, and approval are recorded.
- **Given** content is expired or withdrawn, **when** members browse, **then** it is no longer presented as active.
- **Given** a safety policy update is published, **when** an AI workflow uses it, **then** the policy version used for that interaction can be identified.

**Data fields:** `content_id`, `content_type`, `version`, `locale`, `status`, `author_id`, `reviewer_id`, `approved_at`, `effective_from`, `effective_to`, `policy_version`, `change_reason`.

### US-029 — Review platform audit events and aggregate service metrics (Priority: P3)

**Story:** As an authorized administrator, I want privacy-preserving operational reports and audit trails so that I can monitor service quality and investigate access appropriately.

**Acceptance criteria**

- **Given** an authorized administrator requests metrics, **when** the report is generated, **then** it uses aggregated or de-identified data wherever individual-level data is unnecessary.
- **Given** an administrator accesses sensitive records, **when** access occurs, **then** the purpose, actor, record, and time are logged.
- **Given** a metric could expose an individual in a small cohort, **when** the report is generated, **then** the approved privacy threshold is applied.

**Data fields:** `audit_event_id`, `actor_id`, `actor_role`, `action`, `resource_type`, `resource_id`, `purpose`, `occurred_at`, `result`, `correlation_id`; aggregate measures such as `period`, `support_level`, `volume`, `wait_time`, `completion_rate`, `satisfaction_score`, and `suppression_status`.

---

## Epic 8 — Durable workflows and human operations

### US-030 — Resume a durable support workflow (Priority: P1)

**Story:** As a member, I want an interrupted onboarding or intake process to resume safely so that I do not lose my progress or receive a false completion status.

**Acceptance criteria**

- **Given** a workflow is interrupted, **when** the member returns, **then** the system shows its actual saved state and an allowed next action.
- **Given** a request is retried after a timeout, **when** the first request already succeeded, **then** the retry does not duplicate a booking, message, or disclosure.
- **Given** an activity fails, **when** it cannot be retried safely, **then** the workflow surfaces a recoverable failure or human task rather than success-shaped output.

**Data fields:** `process_definition_id`, `process_version`, `execution_id`, `subject_id`, `current_state`, `started_at`, `updated_at`, `failure_code`, `correlation_id`, `idempotency_key`.

### US-031 — Supervise listener eligibility and conduct (Priority: P2 · Verified & Implemented)

**Story:** As a listener supervisor, I want to review listener training, eligibility, workload, and conduct reports so that peer support remains appropriately bounded and supervised.

**Acceptance criteria**

- **Given** a listener has expired training or is suspended, **when** matching runs, **then** that listener is excluded until an authorized supervisor resolves the status.
- **Given** a conduct report is assigned, **when** a supervisor reviews it, **then** only authorized assigned roles can access its content and decisions are recorded.
- **Given** a supervision action changes eligibility, **when** it is saved, **then** the reason, actor, time, and affected assignments are auditable.
- **Given** a volunteer completes Safeguarding V2 or CEU modules, **when** the supervisor signs off in the console, **then** the credential is verified and persisted in PostgreSQL.
- **Given** regular monthly supervision is required, **when** the supervisor triggers pod check-in scheduling, **then** calendar invites are dispatched to active pod listeners.

**Implementation Status:**
- UI: `/mindspace/listener-supervisor` with subpages `/listeners` (Pod Roster & Eligibility), `/conduct-reports` (Conduct & Boundary Audits), and `/training-reviews` (Training Signoffs & Pods).
- Backend & DB: Backed by PostgreSQL endpoints (`/api/mindspace/supervisor/*`) and verified with clean database state synchronization.

**Data fields:** `listener_id`, `supervisor_id`, `training_status`, `eligibility_status`, `capacity`, `conduct_report_id`, `assignment_id`, `decision`, `decision_reason`, `reviewed_at`.

## Epic 9 — AI governance, safety, and integrations

### US-032 — Restrict agent access to approved tools (Priority: P1)

**Story:** As a privacy/security owner, I want AI agents to use only scoped, typed application tools so that agent behavior cannot bypass domain authorization or directly access databases.

**Acceptance criteria**

- **Given** an agent requests a tool, **when** its service identity or scope is invalid, **then** the call is denied and recorded without exposing data.
- **Given** a tool returns malformed or unsafe output, **when** the output is validated, **then** it is rejected or routed for review and is not presented as verified fact.
- **Given** AI-generated content is produced, **when** it is displayed or shared, **then** it is validated and clearly labeled as AI-generated rather than presented as verified fact.

**Data fields:** `agent_id`, `agent_version`, `tool_id`, `tool_scope`, `execution_id`, `input_schema_version`, `output_schema_version`, `policy_version`, `provenance_id`, `review_state`, `started_at`, `completed_at`.

### US-033 — Operate safety pathways independently of AI (Priority: P1)

**Story:** As a safety operations specialist, I want assigned safety cases, human acknowledgements, and escalation procedures to remain usable when AI services are unavailable so that operational safety does not depend on an agent.

**Acceptance criteria**

- **Given** AI detection or generation is unavailable, **when** a safety case is created or assigned, **then** the approved human workflow and local-resource fallback remain available.
- **Given** a human response has not been acknowledged, **when** its approved timer expires, **then** the workflow escalates according to the staffed operating policy.
- **Given** no responder is staffed, **when** a member sees urgent-help guidance, **then** the interface does not imply monitoring or dispatch.

**Data fields:** `safety_case_id`, `source`, `assigned_to`, `acknowledged_at`, `escalation_policy_version`, `timer_due_at`, `handoff_status`, `resource_id`, `closure_reason`.

### US-034 — Review longitudinal wellbeing information (Priority: P2)

**Story:** As a member, I want to view my own mood entries, check-ins, and wellbeing activities over time so that I can reflect on my self-reported experience.

**Acceptance criteria**

- **Given** the member views a trend, **when** data is displayed, **then** each item is labeled as member-reported or AI-derived.
- **Given** there is insufficient data, **when** a trend is requested, **then** the interface explains that rather than inventing a trend or clinical interpretation.
- **Given** the member chooses to share a wellbeing item, **when** it is shared, **then** only the selected items and recipient are recorded.

**Data fields:** `member_id`, `mood_entry_id`, `checkin_id`, `activity_id`, `value`, `recorded_at`, `source_type`, `sharing_consent_id`, `recipient_id`.

### US-035 — Audit sensitive record access and amendments (Priority: P1)

**Story:** As a privacy officer, I want purpose-bound access and data-change events to be attributable so that sensitive peer and wellbeing records can be reviewed and investigated.

**Acceptance criteria**

- **Given** a sensitive record is read, changed, exported, or shared, **when** the action occurs, **then** actor, role, purpose, resource, outcome, and time are recorded.
- **Given** access is denied, **when** an attempt occurs, **then** the denial is auditable without unnecessarily copying sensitive content into the audit record.
- **Given** a record is amended, **when** history is inspected, **then** prior versions and the amendment reason remain linked.

**Data fields:** `audit_event_id`, `actor_id`, `actor_type`, `role`, `purpose`, `resource_type`, `resource_id`, `action`, `outcome`, `occurred_at`, `correlation_id`, `amends_record_id`.

### US-036 — Publish transactional events safely (Priority: P2)

**Story:** As a system operator, I want domain changes and outbox events to be committed reliably and consumers to handle duplicates so that integrations do not lose or repeat sensitive operations.

**Acceptance criteria**

- **Given** a domain transaction commits, **when** it has an event to publish, **then** the outbox entry is committed atomically with the domain change.
- **Given** a consumer receives an event more than once, **when** it processes the event, **then** it produces at most one business effect.
- **Given** publishing repeatedly fails, **when** retry limits are reached, **then** the event is observable in an operational dead-letter path and is not silently discarded.

**Data fields:** `outbox_event_id`, `aggregate_type`, `aggregate_id`, `event_type`, `event_version`, `occurred_at`, `payload_minimized`, `publish_attempts`, `published_at`, `consumer_id`, `idempotency_key`.

---

## Cross-cutting acceptance requirements

- Authorization is role- and relationship-aware; a user must not gain access by guessing an identifier.
- Member consent is purpose-specific, revocable where applicable, and checked at the time of data access or sharing.
- Peer-support conversations, AI self-help/journal data, and safety cases are classified separately.
- AI-generated material is labeled, versioned, and reviewable; it is not represented as professional advice.
- Sensitive access, consent changes, record sharing, safety escalations, and administrative decisions are auditable.
- Data collection is minimized; retention and deletion follow a documented jurisdiction-specific policy.
- Critical flows provide explicit loading, empty, unavailable, retry, and failure states; they must not display success-shaped fallback content.
- Accessibility, supported languages, and mobile layouts are verified for registration, intake, support conversations, and urgent-help routes.
- Human responders and service availability are represented truthfully; the product must never imply real-time monitoring when none is operating.

## Key domain entities implied by these stories

`app_principals`, `role_assignments`, `member_profiles`, `member_preferences`, `consent_records`, `privacy_requests`, `intake_sessions`, `intake_responses`, `wellbeing_summaries`, `support_recommendations`, `wellbeing_sessions`, `wellbeing_messages`, `journal_entries`, `self_help_content`, `exercise_sessions`, `wellbeing_goals`, `goal_checkins`, `listener_profiles`, `listener_training_records`, `listener_availability`, `listener_match_requests`, `listener_matches`, `peer_conversations`, `peer_messages`, `conduct_reports`, `safety_cases`, `safety_case_actions`, `crisis_resources`, `followups`, `notifications`, `ai_processing_runs`, `audit_events`, `mood_entries`, `wellbeing_reflections`, `wellbeing_activities`, `listener_supervisor_assignments`, `listener_feedback`, `workflow_definitions`, `workflow_executions`, `workflow_steps`, `workflow_tasks`, `workflow_timers`, `workflow_events`, `human_approvals`, `workflow_compensations`, `agent_tool_invocations`, `outbox_events`, and `event_consumer_receipts`.

These are conceptual entities, not a one-to-one prescription for database tables. For example, conversation messages may use a shared storage structure with strong record-class separation, or distinct storage, depending on security and retention design.

## Open decisions before implementation

1. **Launch geography and eligibility:** supported countries/regions, minimum age, and whether minors are supported.
2. **Safety operating model:** staffed hours, human responder ownership, escalation SLAs, local resource verification, and actions when no responder is available.
3. **Peer program governance:** listener screening, training, supervision, capacity, quality review, reporting, and continuity policy.
4. **AI governance:** approved models/providers, data-processing locations, prompt/content review, evaluation thresholds, and whether conversation data may be used for model improvement (default: no).
5. **Privacy/compliance:** consent language, lawful basis, retention and deletion exceptions, breach process, and applicable privacy regulations.
6. **Scope and rollout:** MVP peer-listening and self-guided wellbeing capabilities, languages, and chat/voice availability.

## Suggested delivery order

1. **P1 foundation:** account/profile/consent, private member workspace, compassionate chat and voice intake, editable summary, clear options, privacy boundaries, and location-aware safety resource design.
2. **P1 safety gate:** define jurisdiction and human escalation operations before enabling safety-sensitive AI or member-facing crisis claims.
3. **P2 human support:** listener eligibility and matching, peer conversations, supervision, and conduct review.
4. **P2 continuity:** journaling, exercises, plans, notifications, follow-ups, and member-controlled timeline.
5. **P3 operations:** listener copilot, advanced matching, privacy-preserving analytics, and service optimization.

## Success criteria

- At least 90% of test users can create an account, complete or skip intake, and reach a chosen next-step screen without assistance.
- Members can pause and resume an intake without losing saved answers in at least 99% of tested normal sessions.
- Every test involving an unconsented peer-support share is blocked; every authorized share records its consent basis.
- No test AI conversation presents an automated diagnosis or prescription as clinical advice.
- Every urgent-safety test reaches the approved, location-appropriate response path or clearly states that human response is unavailable.
- A listener cannot accept a match until required approval and training are complete.
- Members can distinguish peer support from AI/self-guided wellbeing in usability tests with at least 90% accuracy.
- All sensitive-record access and safety escalation actions in the test suite produce attributable audit events.
