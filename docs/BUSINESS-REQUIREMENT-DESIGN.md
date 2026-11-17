# MindSpace — Business Requirements Document


## 1. Executive summary

MindSpace is a peer-support-centered emotional-wellbeing platform. Inspired by the general listener-support journey offered by services such as 7 Cups, it helps people find a suitable next step through a stepped-support experience:

1. **Peer emotional support** from trained volunteer listeners.
2. **AI-guided self-help** for reflection, journaling, and reviewed wellbeing exercises.
3. **Safety resources** and human-led escalation only where operations are explicitly staffed.

MindSpace does not provide licensed clinical care or maintain clinical records. AI may support reflection and navigation, but it is not a diagnostician, prescriber, emergency dispatcher, or substitute for human safety operations. The 7 Cups reference is broad product inspiration only; MindSpace uses its own content, branding, code, workflows, and data.

This BRD describes the target product and business rules. It does **not** assert that all capabilities are implemented or that MindSpace is currently licensed, staffed, or compliant in any particular jurisdiction.

## 2. Business context and problem

People seeking emotional support may not know whether to start with a conversation, a self-guided resource, or peer support. A fragmented journey can make it harder to find a suitable option and continue it over time.

MindSpace aims to:

- Offer a compassionate, understandable starting point.
- Let members choose how much to share and which support route to take.
- Connect peer support and self-guided wellbeing without confusing their purpose or boundaries.
- Keep personal wellbeing information under clear privacy and consent controls.
- Provide safe and truthful routes to human help when urgent concerns arise.

### Business outcomes sought

- More members successfully reach a support option appropriate to their choice and eligibility.
- Reduced friction from account creation to first useful support interaction.
- Reliable and trusted listener operations, if those services are launched.
- Improved continuity through member-controlled wellbeing follow-up.
- Sustainable operations without overstating service availability, clinical outcomes, or compliance.

## 3. Product objectives and non-objectives

### Objectives

- Provide a responsive web experience for members and role-specific workspaces for approved operators.
- Establish explicit boundaries between AI self-help and non-clinical peer support.
- Make consent, data sharing, and account controls understandable and actionable.
- Introduce stepped support gradually, gated by readiness of staffing, governance, and jurisdictional operations.
- Track measurable service quality, safety, access, and sustainability outcomes.

### Non-objectives for the initial business definition

- Licensed professional care, clinical assessment, diagnosis, treatment, prescriptions, or clinical records.
- Guaranteed emergency dispatch, continuous monitoring, or 24/7 human response unless separately contracted and staffed.
- Claiming clinical effectiveness, regulatory certification, HIPAA compliance, or other attestations without independent substantiation.
- Defining the implementation stack, API design, database schema, vendors, or hosting model.
- Reproducing another company’s protected branding, content, or proprietary workflows.

## 4. Stakeholders and decision owners

| Stakeholder | Business responsibility |
|---|---|
| Product owner | Product scope, roadmap, prioritization, and acceptance of business outcomes |
| Safety/content lead | Peer-support boundaries, safety policy, escalation process, and content review |
| Privacy/legal lead | Jurisdiction assessment, consent, privacy notices, retention, contracts, and regulatory interpretation |
| Listener program owner | Volunteer eligibility, training, supervision, capacity, and conduct process |
| Security/data owner | Access governance, incident response, data classification, retention, and audit review |
| Support operations | Member support, service issues, complaints, and escalation coordination |
| Finance/business lead | Pricing, funding, and financial sustainability |

Final approval authorities and named individuals are **to be assigned**.

## 5. User personas and business permissions

Permissions below are business-level boundaries. Technical authorization must enforce them for every relevant operation.

### 5.1 Member

**Needs:** A private and understandable way to seek support and control what is shared.

**May:**

- Manage their own account, profile, preferences, and consent.
- Start, pause, resume, correct, or delete eligible intake and self-help records according to policy.
- Select from available peer and self-guided support options.
- View their own member-visible history and share selected information when permitted.
- Report a concern, request account/data support, and withdraw optional consent.

**May not:**

- View another member’s private data.
- Treat AI or volunteer listener content as licensed clinical advice.
- Alter audit history; correction and deletion requests follow an auditable process.

### 5.2 Volunteer listener

**Needs:** A bounded, supported way to provide empathetic peer conversation.

**May:**

- Manage availability and capacity.
- Accept only eligible, assigned conversations.
- View only member information explicitly shared for that conversation.
- End or report a conversation and use an approved safety escalation path.

**May not:**

- Present themselves as a licensed therapist or claim to provide clinical treatment.
- Diagnose, prescribe, promise confidentiality beyond the published policy, or access unrelated member records.
- Export, repurpose, or retain member information outside approved procedures.

### 5.3 Safety responder

**Needs:** Minimum necessary information and clear ownership to handle assigned safety cases.

**May:**

- Access safety cases assigned to them, take approved actions, and document handoffs and resolution.
- Use approved emergency-resource and escalation procedures for the relevant jurisdiction.

**May not:**

- Browse unrelated member records or imply that emergency services were contacted unless confirmed.
- Access peer-support information beyond the minimum necessary for assigned action.

### 5.4 Administrator

**Needs:** Operational control without unrestricted access to sensitive conversations.

**May:**

- Manage role eligibility, listener training status, content, and service configuration.
- Review operational metrics and audit events for legitimate purposes.
- Investigate reports or incidents according to documented procedures.

**May not:**

- Read private conversations by default.
- Grant themselves or others access without an approved role and recorded reason.
- Publish unreviewed safety content or make unsubstantiated service/compliance claims.

### 5.5 Other operational roles and boundaries

The system separates operational roles so that access is limited to a defined responsibility:

| Role | Business scope |
|---|---|
| Listener supervisor | Review listener eligibility, workload, training, conduct reports, and escalations; access is limited to supervision duties. |
| Safety operations specialist | Own assigned safety cases and human handoffs under approved procedures; this is independent of AI availability. |
| Platform administrator | Manage technical/platform configuration; no default access to conversation content. |
| AI agent service identity | A non-human principal permitted to invoke specific typed application tools; never a direct database user or safety operator. |

Roles are not interchangeable. Access is determined by role, assignment, purpose, consent, and record class. Emergency or elevated access requires a policy-defined reason, audit record, and review.

## 6. Core business rules

The following are proposed baseline rules. Items requiring jurisdictional, safety, or operational approval are marked **Decision required**.

### 6.1 Eligibility and account lifecycle

- **BR-001:** Each account has an explicit lifecycle status: pending verification, active, suspended, closed, or deletion-pending.
- **BR-002:** Registration is limited to the approved launch regions and age groups. **Decision required:** supported locations and minimum age.
- **BR-003:** A user must authenticate before accessing private conversations, intake history, or personal records.
- **BR-004:** Role activation requires the applicable approval process; self-selection alone does not grant listener, responder, or administrator authority.
- **BR-005:** Account recovery must verify control of the registered account channel and use expiring, single-use recovery mechanisms.

### 6.2 Intake and AI assistance

- **BR-006:** Intake is supportive and conversational; nonessential questions may be skipped, declined, or answered later.
- **BR-007:** Member-reported information and AI-generated interpretation must be distinguishable.
- **BR-008:** An AI-generated summary is a draft, non-diagnostic aid. The member can review and correct it before it is shared.
- **BR-009:** AI must not diagnose, prescribe, claim to be human or licensed, or make decisions on behalf of the member.
- **BR-010:** AI must not claim that a person is monitoring a conversation or that emergency help has been dispatched unless the relevant operational action is confirmed.
- **BR-011:** AI providers may not use identifiable member content to train or improve general models without a separately approved lawful basis and explicit policy. Proposed default: no secondary training use.
- **BR-012:** If an AI, transcription, or network dependency fails, the product must disclose the failure and offer a retry, save, or alternate route where safe; it must not fabricate a successful interaction.

### 6.3 Consent, data sharing, and privacy

- **BR-013:** Consent is purpose-specific and recorded with the applicable policy/version and time.
- **BR-014:** Sharing intake, journal, or AI self-help information with a listener or other recipient requires the applicable authorization and must be limited to the selected information and recipient.
- **BR-015:** Withdrawing optional consent stops future processing/sharing where applicable; previously completed disclosures and legally retained records are handled under the approved policy.
- **BR-016:** Private peer conversations, AI self-help data, and safety cases are distinct business record classes with separate access, retention, and disclosure rules.
- **BR-017:** Collect only the minimum information needed for the selected service.
- **BR-018:** Members may submit export, correction, and deletion requests. Fulfillment, exceptions, and timelines must follow jurisdiction-specific policy.
- **BR-019:** Use of sensitive data for analytics must be aggregated or de-identified wherever individual-level data is unnecessary.

### 6.4 Peer listener operations

- **BR-020:** A listener may accept a match only when their identity, required training, approval, active status, and capacity are valid.
- **BR-021:** Peer listeners provide non-clinical emotional support and must disclose their role and boundaries.
- **BR-022:** Matching may use only approved attributes and member preferences; sensitive characteristics must not be inferred or used without a lawful, approved purpose.
- **BR-023:** Members may decline a match, request another listener, or report a concern without losing access to other available support routes.
- **BR-024:** No match is guaranteed. Availability and wait expectations must be represented truthfully.
- **BR-025:** Listener access is limited to assigned conversations and information the member has authorized for that context.

### 6.5 Safety and crisis handling

- **BR-026:** Safety policy applies across member-AI, listener, and voice interactions.
- **BR-027:** Human escalation is offered as staffed only if a trained response team, ownership, hours, and operating procedures are established.
- **BR-028:** Crisis resources must be appropriate to the member’s location, have a source and verification date, and avoid claims of guaranteed availability.
- **BR-029:** When location or responder availability is unknown, the product must disclose that limitation and provide a safe, approved fallback.
- **BR-030:** Safety cases are assigned, documented, and closed by authorized personnel under an approved process; access is logged.
- **BR-031:** The precise safety policy, escalation threshold, service level, and applicable duty-of-care obligations require safety and legal review before launch.

### 6.6 Content, notifications, and service operations

- **BR-032:** Self-help and safety content must have an owner, reviewer, version, effective date, and review/expiry process.
- **BR-033:** Notifications use the member’s permitted channels and preferences; sensitive wellbeing details are excluded from previews by default.
- **BR-034:** Reminder behavior respects the member’s timezone, quiet hours, opt-outs, and current support status.
- **BR-035:** Member-facing status and dashboards show actual service state. Placeholder, demo, or stale data must not be represented as real activity.
- **BR-036:** Sensitive access, consent changes, record sharing, safety actions, listener eligibility decisions, and privileged administration produce attributable audit records.
- **BR-037:** Administrators and support personnel access sensitive records only for an authorized, recorded operational purpose.
- **BR-038:** Peer Support, Wellbeing, and Safety are distinct data domains with explicit access and retention rules. A record is not copied into another domain without a valid purpose and authorization.
- **BR-039:** AI agents access data only through typed, authorized application tools. They have no direct database credentials and cannot perform human safety actions.
- **BR-040:** Member-reported check-ins and AI summaries are not diagnoses or treatment recommendations.
- **BR-041:** Long-running business processes must have an identifiable owner, state, version, history, timeout/escalation rules, and auditable human approvals where required.
- **BR-042:** Events contain only the minimum data needed for processing; consumers must be idempotent and failures/retries must be observable.

## 7. Business workflows

### 7.1 Member-to-support journey

1. Member reviews product boundaries and creates an account.
2. Member sets preferences and reviews relevant consents.
3. Member chooses chat or voice intake and may skip or pause optional questions.
4. Member reviews and corrects a non-diagnostic support summary.
5. MindSpace shows eligible options: peer support, self-guided resources, and appropriate local safety resources.
6. Member selects peer support or self-guided wellbeing and consents to any required information sharing.
7. Member uses the selected service and can view the status and next steps.
8. A safety concern, if present, follows the approved safety policy; no unstaffed capability is implied.

### 7.2 Listener lifecycle

1. Applicant submits required details and acknowledgements.
2. Program staff review eligibility and required training.
3. Approved listener sets availability, capacity, and pause preferences.
4. Matching considers eligible listeners and permitted member preferences.
5. Listener accepts an assigned conversation and sees only authorized context.
6. Conversation ends, is reported, or is escalated under the applicable policy.
7. Program staff review training renewals, conduct reports, and capacity.

### 7.3 SDD durable processes

The proposed system defines versioned workflows for onboarding, intake, AI wellbeing, listener matching and sessions, safety handoffs, and member-requested follow-up. These are process families, not a promise that every process is enabled in the MVP. Each must define entry/exit conditions, consent checks, human-task ownership, timers, retry/compensation behavior, and a safe failure path before launch.

## 8. Monetization and business model

**Current status:** Not specified. No pricing or transaction rule should be assumed in implementation.

Potential models for validation:

- **Free member access with sponsored or grant-funded operations.**
- **Subscription for optional self-help tools or premium member features.**
- **Employer, school, insurer, or organization-funded access.**
- **Organization-funded access**, subject to a separately approved business model.

### Monetization guardrails

- Do not sell identifiable wellbeing or conversation data.
- Do not target advertising using sensitive mental-health inferences.
- Disclose price, recurring billing, cancellation, refund, and payer responsibility before purchase.
- Keep access to urgent safety information independent of a paid upgrade.
- Avoid incentives that undermine member safety, privacy, or informed choice.
- **Decision required:** Which model(s), countries, currencies, taxes, payment provider, refund policy, and financial record-retention rules apply?

## 9. Security, privacy, and regulatory requirements

This section defines business obligations, not legal advice or a certification claim. Applicability depends on launch geography, service model, data flows, and contractual relationships.

### Business requirements

- Complete a jurisdiction-specific privacy, healthcare, telehealth, consumer-protection, and safeguarding assessment before public launch.
- Document data categories, purposes, recipients, processors, locations, retention periods, deletion behavior, and legal bases.
- Publish understandable privacy notices and obtain valid consent where required.
- Establish procedures for access, correction, export, deletion, complaints, and data incidents.
- Restrict sensitive data by role, support relationship, purpose, and minimum-necessary access.
- Maintain an incident response process covering detection, containment, investigation, notification, and remediation.
- Assess all AI, voice, analytics, communications, and hosting suppliers for sensitive-data handling and contractual suitability.
- Review age/guardian requirements and safeguarding duties before serving minors.
- Ensure crisis resources and escalation procedures are locally appropriate and operationally tested.
- Ensure accessibility and non-discrimination are considered in service design and outcome monitoring.

### Jurisdictional examples to assess, not presumed requirements

- If operating in the United States, assess applicable federal/state privacy and consumer-health-data requirements; do not assume HIPAA applies or that compliance is achieved.
- If operating in India, assess the Digital Personal Data Protection framework and rules in force at launch, consumer protection, and any other applicable privacy and safeguarding obligations.
- If operating in the European Economic Area or United Kingdom, assess applicable GDPR/UK GDPR and special-category data requirements.
- Assess cross-border transfer and data-residency obligations for every launch market.

### Minimum security/business controls

- Role- and relationship-based access approval and periodic access review.
- Secure authentication and stronger authentication for privileged roles.
- Encryption requirements for transmission and storage, selected and verified by security owners.
- Auditability for access and changes to sensitive records.
- Documented backup, recovery, continuity, and breach-response plans.
- Vendor due diligence, data-processing agreements, and subprocessor transparency as required.
- Separate test/demo data from real member information; never use real sensitive data in sample accounts.

## 10. Success metrics and KPIs

Metrics must be defined with clear numerator, denominator, reporting period, owner, and privacy threshold. Do not claim clinical improvement or guaranteed crisis resolution.

### Acquisition and onboarding

- **Eligible registration completion:** completed eligible registrations ÷ registration starts.
- **Time to first useful action:** median time from registration to first completed intake or selected support action.
- **Consent comprehension:** share of sampled members who correctly understand what data is shared and with whom.
- **Onboarding abandonment:** share of users who leave before reaching a useful next step.

### Support access and experience

- **Support option selection rate:** members who select an available next step ÷ members shown options.
- **Intake completion / pause-resume rate:** completion and successful resume rates, reported separately.
- **Listener wait time and match rate:** median wait and successful match share, only when listener service is operational.
- **Member satisfaction:** post-interaction satisfaction by support level, with response rate reported.
- **Accessibility task success:** completion rate for critical flows using supported assistive technologies.

### Safety and quality

- **Safety-path test pass rate:** share of approved test scenarios reaching the expected safe outcome.
- **Escalation acknowledgment time:** time from case creation to human acknowledgment when staffed.
- **Unresolved safety cases:** open cases beyond the approved operating threshold.
- **AI boundary violations:** verified instances of diagnosis, prescription, misrepresentation, or unsafe output per reviewed interaction sample.
- **Consent enforcement failures:** unauthorized shares or processing events; target is zero.
- **Listener readiness:** share of active listeners meeting current approval and training requirements.

### Continuity and operations

- **Return engagement:** members returning to a chosen support or follow-up activity within a defined interval.
- **Peer-support continuity:** member-selected return or follow-up rates, reported with privacy safeguards.
- **Conversation delivery reliability:** successful message delivery and recovery after interruption.
- **Service availability and incident recovery:** tracked against business-approved service levels.
- **Complaint and report resolution time:** median time from report to documented resolution.

### Financial sustainability (after model selection)

- Revenue, recurring revenue, gross margin, acquisition cost, retention, refund rate, and payment failure rate as applicable.
- Revenue must not be optimized at the expense of safety, privacy, informed choice, or appropriate care.

## 11. Risks, dependencies, and mitigations

| Risk / dependency | Business impact | Proposed mitigation / gate |
|---|---|---|
| Unclear launch geography and age policy | Legal, safeguarding, and operational exposure | Select launch markets and eligibility before onboarding is enabled |
| Human crisis response not staffed | Users may rely on a response that will not occur | Do not imply monitoring; validate local resources and fallback copy |
| Listener program lacks supervision or training | Harm, misconduct, and loss of trust | Define screening, training, capacity, reporting, and supervision before matching |
| AI provides clinical or unsafe advice | Member harm and regulatory exposure | Policy review, evaluation, monitoring, human escalation, and launch gate |
| Peer, wellbeing, and safety records are mixed | Unauthorized disclosure and governance failure | Approve separate record classes, permissions, and retention rules |
| Monetization is undefined | Scope churn and payment rework | Select a business model before payment and billing requirements are designed |
| Unsubstantiated compliance/clinical claims | Trust and legal risk | Require evidence and authorized review for all public claims |

## 12. Assumptions, exclusions, and open decisions

### Assumptions

- Initial platform is web-first and responsive.
- Members have agency to select among available options.
- AI is supportive and assistive, not the decision-maker for care.
- The proposed architecture is a technical baseline for review, not a launch authorization.
- Peer support is volunteer-led and non-clinical; AI/self-help is not clinical care.
- Monetization has not been selected.
- MindSpace is a standalone project with its own code, database, schema, user accounts, branding, and workflows. Peer-listening services such as 7 Cups are product inspiration only.
- System implementation architecture: Core backend platform services, care orchestration APIs, and MCP gateways are implemented in **Python** (FastAPI, Clean Architecture).

### Exclusions from this BRD

- Database tables, schemas, API contracts, infrastructure, and technology selection.
- Final legal advice or a declaration of compliance.
- Clinical protocols, validated assessment instruments, or treatment recommendations.
- Guaranteed 24/7 crisis response, emergency dispatch, or clinical outcomes.
- Detailed UI design and exact AI prompts.


