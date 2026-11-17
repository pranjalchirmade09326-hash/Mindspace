# 🛠️ MindSpace — Complete Commands Quick Reference Guide

A comprehensive, categorized reference for all operational, development, deployment, and testing commands across the entire MindSpace platform.

---

## ⚡ 1. One-Click Platform Launch (Windows)

Start or stop the entire MindSpace ecosystem (PostgreSQL databases, IAM service, FastAPI Core, Multi-Agent Engine, and Next.js Frontend) with a single command:

```powershell
# Start everything in parallel
.\START-ALL.bat

# Gracefully terminate all services and background processes
.\STOP-ALL.bat
```

---

## 🐳 2. Docker & Container Management Commands

### Start Services via Docker Compose

```powershell
# Core Health API (Port 8080) & PostgreSQL (Port 5433)
docker compose -f backend\mindspace-fastapi\docker-compose.yml up -d --build

# IAM Identity Provider & JWKS (Port 5001)
docker compose -f backend\mindspace-iam-py\docker-compose.yml up -d --build

# Multi-Agent Intelligence & Voice Companion (Port 8018)
docker compose -f agents\docker-compose.yml up -d --build

# Frontend PostgreSQL Database (Port 5435)
docker compose -f frontend\docker-compose.yml up -d --build
```

### Inspect Container Status & Logs

```powershell
# View all running MindSpace containers
docker ps

# Stream logs from specific services
docker logs -f mindspace-agents         # Multi-Agent voice engine
docker logs -f mindspace-fastapi        # Core FastAPI backend
docker logs -f mindspace-iam            # IAM identity provider

# Stop containers while safely preserving database volumes
docker compose -f agents\docker-compose.yml down
docker compose -f frontend\docker-compose.yml down
docker compose -f backend\mindspace-fastapi\docker-compose.yml down
docker compose -f backend\mindspace-iam-py\docker-compose.yml down
```

---

## 💻 3. Frontend Development Commands (`frontend/`)

Run these commands inside the `frontend/` directory:

```powershell
cd frontend

# Install package dependencies
pnpm install

# Database & Prisma ORM
pnpm db:generate             # Generate Prisma client types
pnpm db:push                 # Sync schema to PostgreSQL (Port 5435)
pnpm seed:test-data          # Seed test users and initial state

# Local Development Server (Port 4000)
pnpm dev                     # Starts Next.js Turbopack development server

# Code Quality & Linting
pnpm lint                    # Run ESLint (0 errors certified)

# Production Build
pnpm build                   # Compile production Next.js build
pnpm start                   # Start production server
```

---

## 🐍 4. Backend Local Execution Commands

### Engine 3: Core Health API (`backend/mindspace-fastapi/`)

```powershell
cd backend\mindspace-fastapi

# Run locally using uv (Python 3.12+)
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

- **Swagger API Docs:** `http://localhost:8080/docs`
- **ReDoc API Docs:** `http://localhost:8080/redoc`
- **Health Probe:** `http://localhost:8080/health/ready`

### Engine 2: Multi-Agent Intelligence Service (`agents/`)

```powershell
cd agents

# Run locally using uvicorn
uv run uvicorn src.main:app --host 0.0.0.0 --port 8018 --reload
```

- **Swagger API Docs:** `http://localhost:8018/docs`
- **Voice WebSocket Endpoint:** `ws://localhost:8018/ws/audio`

### IAM Service (`backend/mindspace-iam-py/`)

```powershell
cd backend\mindspace-iam-py
docker compose up -d
```

- **JWKS Key Endpoint:** `http://localhost:5001/.well-known/jwks.json`

---

## 🧪 5. Automated Test Suites (100% Passing)

Run all tests from the repository root (`D:\Mindspace`):

```powershell
# 1. Frontend Unit & Workflow Tests (392/392 tests across all 5 roles)
pnpm --dir frontend test

# 2. Backend Milestone 4 Persistence & Security Tests (19/19 tests)
cd backend\mindspace-fastapi
uv run pytest tests/test_milestone4_persistence.py tests/test_api_and_security.py tests/test_mcp.py tests/test_safety.py -v
cd ..\..

# 3. Master E2E Acceptance Test Suite (Tiers 1-4: 52/52 tests)
python tests/e2e/run_all_e2e.py

# 4. Tier 5 Adversarial Agents Security Suite (21/21 tests)
python tests/e2e/test_tier5_adversarial_agents.py

# 5. Tier 5 Adversarial Core Security Suite (17/17 tests)
python tests/e2e/test_tier5_adversarial_core.py

# 6. Production Rebranding Invariant Suite (20/20 tests)
python tests/e2e_rebranding_verification.py
```

---

## 👥 6. Service URLs & 1-Click Demo Login

Navigate to **`http://localhost:4000/en/login`** or **`http://localhost:4000/en/demo-login`** to authenticate directly into any role workspace:

| Role | Demo Card / User | Primary Workspace URL | Dedicated Client Demo URL |
|---|---|---|---|
| **Member** | Sarah Chen | `http://localhost:4000/en/mindspace/member` | `http://localhost:4000/en/mindspace/member` |
| **Peer Listener** | Marcus Johnson | `http://localhost:4000/en/mindspace/listener` | `http://localhost:4000/en/mindspace/listener` |
| **Listener Supervisor** | Rae Kim | `http://localhost:4000/en/mindspace/listener-supervisor` | `http://localhost:4000/en/mindspace/supervisor` |
| **Safety Operations** | Noor Haddad | `http://localhost:4000/en/mindspace/safety-operations` | `http://localhost:4000/en/mindspace/safety` |
| **Platform Administrator** | Admin User | `http://localhost:4000/en/mindspace/platform-administrator` | `http://localhost:4000/en/mindspace/admin` |

### Key Feature URLs:
- **Voice Companion:** `http://localhost:4000/en/mindspace/member/voice`
- **Wellbeing Journal:** `http://localhost:4000/en/mindspace/member/journal`
- **Mood Tracking:** `http://localhost:4000/en/mindspace/member/reflections`
- **Peer Sessions:** `http://localhost:4000/en/mindspace/member/peer-sessions`
