# 🧠 MindSpace

Enterprise peer-support and emotional wellbeing platform.

## 📖 About

MindSpace connects members with trained volunteer listeners, provides non-clinical AI wellbeing tools (mood tracking, journaling, goals, reflections), and escalates crisis situations through deterministic safety screening.

It is organised as separate services:

| Folder | What it does |
|---|---|
| `frontend/` | Next.js 15 / React 19 web app (member, listener, supervisor, admin workspaces) |
| `backend/mindspace-fastapi/` | Core health data API (FastAPI, PostgreSQL, AES-256-GCM encryption) |
| `backend/mindspace-iam-py/` | Identity provider and JWKS service |
| `agents/` | AI chat and voice agent service (LiveKit, Sarvam) |


## 🚀 Quick Start (Docker, Windows PowerShell)

Run from the repository root:

```powershell
docker compose -f backend\mindspace-fastapi\docker-compose.yml up -d --build
docker compose -f backend\mindspace-iam-py\docker-compose.yml up -d --build
docker compose -f frontend\docker-compose.yml up -d --build
docker compose -f agents\docker-compose.yml up -d
```

Before starting, create the `.env` files from their `.env.example` counterparts and fill in real values (`BETTER_AUTH_SECRET`, `API_KEY`, `SARVAM_API_KEY`, `JINA_API_KEY`).

### Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:4000 |
| FastAPI docs | http://localhost:8080/docs |
| IAM | http://localhost:5001 |
| Agents | http://localhost:8018 |

### Useful commands

```powershell
# Status
docker compose -f frontend\docker-compose.yml ps

# Logs
docker compose -f backend\mindspace-fastapi\docker-compose.yml logs -f mindspace-fastapi

# Stop (keeps database data)
docker compose -f agents\docker-compose.yml down
docker compose -f frontend\docker-compose.yml down
docker compose -f backend\mindspace-iam-py\docker-compose.yml down
docker compose -f backend\mindspace-fastapi\docker-compose.yml down
```

## 🛠️ Frontend Local Development

```powershell
cd frontend
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

Opens on http://localhost:4000.

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm seed:test-data`.

## 🔐 Security

- AI models have no database credentials; all data access goes through typed, authenticated endpoints.
- Sensitive content (journals, intake responses, peer messages) is encrypted at the application level.

## ⚠️ Non-Clinical Notice

MindSpace is not a substitute for professional medical care. In an emergency, contact local emergency services or a crisis hotline.

