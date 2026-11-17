# MindSpace — Feature List

## Product concept
MindSpace is an agentic mental wellbeing and care coordination platform. It moves members from acute or chronic emotional distress to appropriate human support and, when needed, professional care. Moving beyond simple passive chat interfaces, MindSpace functions as an active care navigator along a Stepped-Care continuum:

1. **Tier 1: AI-guided self-help** such as reflection, journaling, somatic grounding, and cognitive wellbeing exercises.
2. **Tier 2: Peer emotional support** from trained, verified volunteer listeners.
3. **Tier 3: Professional care navigation** for scheduling, credential validation, and connecting with licensed therapists.
4. **Urgent safety resources** and human-led crisis escalation powered by deterministic safety circuit breakers.

MindSpace does not provide direct medical diagnoses, write prescriptions, or maintain formal hospital EMRs. AI agents coordinate care, facilitate intake, and match resources, but must never impersonate licensed clinicians or independently manage crisis situations. Peer-support, AI self-help, and safety records maintain strict data segregation and purpose-specific retention rules.

## User roles

- **Member:** Seeks emotional wellbeing or mental-health support.
- **Listener:** Provides trained, non-clinical peer support.
- **Listener supervisor:** Oversees listener eligibility, workload, training, and conduct processes.
- **Safety operations specialist:** Handles assigned safety cases and human handoffs.
- **Platform administrator:** Manages platform operations, without default access to sensitive conversation content.
- **AI agent service identity:** A non-human principal limited to authorized typed application tools; no direct database access.

## Scope assumptions

- The initial platform is a responsive web application. Native mobile apps are a future option.
- Peer listening and accessible self-guided wellbeing are the product's core support options; clinical services are out of scope.
- Product references such as 7 Cups describe broad inspiration only; do not copy proprietary branding, text, or workflows.
- Registration and private conversations require authentication.
- Users can skip nonessential intake questions and control sharing.
- Listener support is peer support, not therapy or clinical treatment.
- Geographic availability, age eligibility, legal obligations, data retention, and crisis operations must be decided before launch.
- Do not advertise 24/7 human support, emergency dispatch, or clinical services/compliance.
- Features below define a new, standalone MindSpace product and data model. Intake and all other features are implemented for MindSpace; no other project's code, accounts, or data are assumed.
- The target data domains are Peer Support and Wellbeing. Safety, identity/access, workflow orchestration, AI orchestration, and eventing are cross-cutting capabilities.
- The proposed SDD recommends a process-oriented modular monolith with durable Temporal workflows, Redis, typed application tools, and a transactional outbox; this is a target design, not proof that those components are currently implemented.
- “MVP” means a proposed first release. Safety-sensitive features must not launch until their operational controls are approved.

## Priority legend

- **MVP / Version 1:** Required for a safe, useful initial member experience.
- **Version 2:** Enhancements that can follow once core workflows and operations are proven.

---

## 1. Authentication, roles, and account lifecycle

### MVP / Version 1

- Member registration, sign-in, sign-out, and account recovery.
- Role-aware access for members, listeners, safety responders, and administrators.
- Email verification and secure session management.
- Basic profile setup with optional language, timezone, accessibility, and communication preferences.
- Eligibility checks based on approved launch-age and jurisdiction policies.
- Clear consent to terms, privacy notices, and feature-specific data processing.
- Account deactivation and request routes for data export or deletion.

### Version 2

- Additional identity providers or passkeys.
- Multi-factor authentication for privileged roles.
- Optional organizational listener-program administration.
- Self-service account history and security-session management.

### Edge cases to consider

- Duplicate email, unverified email, expired recovery link, repeated recovery requests.
- Disabled, suspended, deleted, or partially onboarded account attempts to sign in.
- A user has more than one role; prevent unintended access between role workspaces.
- Eligibility cannot be established or is outside the configured service region.
- User loses access to their email or authentication provider.
- Session expires during intake or while sending a message; preserve safe unsent work where appropriate.

---

## 2. Member onboarding, preferences, and consent

### MVP / Version 1

- Explain MindSpace's peer-support and AI/self-guided options and clarify that MindSpace does not provide clinical care.
- Collect only necessary profile and support preferences.
- Obtain purpose-specific consent before recording, transcribing, analyzing, or sharing sensitive information.
- Let members review, edit, decline, or withdraw optional sharing consent.
- Show understandable data-use notices at the point where information is collected or shared.

### Version 2

- Granular consent for selected data categories, providers, and time periods.
- Accessibility preference profiles and expanded language support.
- Consent renewal and reminders when policies materially change.
- Member-managed trusted contacts where permitted by policy.

### Edge cases to consider

- Member declines optional consent but wants to continue with a reduced feature set.
- Consent is withdrawn while a conversation or information-sharing action is in progress.
- A policy version changes after consent was granted.
- User cannot understand a consent notice in their preferred language.
- A user requests deletion but some records must be retained for legal or safety reasons.

---

## 3. Mental-wellbeing intake and support planning

### MVP / Version 1

- Compassionate chat-based intake with optional questions and a clear AI identity.
- Voice intake only where speech recognition and consent behavior are verified.
- Capture member-reported concerns, emotions, duration, context, goals, and support preferences.
- Let members skip questions, pause, resume, correct, or restart intake.
- Generate an editable, clearly labeled, non-diagnostic wellbeing summary.
- Present available next steps without implying that a recommendation is a diagnosis or guaranteed service.
- Ask for permission before sharing intake or a summary with a listener.

### Version 2

- Adaptive follow-up questions based on member responses and stated goals.
- Intake in additional languages and accessible formats.
- Optional trend summaries over multiple member-approved check-ins.
- Add specialized intake paths only after safety and content review.

### Edge cases to consider

- Member expresses immediate danger during intake.
- AI or transcription service is unavailable, times out, or returns malformed output.
- Network disconnects mid-message or voice recording.
- Speech transcription is inaccurate or the member corrects it.
- Intake contains unanswered fields; do not treat blank as “no.”
- Summary invents or misstates details; make source attribution and correction possible.
- Member wants support but does not want to provide a detailed intake.

---

## 4. AI wellbeing companion and self-help

### MVP / Version 1

- Clearly identified AI-guided reflective conversation.
- Grounded, supportive language that avoids diagnosis, prescriptions, or claims of human identity.
- Basic conversation history controls, including start, end, and delete according to retention rules.
- Clear route to human support and urgent local resources where appropriate.
- Explain when the AI service is unavailable; do not provide simulated success responses.

### Version 2

- Guided journaling and reflection prompts.
- Reviewed self-help exercises and psychoeducational content.
- Member-controlled goals, check-ins, and progress summaries.
- Personalized content suggestions based on explicit preferences and consent.

### Edge cases to consider

- AI response conflicts with safety rules or asks for unnecessary sensitive information.
- AI is mistaken for a human listener or a source of licensed clinical care.
- Member asks for diagnosis, medication, or emergency help.
- Provider outage, rate limit, unsafe output, or latency timeout.
- Journal or conversation data is accidentally included in another feature without consent.
- Content is unavailable in the user’s language or may not be suitable for the user.

---

## 5. Peer listener discovery, matching, and conversations

### MVP / Version 1

- Explain listener eligibility, training, boundaries, and non-clinical role.
- Allow eligible members to request peer support and set optional matching preferences.
- Match only with approved, trained, active, available listeners who have capacity.
- Show when no listener is available and offer a wait, retry, or alternative support option.
- Support private text conversations with consent-aware access controls.
- Let members end a conversation, request a different listener, or submit a report.
- Share only member-approved intake context with a matched listener.

### Version 2

- Voice conversations and continuity with a previous listener.
- Listener profiles with verified languages and approved, non-sensitive experience tags.
- Member feedback and listener quality review processes.
- Listener-side copilot suggestions, clearly labeled and reviewed before sending.
- Expanded scheduling and availability options.

### Edge cases to consider

- No eligible listener matches language, preference, or availability constraints.
- Listener becomes unavailable after being matched.
- Either party disconnects or sends a message during a service outage.
- Member blocks or reports a listener; prevent unwanted rematching.
- Listener exceeds capacity, misses training renewal, or has a conduct concern.
- A peer conversation raises a concern that requires an appropriate safety resource.
- Messages are delivered late or out of order; provide reliable delivery status.

---

## 6. Safety, crisis resources, and human escalation

### MVP / Version 1

- A reviewed safety policy that applies to chat, voice, peer, and professional workflows.
- Clear statements about whether interactions are monitored and the service’s operating hours.
- Location-appropriate urgent-help resources with source and last-verification metadata.
- A human escalation workflow only where trained responders, ownership, hours, and response procedures are operational.
- Minimal, role-restricted safety case records with audit trails.
- Member-facing fallbacks that do not imply help has been dispatched or a person is monitoring when that is not true.

### Version 2

- Responder queue, assignment, handoff, and closure tooling.
- Jurisdiction-specific escalation protocols and service directories.
- Operational dashboards for response time and unresolved cases, with privacy safeguards.
- Post-escalation follow-up where the service is staffed and authorized to provide it.

### Edge cases to consider

- Urgent signal is detected but no human responder is available.
- User’s location is unknown, incorrect, or changes.
- Local hotline or resource is unavailable, out of date, or not suitable for the user.
- Signal is ambiguous or a safety classifier returns an error.
- Member refuses escalation, loses connection, or is unable to continue the conversation.
- Responder assignment fails or a case is transferred without acknowledgment.
- Avoid promising emergency dispatch, response times, or 24/7 monitoring unless guaranteed operationally.

---

## 7. Member dashboard, history, and follow-up

### MVP / Version 1

- Member home dashboard with clear actions to continue intake or choose support.
- Current peer-support requests and wellbeing activities.
- Member-visible summaries and records, labeled by source and status.
- Empty states that explain how to begin; no fabricated sample records in live accounts.
- Member-controlled visibility and sharing of eligible information.

### Version 2

- Private journal, wellbeing activities, member-selected goals, and personal timeline.
- Optional reminders for goals and wellbeing check-ins.
- Progress visualizations based on member-reported information.
- Cross-device preferences and notification settings.

### Edge cases to consider

- Dashboard cannot load wellbeing records because a downstream service is unavailable.
- A member sees stale, duplicated, deleted, or incorrectly attributed information.
- Reminder arrives during quiet hours or after cancellation.
- Member shares one item but does not intend to share the rest of their history.
- Time-zone changes alter reminder display.
- User deletes an item that appears in a timeline or summary.

---

## 8. Listener workspace and operations

### MVP / Version 1 (Implemented & Verified)

- Listener application and administrative approval process.
- Required training and eligibility status visible to authorized operations staff.
- Availability, capacity limit (Max 3 concurrent), and time-away settings persisted to PostgreSQL (`PUT /peer/listeners/me`).
- Listener queue showing only assigned or eligible support requests (`Consultations & Live Queue`).
- Real-time active listening room with member intake context and non-clinical AI copilot suggestions.
- Complete Peer Consultation Call Workflow: Pre-call media check & ringing handshake, live audio/video with somatic 4-7-8 breathwork pacer & in-call text chat, structured in-call SOAP note drafting with quick-tags, post-session wellbeing reflection (mood rating & encrypted journal sync), and mandatory 60s volunteer cooldown decompression (US-015).
- Post-session confidential SOAP documentation (`[SOAP RECORD]`) encrypted in Python memory with AES-256-GCM before database write.
- Conversation boundaries, report/escalation controls, and crisis helpline directories.
- Suspend matching when approval or required training is missing or expired.
- Clinical supervisor oversight: Pod roster eligibility toggles, conduct & boundary audit resolution, and CEU module signoffs (`US-031`, `US-018`).

### Version 2

- Advanced automated empathy scoring across multi-session voice recordings.
- Expanded multi-organization pod hierarchy and multi-tenant B2B enterprise pods.
- De-identified aggregate service-quality reports and peer listener CEU renewal automation.

### Edge cases to consider

- Listener tries to accept a request while suspended, offline, or over capacity.
- Training expires during an active conversation.
- Member report is about a listener with privileged access to the report system.
- Listener requests leave while matched or mid-conversation.
- Listener has conflicting availability rules or time zones.

---

## 9. Administration, content, and audit

### MVP / Version 1

- Role-restricted member, listener, and safety-operations administration.
- Provider credential verification and listener approval with recorded decisions.
- Management of approved self-help content and local safety resources.
- Audit events for sensitive data access, consent changes, sharing, and administrative actions.
- Policy and content version history, reviewer, approval date, and expiry.
- Basic operational error visibility without exposing unnecessary sensitive content.

### Version 2

- Privacy-preserving metrics for intake completion, availability, wait times, and service quality.
- Content review reminders, localization workflows, and policy rollout controls.
- More advanced fraud, abuse, and access-anomaly monitoring.
- De-identified service analytics and administrative exports.

### Edge cases to consider

- Administrator attempts an action outside their role or assigned organization.
- Policy/content update is partially published or rolled back.
- Small-cohort analytics could identify an individual.
- Audit event write fails during a sensitive operation.
- Deleted user is still referenced by an active conversation or safety case.
- Emergency access is used; require a recorded justification and subsequent review.

---

## 10. Notifications and communication preferences

### MVP / Version 1

- Appointment and support-request confirmations.
- Member-selected communication channel where supported.
- Notification preference and quiet-hour controls.
- Non-sensitive notification content by default; avoid exposing wellbeing details on lock screens or shared email accounts.
- Delivery, failure, and retry status for critical transactional notices.

### Version 2

- Goal reminders, follow-up check-ins, and listener availability notices.
- Push notifications if native mobile clients are introduced.
- More granular preferences by event type and channel.

### Edge cases to consider

- Duplicate, delayed, bounced, or out-of-order notifications.
- Member changes email, phone, timezone, quiet hours, or consent.
- Sensitive subject or preview text exposes private details.
- Appointment is cancelled after a reminder was queued.
- Notification provider outage or user opted out of a channel.

---

## 11. Accessibility, localization, and platform reliability

### MVP / Version 1

- Responsive layouts for common phone, tablet, and desktop sizes.
- Keyboard navigation, screen-reader labels, readable contrast, and clear focus indicators.
- Plain-language safety and consent copy.
- Language and timezone-aware date/time display.
- Explicit loading, empty, retry, unavailable, and error states across critical journeys.
- Protect unsent text or clearly indicate when it could not be saved.

### Version 2

- Expanded interface and support languages.
- Additional accessibility preferences and assistive-input support.
- Offline-friendly reading of previously loaded non-sensitive content where safe.
- Native mobile apps and platform-specific accessibility features.

### Edge cases to consider

- Slow or intermittent connectivity during chat, intake, or listener matching.
- Unsupported browser or device permission for microphone/video.
- Right-to-left language layout or translated copy exceeding component limits.
- Screen reader cannot announce a new message or safety instruction.
- User changes locale/timezone during a multi-step workflow.
- Recovery or error screen breaks keyboard access or hides a critical action.

---

## 12. Durable business workflows and human tasks

### MVP / Version 1

- Durable, versioned processes for member onboarding, intake, and approved safety handoffs.
- Explicit workflow state, owner, timestamps, timers, retries, and visible failure outcomes.
- Human task queues for approvals and safety operations, with assignment, acknowledgment, escalation, and closure.
- Idempotent handling of repeated requests and events; compensating actions for partially completed bookings or handoffs.

### Version 2

- Durable workflows for intake, listener matching, human safety tasks, and member-requested follow-ups.
- Workflow replay/version controls, operational dashboards, and recovery tooling.

### Edge cases to consider

- Workflow engine, event bus, or database is unavailable while a process is active.
- A task expires, is assigned twice, or is completed by a stale worker.
- External side effect succeeds but acknowledgment is lost; retries must not duplicate it.
- A workflow version changes while existing cases are still running.
- Human approval is withdrawn or the approver no longer has the required role.

## 13. Agentic Care Coordination, Stepped-Care Navigation, and MCP Toolsets

### MVP / Version 1

- **LangGraph StateGraph Execution Runtime:** Stateful multi-turn agent execution loops with token budgeting, context compression, and loop detection.
- **Stepped-Care Triage & Pathway Assignment:** Intake agent administers conversational screeners (PHQ-9/GAD-7 non-diagnostic proxies) and dynamically assigns Tier 1 (Self-Help), Tier 2 (Peer Listener), or Tier 3 (Professional Care).
- **Model Context Protocol (MCP) Integration:** Agents interact with backend services exclusively through authenticated, typed MCP tool servers exposed by the **Python FastAPI** backend (`backend/mindspace-fastapi`):
  - `Intake MCP`: `record_intake_response`, `calculate_triage_score`, `update_care_tier`
  - `Listener MCP`: `query_available_listeners`, `request_listener_match`, `poll_assignment_status`
  - `Scheduling MCP`: `query_provider_availability`, `reserve_session_slot`, `dispatch_booking_confirmation`
  - `Safety MCP`: `trigger_crisis_escalation`, `fetch_local_hotlines`, `create_safety_incident_case`
- **Zero Direct Database Access:** Agents have no direct PostgreSQL or SQL credentials; all data interactions pass through validated application tool gateways.
- **Deterministic Safety Sentinel:** Non-LLM regex and lexical circuit breakers that intercept self-harm, suicidal ideation, and acute distress before model inference, disengaging conversational AI and triggering emergency protocols.
- **Explainable Care Plans:** Clear, human-readable explanations of why a specific care tier was recommended, with member authority to override or adjust preferences.

### Version 2

- **Asynchronous Session Checkpointing & Resumability:** When requesting a human peer listener, the agent workflow serializes its execution state, suspends execution, and safely rehydrates upon the human listener's acceptance event.
- **Autonomous Longitudinal Follow-ups:** Automated, consent-driven check-ins scheduled at 24h, 72h, and 7-day intervals to assess recovery trajectory and adjust care tiers.
- **Multi-Agent Collaborative Routing:** Specialized subagents (Intake, Pathway, Companion, Matching, Care Coordination, Follow-up) executing with scoped roles and explicit handoff protocols.
- **Offline Evaluation Harness & Golden Datasets:** Continuous regression testing for empathy scoring, safety classification accuracy, and prompt leakage prevention.

### Edge cases to consider

- Prompt injection attempts, jailbreaks, or prompt extraction during open conversational intake.
- Human listener pool exhaustion or prolonged acceptance latency; agent must provide self-guided stabilization while queueing.
- Conflicting signals between conversational tone and questionnaire responses.
- Asynchronous rehydration race conditions if member initiates another interaction while a match is pending.
- External MCP tool timeouts or network partitions; fail gracefully with transparent fallback messages.

## 14. Versioned API, eventing, and integration

### MVP / Version 1

- Versioned REST/JSON API under `/api/v1` implemented in **Python (FastAPI)** with interactive OpenAPI / Swagger UI (`/docs`), ReDoc (`/redoc`), and Pydantic runtime schema validation.
- Authentication, object- and relationship-aware authorization, rate limits, pagination, correlation IDs, and safe generic error responses.
- Idempotency keys for retryable state-changing requests.
- Transactional outbox, idempotent consumers, bounded retries, and observable dead-letter handling.
- Event payloads minimize sensitive data; conversation text and private journal content are not copied into events.

### Version 2

- Governed event-driven notifications and privacy-preserving analytics consumers.
- Operational dashboards for retries, dead letters, and integration drift.

### Edge cases to consider

- Event publication fails after a database transaction or is delivered more than once.
- Client retries after a timeout but the first request succeeded.
- API contract or event version changes while old consumers remain active.
- Error, trace, or event payload accidentally includes sensitive member data.

---

## Cross-module product guardrails

- **Privacy by default:** Collect the minimum data needed and make sharing opt-in where appropriate.
- **Separate record classes:** Peer-support, AI self-help, and safety data must have explicit access and retention rules.
- **Human accountability:** AI-generated content is advisory; members control whether wellbeing summaries are retained or shared.
- **Honest service claims:** Do not imply licensed care, listener availability, emergency monitoring, regulatory compliance, or encryption properties that have not been verified.
- **Fail explicitly:** A downstream outage must be visible to the user; never show invented success data.
- **Safe access control:** Enforce permissions on every read and write, not only in the interface.
- **Auditable sensitive actions:** Log consent, sharing, sensitive access, safety escalation, and privileged administration.
- **Workflow integrity:** Long-running processes are versioned, replayable where supported, observable, and safe under retries; human approval cannot be replaced by an AI result.
- **Accessible core journey:** Registration, intake, support selection, messaging, and urgent-help content must be keyboard and screen-reader usable.

## Suggested MVP boundary

The first release should prioritize account and consent foundations, a private member dashboard, transparent chat intake, an editable non-diagnostic summary, and safe support choices. Listener matching, voice processing, or human safety escalation must be gated on the relevant staffing, consent, data-governance, and jurisdictional decisions.

## Decisions to finalize before database design

1. Launch geography, age eligibility, language support, and whether minors are in scope.
2. Which support levels are in the first release and which are later phases.
3. Whether listener support is staffed, its training and supervision requirements, and availability model.
4. Human safety response ownership, hours, response expectations, and no-responder fallback.
5. Listener screening, training, supervision, capacity, and boundaries.
6. Consent model, data retention/deletion, AI-provider data handling, and use of data for model improvement (default: do not use without explicit approval).
7. Which peer-listening and self-guided wellbeing capabilities should be in the first MindSpace release, and which should follow later.


