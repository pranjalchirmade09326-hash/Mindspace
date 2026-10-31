# Mindspace - Telemedicine & FHIR Healthcare Platform

An integrated healthcare platform combining a modern Telemedicine & EMR frontend (`frontend`) with an HL7 FHIR R4 clinical data backend and API gateway (`backend`).

---

## 📁 Repository Structure

```
Mindspace/
├── frontend/             # Next.js 16 (App Router), React 19, Tailwind v4, Prisma, LiveKit
└── backend/              # FHIR Healthcare Monorepo (FastAPI, PostgreSQL, Redis, MCP)
    ├── fhir-server/      # Core FHIR R4 REST API data layer (FastAPI + SQLAlchemy + asyncpg)
    ├── fhir-gql/         # Middleware & API Gateway (FastAPI, JWT/RBAC, rate-limiting)
    ├── fhir-mcp/         # FastMCP Server exposing FHIR tools for AI agents
    └── fhir-staging/     # External medical record staging service
```

---

## 🚀 Quick Start

### 1. Start Databases (Docker)

```bash
# Backend DB (PostgreSQL 15 on port 5436 + Redis on port 6381)
cd backend
docker compose up -d

# Frontend DB (PostgreSQL 16 on port 5434)
cd ../frontend
docker compose -f docker-compose.dev.yml up -d
```

### 2. Start Backend Services

#### Terminal 1: FHIR Server (Port 8000)
```bash
cd backend/fhir-server
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2: FHIR Gateway (Port 8005)
```bash
cd backend/fhir-gql
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
```

### 3. Start Frontend (Port 4000)

#### Terminal 3: Next.js Frontend
```bash
cd frontend
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

Open [http://localhost:4000](http://localhost:4000) to view the application.
