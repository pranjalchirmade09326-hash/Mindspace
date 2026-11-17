# 🧠 MindSpace

Enterprise peer-support, emotional wellbeing, and stepped-care mental health platform.

---

## 📖 Overview

MindSpace is a resilient, privacy-first mental health and peer support ecosystem. It connects members with verified peer listeners, provides non-clinical AI wellbeing companions (dual-language voice interaction, encrypted journaling, somatic reflections, mood tracking, and goal check-ins), coordinates clinical supervision, and enforces deterministic crisis safety screening before any AI processing.

---

## 🛠️ Technology Stack

| Layer | Technologies & Frameworks |
|---|---|
| **Frontend Web App** | **Next.js 16 (App Router)**, **React 19**, TypeScript, Tailwind CSS, Radix UI, Lucide React, Sonner, Turbopack |
| **Audio & Voice Client** | **Web Audio API** (AudioWorklet PCM-16 resampler @ 16 kHz), **Web Speech API** (`SpeechRecognition` & `SpeechSynthesis` for Hindi/English), AudioContext Autoplay Unblocker |
| **Engine 3 (Core Health API)** | **Python 3.12**, **FastAPI**, **PostgreSQL** (Port 5433), SQLAlchemy, asyncpg, Pydantic v2, Clean Architecture, **AES-256-GCM Envelope Encryption** |
| **Engine 2 (AI & Voice Agents)** | **LangGraph StateGraph**, **Google Gemini 2.5/Flash API**, **Sarvam AI** (`bulbul:v3` TTS & `saaras:v3` STT @ 24 kHz), WebSockets, Adaptive VAD (Energy/Silence Detection) |
| **IAM & Authentication** | **Python IAM Service** (Port 5001), RFC 7517 JWKS, Ed25519 JWT Tokens, Next.js **Better Auth**, Cookie-based Role Guards (RBAC) |
| **Frontend Database & ORM** | **PostgreSQL** (Port 5435), **Prisma ORM**, Next.js Server Actions |
| **Containerization & Ops** | **Docker**, **Docker Compose**, Uvicorn, Gunicorn, Bash / PowerShell Automation |
| **Testing & Quality Assurance** | **Vitest 2.1.8**, **ESLint 9**, Python `unittest`, AST Static Parsers, Tier 5 Adversarial Suites |

---

## 🏛️ Ecosystem Architecture & Ports

| Service Tier | Directory | Port | Description |
|---|---|---|---|
| **MindSpace Frontend** | `frontend/` | `4000` | Next.js 16 localized web app with 5 role workspaces |
| **Core Health Data API** | `backend/mindspace-fastapi/` | `8080` | Engine 3: Health records, encrypted journals, peer scheduling |
| **Multi-Agent Intelligence** | `agents/` | `8018` | Engine 2: Voice companion WebSocket (`/ws/audio`), LangGraph chat |
| **Identity Provider & IAM** | `backend/mindspace-iam-py/` | `5001` | JWT authentication and JWKS public key endpoint |
| **Core PostgreSQL** | `backend/mindspace-fastapi/` | `5433` | Primary PostgreSQL database with AES-256 encrypted tables |
| **Frontend PostgreSQL** | `frontend/` | `5435` | Localized application database managed via Prisma |

---




### 2. Docker Deployment Commands (Per-Service)

Run individual services from the repository root:

```powershell
# Core Health API & PostgreSQL (Port 8080 & 5433)
docker compose -f backend\mindspace-fastapi\docker-compose.yml up -d --build

# IAM Identity Provider (Port 5001)
docker compose -f backend\mindspace-iam-py\docker-compose.yml up -d --build

# Multi-Agent Intelligence & Voice Service (Port 8018)
docker compose -f agents\docker-compose.yml up -d --build

# Frontend Database (PostgreSQL Port 5435)
docker compose -f frontend\docker-compose.yml up -d --build
```

#### Docker Container Management:

```powershell
# Check status of running containers
docker ps

# Inspect logs of specific services
docker logs -f mindspace-agents         # Multi-Agent voice engine
docker logs -f mindspace-fastapi       # Core FastAPI engine
docker logs -f mindspace-iam           # IAM identity provider

# Stop containers while preserving database volumes
docker compose -f agents\docker-compose.yml down
docker compose -f frontend\docker-compose.yml down
docker compose -f backend\mindspace-fastapi\docker-compose.yml down
docker compose -f backend\mindspace-iam-py\docker-compose.yml down
```

---

### 3. Frontend Local Development Commands

```powershell
# Navigate to frontend directory
cd frontend

# Install package dependencies
pnpm install

# Generate & push Prisma database schema
pnpm db:generate
pnpm db:push

# Start development server on port 4000
pnpm dev

# Run static code analysis & linting (Zero errors certified)
pnpm lint

# Build production Next.js bundle
pnpm build
```

---

### 4. Automated Testing Suites (222/222 Tests Passing - 100%)

Run any or all test suites from the repository root:

```powershell
# 1. Frontend Unit Tests (127/127 tests across all 5 roles)
pnpm --dir frontend test

# 2. Master E2E Acceptance Test Suite (Tiers 1-4: 52/52 tests)
python tests/e2e/run_all_e2e.py

# 3. Tier 5 Adversarial Agents Security Suite (21/21 tests)
python tests/e2e/test_tier5_adversarial_agents.py

# 4. Tier 5 Adversarial Core Security Suite (17/17 tests)
python tests/e2e/test_tier5_adversarial_core.py

# 5. Production Rebranding Invariant Suite (20/20 tests)
python tests/e2e_rebranding_verification.py
```

---

## 👥 5-Role Dashboard Access & Demo Credentials

Navigate to **`http://localhost:4000/en/login`** for 1-click authentication into any of the 5 role workspaces:

| Role | Demo User | Route | Key Capabilities |
|---|---|---|---|
| **Member** | Sarah Chen | `/en/mindspace/member` | Wellbeing tools, mood tracking, AES-256 encrypted journal, peer booking, dual-language Voice Companion |
| **Peer Listener** | Marcus Johnson | `/en/mindspace/listener` | Peer consultations, member directory, live call room, crisis escalation & conduct reporting |
| **Listener Supervisor** | Rae Kim | `/en/mindspace/supervisor` (or `/listener-supervisor`) | Listener monitoring, pod roster oversight, conduct incident reports, eligibility verification |
| **Safety Operations** | Noor Haddad | `/en/mindspace/safety` (or `/safety-operations`) | Crisis triage cases, immediate safety intervention actions, emergency hotline routing |
| **Platform Administrator** | Admin User | `/en/mindspace/admin` (or `/platform-administrator`) | System telemetry metrics, AES-256-GCM KMS key rotation, security audit logs |

---

## 🎙️ Voice Companion Capabilities (`/en/mindspace/member/voice`)

- **Dual-Engine Speech Recognition:** Real-time microphone audio is processed concurrently by browser Web Speech API (`hi-IN` & `en-IN`) and Sarvam AI (`saaras:v3`).
- **Dual-Engine Speech Synthesis:** Spoken responses stream via Sarvam AI (`bulbul:v3`) with zero-latency browser Web SpeechSynthesis fallback so audio output is 100% guaranteed.
- **Autoplay Protection Bypass:** AudioContext instances automatically unlock upon user gesture/click on the screen.
- **Non-Interruptive VAD:** Adaptive Voice Activity Detection ensures natural 0.85s pauses without chopping conversational sentences.

---

## 🔐 Security & Data Governance

- **Zero Direct DB Access for AI:** AI models and tools have no direct database credentials; all operations route through authenticated REST API contracts.
- **Envelope Encryption (AES-256-GCM):** Member personal journals, disclosures, and session notes are encrypted in memory prior to storage in PostgreSQL.
- **Deterministic Crisis Sentinel:** Deterministic sub-2ms lexical regex interceptors trip emergency protocols prior to LLM reasoning.

---

## ⚠️ Non-Clinical Notice

MindSpace is an emotional wellness and peer support platform and is not a substitute for professional clinical treatment, formal diagnosis, or hospital emergency services. In an acute crisis, immediately call emergency services (112, 988) or the Tele-MANAS helpline (+91 9999 666 555).
