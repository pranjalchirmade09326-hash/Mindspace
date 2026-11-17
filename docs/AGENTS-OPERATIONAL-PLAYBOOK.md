# 🤖 MindSpace — Agents Operational Playbook & Usage Guide

This document is the definitive operational and developer guide for all **7 Specialized Subagents** within MindSpace: **When each agent triggers, how they communicate, which Model Context Protocol (MCP) tools they execute, and how to invoke and test them during implementation.**

---

## 🧭 1. Complete Multi-Agent Topology at a Glance

```
                              ┌──────────────────────────┐
                              │    Care Orchestrator     │
                              │   (Supervisor Pattern)   │
                              └────────────┬─────────────┘
                                           │
         ┌───────────────────┬─────────────┴─────────────┬───────────────────┐
         ▼                   ▼                           ▼                   ▼
┌─────────────────┐ ┌─────────────────┐         ┌─────────────────┐ ┌─────────────────┐
│ 1. Intake Agent │ │2. Pathway Agent │         │4. Matching Agent│ │6. Follow-up Ag. │
└────────┬────────┘ └────────┬────────┘         └────────┬────────┘ └─────────────────┘
         ▼                   ▼                           ▼
┌─────────────────┐ ┌─────────────────┐         ┌─────────────────┐
│3. Wellbeing Ag. │ │5. Care Coord Ag │         │7. Safety Sentinel│
└─────────────────┘ └─────────────────┘         └─────────────────┘
```

| Agent Name | Primary Responsibility | Trigger / Entrypoint | Tools Allowed (MCP) | Destination / Output |
|---|---|---|---|---|
| **1. Intake & Triage Agent** | Conversational onboarding, screener extraction (PHQ-9/GAD-7 proxies) | Member initiates chat/voice intake (`POST /api/v1/intakes/sessions`) | `create_intake_session`, `record_intake_response` | Encrypted Screener Payload |
| **2. Support Pathway Agent** | Distress classification & Stepped-Care Tier assignment | Intake session completes | `calculate_triage_score`, `update_care_tier` | Assigned Tier (`tier_1`, `tier_2`, `tier_3`) |
| **3. Wellbeing Companion** | Self-guided CBT grounding, reflective journaling, breathing | Member enters Member Sanctuary (`/en/mindspace/member`) | `record_mood`, `save_journal_entry` | Reflection summary & Streak |
| **4. Peer Matching Agent** | Listener discovery, invitation dispatch, wait for human acceptance | Member selects Peer Support (Tier 2) | `query_available_listeners`, `request_listener_match` | Checkpoint saved; awaits human listener |
| **5. Care Coordination Agent**| Licensed therapist registry search & video booking intent | Member selects Professional Care (Tier 3) | `query_provider_availability`, `reserve_session_slot` | Calendar booking confirmation |
| **6. Autonomous Follow-up** | Scheduled check-ins at 24h, 72h, 7-day intervals | Post-session or recurring cron trigger | `schedule_checkin`, `fetch_wellbeing_trajectory` | Push notification / Check-in card |
| **7. Safety Sentinel Agent** | Immediate crisis keyword interceptor (Zero-LLM Latency) | Every incoming text message before LLM inference | `trigger_crisis_escalation`, `fetch_local_hotlines` | Emergency card (988) + Safety Ops case |

---

## 🔄 2. End-to-End Stepped Care Agent Workflow

```
[Member enters platform]
          │
          ▼
[1. Intake Agent] ───► Administers conversational screening (Text or Streaming Voice)
          │
          ▼
[7. Safety Sentinel Interceptor] (Parallel Check)
     ├──► Crisis Detected? ──► YES: Halt LLM ──► 988 Hotlines + Safety Ops Alert
     └──► NO Crisis
          │
          ▼
[2. Support Pathway Agent] ───► Evaluates screener & assigns Care Tier:
     ├──► TIER 1: Guided Self-Help  ──► Dispatches to [3. Wellbeing Companion]
     ├──► TIER 2: Peer Listening    ──► Dispatches to [4. Peer Matching Agent]
     └──► TIER 3: Professional Care ──► Dispatches to [5. Care Coordination Agent]
          │
          ▼
[Post-Interaction] ───► [6. Autonomous Follow-up Agent] (24h/72h Check-in Saga)
```

---

## 🛠️ 3. How to Use & Implement Each Agent (Step-by-Step)

### Agent 1: Intake & Triage Agent
* **Role:** Engages the member empathetically, understands their primary emotional concerns, and extracts screener scores without medical diagnosis.
* **How to Call (HTTP REST Endpoint):**
  ```bash
  POST http://localhost:8080/api/v1/intakes/sessions
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

  {
    "channel": "text",
    "locale": "en"
  }
  ```
* **Agent Response Flow:**
  The agent inquires about emotional wellbeing, sleep patterns, and current stress. Every answer is encrypted in application memory with **AES-256-GCM** before saving to PostgreSQL:
  ```bash
  POST http://localhost:8080/api/v1/intakes/responses
  {
    "session_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "question_key": "mood_valence",
    "response_text": "Feeling anxious about upcoming exams"
  }
  ```

---

### Agent 2: Support Pathway Planning Agent
* **Role:** Evaluates screener responses against governed clinical triage thresholds to assign the appropriate care tier:
  - `tier_1`: Mild distress -> Self-guided wellbeing tools & journaling
  - `tier_2`: Moderate distress -> Verified volunteer peer listener
  - `tier_3`: Severe distress -> Licensed professional therapist
* **Agent Tool Call (MCP):**
  ```json
  {
    "tool": "update_care_tier",
    "arguments": {
      "session_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "recommended_tier": "tier_2",
      "triage_score": 14,
      "reasoning": "Member expressed moderate loneliness and requested peer human accompaniment."
    }
  }
  ```

---

### Agent 3: Wellbeing Companion Agent
* **Role:** Guides daily reflections, somatic 4-7-8 breathing exercises, and mood tracking inside the Member Sanctuary.
* **How to Use via Backend:**
  - **Mood Check-in:**
    ```bash
    POST http://localhost:8080/api/v1/wellbeing/moods
    {
      "score": 4,
      "energy": 3,
      "tags": ["reflective", "calm"],
      "note": "Took a refreshing morning walk"
    }
    ```
  - **Encrypted Journal Reflection:**
    ```bash
    POST http://localhost:8080/api/v1/wellbeing/journals
    {
      "title": "Evening Reflections",
      "content": "Grateful for small wins and mindful moments today.",
      "prompt_id": "gratitude_daily"
    }
    ```

---

### Agent 4: Peer Listener Matching Agent (Stateful Suspend-and-Resume)
* **Role:** Discovers active, trained volunteer listeners and manages the asynchronous matching lifecycle.
* **The Long-Running Saga (Human-in-the-Loop):**
  ```
  Step 1: Agent invokes 'request_listener_match'
            │
  Step 2: Execution State serialized to PostgreSQL checkpoint
            │
  Step 3: Agent enters SUSPENDED state (Zero compute / zero wasted tokens)
            │
       (15 minutes pass while volunteer listener reviews notification)
            │
  Step 4: Volunteer clicks "Accept Match" in Listener Hub (/en/mindspace/listener)
            │
  Step 5: POST /api/v1/peer/match-requests/{id}/accept
            │
  Step 6: Domain Event awakens Agent -> Checkpoint rehydrates -> Member notified!
  ```
* **Payload to Initiate Match:**
  ```bash
  POST http://localhost:8080/api/v1/peer/match-requests
  {
    "category": "academic_stress",
    "preferred_language": "en"
  }
  ```

---

### Agent 5: Care Coordination Agent (Clinical Navigation)
* **Role:** Searches the verified directory of licensed therapists, verifies jurisdictional licensing, and captures booking intent.
* **Tool Call (MCP):**
  ```json
  {
    "tool": "query_provider_availability",
    "arguments": {
      "specialization": "Anxiety & Stress",
      "jurisdiction": "IN-MH",
      "date_range": "2026-11-15:2026-11-20"
    }
  }
  ```

---

### Agent 6: Autonomous Follow-up Agent
* **Role:** Schedules delayed, consent-driven check-ins at 24-hour and 7-day intervals post-session to monitor recovery trajectory.
* **Background Trigger:** Scheduled via Cron / Temporal workflow activity.
* **Result:** Surfaces a personalized "How are you feeling today?" reflection card on the member dashboard.

---

### Agent 7: Deterministic Safety Sentinel (Circuit Breaker)
* **Role:** Intercepts self-harm, suicidal ideation, or violence keywords **instantly bypassing LLM text generation** (<2ms latency).
* **Execution Boundary:** Python FastAPI Gateway Middleware (`app/core/security.py`).
* **Trigger Phrases:** `kill myself`, `end my life`, `suicide`, `cut myself`, `want to die`.
* **Immediate Response:**
  1. Member receives an empathetic, non-LLM safety card with:
     - **988 Suicide & Crisis Lifeline** (Call/Text 988)
     - **Crisis Text Line** (Text HOME to 741741)
     - **Vandrevala Foundation Helpline** (India: 9999 666 555)
  2. Creates a prioritized `safety_case` record routed immediately to the Safety Operations Hub at [http://localhost:4000/en/mindspace/safety-operations](http://localhost:4000/en/mindspace/safety-operations).

---

## 🔐 4. Core Security Rules for Agents

1. **Zero Direct Database Access:**
   Agents never receive direct PostgreSQL connection strings or SQL credentials. All data exchanges occur strictly via typed **MCP tools** or authorized **FastAPI REST endpoints**.
2. **Strict Identity Claims:**
   Every agent execution includes a Better Auth JWT Bearer token with the claim `role: "ai_agent_service"` or caller identity `sub`. Agents cannot forge identities or access unauthorized member records.
3. **Application-Level Encryption:**
   Intake responses and personal journal entries are encrypted with AES-256-GCM in Python memory before persistence. Database administrators and raw SQL query logs never see plaintext member narratives.

---

## 🧪 5. Local Execution & Testing Commands

### Start the Agents Container
```powershell
cd D:\Mindspace\agents
docker compose up -d
# Stream container logs:
docker compose logs -f mindspace-agents
```

### Agents Interactive Swagger Documentation
Open in browser: **[http://localhost:8018/docs](http://localhost:8018/docs)**

### Run Python Backend & Agent Contract Tests
```powershell
cd D:\Mindspace\backend\mindspace-fastapi
# Execute test suites:
uv run pytest -v
```
