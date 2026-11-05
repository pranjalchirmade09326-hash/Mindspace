# MindSpace — Complete Guide (Simple Language)

Ye ek hi document hai jisme MindSpace project ki saari important information hai — project kya hai, architecture, technology, commands, dashboards, aur kaam kaise karna hai.

---

## 1. Project kya hai?

**MindSpace** ek peer-support aur emotional-wellbeing platform hai. Iska high-level inspiration 7 Cups jaisa hai, lekin branding, content, aur workflows MindSpace ke apne hain.

Member (user) teen tarike se help le sakta hai:

1. **Peer emotional support** — trained volunteer "listeners" se baat karna
2. **AI-guided self-help** — journaling, mood tracking, reflections, wellbeing exercises
3. **Safety resources** — urgent help ke liye clearly marked resources (sirf tab jab staffed ho)

**Important:** MindSpace clinical care nahi hai. Isme diagnosis, prescriptions, appointments (clinical), EMR, ya FHIR integration nahi hai. Safety services tabhi real hain jab insaan actually staff hon.

---

## 2. Architecture — kaise bana hai?

```
┌─────────────────────────────────────────────────┐
│                 FRONTEND (Next.js)               │
│  Port 4000 — React + TypeScript + Tailwind       │
│  • Marketing pages, auth, dashboards             │
│  • Chat intake UI, voice intake UI               │
│  • Server actions → MindSpace API ko call        │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS / Bearer JWT
┌──────────────────▼──────────────────────────────┐
│              MINDSpace API (Fastify)             │
│  Port 8080 — TypeScript modular monolith         │
│  • /api/v1/* — intake, wellbeing, peer support,  │
│    safety, admin, workflow, events               │
│  • PostgreSQL + Prisma ORM                       │
│  • AES-256-GCM encryption for sensitive data     │
│  • Swagger docs at /api-docs                     │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              PostgreSQL (Prisma)                 │
│  Port 5433 — mindspace database                  │
│  • Encrypted intake responses, journals,         │
│    conversations, safety cases                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              AGENTS (Docker)                      │
│  Port 8018 — voice/chat AI agent service         │
│  • WebSocket voice agent for voice intake        │
│  • Sarvam STT/TTS, Jina embeddings               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         IDENTITY (Better Auth / IAM)             │
│  Port 5001 — JWT issuer, JWKS endpoint           │
│  • MindSpace API isko verify karta hai           │
└─────────────────────────────────────────────────┘
```

**Design principles (docs se):**
- Modular monolith — saare domains ek API me, clear boundaries ke saath
- AI agents ko direct database access NAHI — sirf typed authorized tools
- Peer support, wellbeing, aur safety data alag domains hain — mix nahi hote
- Safety operations AI ke bina bhi chalne chahiye
- Long-running processes durable/versioned workflows se hote hain

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend API | Node.js 22+, TypeScript, Fastify 5, Prisma 6 |
| Database | PostgreSQL 16 |
| Auth | Better Auth / JWT (JWKS verification) |
| Voice | WebSocket agent, AudioWorklet, PCM audio |
| Encryption | AES-256-GCM application-level encryption |
| API docs | OpenAPI 3 + Swagger UI |
| Agents | Docker container (Python voice agent) |

---

## 4. Commands — project kaise chalayein

### Step 1: MindSpace API backend (port 8080)

```powershell
cd D:\Mindspace\backend\mindspace-api

# pehli baar: env file banao
copy .env.example .env

# encryption key generate karo (dev ke liye)
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
# jo key mile, usse .env me INTAKE_ENCRYPTION_KEYS_JSON ke v1 me daalo

# database start karo
docker compose up -d mindspace-postgres

# packages install + migrations
pnpm install
pnpm db:migrate
pnpm db:generate

# API start (port 8080)
pnpm dev
```

**Swagger docs:** http://localhost:8080/api-docs
**Health check:** http://localhost:8080/health/ready

### Step 2: Agents service (port 8018)

```powershell
cd D:\Mindspace\agents

# .env banao: API_KEY, SARVAM_API_KEY, JINA_API_KEY
copy .env.example .env   # agar example hai, warna manually banao

docker compose up -d
```

### Step 3: Frontend (port 4000)

```powershell
cd D:\Mindspace\frontend

# pehli baar
copy .env.example .env
pnpm install

# dev server
pnpm dev
```

Frontend: http://localhost:4000

### Step 4: Optional — telemedicine backend (agar purana system bhi chahiye)

```powershell
cd D:\Mindspace\backend\bezs-iam       # auth/IAM — port 5001
cd D:\Mindspace\backend\fhir-server   # FHIR — port 8000 (legacy)
cd D:\Mindspace\backend\fhir-gql      # GraphQL — port 8005
cd D:\Mindspace\backend\fhir-mcp      # MCP — port 8002
```

### Useful commands

```powershell
# backend tests
cd D:\Mindspace\backend\mindspace-api
pnpm test

# frontend lint
cd D:\Mindspace\frontend
pnpm lint

# frontend production build
pnpm build

# backend production build
cd D:\Mindspace\backend\mindspace-api
pnpm build
pnpm start

# docker compose status
docker compose ps
```

---

## 5. PPT Presentation Script — kal ke liye

Copy-paste ready points:

```
SLIDE 1: MindSpace — Peer Support & Wellbeing Platform
- MindSpace ek peer-support centered emotional wellbeing platform hai
- High-level inspiration: 7 Cups — lekin original branding, content, workflows
- Clinical care NAHI hai — diagnosis, prescriptions, EMR, FHIR out of scope

SLIDE 2: Problem
- Logon ko emotional support chahiye jo clinical/therapy se alag ho
- Professional therapy expensive aur limited hai
- Peer listeners trained hote hain — non-clinical, empathetic support

SLIDE 3: Solution — teen support routes
1. Peer emotional support — trained volunteer listeners se match
2. AI-guided self-help — journaling, mood tracking, reflections
3. Safety resources — urgent help ke liye clearly marked resources

SLIDE 4: User Roles
- Member — support seek karta hai
- Listener — trained volunteer, peer support deta hai
- Listener Supervisor — listener eligibility/training oversee karta hai
- Safety Operations — safety cases handle karta hai
- Platform Administrator — platform ops, sensitive content access nahi
- AI Agent — typed tools only, no direct DB access

SLIDE 5: Architecture
- Frontend: Next.js + React + TypeScript + Tailwind (port 4000)
- Backend: Fastify + TypeScript modular monolith (port 8080)
- Database: PostgreSQL + Prisma ORM (port 5433)
- Agents: Docker-based voice/chat AI agent (port 8018)
- Auth: JWT + JWKS verification

SLIDE 6: Key Features (MVP)
- Member registration, consent, preferences
- Chat intake — AI-guided conversation
- Voice intake — speech-to-text transcription
- Wellbeing tools — moods, journal, goals, reflections
- Peer support — match requests, listener conversations
- Safety cases — human-operated escalation records
- Admin — roles, content approval, audit

SLIDE 7: Security & Privacy
- AES-256-GCM encryption for sensitive responses
- Owner-based access control — JWT se identity
- Consent-based data collection — purpose-specific
- Voice audio store nahi hoti — sirf encrypted transcript
- Append-only consent history
- Audit trails for sensitive actions

SLIDE 8: Tech Stack
- Frontend: Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui
- Backend: Node.js 22, Fastify 5, Prisma 6, PostgreSQL 16
- Voice: WebSocket, AudioWorklet, PCM streaming
- Auth: Better Auth, JWT, JWKS
- Docs: OpenAPI 3, Swagger UI
- Agents: Python Docker container, Sarvam STT/TTS, Jina embeddings

SLIDE 9: Current Status
- Backend API: saare domains ke routes implemented
- Intake: chat + voice dono ka flow built
- Dashboards: 5 role-based dashboards (member, listener, supervisor, safety, admin)
- Pending: peer matching UI, listener workspace UI, safety ops UI wiring

SLIDE 10: Roadmap
- Phase 1: Member dashboard + wellbeing tools wiring
- Phase 2: Peer support matching + listener workspace
- Phase 3: Safety operations + admin tooling
- Phase 4: Notifications, workflow automation, production hardening
```

---

## 6. Project pe kaise kaam karna hai — workflow

### Daily workflow

1. **Backend change karna hai?**
   - `backend/mindspace-api/src/` me domain logic hai
   - Prisma schema: `backend/mindspace-api/prisma/schema.prisma`
   - Migration: `pnpm db:migrate:dev` (dev) / `pnpm db:migrate` (deploy)
   - Tests: `pnpm test`

2. **Frontend change karna hai?**
   - Pages: `frontend/src/app/[locale]/(apps)/mindspace/` — role dashboards
   - Components: `frontend/src/modules/client/`
   - Server actions: `frontend/src/modules/server/presentation/actions/`
   - MindSpace API client: `frontend/src/modules/server/mindspace/api-client.ts`

3. **Naya feature add karna hai?**
   - Pehle docs check karo — kya already spec'd hai
   - Backend route → frontend action → UI component → menu entry
   - Consent/privacy implications socho

4. **Testing se pehle**
   - `pnpm lint` (frontend)
   - `pnpm test` (backend)
   - `pnpm build` — dono jagah

5. **Commit karne se pehle**
   - `git status` — kya change hua
   - Sensitive data check — koi key/password to nahi
   - Commit message: "why" focus karo

### Important rules (docs se)

- **Synthetic data hi use karo** — real member data nahi
- **AI agents ko DB access mat do** — typed tools only
- **Safety features ko AI se independent rakho**
- **Peer support, wellbeing, safety data mix mat karo**
- **Clinical care claims mat karo** — MindSpace clinical nahi hai
- **Voice audio store mat karo** — sirf transcript
- **Consent ke bina sensitive data collect mat karo**

---

## 7. Voice & Chat Intake — plan aur status

### Already built hai:

- **Chat intake page:** `/[locale]/bezs/telemedicine/patient/intake`
- **Voice intake page:** `/[locale]/bezs/telemedicine/patient/appointments/intake`
- **Intake choice page:** `/[locale]/bezs/telemedicine/patient/intake/start`
- Components: `TextIntake`, `VoiceIntakeTest`, `MindspaceIntakeGate`, `IntakeChoice`
- API routes: `/api/intake-agent`, `/api/intake-voice-agent`
- Server actions: `beginMindspaceIntakeAction`, `completeMindspaceIntakeAction`

### Kaise kaam karta hai:

1. Member "Choose intake" pe click karta hai
2. `MindspaceIntakeGate` consent leta hai (intake + transcription for voice)
3. `beginMindspaceIntakeAction` → consent POST → intake POST → intakeId milta hai
4. **Chat:** member types → `/api/intake-agent` → AI responds (SSE stream) → End Chat pe transcript save
5. **Voice:** member clicks Start Call → `/api/intake-voice-agent` → WS connect → mic stream → AI responds → End Call pe transcript save
6. Dono case me transcript `intake_responses` me encrypted save hota hai

### Setup ke liye chahiye:

```powershell
# frontend/.env me:
MINDSPACE_API_URL=http://localhost:8080
INTAKE_VOICE_AGENT_URL=http://localhost:8018   # agents service

# backend/mindspace-api/.env me:
TRANSCRIPTION_API_URL=<provider-url>           # voice transcription ke liye
TRANSCRIPTION_API_KEY=<key>
TRANSCRIPTION_MODEL=whisper-1

# auth ke liye:
AUTH_ISSUER=<mindspace-identity-provider>
AUTH_AUDIENCE=mindspace-api
AUTH_JWKS_URL=<jwks-endpoint>
```

---

## 8. Dashboards — kya hai aur kya banana hai

### Already exists:

**MindSpace role dashboards** (`/mindspace/[role]`):
- `member` — support, wellbeing, privacy sections
- `listener` — conversations, training, availability
- `listener-supervisor` — roster, training reviews, quality
- `safety-operations` — case queue, handoffs, resources
- `platform-administrator` — users/roles, service health, audit

**Telemedicine dashboards** (alag product — legacy):
- Patient: `/bezs/telemedicine/patient`
- Doctor: `/bezs/telemedicine/doctor/dashboard`

### Problem:

MindSpace dashboards abhi **static placeholder** hain — `dashboard-data.ts` me hardcoded data. Real backend APIs se wire nahi hain.

### Kya banana hai:

1. Har role dashboard ko real API se connect karna
2. Member dashboard — intake status, wellbeing activities, privacy settings
3. Listener dashboard — assigned conversations, training status, availability toggle
4. Supervisor dashboard — listener roster, training reviews, quality metrics
5. Safety ops dashboard — case queue, action recording, resource verification
6. Admin dashboard — role management, content approval, audit log view

### Integration points:

- `frontend/src/modules/server/mindspace/api-client.ts` — MindSpace API client
- `frontend/src/modules/server/presentation/actions/` — server actions
- `backend/mindspace-api/src/` — backend routes already exist

---

## 9. Quick Reference — file locations

| Kaam | Path |
|---|---|
| Frontend pages | `frontend/src/app/[locale]/(apps)/mindspace/` |
| MindSpace dashboards data | `frontend/src/modules/client/mindspace-dashboard/` |
| Intake components | `frontend/src/modules/client/telemedicine/patient/component/intake/` |
| Server actions | `frontend/src/modules/server/presentation/actions/` |
| MindSpace API client | `frontend/src/modules/server/mindspace/api-client.ts` |
| Backend API | `backend/mindspace-api/src/` |
| Backend Prisma schema | `backend/mindspace-api/prisma/schema.prisma` |
| Backend README | `backend/mindspace-api/README.md` |
| Feature list | `docs/feature-list.md` |
| User stories | `docs/user-stories.md` |
| System design | `docs/System Requirement Design.md` |
| Database schema | `docs/database-schema.md` |

---

## 10. Important warnings

- **Docs folder gitignored hai** — planning artifacts hain, proof nahi ki implemented hai
- **Backend API foundation hai** — production-ready nahi, real member data mat daalo
- **Telemedicine code alag product hai** — MindSpace docs ke hisaab se clinical care out of scope
- **Safety features gated hain** — staffing/consent/jurisdiction decisions ke bina launch mat karo
- **Voice transcription provider configured nahi** — env unset → 503 error
- **Notifications deliver nahi hote** — sirf queue hoti hain
- **Real identity provider pending** — JWT issuer placeholder hai

---

*Last updated: 2026-11-05*

Running: mindspace-api :8080 ✅, agents :8018 ✅, IAM :5001 ✅, frontend :4000 (compile ho raha tha)

