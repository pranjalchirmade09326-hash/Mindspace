# 🧠 MindSpace

Enterprise peer-support, emotional wellbeing, and stepped-care mental health platform.

## 📖 About

MindSpace connects members with trained volunteer listeners, provides non-clinical AI wellbeing tools (mood tracking, journaling, goals, reflections), coordinates professional care, and escalates crisis situations through deterministic safety screening.

It is organized into decoupled service tiers:

| Folder | What it does |
|---|---|
| `frontend/` | Next.js 16 (16.2.4) / React 19 (19.2.4) web app delivering 5 localized role workspaces (`member`, `listener`, `listener-supervisor`, `safety-operations`, `platform-administrator`) on Port 4000 |
| `backend/mindspace-fastapi/` | Engine 3: Core Health Data API (FastAPI, PostgreSQL Port 5433, Clean Architecture, AES-256-GCM envelope encryption) on Port 8080 |
| `backend/mindspace-iam-py/` | Identity Provider and RFC 7517 JWKS service issuing Ed25519 JWTs on Port 5001 |
| `agents/` | Engine 2: AI chat and streaming voice agent service (LangGraph StateGraph, LiveKit, Sarvam STT/TTS) on Port 8018 |
| `backend/fhir-server/` | Auxiliary interoperability tier: FHIR R4 clinical REST API on Port 8000 |
| `backend/fhir-mcp/` | Auxiliary interoperability tier: FastMCP dynamic tool gateway on Port 8002 (`/mcp`) |
| `backend/fhir-gql/` | Auxiliary interoperability tier: FHIR middleware service on Port 8001 |
| `backend/fhir-staging/` | Auxiliary interoperability tier: FHIR clinical document staging pipeline |

---

## 🚀 One-Click Quick Start (Windows)

Launch the entire MindSpace ecosystem with one command:

```powershell
.\START-ALL.bat
```

To gracefully terminate all running services and databases:

```powershell
.\STOP-ALL.bat
```

---

## 🐳 Docker Deployment (Per-Service)

Run from the repository root:

```powershell
docker compose -f backend\mindspace-fastapi\docker-compose.yml up -d --build
docker compose -f backend\mindspace-iam-py\docker-compose.yml up -d --build
docker compose -f frontend\docker-compose.yml up -d --build
docker compose -f agents\docker-compose.yml up -d
```

Before starting, create the `.env` files from their `.env.example` counterparts and configure necessary secrets (`BETTER_AUTH_SECRET`, `API_KEY`, `SARVAM_API_KEY`, `JINA_API_KEY`).

### Service URLs

| Service | URL |
|---|---|
| Frontend Sanctuary | http://localhost:4000/en/mindspace/member |
| Core API Swagger Docs | http://localhost:8080/docs |
| IAM Identity Provider & JWKS | http://localhost:5001/.well-known/jwks.json |
| Agent Orchestrator Docs | http://localhost:8018/docs |
| FHIR R4 Clinical Server | http://localhost:8000/docs |
| FHIR FastMCP Gateway | http://localhost:8002/mcp |

### Useful commands

```powershell
# Check status
docker compose -f frontend\docker-compose.yml ps

# Inspect Core API logs
docker compose -f backend\mindspace-fastapi\docker-compose.yml logs -f mindspace-fastapi

# Stop containers
docker compose -f agents\docker-compose.yml down
docker compose -f frontend\docker-compose.yml down
docker compose -f backend\mindspace-iam-py\docker-compose.yml down
docker compose -f backend\mindspace-fastapi\docker-compose.yml down
```

---

## 🛠️ Frontend Local Development

```powershell
cd frontend
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

Opens at http://localhost:4000/en/mindspace/member.

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm seed:test-data`.

---

## 🔐 Security & Data Governance

- **Zero Direct DB Access for AI:** AI models have no direct database credentials; all actions route through authenticated MCP tools or REST APIs.
- **Application-Level Encryption:** Sensitive disclosures (journals, intake answers, peer messages, SOAP notes) are encrypted in Python memory with AES-256-GCM before database writes.
- **Deterministic Crisis Sentinel:** Sub-2ms regex and lexical interceptors trip emergency protocols prior to LLM inference.

---

## ⚠️ Non-Clinical Notice

MindSpace is not a substitute for professional medical care, diagnosis, or clinical intervention. In an acute emergency, contact local emergency services (112, 988) or the Tele-MANAS hotline (+91 9999 666 555).
