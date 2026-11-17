# MindSpace — API & Model Context Protocol (MCP) Specification

## 1. Authentication & Protocol Baseline

### 1.1 HTTP REST Baseline (`/api/v1/*`)
* **Backend Implementation:** Python 3.12+ / FastAPI modular clean architecture (`backend/mindspace-fastapi`)
* **Base URL:** `http://localhost:8080/api/v1`
* **Interactive OpenAPI / Swagger Documentation:** [http://localhost:8080/docs](http://localhost:8080/docs) (ReDoc: [http://localhost:8080/redoc](http://localhost:8080/redoc))
* **Transport:** HTTPS (TLS 1.3) / HTTP during local dev
* **Authorization:** `Authorization: Bearer <JWT_TOKEN>` issued by Better Auth IAM (`http://localhost:5001`).
* **Content Type:** `application/json; charset=utf-8`
* **Common Request Headers:**
  * `x-correlation-id`: UUIDv4 tracking a single request across distributed services.
  * `x-idempotency-key`: UUIDv4 ensuring state-altering requests (`POST`, `PUT`, `PATCH`) are processed at most once.

### 1.2 Model Context Protocol (MCP) Baseline
* **Transports:** `stdio` (local subprocess), `SSE` / `HTTP` (FastMCP gateway on port `8002`, Agent orchestrator on port `8018`, Core API on port `8080`).
* **Format:** JSON-RPC 2.0.
* **Security Rule:** Agents **never** hold raw database credentials. Every MCP tool execution validates the caller's JWT claims (`sub`, `roleCodes`, `tenantId`) and executes via authorized Python FastAPI service controllers.

---

## 2. Model Context Protocol (MCP) Tool Contracts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MINDSPACE MCP SERVERS                             │
├───────────────────────┬─────────────────────────┬───────────────────────────┤
│ Server Name           │ Primary Purpose         │ Handled Domain Entities   │
├───────────────────────┼─────────────────────────┼───────────────────────────┤
│ `mindspace-intake`    │ Conversational Triage   │ Intake, Screeners, Consent│
│ `mindspace-listener`  │ Peer Volunteer Support  │ Listeners, Matches, Chats │
│ `mindspace-scheduling`│ Professional Clinicians │ Providers, Slots, Bookings│
│ `mindspace-safety`    │ Crisis Circuit Breaker  │ Safety Cases, Hotlines    │
└───────────────────────┴─────────────────────────┴───────────────────────────┘
```

### 2.1 `mindspace-intake` Server

#### Tool: `create_intake_session`
Initializes a secure, encrypted intake session for a member.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "member_id": { "type": "string", "format": "uuid" },
      "channel": { "type": "string", "enum": ["text", "voice"] },
      "locale": { "type": "string", "default": "en" }
    },
    "required": ["member_id", "channel"]
  }
  ```
* **Output Schema:**
  ```json
  {
    "intake_session_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "in_progress",
    "encryption_key_version": "v1",
    "created_at": "2026-11-09T12:00:00Z"
  }
  ```

#### Tool: `record_member_consent`
Records explicit, purpose-bounded consent from the member before capturing or sharing sensitive feelings.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "member_id": { "type": "string", "format": "uuid" },
      "purpose_codes": {
        "type": "array",
        "items": { "type": "string", "enum": ["peer_support_matching", "ai_wellbeing_analysis", "clinical_referral"] }
      },
      "consent_state": { "type": "string", "enum": ["granted", "declined"] }
    },
    "required": ["member_id", "purpose_codes", "consent_state"]
  }
  ```
* **Output Schema:**
  ```json
  {
    "consent_record_ids": ["c1a2b3c4-0000-0000-0000-000000000001"],
    "status": "recorded",
    "audit_timestamp": "2026-11-09T12:00:05Z"
  }
  ```

#### Tool: `submit_encrypted_intake`
Encrypts structured intake narratives in application memory with AES-256-GCM before writing to PostgreSQL.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "intake_session_id": { "type": "string", "format": "uuid" },
      "distress_narrative": { "type": "string" },
      "phq9_screener_score": { "type": "integer", "minimum": 0, "maximum": 27 },
      "gad7_screener_score": { "type": "integer", "minimum": 0, "maximum": 21 }
    },
    "required": ["intake_session_id", "distress_narrative"]
  }
  ```
* **Output Schema:**
  ```json
  {
    "intake_response_id": "a8f3b4c1-1234-5678-90ab-cdef12345678",
    "storage_status": "encrypted_and_stored",
    "key_version": "v1"
  }
  ```

---

### 2.2 `mindspace-listener` Server

#### Tool: `get_eligible_listeners`
Queries the active volunteer listener pool filtered by language, topic, and availability status.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "language": { "type": "string", "default": "en" },
      "topics": { "type": "array", "items": { "type": "string" } },
      "exclude_listener_ids": { "type": "array", "items": { "type": "string", "format": "uuid" } }
    },
    "required": ["language"]
  }
  ```
* **Output Schema:**
  ```json
  {
    "eligible_count": 3,
    "listeners": [
      {
        "listener_id": "e4f5a6b7-8901-2345-6789-0123456789ab",
        "display_name": "Sarah (Trained Listener)",
        "experience_tags": ["workplace_stress", "mindfulness"],
        "languages": ["en"],
        "empathy_rating": 4.9
      }
    ]
  }
  ```

#### Tool: `request_listener_assignment`
Dispatches a match invite to a volunteer listener and arms the asynchronous checkpointing saga.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "member_id": { "type": "string", "format": "uuid" },
      "listener_id": { "type": "string", "format": "uuid" },
      "topic_summary": { "type": "string" }
    },
    "required": ["member_id", "listener_id", "topic_summary"]
  }
  ```
* **Output Schema:**
  ```json
  {
    "match_request_id": "f5e4d3c2-b1a0-9876-5432-10fedcba9876",
    "request_state": "queued",
    "workflow_action": "SUSPEND_UNTIL_HUMAN_RESPONSE",
    "timeout_seconds": 900
  }
  ```

---

### 2.3 `mindspace-scheduling` Server

#### Tool: `find_verified_therapists`
Discovers licensed mental health clinicians for Tier 3 care navigation.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "specialization": { "type": "string", "enum": ["clinical_depression", "generalized_anxiety", "trauma_cbt", "adhd"] },
      "jurisdiction": { "type": "string" },
      "teletherapy_only": { "type": "boolean", "default": true }
    },
    "required": ["specialization", "jurisdiction"]
  }
  ```
* **Output Schema:**
  ```json
  {
    "providers": [
      {
        "provider_id": "p1-2345-6789-0123",
        "name": "Dr. Marcus Vance, PsyD",
        "license_state": "VERIFIED_ACTIVE",
        "modalities": ["CBT", "ACT"],
        "next_available_slot": "2026-11-11T14:00:00Z"
      }
    ]
  }
  ```

---

### 2.4 `mindspace-safety` Server

#### Tool: `trigger_safety_escalation`
Activates an emergency safety case and alerts on-call human responders.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "member_id": { "type": "string", "format": "uuid" },
      "urgency_level": { "type": "string", "enum": ["routine", "urgent", "emergency"] },
      "trigger_signal": { "type": "string" },
      "session_channel": { "type": "string", "enum": ["intake", "peer_chat", "journal"] }
    },
    "required": ["member_id", "urgency_level", "trigger_signal"]
  }
  ```
* **Output Schema:**
  ```json
  {
    "safety_case_id": "case-999-urgent-44",
    "status": "escalated_to_human_queue",
    "circuit_breaker": "TRIPPED_OPEN",
    "hotline_resources": [
      { "name": "988 Suicide & Crisis Lifeline", "phone": "988", "available": "24/7" },
      { "name": "Crisis Text Line", "text": "HOME to 741741", "available": "24/7" }
    ]
  }
  ```

---

## 3. Core REST API Endpoints (`backend/mindspace-fastapi`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health/ready` | Readiness and database connectivity probe | No |
| `GET` | `/health/live` | Process liveness probe | No |
| `GET` | `/docs` | Interactive Swagger UI (OpenAPI 3.1) | No |
| `GET` | `/redoc` | ReDoc API documentation | No |
| `GET` | `/api/v1/me` | Fetch caller principal details & active roles | Yes (`Bearer JWT`) |
| `POST` | `/api/v1/members/me/provision` | Provision initial member identity & preferences | Yes (`Bearer JWT`) |
| `GET` | `/api/v1/members/me/summary` | Aggregate dashboard stats, mood streak & check-ins | Yes (`member`) |
| `POST` | `/api/v1/intakes/sessions` | Initialize a secure, encrypted intake session | Yes (`member`) |
| `POST` | `/api/v1/intakes/responses` | Save encrypted intake screener responses (AES-256-GCM) | Yes (`member`, `ai_agent`) |
| `GET` | `/api/v1/intakes/sessions/{id}/recommendations` | Get assigned care tier & support recommendation | Yes (`member`) |
| `GET` | `/api/v1/wellbeing/moods` | Retrieve member's longitudinal mood logs | Yes (`member`) |
| `POST` | `/api/v1/wellbeing/moods` | Record daily mood check-in with valence score | Yes (`member`) |
| `GET` | `/api/v1/wellbeing/journals` | Fetch encrypted reflection journal entries | Yes (`member`) |
| `POST` | `/api/v1/wellbeing/journals` | Store AES-256-GCM encrypted reflection journal | Yes (`member`) |
| `GET` | `/api/v1/wellbeing/goals` | List member wellbeing micro-goals | Yes (`member`) |
| `POST` | `/api/v1/wellbeing/goals` | Create a new wellbeing habit/goal | Yes (`member`) |
| `POST` | `/api/v1/peer/match-requests` | Initiate a peer listener matching request | Yes (`member`, `ai_agent`) |
| `GET` | `/api/v1/peer/match-requests/active` | Query active listening queue for peer listeners | Yes (`listener`) |
| `POST` | `/api/v1/peer/match-requests/{id}/accept` | Volunteer listener accepts match request | Yes (`listener`) |
| `POST` | `/api/v1/peer/conversations/{id}/messages` | Send encrypted peer-to-peer support message | Yes (`member`, `listener`) |
| `POST` | `/api/v1/peer/conversations/{conversation_id}/soap` | Save confidential, encrypted SOAP note (AES-256-GCM) into PostgreSQL | Yes (`listener`) |
| `PUT` | `/api/v1/peer/conversations/{conversation_id}/close` | Formally close consultation session in database | Yes (`listener`) |
| `PUT` | `/api/v1/peer/listeners/me` | Update listener capacity limit, languages, and profile | Yes (`listener`) |
| `GET` | `/api/v1/supervisors/pod/listeners` | List supervised pod listeners with readiness, review status & capacity | Yes (`listener-supervisor`) |
| `PUT` | `/api/v1/supervisors/pod/listeners/{id}/eligibility` | Update listener eligibility state (`eligible`, `review_required`, `suspended`) | Yes (`listener-supervisor`) |
| `GET` | `/api/v1/supervisors/pod/conduct-reports` | Retrieve flagged boundary audits & member reports | Yes (`listener-supervisor`) |
| `PUT` | `/api/v1/supervisors/pod/conduct-reports/{id}/resolve` | Record supervisor conduct resolution decision & audit notes | Yes (`listener-supervisor`) |
| `GET` | `/api/v1/supervisors/pod/training-reviews` | Retrieve CEU modules & Safeguarding V2 credentials awaiting audit | Yes (`listener-supervisor`) |
| `PUT` | `/api/v1/supervisors/pod/training-reviews/{id}/verify` | Sign off CEU credential and mark verified in PostgreSQL | Yes (`listener-supervisor`) |
| `GET` | `/api/v1/safetys` | List and review active safety officer incident cases and stats | Yes (`safety_operations_specialist`) |

