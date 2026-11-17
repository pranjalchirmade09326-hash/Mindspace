# MindSpace — Complete Architectural & Operational Guide

This document is the definitive guide to the MindSpace platform — its core philosophy, agentic stepped-care model, three-engine system architecture, role dashboards, data governance, and operational commands.

## 1. Executive Summary & Mission

**MindSpace** is an agentic mental wellbeing and care coordination platform designed to bridge the massive gap between personal emotional distress and accessible human care. Rather than functioning as a passive conversational chatbot or a basic self-help app, MindSpace operates as an **active, continuous care navigator**.

MindSpace organizes care across a **Stepped-Care Continuum**:
1. **Tier 1: AI-Guided Self-Care & Reflection** — Conversational intake, somatic grounding, mood check-ins, CBT/mindfulness reflection exercises.
2. **Tier 2: Empathetic Peer Support** — Connection with verified, trained volunteer listeners for non-clinical emotional accompaniment.
3. **Tier 3: Professional Care Navigation** — Automated matching, credential verification, and appointment coordination with licensed mental health professionals (therapists, psychologists).
4. **Independent Safety Escalation** — Deterministic, non-LLM safety circuit breakers that immediately intervene and route crisis signals to human crisis intervention teams.

> [!IMPORTANT]
> **Clinical Boundary Definition:**
> While MindSpace coordinates professional care and provides structured wellbeing support, **AI agents never diagnose mental health conditions, prescribe medication, or independently manage crises**. All clinical interventions and crisis handoffs are strictly human-led.

---

## 2. Decoupled Three-Engine Architecture

MindSpace achieves resilience, safety, and strict health data privacy by decoupling execution across three dedicated engines:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MINDSPACE USER INTERFACES                       │
│     Member Workspace · Listener Hub · Supervisor Console · Safety Ops  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WebSocket (JWT via JWKS)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       ENGINE 1: PROCESS ENGINE                         │
│    (LangGraph Central StateGraph Orchestrator (Port 8018) + Sarvam AI) │
│  • Multi-turn execution loops & session management                     │
│  • Deterministic Checkpoint & State Serialization                      │
│  • Asynchronous Workflow Suspend & Resume (Waiting for Human Actions)  │
│  • Context compression, loop detection & token governance              │
└─────────────────┬────────────────────────────────────┬─────────────────┘
                  │                                    │
                  │ Context & Prompts                  │ Authenticated Tool Calls
                  ▼                                    ▼
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│   ENGINE 2: AGENT INTELLIGENCE   │ │  ENGINE 3: HEALTH DATA ENGINE    │
│    (Domain LLMs & Reasoning)     │ │   (MindSpace Core Python Backend)│
│  • Intake & Triage Agent         │ │  • Zero Direct DB Access for AI  │
│  • Support Pathway Agent         │ │  • Python FastAPI Clean Arch API │
│  • Wellbeing Companion Agent     │ │  • Typed MCP Server Gateways     │
│  • Peer Matching Agent           │ │  • Application-Level AES-256-GCM │
│  • Care Coordination Agent       │ │  • PostgreSQL Relational Store   │
│  • Autonomous Follow-up Agent    │ │  • IAM / Better Auth Integration │
│  • Independent Safety Guardrails │ │  • SQLAlchemy Async & Pydantic   │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

### Architectural Safeguards:
1. **Zero Direct Database Access:** The LLM and agent runtime have no SQL credentials. All mutations occur via typed, authenticated Model Context Protocol (MCP) tool endpoints.
2. **Deterministic Safety Sentinel:** Risk screening uses deterministic regex/lexical matching running independently in the data gateway before LLM inference.
3. **Data Segregation:** Peer Support conversations, Wellbeing reflections, and Clinical Navigation data are logically isolated into dedicated domain schemas with distinct retention and encryption policies.

---

## 3. Core Design Principles & Software Patterns

MindSpace enforces strict engineering principles and established architectural patterns across both backend services and the agent orchestration layer:

### Core Design Principles
* **Least Privilege & Zero Direct DB Access:** AI models are treated as untrusted reasoning actors. They interact with data exclusively via authenticated, typed tools (MCP).
* **Privacy by Design:** Data is partitioned into strictly isolated domains (Peer Support, Personal Wellbeing, Clinical Navigation, Safety). Cross-domain access requires explicit, auditable member consent.
* **Deterministic Safety Over Probabilistic LLMs:** Acute crisis detection (self-harm, suicidal ideation) uses non-LLM regex and lexical rules running at the network gateway to ensure zero false negatives.
* **Human-in-the-Loop (HITL) Primacy:** AI agents navigate and coordinate, but humans provide care. Peer listeners must explicitly accept match requests; safety personnel lead crisis interventions.
* **Graceful Degradation & Fail-Safe Defaults:** If an AI provider fails or times out, the user is transitioned to deterministic offline self-help modules and emergency hotlines.
* **Non-Diagnostic Clinical Guardrails:** Conversational intake screeners (PHQ-9/GAD-7 proxies) are for triage navigation only, never for generating medical diagnoses or prescriptions.

### Architectural & Agentic Patterns
* **Orchestrator-Workers (Supervisor) Pattern:** A root `Care Orchestrator` supervises 7 single-purpose subagents, preventing context pollution and hallucination loops.
* **Router / Stepped-Care Triage Pattern:** Categorizes distress severity to dynamically route members across Tier 1 (Self-Help), Tier 2 (Peer Support), or Tier 3 (Professional Care).
* **Model Context Protocol (MCP) Pattern:** Standardized tool abstraction separating LLM prompts from backend Python FastAPI route implementations.
* **Suspend & Resume Saga Pattern:** Persists long-running care workflows to PostgreSQL/Redis checkpoints while awaiting asynchronous human actions (e.g., listener accepting an invite).
* **Circuit Breaker Pattern:** Inline safety sentinel that instantly halts AI text generation upon detecting crisis keywords, routing to emergency resources.
* **Modular Monolith Pattern:** Single deployable Python FastAPI backend adhering to Clean Architecture with strictly encapsulated domain layers (`routers`, `schemas`, `models`, `core`).
* **Transactional Outbox Pattern:** Ensures dual-write consistency between PostgreSQL state changes and asynchronous event notifications.
* **Application-Level Envelope Encryption:** AES-256-GCM encryption applied to sensitive health data in Python application memory (`app.core.security`) before writing to disk.

---

## 4. The 7 Specialized Subagents

The MindSpace agent layer decomposes complex care coordination into seven single-responsibility subagents:

```
                          ┌───────────────────────────┐
                          │   Intake & Triage Agent   │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │   Support Pathway Agent   │
                          └──────┬─────────────┬──────┘
             Tier 1 Pathway      │             │      Tier 2 & 3 Pathway
      ┌──────────────────────────┘             └──────────────────────────┐
      ▼                                                                   ▼
┌───────────────────────────┐                               ┌───────────────────────────┐
│ Wellbeing Companion Agent │                               │    Peer Matching Agent    │
└───────────────────────────┘                               └─────────────┬─────────────┘
                                                                          │
                                                                          ▼
                                                            ┌───────────────────────────┐
                                                            │ Care Coordination Agent   │
                                                            └─────────────┬─────────────┘
                                                                          │
                                                                          ▼
                                                            ┌───────────────────────────┐
                                                            │ Autonomous Follow-up Agent│
                                                            └───────────────────────────┘

─────────────────────────────────────────────────────────────────────────────────────────
             SAFETY SENTINEL (CROSS-CUTTING DETERMINISTIC CIRCUIT BREAKER)
─────────────────────────────────────────────────────────────────────────────────────────
```

1. **Intake & Triage Agent:** Conducts empathetic conversational intake, administers non-diagnostic clinical screeners (PHQ-9/GAD-7 proxies), and identifies presenting concerns.
2. **Support Pathway Agent:** Evaluates member preferences and distress severity to assign the optimal care tier.
3. **Wellbeing Companion Agent:** Guides self-paced exercises, somatic breathing, reflective journaling, and psychoeducational modules.
4. **Peer Matching Agent:** Queries active, trained volunteer listener pools based on topic, language, and communication style.
5. **Care Coordination Agent:** Searches verified clinical therapist registries, validates licensing and availability, and coordinates booking intents.
6. **Autonomous Follow-up Agent:** Schedules long-term check-ins, tracks longitudinal wellbeing progress, and adjusts support pathways.
7. **Safety Sentinel Agent:** Continuous, real-time crisis detection circuit breaker that triggers safety operations when acute risk signals are detected.

---

## 5. MCP Tool Ecosystem

Agents interact with the MindSpace platform through Model Context Protocol (MCP) servers:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           MINDSPACE MCP TOOL SUITES                           │
├─────────────────────┬───────────────────┬───────────────────┬─────────────────┤
│     Intake MCP      │   Listener MCP    │   Scheduling MCP  │   Safety MCP    │
├─────────────────────┼───────────────────┼───────────────────┼─────────────────┤
│ • record_intake_    │ • query_available_│ • query_provider_ │ • trigger_crisis│
│   response          │   listeners       │   availability    │   escalation    │
│ • calculate_triage_ │ • request_listener│ • reserve_session_│ • fetch_local_  │
│   score             │   match           │   slot            │   hotlines      │
│ • update_care_tier  │ • poll_assignment_│ • dispatch_booking│ • create_safety_│
│                     │   status          │   confirmation    │   incident_case │
└─────────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

---

## 6. Stateful Session Checkpointing & Resumability

A key differentiator of the LangGraph Central StateGraph engine is **workflow persistence**:

```
[Agent initiates match via Listener MCP]
                 │
                 ▼
[Save state checkpoint to PostgreSQL/Redis]
                 │
                 ▼
[Suspend Agent Execution: Status = AWAITING_HUMAN_ACCEPTANCE]
                 │
       (Minutes or Hours Pass)
                 │
[Listener accepts session in Listener Hub]
                 │
                 ▼
[Event Trigger: ListenerAcceptedEvent]
                 │
                 ▼
[LangGraph rehydrates checkpoint from memory]
                 │
                 ▼
[Agent resumes execution loop & notifies member]
```

This prevents wasted tokens and keeps long-running human-in-the-loop coordination stable across browser sessions and network disconnects.

---

## 7. The 5 Core Role Dashboards

MindSpace provides dedicated web workspaces built with Next.js 16 (16.2.4) / React 19 (19.2.4) and Tailwind CSS:

```
Frontend Base URL: http://localhost:4000/en
```

| Route | Target Audience | Primary Operational Page & Functionality |
|---|---|---|
| `/en/mindspace/member` | Members | **Member Wellbeing Sanctuary**: Personal care space, mood check-ins, encrypted journals, habit goals, consultation room. |
| `/en/mindspace/member/mood` | Members | **Daily Mood Check-in**: Longitudinal 1-10 valence tracking and sentiment trend. |
| `/en/mindspace/member/journal` | Members | **Encrypted Reflection Journal**: AES-256-GCM encrypted private reflections. |
| `/en/mindspace/member/goals` | Members | **Personal Wellbeing Goals**: Micro-habits and progress tracking in PostgreSQL. |
| `/en/mindspace/member/consultation`| Members | **Live Consultation Room**: Multi-stage peer room (Media check & ringing -> Live video/audio + 4-7-8 Somatic breathwork pacer + in-call private chat -> Post-call reflection, mood sync, and encrypted journal logging). |
| `/en/mindspace/listener` | Volunteer Listeners | **Consultations & Live Queue**: Active peer queue, incoming call acceptance, live session room with in-call SOAP note drafting, safety escalation, and mandatory volunteer cooldown breather (US-015). |
| `/en/mindspace/listener/members` | Volunteer Listeners | **Member Records & SOAP**: Review past encounter histories and confidential post-session SOAP documentation. |
| `/en/mindspace/listener/profile` | Volunteer Listeners | **Practice Profile & Settings**: Manage listener verification level, languages, focus specialties, and concurrent roster capacity limit. |
| `/en/mindspace/listener-supervisor` | Listener Supervisors | **Listener Supervision & Quality Governance**: Supervisor sanctuary overview with metrics, pod schedule, and active status. |
| `/en/mindspace/listener-supervisor/listeners` | Listener Supervisors | **Pod Roster & Eligibility Oversight (US-031)**: Volunteer listener readiness, workload capacity, and eligibility toggles (Eligible / Review Due / Suspended). |
| `/en/mindspace/listener-supervisor/conduct-reports`| Listener Supervisors | **Conduct & Boundary Audits (US-031)**: Review member-reported boundary concerns, audit flagged encounters, and record supervisor resolution decisions. |
| `/en/mindspace/listener-supervisor/training-reviews`| Listener Supervisors | **Training Signoffs & Pods (US-018 / US-031)**: Audit CEU completions, sign off Safeguarding V2 credentials, and manage supervision pod schedules. |
| `/en/mindspace/safety-operations` | Crisis & Safety Responders | **Safety Operations & Crisis Response**: Human-led crisis escalation triage, emergency handoffs, zero-exposure incident records (+91 9999 666 555 Tele-MANAS, AASRA, 112/988). |
| `/en/mindspace/platform-administrator` | System Administrators | **Platform Administration**: Zero-Knowledge mode, RBAC directory, service health telemetry, cryptographic audit logs, KMS key rotation tracking. |

---

## 8. Technology Stack Summary

| Layer | Technologies Used | Key Responsibilities |
|---|---|---|
| **Frontend Web** | Next.js 16 (16.2.4) (App Router), React 19 (19.2.4), Tailwind CSS, TypeScript, BetterAuth Client | Member & Staff workspaces, responsive Clean Architecture UI, i18n routing (`/en`) |
| **API Backend** | Python 3.12+, FastAPI, Uvicorn, SQLAlchemy (Async), Pydantic, asyncpg | Python REST API under `/api/v1` and `/peer`, Clean Architecture, Pydantic DTO validation, Swagger/OpenAPI docs at `/docs` |
| **Identity & Auth** | Better Auth, JWKS, Ed25519/RSA JWT | Token issuance, role claim verification, session management |
| **Database** | PostgreSQL 16 (Port 5433 / 5435) | Relational storage for intake, wellbeing, peer chats, encrypted SOAP notes, conduct audits |
| **Data Encryption** | AES-256-GCM (Application-Level via Python `cryptography`) | Envelope encryption for member intake answers, journal text, peer messages, and post-session SOAP records |
| **Agent Runtime** | LangGraph StateGraph (Port 8018) | Stateful multi-agent state machine, MCP clients, session checkpointing |
| **Voice / Speech** | Python, FastAPI, WebSocket, Sarvam STT/TTS | Low-latency streaming voice agent for accessible intake |

---

## 9. Operational Commands Reference

### Starting the Platform with Docker / Local Services

```powershell
# 1. Start MindSpace Python FastAPI Backend API (Port 8080) & Database (Port 5433)
cd D:\Mindspace\backend\mindspace-fastapi
# Local run with uv:
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
# Or run with Docker:
# docker compose up -d

# 2. Start IAM Server & Database (Ports 5001, 5430)
cd D:\Mindspace\backend\mindspace-iam-py
docker compose -f docker-compose.dev.yml up -d

# 3. Start AI Voice Agents Service (Port 8018)
cd D:\Mindspace\agents
docker compose up -d

# 4. Start Frontend Dev Server (Port 4000)
cd D:\Mindspace\frontend
pnpm dev
```

### Verified Health & Documentation Endpoints

- **Frontend:** [http://localhost:4000/en](http://localhost:4000/en)
- **Backend Swagger API Docs:** [http://localhost:8080/docs](http://localhost:8080/docs) (and [http://localhost:8080/redoc](http://localhost:8080/redoc))
- **Backend Ready Probe:** [http://localhost:8080/health/ready](http://localhost:8080/health/ready)
- **Agents Swagger API Docs:** [http://localhost:8018/docs](http://localhost:8018/docs)
- **IAM Auth Server:** [http://localhost:5001](http://localhost:5001)

---

## 10. Key Directory Map

```
D:\Mindspace
├── agents/                       # Voice & chat agent service (LangGraph StateGraph, FastAPI, Docker)
├── backend/
│   ├── mindspace-fastapi/        # Core MindSpace Python FastAPI backend (Port 8080, Clean Architecture, SQLAlchemy, Pydantic)
│   │   ├── app/                  # Application code (core, models, schemas, services, routers, main.py)
│   │   ├── pyproject.toml        # Dependencies managed via uv (Python 3.12+)
│   │   └── Dockerfile            # Container definition
│   ├── mindspace-iam-py/         # Identity & Access Management service (Port 5001, Ed25519 JWT, JWKS)
│   ├── fhir-server/              # Auxiliary FHIR R4 REST API service (Port 8000)
│   ├── fhir-mcp/                 # FastMCP interoperability gateway (Port 8002)
│   ├── fhir-gql/                 # FHIR middleware GraphQL / REST service (Port 8001)
│   └── fhir-staging/             # FHIR staging & clinical document ingestion pipeline
├── frontend/
│   ├── src/
│   │   ├── app/[locale]/(mindspace)/mindspace/ # 5 Role workspaces & sub-pages (Next.js 16 / React 19)
│   │   ├── modules/client/mindspace/          # Clean Architecture role components
│   │   ├── modules/server/mindspace/          # Backend API integration clients
│   │   └── proxy.ts                           # Route proxy & asset bypass configuration
└── docs/                         # Platform documentation & architecture specifications (17 documents)
    ├── AGENT-EVALUATION-AND-TESTING.md      # Evaluation metrics, safety benchmarks & chaos tests
    ├── AGENTIC-FRAMEWORK-ARCHITECTURE.md   # Deep architectural specification
    ├── AGENTS-OPERATIONAL-PLAYBOOK.md      # Practical operational playbook for all 7 subagents
    ├── ALL-COMMANDS.md                     # Complete commands quick reference guide
    ├── API-AND-MCP-SPECIFICATION.md        # API & MCP tool specifications
    ├── BUSINESS-REQUIREMENT-DESIGN.md      # Business requirements document
    ├── DATABASE-SCHEMA.md                  # Relational database schema reference
    ├── ER-DIAGRAM.mmd                      # Mermaid entity relationship diagram
    ├── FEATURE-LIST.md                     # Functional & agentic feature backlog
    ├── MINDSPACE-GUIDE.md                  # Complete architectural & operational guide
    ├── MINDSPACE-MENTAL-HEALTH-ER-DIAGRAM.png # Mental health domain visual ER diagram
    ├── MINDSPACE-WELLBEING-ER-DIAGRAM.png  # Wellbeing domain visual ER diagram
    ├── MINDSPACE_BACKEND_SYSTEM_DESIGN_DOCUMENT_SDD_V1.pdf # Backend System Design Document
    ├── MULTI-AGENT-SYSTEM-ARCHITECTURE.md  # Multi-agent system architecture & LangGraph design
    ├── SECURITY-PRIVACY-GUARDRAILS.md      # Security & privacy guardrails
    ├── SYSTEM-REQUIREMENT-DESIGN.md        # Technical specifications & design rules
    └── USER-STORIES.md                     # Product user stories with acceptance criteria
```
