# MindSpace — Agentic Framework & Technical Architecture


## 1. Executive Summary & Core Mission

MindSpace is an agentic AI mental healthcare coordination platform designed to transition individuals experiencing emotional distress into appropriate, continuous human support and professional care.

Traditional mental health chatbots operate as conversational text generators—offering static advice, ending when the user closes the window, and leaving the user to navigate fragmented care independently. MindSpace introduces an **agentic care-coordination layer** powered by the **LangGraph** multi-agent state machine orchestrator (Port 8018). It plans multi-step support pathways, queries live availability, matches users with trained volunteer listeners or verified clinicians, triggers human handoffs, preserves execution checkpoints, and autonomously resumes workflows across long-running sessions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             MINDSPACE ECOSYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Member Portal          Listener Workspace      Therapist Portal   Admin UI │
│  (Next.js / React)      (Peer Coordination)     (Care Dashboard)   (Audit)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / WSS / JWT
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    MINDSPACE AGENT ORCHESTRATION LAYER                      │
│                 (LangGraph Central StateGraph Orchestrator)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Intake Agent │  │Pathway Agent │  │Matching Agent│  │Care Coord Agent │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                 │                 │                   │           │
│         └─────────────────┼─────────────────┴───────────────────┘           │
│                           ▼                                                 │
│             Stateful Session Checkpoints & MCP Client                       │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
    Authorized MCP Tools│                             │ Hard Handoff
┌───────────────────────▼──────────────┐   ┌──────────▼───────────────────────┐
│     MINDSPACE DOMAIN SERVICES        │   │ INDEPENDENT SAFETY SERVICE       │
│  (Python FastAPI / PostgreSQL / Async)│  │ (Deterministic Risk Rules)       │
│  • Peer Support & Listening Sessions │   │ • Non-LLM Hardcoded Triggers     │
│  • Encrypted Journals & Wellbeing    │   │ • Emergency Escalation Queues    │
│  • Provider Directory & Bookings     │   │ • Human Safety Responder Alert   │
│  • Consent & Purpose-Bounded Tokens  │   │ • Crisis Line Routing (988)      │
└──────────────────────────────────────┘   └──────────────────────────────────┘
```

---

## 2. LangGraph Multi-Agent Orchestration Architecture

The platform separates generic agent-runtime mechanics from mental healthcare domain intelligence:

* **LangGraph StateGraph Framework (Runtime Infrastructure):** Provides multi-turn execution loops, session checkpointing, token sliding windows, MCP client transports (stdio & HTTP/SSE), subagent lifecycle hooks, loop detection, and dangerous-command gates.
* **MindSpace Domain Intelligence (Application Layer):** Provides healthcare-specific schemas, conversational triage, empathetic intake prompts, stepped-care pathway algorithms, volunteer listener matching rules, and strict clinical boundaries.

### Architectural Decoupling: The Three-Engine Pattern

1. **Process & Orchestration Engine (LangGraph StateGraph):**
   * Manages long-running state machines (e.g., waiting 20 minutes for a listener to accept an assignment).
   * Persists workflow state to durable checkpoints.
   * Handles agent-to-agent delegation and context compression.
2. **AI Agent Intelligence Engine:**
   * Specialized LLM prompts paired with constrained function calling.
   * Enforces zero direct database access—all operations must occur via typed, authenticated application tools.
3. **Secure Health Data Engine (MindSpace Core):**
   * PostgreSQL with application-level AES-256-GCM encryption for sensitive text.
   * Purpose-limited access tokens and append-only consent ledgers.
   * Strict database isolation: Peer Support, Wellbeing, and Clinical Health records reside in separate logical domains.

---

## 3. Core Design Principles & Architectural Patterns

MindSpace's architecture adheres to strict engineering principles and established distributed/agentic patterns to ensure patient safety, data confidentiality, and reliable long-running workflow coordination.

### Core Design Principles

| Principle | Architectural Manifestation in MindSpace |
|---|---|
| **Principle of Least Privilege & Zero Direct DB Access** | AI agents and LLM runtimes have **zero direct SQL credentials**. All read/write operations must traverse typed, authenticated, and schema-validated Model Context Protocol (MCP) tool endpoints. |
| **Privacy by Design & Purpose-Bounded Segregation** | Strict logical and schema separation between Peer Support chats, Personal Wellbeing reflections, Clinical Navigation records, and Safety Incidents. Data cannot cross domain boundaries without explicit, auditable member consent. |
| **Determinism Over Probabilism for Safety (Defense-in-Depth)** | Critical safety decisions (suicidal ideation, self-harm, domestic danger) **never** depend solely on probabilistic LLM reasoning. Hardcoded regex, lexical filters, and rule engines intercept text in the gateway before LLM inference. |
| **Human-in-the-Loop (HITL) Primacy** | AI navigates and coordinates, but licensed humans or vetted volunteers execute actual care. Peer listening matches require explicit human listener acceptance; crisis interventions require human safety responders. |
| **Fail-Safe Defaults & Graceful Degradation** | In the event of model provider outages, rate limits, or network partitions, the platform falls back to deterministic, offline self-help modules, grounding exercises, and verified emergency hotlines—never failing silently or inventing data. |
| **Non-Diagnostic Clinical Boundary** | Conversational screeners (PHQ-9/GAD-7 proxies) are used solely for triage scoring and care-tier recommendation. Agents are forbidden from making formal medical diagnoses, proposing clinical treatment, or prescribing medication. |

---

### Architectural & Agentic Design Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               MINDSPACE PATTERN CATALOG                                 │
├───────────────────────────────┬─────────────────────────────────────────────────────────┤
│ Pattern                       │ Implementation in MindSpace                             │
├───────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 1. Orchestrator-Workers       │ Root Care Orchestrator delegating to specialized        │
│    (Supervisor Pattern)       │ subagents (Intake, Pathway, Companion, Matching, etc.) │
├───────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 2. Router / Stepped-Care      │ Dynamic triage routing members to Tier 1 (Self-Help),   │
│    Triage Pattern             │ Tier 2 (Peer Listener), or Tier 3 (Clinical Care)       │
├───────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 3. Model Context Protocol     │ Decoupled, typed JSON-RPC tool contracts over stdio/SSE │
│    (MCP Tool Pattern)         │ isolating backend business logic (Python FastAPI)       │
├───────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 4. Suspend & Resume Saga      │ Stateful session checkpointing to PostgreSQL/Redis while│
│    (Checkpointing Pattern)    │ awaiting human listener acceptance, then rehydrating    │
├───────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 5. Safety Circuit Breaker     │ Gateway-level non-LLM filter that halts agent text      │
│    (Sentinel Pattern)         │ generation and routes immediately to human crisis teams │
├───────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 6. Evaluator-Optimizer        │ Secondary validation pass checking extracted clinical   │
│    (Reflection Pattern)       │ summaries against safety policies before member review  │
├───────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 7. Modular Monolith with      │ Single deployable Python FastAPI backend with strictly  │
│    Bounded Contexts           │ bounded modules (intake, wellbeing, peer, safety)       │
├───────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 8. Transactional Outbox       │ Guarantees consistent event publication to Redis/queues │
│    Pattern                    │ alongside PostgreSQL transactions without 2PC locking   │
├───────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 9. Idempotent Consumer        │ Idempotency keys on all state-changing tool executions  │
│    Pattern                    │ preventing duplicate bookings or repeated match requests│
├───────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 10. Envelope Encryption       │ Application-level AES-256-GCM encryption for sensitive  │
│     Pattern                   │ health fields with versioned keychains in environment   │
└───────────────────────────────┴─────────────────────────────────────────────────────────┘
```

#### Detailed Pattern Mechanics:

1. **Orchestrator-Workers (Supervisor Pattern):**
   * The `Care Orchestrator` maintains overall conversational trajectory and delegates specific tasks to specialized subagents. Each worker operates with a focused prompt, strict tool whitelist, and restricted context window, reducing hallucination risk and token overhead.

2. **Stateful Suspend-and-Resume Saga Pattern:**
   * Traditional chatbots cannot wait hours for a human listener to accept a request without holding open expensive HTTP connections or polling loops. MindSpace serializes the agent's internal state machine into PostgreSQL/Redis as an immutable checkpoint. When the listener clicks "Accept" in the Listener Workspace, a domain event awakens the LangGraph runtime, rehydrates the checkpoint, and seamlessly continues the coordination journey.

3. **Circuit Breaker Pattern (Safety Sentinel):**
   * Operates as an inline interceptor. If incoming text matches high-risk crisis patterns (e.g., self-harm indicators), the circuit trips instantly (`STATE = OPEN`). LLM generation is completely bypassed, the member receives immediate crisis hotline resources, and a prioritized case is pushed to the Safety Operations Hub.

4. **Application-Level Envelope Encryption Pattern:**
   * Sensitive health responses, journal reflections, and safety logs are encrypted in Python application memory (`app.core.security` with AES-256-GCM) before reaching the PostgreSQL wire. Even database administrators or compromised SQL dumps cannot read raw member emotional reflections without the application decryption keys.

---

## 4. Flagship Agent: AI Support & Care Navigation Agent

The central flagship agent coordinates the entire stepped-care journey.

### Stepped-Care Model

```
                    ┌───────────────────────────────┐
                    │  Acute Crisis / Safety Alert  │ ──► Immediate Human Escalation
                    └───────────────▲───────────────┘     (Deterministic Safety Engine)
                                    │
                    ┌───────────────┴───────────────┐
                    │ Tier 3: Professional Care     │ ──► Verified Therapists /
                    │ (Assessment, Teletherapy)     │     Psychiatrists (Scheduling MCP)
                    └───────────────▲───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │ Tier 2: Community Peer Support│ ──► Trained Volunteer Listeners
                    │ (Empathetic Human Listening)  │     (Matching MCP)
                    └───────────────▲───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │ Tier 1: Guided Self-Help      │ ──► AI Journaling, Reflections,
                    │ (Emotional Equilibrium)       │     Mood Tracking (Wellbeing MCP)
                    └───────────────────────────────┘
```

### What Makes This Genuinely Agentic (vs Conventional Chatbots)

| Dimension | Conventional Chatbot | MindSpace Agentic Framework |
|---|---|---|
| **Execution Horizon** | Single prompt-response exchange | Multi-step, long-running workflow across days |
| **Action Capability** | Recommends external hyperlinks | Invokes authorized MCP tools to book, match, and notify |
| **Session Memory** | Lost upon browser refresh | Checkpointed state stored in database; resumable on event |
| **Human In The Loop** | Cannot coordinate humans | Suspends execution until human listener clicks "Accept", then resumes |
| **Safety Governance** | LLM probabilistic text evaluation | Independent, deterministic non-LLM safety engine |
| **Follow-Up** | Relies on user returning | Autonomous scheduled check-ins and longitudinal tracking |

---

## 5. Specialized Multi-Agent Topology

MindSpace divides responsibilities across specialized, single-purpose subagents orchestrated by a central coordinator:

```
                          ┌──────────────────────────┐
                          │   Care Orchestrator      │
                          │   (Root Session Agent)   │
                          └────────────┬─────────────┘
                                       │
        ┌───────────────────┬──────────┴──────────┬───────────────────┐
        ▼                   ▼                     ▼                   ▼
┌───────────────┐   ┌───────────────┐     ┌───────────────┐   ┌───────────────┐
│ Intake Agent  │   │Pathway Agent  │     │Matching Agent │   │Follow-up Agent│
│ • Needs extract│   │ • Tier routing│     │ • Listener pool│   │ • Check-ins   │
│ • Consent opt │   │ • Risk filter │     │ • Session setup│   │ • Mood trends │
└───────────────┘   └───────────────┘     └───────────────┘   └───────────────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌───────────────┐   ┌───────────────┐     ┌───────────────┐
│Wellbeing Agent│   │Coordination Ag│     │Safety Sentinel│
│ • Reflections │   │ • Clinician DB│     │ • Risk scoring│
│ • Journaling  │   │ • Appointments│     │ • Auto-handoff│
└───────────────┘   └───────────────┘     └───────────────┘
```

1. **Intake Agent:** Conducts conversational assessment (via text chat or streaming voice WebSocket), extracts primary concerns, and captures explicit consent before storing responses.
2. **Support Pathway Planning Agent:** Uses governed triage rules to recommend Tier 1 (Self-help), Tier 2 (Peer listener), or Tier 3 (Clinical assessment).
3. **Wellbeing Companion Agent:** Guides self-reflection, emotional equilibrium exercises, mood logging, and structured thought reframing.
4. **Peer Listener Matching Agent:** Queries active volunteer rosters, filters by shared lived experience or language preference, sends dispatch invites, and awaits acceptance.
5. **Care Coordination Agent:** Interacts with scheduling services to discover verified professional therapists, check calendar availability, and confirm video teletherapy slots.
6. **Follow-Up Agent:** Executes autonomous Day 2 / Day 7 check-in workflows, tracking wellbeing trajectories and suggesting pathway adjustments.
7. **Safety Support Agent:** Operates in tandem with the hardcoded safety engine to structure contextual notes for human safety officers during escalations.

---

## 6. Model Context Protocol (MCP) Tool Specifications

Agents interact with the MindSpace platform exclusively through standardized, permissioned MCP tools:

```
┌──────────────────┐           JSON-RPC 2.0 (MCP)          ┌─────────────────────┐
│  LangGraph Multi-│ ────────────────────────────────────► │  MindSpace Host API │
│  Agent (Port 8018│ ◄──────────────────────────────────── │  (Port 8080/8002)   │
└──────────────────┘          Server-Side Auth & Claims    └──────────┬──────────┘
                                                                      │
                                                           ┌──────────▼──────────┐
                                                           │ PostgreSQL Database │
                                                           │     (Port 5433)     │
                                                           └─────────────────────┘
```

### Core Toolsets

#### A. Intake & Member Tools
* `create_intake_session(member_id, modality)`: Initializes an encrypted intake session.
* `record_member_consent(member_id, purpose_codes[])`: Persists append-only consent records.
* `submit_encrypted_intake(intake_id, payload)`: Encrypts intake content with AES-256-GCM before writing.

#### B. Peer Support & Matching Tools
* `get_eligible_listeners(language, topics[], availability_window)`: Queries qualified listener pool.
* `request_listener_assignment(match_request_id, listener_id)`: Dispatches push notification and invite.
* `confirm_support_session(match_request_id, room_id)`: Binds member and listener into an encrypted chat room.

#### C. Professional Coordination Tools
* `find_verified_therapists(specialization, language, jurisdiction)`: Filters verified clinical roster.
* `get_available_appointments(provider_id, date_range)`: Fetches open calendar slots.
* `book_teletherapy_appointment(member_id, slot_id)`: Finalizes booking and generates video link.

#### D. Follow-up & Safety Tools
* `schedule_wellbeing_checkin(member_id, execute_at_timestamp)`: Schedules delayed follow-up webhook.
* `trigger_safety_escalation(member_id, urgency_level, trigger_phrase)`: Alerts on-call human safety officers.

> **Security Rule:** Tool arguments alone never confer access. Every MCP tool executes server-side validation against the caller's JWT claims (`sub`, `roleCodes`, `tenantId`).

---

## 7. Deterministic Safety & Human Escalation Architecture

Mental healthcare platforms must never rely exclusively on LLM judgment for critical safety events:

```
                               Incoming Member Message
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
       ┌────────────────────────┐                 ┌─────────────────────────┐
       │ AI Agent (FastAPI/Py)  │                 │   Deterministic Safety  │
       │   Empathetic Triage    │                 │   Rule Engine (Regex/   │
       │   Pathway Planning     │                 │   Validated Keywords)   │
       └────────────────────────┘                 └────────────┬────────────┘
                                                               │
                                                   Critical Trigger Detected?
                                                               │
                                             ┌─────────────────┴─────────────────┐
                                             ▼ YES                               ▼ NO
                                ┌──────────────────────────┐          ┌──────────────────────┐
                                │ Instant Circuit Breaker  │          │ Allow Standard Agent │
                                │ • Freeze AI conversation │          │ Multi-Tier Workflow  │
                                │ • Alert Human Safety Team│          └──────────────────────┘
                                │ • Display 988 / Local Hot│
                                └──────────────────────────┘
```

* **Zero-Hallucination Circuit Breaker:** If self-harm, suicidal ideation, or severe clinical crisis keywords are detected, the deterministic rule engine bypasses the LLM entirely.
* **Human-Led Crisis Protocol:** The interface transitions to displaying emergency resources (e.g., 988 Suicide & Crisis Lifeline) and places an urgent event into the `safety_cases` human operator queue.
* **Volunteer Listener Boundaries:** Volunteer listeners receive structured non-clinical training. If a crisis emerges during a peer chat, a 1-click "Escalate to Supervisor/Safety" button instantly alerts professional safety staff.

---

## 8. Stateful Session Management & Workflow Checkpointing

LangGraph provides durable checkpointing that allows MindSpace to support asynchronous, real-world interactions:

```
[Member chats with Agent] 
       │
       ▼
[Intake Agent plans Match] ──► MCP: `request_listener_assignment`
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ WORKFLOW SUSPENDED & CHECKPOINTED                      │
│ • Session State saved to PostgreSQL                    │
│ • Agent execution paused (0 compute consumed)          │
│ • System waits for Human Listener webhook response     │
└──────────────────────────────────┬─────────────────────┘
                                   │
                    Volunteer Listener clicks "Accept"
                                   │
                                   ▼
┌────────────────────────────────────────────────────────┐
│ WORKFLOW RESUMED FROM CHECKPOINT                       │
│ • Session deserialized with full conversation history  │
│ • Care Orchestrator creates private chat room          │
│ • Member receives notification: "Listener Connected!"  │
│ • Follow-up Agent arms 48-hour check-in timer          │
└────────────────────────────────────────────────────────┘
```

---

## 9. Data Segregation & Governance

MindSpace strictly isolates data into three non-interchangeable domains:

| Data Silo | Contents | Who Has Access? | Storage Encryption |
|---|---|---|---|
| **Peer Support Domain** | Match requests, volunteer chat transcripts, listener reviews | Member, Assigned Listener (during active session only) | Database level + TLS |
| **Personal Wellbeing Domain** | Mood tracker, personal journals, daily reflections | Member only (private) | AES-256-GCM encrypted |
| **Clinical Health Domain** | Formal assessments, therapist notes, teletherapy schedules | Member, Licensed Clinical Professional | Health-grade audit log + TLS |

Agents and listeners **cannot** access private wellbeing journals or clinical therapist records unless the member grants explicit, time-bounded consent via the `record_member_consent` tool.

---

## 10. 5-Minute End-to-End Live Demonstration Workflow

When demonstrating the platform, the following scenario showcases full agentic capabilities:

1. **Minute 0:00 – 0:45 (Triage & Consent):**
   * Member connects via chat or voice.
   * Intake Agent gathers concerns ("Feeling isolated, overwhelmed with work stress").
   * Captures member consent to store responses for peer matching.
2. **Minute 0:45 – 1:30 (Stepped Pathway Decision):**
   * Safety rule engine confirms no active self-harm risk.
   * Pathway Agent proposes Tier 2: Community Peer Listener. Member clicks "Connect".
3. **Minute 1:30 – 2:45 (Agentic Action & Checkpointing):**
   * Matching Agent queries listener pool via MCP.
   * Dispatches request to an available listener with matching language/experience tags.
   * **Workflow suspends and enters checkpoint.**
4. **Minute 2:45 – 3:30 (Human Acceptance & Automatic Resume):**
   * In a separate browser tab (Listener Workspace), volunteer clicks **"Accept Session"**.
   * MindSpace webhook fires; LangGraph resumes from checkpoint.
   * Private encrypted session room is provisioned; member is alerted.
5. **Minute 3:30 – 4:15 (Session Wrap-up & Follow-up Scheduling):**
   * Simulation of completed session.
   * Follow-up Agent automatically schedules a Day 2 wellbeing check-in.
6. **Minute 4:15 – 5:00 (Observability & Audit Trail):**
   * Open the Administrator / Engineering trace log.
   * Display the complete execution tree: agent decisions, tool payloads, MCP calls, state transitions, and deterministic safety checks.




 
