# MindSpace — Security, Privacy & Clinical Safety Guardrails

## 1. Clinical Safety & Non-Diagnostic Boundary

### 1.1 Non-Diagnostic Disclaimer Standard
MindSpace is a non-clinical emotional wellbeing and care coordination platform. It explicitly separates non-clinical peer support from licensed healthcare.

* **Mandatory System Prompt Constraint:**  
  * "You are MindSpace, an empathetic care coordinator. You are NOT a medical doctor, psychiatrist, or licensed clinical psychologist. You MUST NEVER diagnose conditions (e.g. 'You have Major Depressive Disorder'), prescribe pharmaceutical interventions, or advise stopping prescribed medication."
* **User-Facing Disclosure:** Displayed on every intake screener, chat workspace, and voice interaction:
  > *"MindSpace provides non-clinical wellbeing support and care coordination. If you are experiencing a medical emergency, acute crisis, or severe distress, please call emergency services (911/999/112) or call/text 988 immediately."*

---

## 2. Deterministic Safety Circuit Breaker (Zero-LLM Latency)

### 2.1 The Problem with Stochastic Safety
Large Language Models are probabilistic. Under jailbreaks, adversarial phrasing, or stochastic variance, an LLM might attempt to counsel a member through active suicidal ideation rather than escalating to emergency care.

### 2.2 The Deterministic Interceptor Architecture
The Safety Sentinel operates as a **deterministic regex and lexical matcher running in the Python FastAPI network gateway / middleware** *before* any prompt reaches an LLM:

```
[Incoming User Message]
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  PYTHON FASTAPI GATEWAY: DETERMINISTIC SAFETY SENTINEL │
│  • Compiles pre-evaluated Regex and Lexical Rules      │
│  • Latency < 2ms (Zero Model Inference Delay)          │
└──────────────────────────┬─────────────────────────────┘
                           │
                 Risk Pattern Detected?
                           │
              ┌────────────┴────────────┐
              ▼ YES                     ▼ NO
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ CIRCUIT BREAKER TRIPS OPEN  │ │ DISPATCH TO LANGGRAPH ORCH. │
│ • Drop LLM generation loop  │ │ • Empathetic triage         │
│ • Return emergency hotlines │ │ • Stepped-care coordination │
│ • Push case to Safety Hub   │ │ • Peer listener matching    │
└─────────────────────────────┘ └─────────────────────────────┘
```

### 2.3 Trigger Dictionary Categories
1. **Active Suicidal Ideation:** Lexical patterns matching `kill myself`, `end my life`, `suicide plan`, `want to die`, `hang myself`, `overdose pills`.
2. **Imminent Self-Harm:** Lexical patterns matching `cut my wrists`, `burn myself`, `self-mutilation`.
3. **Third-Party Violence / Threat:** Lexical patterns matching explicit intent to harm others or domestic abuse emergencies.

When tripped:
* HTTP Status: `200 OK` (User receives an immediate warm empathetic safety card with 988 Lifeline and Crisis Text Line 741741).
* Backend Action: Generates an urgent `safety_case` record with priority `EMERGENCY` assigned to the `/en/mindspace/safety-operations` dashboard.

---

## 3. PII Scrubbing & Redaction Pipeline

Before any conversational context is dispatched to external LLM providers (e.g., Gemini, OpenAI, Claude), the context traverses an in-memory PII sanitization filter:

| Data Type | Detection Method | Redaction Replacement |
|---|---|---|
| **Email Addresses** | RFC 5322 Regex | `[EMAIL_REDACTED]` |
| **Phone Numbers** | E.164 & International Regex | `[PHONE_REDACTED]` |
| **Street Addresses** | Named Entity Recognition (NER) | `[ADDRESS_REDACTED]` |
| **Government IDs / SSN** | Luhn & Regex | `[ID_REDACTED]` |
| **Payment Card Numbers** | Luhn Algorithm | `[CARD_REDACTED]` |

---

## 4. Application-Level AES-256-GCM Envelope Encryption

MindSpace implements cryptographic field encryption at the application layer (`backend/mindspace-fastapi/app/core/security.py` using Python `cryptography.hazmat.primitives.ciphers.aead.AESGCM`) to protect member privacy against database breaches or unauthorized database administrator access.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AES-256-GCM ENCRYPTION PAYLOAD                        │
├─────────────────────┬───────────────────┬───────────────────────────────────┤
│ Field               │ Size              │ Description                       │
├─────────────────────┼───────────────────┼───────────────────────────────────┤
│ `keyVersion`        │ 2 - 4 bytes       │ Keyring identifier (e.g., "v1")   │
│ `iv`                │ 12 bytes          │ Cryptographic Initialization Vector│
│ `authTag`           │ 16 bytes          │ GCM Authentication Tag            │
│ `ciphertext`        │ Variable          │ Encrypted binary content          │
└─────────────────────┴───────────────────┴───────────────────────────────────┘
```

### 4.1 Implementation Standard
* **Cipher:** `aes-256-gcm` (Authenticated Galois/Counter Mode).
* **Key Size:** Exactly 256 bits (32 bytes), decoded from Base64.
* **IV:** 12 random bytes generated per write using `crypto.randomBytes(12)`. IVs are **never reused**.
* **Integrity Tag:** 16-byte authentication tag generated by OpenSSL. Prevents ciphertext tampering.
* **Key Rotation:** Keys are managed via `INTAKE_ENCRYPTION_KEYS_JSON`:
  ```json
  {
    "v1": "ZuJf+l5X2fCosUHqi/CMxhkTOjIRou/VqXkknXOGCPs=",
    "v2": "NewRotatedKeyBase64StringHere32BytesLong="
  }
  ```
  New records are always written with the latest version; historical records remain readable using their embedded `keyVersion` header.

---

## 5. Principle of Zero Direct Database Access for AI

To prevent SQL injection, model confusion, and unintended data leakage:

1. **No Database Drivers in Agent Services:** The `agents` container and LangGraph orchestrator runtime do not import `asyncpg`, `sqlalchemy`, or database connection pools.
2. **Typed Gateways Only:** All reads and writes must pass through validated MCP tools or REST endpoints.
3. **Caller Identity Verification:** Every MCP invocation extracts the authenticated caller identity (`sub`, `roleCodes`) from the JWT. The agent cannot spoof a member's ID or access another member's records.
4. **Audit Trail:** Every agent tool invocation produces an immutable record in the `audit_events` table recording:
   * `actor_id` (Agent service principal UUID)
   * `target_entity_id` (Record modified)
   * `action` (e.g., `SCHEDULE_CHECKIN`, `QUERY_LISTENERS`)
   * `timestamp` (UTC instant)

