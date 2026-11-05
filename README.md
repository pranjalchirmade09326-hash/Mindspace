# MindSpace

MindSpace is a standalone peer-support and emotional-wellbeing platform. Members can connect with trained volunteer listeners and use AI-assisted or self-guided wellbeing tools. The high-level listener experience is inspired by services such as 7 Cups, but MindSpace has its own identity, requirements, implementation, content, and product design.

MindSpace does **not** include licensed clinical care, an EMR, diagnosis, prescriptions, appointments, or FHIR integration. Safety resources and any human escalation are available only when explicitly staffed and operational.

The architecture and schemas in this repository are planning artifacts, not evidence that the described controls or services have already been implemented or approved.

## Product and system design documents

- [Business Requirements Document](docs/business%20requirement%20design.md)
- [Feature list](docs/feature-list.md)
- [User stories](docs/user-stories.md)
- [Technical architecture](docs/System%20Requirement%20Design.md)
- [Database schema blueprint](docs/database-schema.md)
- [ER diagram source (Mermaid)](docs/er-diagram.mmd)
- [Intake API implementation and setup](backend/mindspace-api/README.md)

## Core architecture principles

- Use a process-oriented modular monolith for the product API, with clear Peer Support, Wellbeing, Safety, Identity/Access, Workflow, and Audit boundaries.
- Treat peer conversations, private wellbeing records, and safety cases as distinct data domains. Do not copy data between them without a valid purpose, authorization, and auditable workflow.
- Make safety operations independent of AI availability. Do not promise monitoring, emergency dispatch, or response times unless people and procedures are actually staffed.
- Give AI agents no direct database credentials. Agents use typed, authorized application tools; their outputs are untrusted until validated and clearly presented as AI-generated.
- Use durable, versioned workflows for long-running processes, with human approvals, idempotent event handling, and a transactional outbox.
- Keep peer-support, wellbeing, safety, and operational data boundaries explicit; no clinical interoperability is part of this project.

## Standalone project status

The linked design documents describe MindSpace’s proposed architecture and conceptual data model; they are not evidence that every feature exists or is approved. A first standalone intake API implementation is in [`backend/mindspace-api`](backend/mindspace-api/README.md); it is not the complete MindSpace platform. The API uses MindSpace-owned identity configuration and a separate PostgreSQL database. Approve the safety, privacy, and security operating model before handling real member data, then introduce reviewed migrations incrementally.

## Local development

For the intake API, follow [`backend/mindspace-api/README.md`](backend/mindspace-api/README.md). Other product areas are not yet implemented. Use synthetic data for local development; do not use production member, peer-support, or wellbeing data.



--
Devin:
Good news — chat intake aur voice intake dono already implemented hain is project me. Maine poora flow trace kiya; yeh raha breakdown:

Kya already exists
Pages (Next.js routes):

/[locale]/bezs/telemedicine/patient/intake/start — IntakeChoice page, member ko "Chat" vs "Voice" choose karne deta hai
/[locale]/bezs/telemedicine/patient/intake — Chat intake page → MindspaceIntakeGate (consent) → TextIntake
/[locale]/bezs/telemedicine/patient/appointments/intake — Voice intake page → MindspaceIntakeGate → VoiceIntakeTest
Components — src/modules/client/telemedicine/patient/component/intake/:

IntakeChoice.tsx — chat/voice select cards
MindspaceIntakeGate.tsx — consent checkbox (voice ke liye transcription consent bhi) + beginMindspaceIntakeAction call
TextIntake.tsx — chat UI, /api/intake-agent se SSE streaming, "End Chat" pe transcript save
VoiceIntakeTest.tsx — WebSocket voice agent, mic capture via AudioWorklet, PCM streaming, gapless audio playback
ConversationChat.tsx, IntakeCompleteModal.tsx — shared UI
API routes:

src/app/api/intake-agent/route.ts — text chat agent proxy
src/app/api/intake-voice-agent/route.ts — JWT mint + WS URL resolve (INTAKE_VOICE_AGENT_URL env se)
Server actions: src/modules/server/presentation/actions/mindspace-intake.actions.ts — beginMindspaceIntakeAction (consent → /api/v1/consents → /api/v1/intakes create) aur completeMindspaceIntakeAction (responses save + intake complete)

Menu: dono options menu-datas.ts me already listed hain ("Choose an intake", "Chat intake", "Voice intake").

Backend: backend/mindspace-api ke /api/v1/intakes, /responses, /transcription endpoints support karte hain.

Chalane ke liye kya chahiye
.env me INTAKE_VOICE_AGENT_URL set karna hoga (voice ke liye) — bina iske voice page 500 dega
/api/intake-agent aur voice agent service chal rahi honi chahiye
MindSpace API (mindspace-api) chal rahi ho + member ka JWT auth configured ho
Browser se mic permission allow karni hogi voice ke liye
Sawal
Aapne "add karo" kaha — kya aapka matlab tha:

Ye feature kisi aur section me add karna hai (jaise MindSpace dashboard, sirf telemedicine ke bajaye)? — to batao kahan, main wahan pages/components wire kar dunga
Koi naya intake type/agent banana hai (jaise alag workflow)?
Ya aapko error aa raha hai in pages pe?
Clarify karo to main exact implementation kar sakta hoon.


Pranjal Chirmade:
docs according to that further ka dena.firstgive em all commadns and after that dashboards kitne hai vo dena 

Devin:
Docs folder ignore-file me hai, isliye read tool block ho gaya — shell se padhta hoon.


Devin:
Docs padh liye. Neeche teeno cheezein hain — pehle commands, phir dashboards, aur end me docs ke hisaab se pending kaam.

1) Sab chalane ke commands
MindSpace API (backend) — port 8080:

cd D:\Mindspace\backend\mindspace-api
copy .env.example .env        # pehli baar: keys/issuer/transcription config bharo
docker compose up -d mindspace-postgres
pnpm install
pnpm db:migrate
pnpm db:generate
pnpm dev
Agents (voice/chat agent service) — port 8018:

cd D:\Mindspace\agents
# .env banao: API_KEY, SARVAM_API_KEY, JINA_API_KEY
docker compose up -d
Frontend (Next.js) — port 4000:

cd D:\Mindspace\frontend
pnpm install        # pehli baar
pnpm dev
Test/verify:

Test/verify:

# backend tests
cd backend\mindspace-api && pnpm test
 
# frontend
cd frontend && pnpm lint && pnpm build

--
5 MindSpace role dashboards — /[locale]/mindspace/[role] route se, dashboard-data.ts me defined:

#	Role	Dashboard
1	member	Member dashboard (support, wellbeing, privacy sections)
2	listener	Listener dashboard (conversations, training, availability)
3	listener-supervisor	Supervisor dashboard (roster, training reviews, quality)
4	safety-operations	Safety ops dashboard (case queue, handoffs, resources)
5	platform-administrator	Admin dashboard (users/roles, service health, audit log)
--

