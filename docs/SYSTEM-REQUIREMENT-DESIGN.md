# MindSpace — Technical Architecture and Stack Recommendation
## 1. Executive recommendation

### Planning assumptions

The request did not specify team size, timeline, initial scale, or budget. This recommendation assumes:

- **Team:** Solo developer or 2–3 developers.
- **Timeline:** MVP in roughly 8–16 weeks after scope and safety decisions.
- **Initial scale:** Pilot or low-to-moderate traffic; design for a few thousand accounts, not internet-scale throughput.
- **Budget:** Cost-conscious pilot. Pay for managed infrastructure where it materially reduces operational and security risk; do not treat a free tier as production-ready for sensitive data.
- **Platform:** Responsive web application first; mobile apps later.

If these assumptions differ, revisit the deployment sizing and service boundaries. The architecture choice below is still appropriate for a small team unless scale, organization boundaries, or independent regulatory controls demand otherwise.

### Definitive decisions

1. **Start with a modular monolith for new MindSpace product workflows.** Keep clear domain boundaries and deploy fewer independently operated services.
2. **Use PostgreSQL as the primary transactional database**, with clear Peer Support, Wellbeing, Safety, and operational data ownership and access boundaries.
3. **Build MindSpace as a standalone, process-oriented modular monolith** for domain APIs and business rules, with its own application, identity, services, and database.
4. **Use Temporal for durable, versioned long-running business processes**, including human tasks, timers, retries, and compensations; safety operations must not depend on AI or workflow-engine availability for immediate local fallback behavior.
5. **Use Redis only for ephemeral/cache and coordination needs**, never as authoritative storage for transactional business state.
6. **Use a transactional outbox and idempotent event consumers** for reliable integration; minimize sensitive payloads and establish retry/dead-letter operations.
7. **Place AI behind the LangGraph state machine orchestrator (Port 8018) and typed Model Context Protocol (MCP) tool suites.** The runtime orchestrates stateful multi-turn sessions, context compression, and resumable session checkpoints. Agents have zero direct database credentials; all actions pass through validated MCP tools and are subject to independent safety circuit breakers.
8. **Use the SDD API baseline**: REST/JSON/OpenAPI under `/api/v1`, Zod validation, pagination, idempotency keys, correlation IDs, authorization, rate limiting, and safe generic errors.
9. **Build a new Next.js / TypeScript frontend and Python FastAPI backend for MindSpace** according to the SDD. The backend is implemented in Python (using FastAPI, SQLAlchemy Async, and Pydantic) adhering to Clean Architecture principles. Do not import another project's application code, schema, user accounts, or database. Recreate only the desired high-level intake journey as MindSpace functionality.
10. **Use managed hosting and managed PostgreSQL for a real pilot handling sensitive data.** Local Docker and free tiers are suitable for development or non-sensitive demos, not a compliance or availability guarantee.
11. **Do not launch listener matching, voice recording/transcription, or human safety escalation until the corresponding operations, consent, jurisdiction, and safety requirements are approved.**

## 2. Architectural decision: modular monolith vs. microservices

### Recommendation: modular monolith for new product capabilities

For a solo developer or small team with an MVP timeline, a modular monolith is the most reliable starting point:

- One main application boundary means fewer deployments, network calls, credentials, dashboards, and failure modes.
- A small team can deliver end-to-end member journeys without coordinating multiple service owners.
- Domain modules can still enforce boundaries: identity, member profile/consent, intake, peer support, self-help, safety operations, and administration.
- Transactions across related business records are easier to reason about than distributed transactions.
- The application can be split later when a measured need exists, without starting with distributed-systems overhead.

**Why not new microservices now:** Independent scaling and deployment are useful at larger scale, but they add operational work, observability needs, service-to-service authorization, network failure handling, data ownership decisions, and deployment coordination. A small team is more likely to lose delivery time to this overhead than gain value from it.

### Standalone MindSpace system boundary

MindSpace is a standalone application with its own source code, identity configuration, application database, service deployments, secrets, and operational environment. It is inspired by the broad peer-listening and wellbeing product category, including services such as 7 Cups, without sharing another product's accounts, database, code, branding, or proprietary workflows.

- **Authentication:** Configure a MindSpace-owned BetterAuth identity boundary and MindSpace role/relationship authorization. Do not federate or import prior-project accounts by default.
- **Database:** Provision a MindSpace-owned PostgreSQL database and migrations. Do not point MindSpace at a prior project's database or copy its schema.
- **Scope:** MindSpace is peer-support and wellbeing only. Do not inherit clinical workflows, EMR tables, FHIR integrations, identities, or services from another project.
- **AI:** Configure MindSpace's own model/provider boundary and credentials; only send the minimum authorized MindSpace context.
- **Intake:** Reimplement the desired intake workflow based on MindSpace requirements. Similarity of a user journey does not imply shared implementation or stored data.

The desired first deployment is a **standalone MindSpace modular monolith** with only explicitly approved external providers (such as an AI model or hosting service), not inherited application services.

### Suggested domain boundaries

| Domain | Owns | Important boundary |
|---|---|---|
| Identity and access | Accounts, sessions, role assignments | Authentication is not authorization; check role and relationship on every operation |
| Member and consent | Profile, preferences, consent, privacy requests | Consent is purpose-specific and checked at use/share time |
| Peer Support | Listener credentials/training, supervision, assignments, sessions, feedback | Non-clinical records; listener sees only authorized conversation context |
| Wellbeing | Intake, self-reported mood/check-ins, goals, activities, and insights | Member-controlled; distinguish self-report and AI interpretation |
| Safety operations | Safety cases, resources, responder actions, human tasks | Independent subsystem; human response is represented as available only when staffed |
| Workflow orchestration | Versioned processes, steps, tasks, timers, events, approvals, compensations | Temporal persists process state; business records remain in their authoritative domains |
| AI and tool orchestration | Agent runs, tool calls, policy/provenance metadata | Typed application tools only; no direct database access or human safety actions |
| Eventing and audit | Outbox, idempotent consumers, audit/access events | Minimize sensitive data in events and logs; maintain traceable provenance |

These are logical boundaries, not a mandate for one service or database table per domain.

## 3. Database strategy: relational SQL

### Recommendation: PostgreSQL

MindSpace’s core business data is relational and consistency-sensitive:

- Accounts have roles and consent records.
- Members have intakes, summaries, support requests, and conversations.
- Listener matches connect a member and an eligible listener.
- Wellbeing activity and peer conversations are related to members through explicit ownership and consent.
- Safety cases require assignments, state transitions, and auditable actions.
- Access rules depend on relationships, statuses, and explicit consent.

PostgreSQL supports constraints and transactions for these relationships, flexible JSON fields where genuinely useful, and mature operational tooling. Use normalized relational entities for authoritative business state. Store large message or media payloads only after deciding retention, encryption, consent, and access controls.

### Do not default to MongoDB for the core system

Document storage may appear convenient for variable AI transcripts, but it does not remove the need for relationships, consent checks, audit history, and lifecycle consistency. A document database is not the recommended primary source of truth for this product. If an independently justified workload needs a document or search index later, treat it as a derived, access-controlled projection—not the authority for identity, consent, member wellbeing, or safety state.

### Data separation recommendation

- Prefer clear logical ownership of peer, wellbeing, safety, and operational information, even if they initially share a PostgreSQL cluster.
- Keep separate schemas, access boundaries, retention policies, and service credentials for MindSpace's own application domains.
- Clinical records, provider workflows, and FHIR integration are explicitly out of scope.
- Do not assume that “same PostgreSQL server” means information is safe to join or share.
- Keep binaries, recordings, and attachments out of relational rows; use controlled object storage only if the feature is approved and retention/deletion is defined.
- Use migrations with review and backups. Do not use ad-hoc production schema pushes as the release process.

## 4. Recommended technology stack

| Area | Recommendation | Why / notes |
|---|---|---|
| Frontend | New Next.js + React + TypeScript MindSpace application | Build as a standalone responsive member and role-based web UI |
| Backend for product workflows | Python (FastAPI 0.115+, Python 3.12+) process-oriented modular monolith adhering to Clean Architecture | Single deployable backend service organized into delivery (FastAPI routers), domain entities (SQLAlchemy models), interface adapters (Pydantic DTOs), and core security |
| Identity | MindSpace-owned BetterAuth configuration with RBAC plus relationship/attribute checks (ABAC) | New account store and sessions for MindSpace; no accounts imported or shared by default |
| Durable workflows | Temporal workflows and activities | Persist long-running P01–P09 processes, human tasks, timers, retries, and compensations; version workflows deterministically |
| Cache/coordination | Redis | Use for ephemeral coordination/cache only; do not make it the source of truth for member or workflow records |
| Event reliability | PostgreSQL transactional outbox plus event bus/consumers | Write domain state and outbox atomically; consumers are idempotent and failures observable |
| Clinical interoperability | Out of scope | Do not add FHIR or clinical record modules to this product baseline |
| Primary database | PostgreSQL | Relational consistency for consent, matching, peer sessions, roles, and audit references |
| Database access / schema | SQLAlchemy 2.0 (Async) + asyncpg for the MindSpace Python backend | MindSpace owns its schema and models; uses async sessions, connection pooling, and migrations |
| Frontend/server state | TanStack Query for server state; React state for local UI state | Use as the MindSpace client state convention |
| Authentication | OIDC/OAuth-compatible IAM with role-aware authorization checks in every backend operation | Centralized identity; roles alone are insufficient—also enforce ownership, support assignment, and consent |
| Background work | Temporal for durable processes; outbox/event consumers for integrations and notifications | Separate durable workflow state from transient jobs; human safety procedures retain independent fallback paths |
| File/media storage | Managed private object storage only for an approved use case | Short-lived access, encryption, retention, and deletion policy required; do not store recordings by default |
| AI services | Hybrid agent harness with typed application tools/MCP and a server-side provider adapter | Agents never connect directly to databases; validate schemas, safety, provenance, scope, timeouts, and human review status |
| API contract | REST/JSON/OpenAPI under `/api/v1`, with Pydantic input/output validation | Standard errors, pagination, idempotency, correlation IDs, rate limits, interactive Swagger UI (`/docs`), and authorization on every operation |
| Observability | Central error reporting, structured operational logs, metrics, and audit records with sensitive-data redaction | Diagnose failures without storing conversation text or credentials in logs |

### SDD process catalog and execution constraints

The SDD process families are the implementation boundary for long-running work; they do not imply that each feature is in MVP:

| Process | Scope |
|---|---|
| P01 | Member onboarding and consent |
| P02 | Intake and support-option selection |
| P03 | Safety assessment and human escalation |
| P04 | AI wellbeing interaction |
| P05 | Listener matching |
| P06 | Peer listener session |
| P07 | Member wellbeing check-ins, goals, and follow-up |
| P08 | Privacy requests and data lifecycle |
| P09 | Notifications and member-preference handling |

Use deterministic, versioned workflow definitions. External effects (AI-provider calls, notifications, and approved resource lookups) run as activities with idempotency and compensation where possible. Human approvals are explicit workflow tasks with role, purpose, assignment, deadline, and audit trail. A workflow timeout or AI outage must never be shown as successful completion.

### Data boundaries and out-of-scope capabilities

The authoritative product domains are **Peer Support** and **Wellbeing**. Safety is an independent operational subsystem; identity, eventing, workflow orchestration, AI, and audit are cross-cutting capabilities. Sharing between domains requires an explicit purpose, authorization, consent where applicable, minimal data selection, and provenance.

Licensed professional care, provider credentialing, appointments, clinical instruments, clinical records, and FHIR exchange are not part of this MindSpace release. Do not create tables, APIs, roles, or workflows for those capabilities without a separately approved product scope.

Member-entered mood and wellbeing check-ins are self-reported reflection data. Do not use them to diagnose, prescribe, or make clinical decisions.

### State-management guidance

- Use TanStack Query for fetched server data, invalidation, retry policy, and loading/error state.
- Keep temporary form and interaction state local to the relevant UI.
- Treat consent, safety-case state, peer-session status, and access control as server-authoritative.
- Never rely on client-side state or hidden UI to enforce authorization.
- Avoid duplicating sensitive conversation content in local storage or analytics events.

## 5. Deployment and infrastructure strategy

### Environments

1. **Local development:** Docker Compose for development databases and required local dependencies; synthetic data only.
2. **Test/staging:** Separate environment, database, credentials, AI-provider configuration, and non-production data.
3. **Production/pilot:** Managed application hosting and managed PostgreSQL, private network/access controls where available, automated backups, monitoring, and a tested recovery process.

Do not use production member data in local development. Use generated synthetic fixtures.

### Cost-conscious options

| Situation | Suggested setup | Trade-offs |
|---|---|---|
| UI prototype / synthetic demo | Frontend on Vercel or equivalent; no real mental-health data; local or low-cost database | Fast and low-cost, but does not establish privacy/compliance or production readiness |
| Small production pilot | One managed application host and managed PostgreSQL in a suitable region, plus private object storage only if needed | Predictable operations; paid service and region/legal review required |
| Azure-oriented organization or data governance needs | Azure App Service or Container Apps, Azure Database for PostgreSQL, Key Vault, and Application Insights with sensitive-data filtering | More governance and integration options; requires cost, identity, region, and configuration management |
| Container-based MindSpace deployment | A managed container platform with a MindSpace-managed database and secrets service | Avoids self-managing databases; verify persistent storage, patching, backups, and network isolation |

**Recommendation for MindSpace:** For early user-interface work, free/low-cost hosting is acceptable only with synthetic data and non-operational AI. For a real pilot involving sensitive wellbeing information, use a paid managed platform with a region selected after legal/privacy review. Do not choose a vendor solely because it has a free tier.

### Production readiness requirements

- Separate production and non-production credentials and data.
- Store provider secrets in an approved secrets manager; never in source control or client bundles.
- Enforce TLS, database network restrictions, least-privilege service identities, and administrative MFA where available.
- Enable encrypted backups and document restore objectives and retention.
- Configure health checks, alerts, error reporting, and incident ownership.
- Redact message text, tokens, and sensitive identifiers from standard logs and telemetry.
- Document data location, subprocessors, backup location, and deletion behavior.
- Establish an incident response and breach-notification process before real-member launch.
- Use deployment approvals and reversible migrations for production changes.

### Cost expectations

No exact cost estimate is possible without region, availability target, traffic, AI usage, retention, and vendor choices. Budget for at least application hosting, managed PostgreSQL, backups, monitoring, email/notification delivery, AI usage (if enabled), and security/legal review. Free tiers may impose limits or terms unsuitable for sensitive-data production use.

## 6. Security, Privacy, and Health Data Governance

- **Zero Direct Database Access for AI:** AI models and agent runtimes must never hold PostgreSQL credentials or execute arbitrary SQL. All interactions are mediated by typed, authorized application and MCP tools.
- **Application-Level Cryptography:** Sensitive intake responses, journal entries, and safety incident payloads are encrypted with AES-256-GCM before database insertion. Key rotation is managed via versioned key identifiers (`INTAKE_ENCRYPTION_KEYS_JSON`).
- **Data Segregation:** Maintain strict logical and schema separation between Peer Support conversations, Personal Wellbeing journals, and Clinical Care Navigation records. Data is never cross-mingled or queried without explicit purpose-specific consent.
- **Data Minimization for LLMs:** Only transmit the minimal necessary context required for a specific agent step. Redact or strip identifiers, contact information, and unconsented historical notes before external API calls.
- **Provenance & Auditing:** Record model identifier, prompt/policy version, token consumption, tool execution latencies, and human review status for every agent run without persisting raw sensitive text in system logs.
- **Untrusted Output Validation:** Treat all LLM outputs as untrusted input. Validate strictly against Zod/Pydantic schemas and apply safety policy filters before dispatching responses to users or downstream tools.

## 7. Agentic Orchestration Architecture (LangGraph & MCP)

MindSpace leverages a decoupled **Three-Engine Pattern** to coordinate care along a stepped-care continuum:

```
┌────────────────────────────────────────────────────────┐
│               ENGINE 1: PROCESS ENGINE                 │
│         (LangGraph Central StateGraph Runtime)         │
│  • Multi-turn tool execution loop & token management   │
│  • Checkpoint serialization to PostgreSQL / Redis      │
│  • Workflow Suspend & Resume on human events           │
│  • Loop detection, approval hooks & budget enforcement │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
     Context &  │                        │ Typed Authenticated
     Prompts    │                        │ MCP Invocations
                ▼                        ▼
┌────────────────────────────────┐ ┌────────────────────────────────┐
│  ENGINE 2: AGENT INTELLIGENCE  │ │  ENGINE 3: HEALTH DATA ENGINE  │
│       (Domain Subagents)       │ │      (MindSpace Core API)      │
│  • Intake & Triage Agent       │ │  • Intake MCP Server           │
│  • Support Pathway Agent       │ │  • Listener MCP Server         │
│  • Wellbeing Companion Agent   │ │  • Scheduling MCP Server       │
│  • Peer Matching Agent         │ │  • Safety MCP Server           │
│  • Care Coordination Agent     │ │  • AES-256-GCM Decryption Gate │
│  • Follow-up Agent             │ │  • Relational PostgreSQL DB    │
│  • Safety Sentinel Circuit     │ │  • Independent Crisis Hand-off │
└────────────────────────────────┘ └────────────────────────────────┘
```

### Key Agentic Capabilities:
1. **Stepped-Care Triage:** Conversational screening measures distress against non-diagnostic PHQ-9/GAD-7 indicators, dynamically routing members to Tier 1 (Self-Help), Tier 2 (Peer Listener), or Tier 3 (Professional Care).
2. **Asynchronous Checkpointing & Resumability:** When matching a member to a human peer listener, the agent initiates the request via the `Listener MCP`, checkpoints its serialized execution state, and suspends execution (`AWAITING_HUMAN_ACCEPTANCE`). When a listener accepts in the Listener Hub, an event triggers the runtime to rehydrate the checkpoint and resume the care loop.
3. **Model Context Protocol (MCP) Boundaries:** Standardized tool interfaces enforce parameter validation, credential scope, and authorization checks before executing any backend state changes.
4. **Independent Deterministic Circuit Breaker:** Critical safety and crisis detection is never left exclusively to generative LLM reasoning. Deterministic regex and lexical pattern matchers intercept emergency signals in the data gateway, triggering immediate escalation and hotline resources.

### Core Design Principles & Software Patterns

#### 1. Core Engineering & Safety Principles
* **Principle of Least Privilege & Zero Direct DB Access:** AI models operate as untrusted reasoning actors. They possess no database connection strings or credentials. All interactions are strictly mediated by authenticated, schema-validated MCP tool calls.
* **Privacy by Design & Data Segregation:** Dedicated domain boundaries isolate Peer Support conversations, Personal Wellbeing reflections, Clinical Health records, and Safety Incidents. Data cannot cross boundaries without explicit, auditable member consent.
* **Determinism Over Probabilism for Critical Safety:** Life-critical events (self-harm, suicidal ideation) must not depend on probabilistic LLM token generation. Deterministic regex and lexical pattern matchers execute at the network gateway before LLM inference.
* **Human-in-the-Loop (HITL) Primacy:** AI navigates and coordinates; vetted human listeners and clinicians deliver care. Long-running coordination workflows suspend until humans take action.
* **Fail-Safe Defaults & Graceful Degradation:** External AI provider outages trigger deterministic fallbacks to offline grounding exercises, journal reflection prompts, and verified emergency hotlines.
* **Non-Diagnostic Clinical Boundary:** Conversational intake screeners (PHQ-9/GAD-7 proxies) are utilized exclusively for triage scoring and care-tier recommendation—never for diagnosing conditions or issuing prescriptions.

#### 2. Key Architectural & Agentic Patterns
* **Orchestrator-Workers (Supervisor Pattern):** A root `Care Orchestrator` agent manages conversational context and delegates specialized tasks to scoped subagents (`Intake`, `Pathway`, `Companion`, `Matching`, `Coordination`, `Follow-up`), mitigating context bloat and hallucination risk.
* **Router / Stepped-Care Triage Pattern:** Dynamically classifies member distress into structured care tiers (Tier 1 Self-Help, Tier 2 Peer Support, Tier 3 Clinical Navigation).
* **Model Context Protocol (MCP) Tool Pattern:** Decouples AI agent prompt engineering from backend Python FastAPI route implementations via typed JSON-RPC contracts over stdio and HTTP/SSE.
* **Stateful Suspend & Resume Saga Pattern:** Checkpoints agent state into PostgreSQL/Redis while waiting for human listener acceptance or supervisor review, freeing memory and compute during idle wait times.
* **Circuit Breaker Pattern (Safety Sentinel):** Inline safety filter that intercepts acute crisis keywords, instantly halts LLM text generation, and routes directly to human crisis responders.
* **Modular Monolith Pattern:** Consolidates domain APIs into a single deployable Python FastAPI service adhering to Clean Architecture, eliminating distributed network overhead while maintaining strict domain encapsulation.
* **Transactional Outbox Pattern:** Ensures dual-write consistency between PostgreSQL state transitions and event notifications without distributed 2PC locks.
* **Idempotent Receiver Pattern:** Employs unique idempotency keys on all state-altering endpoints to prevent duplicate bookings or repeated match requests during network retries.
* **Application-Level Envelope Encryption Pattern:** Encrypts sensitive member intake responses and journals using AES-256-GCM in application memory before writing to disk.

## 8. Reliability, Scale, and Evolution

### Initial scale

For a low-to-moderate pilot, a single application deployment and managed relational database are generally sufficient. Begin with service-level measures that matter to users: successful account and intake completion, message delivery, peer-support workflow correctness, service availability, and recovery from dependency outages.

Avoid promising a specific concurrency target until load assumptions are known. Establish expected active users, peak traffic, message volume, AI requests per member, media needs, retention, and uptime goals before capacity planning.

The SDD proposes **99.9% availability** and **p95 under 500 ms for ordinary non-AI reads** as initial targets; AI latency is excluded and needs separate objectives. These are design targets, not a measured SLO or availability guarantee. Define service ownership, measurement windows, exclusions, alerting, and recovery objectives before production.

### Scaling triggers for later decomposition

Split a module into a separate service only when one or more measured needs justify it:

- It has an independent scaling or availability profile.
- A separate team owns it and can operate it reliably.
- Its data or regulatory boundary requires stronger isolation.
- Releases are repeatedly blocked by the main application cadence.
- A stable contract and service-level objective can be maintained.

Likely future candidates include AI orchestration and notification delivery—but extraction adds operational complexity and is not an MVP prerequisite.

## 9. Key architecture decisions to record

| Decision | Recommendation | Revisit when |
|---|---|---|
| Architecture shape | Standalone modular monolith for MindSpace workflows | Team growth, measured scaling, or justified data isolation |
| Primary data store | PostgreSQL | A distinct workload demonstrates a need for another data model |
| Peer/self-help data | Separate logical data classes and access/retention policy | Security assessment specifies stronger physical isolation |
| AI provider | Server-side adapter; minimize/consent data; no default training reuse | Vendor terms, risk review, and quality evaluation approve a change |
| Hosting | Managed services for sensitive production pilot | Confirmed organization cloud policy and jurisdiction |
| Mobile | Responsive web first | Validated usage and business case justify native apps |
| Payments | Excluded until monetization decision | Business model and legal/payment review are complete |

The SDD-aligned data model and its conceptual ER source are in [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) and [ER-DIAGRAM.mmd](./ER-DIAGRAM.mmd). Both are proposed artifacts for MindSpace's independent database and must be reviewed before migrations.

## 10. Next steps checklist

- [ ] Confirm team size, target MVP date, pilot size, budget ceiling, and operating region.
- [ ] Approve the MVP support levels; explicitly defer features without staffing or governance.
- [ ] Assign safety, privacy/legal, security, and operations decision owners.
- [ ] Create the standalone MindSpace application, identity configuration, PostgreSQL database, and service environments.
- [ ] Define MindSpace's own identity/role model and service-to-service authorization.
- [ ] Classify peer, self-help, and safety data; decide access, retention, and deletion policies.
- [ ] Confirm PostgreSQL ownership, migration strategy, backup, restore, and database isolation needs.
- [ ] Select an AI provider only after reviewing data processing terms, location, retention, and safety performance.
- [ ] Deploy the standalone MindSpace backend on Python FastAPI (`backend/mindspace-fastapi`); confirm Temporal, Redis, outbox, and event-bus ownership before implementing those capabilities.
- [ ] Define typed tool/MCP contracts, service identities, agent permissions, validation, provenance, and human-approval boundaries.
- [ ] Choose hosting region and providers after privacy/legal review; use synthetic data until approved.
- [ ] Define operational SLOs, monitoring, incident response, and human escalation coverage.
- [ ] Capture architecture decisions as approved ADRs before committing to major service or vendor choices.
- [ ] Only then finalize detailed schemas, APIs, and implementation tasks.

## 11. Decision status

This is a **proposed architecture, not an approved deployment plan**. The project details supplied so far do not specify team size, timeline, expected scale, budget, or launch geography. Confirm these assumptions and obtain safety, privacy, security, and legal approvals before committing to a production deployment or sensitive-data launch.
