# MindSpace Core API — Python FastAPI

[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12%2B-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Database: PostgreSQL + SQLAlchemy](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLAlchemy%20Async-336791.svg?logo=postgresql)](https://www.sqlalchemy.org/)
[![Security: AES-256-GCM](https://img.shields.io/badge/Security-AES--256--GCM%20Envelope-green.svg)](#)

The **MindSpace Core Platform API** rebuilt with **Python FastAPI**, adhering to **Clean Architecture** principles. It connects asynchronously to the PostgreSQL database (Port `5433`), handles application-level **AES-256-GCM envelope encryption** for sensitive wellbeing disclosures, and serves live dynamic data to the Next.js frontend.

---

## 🏛️ Clean Architecture Layout

```
backend/mindspace-fastapi/
├── app/
│   ├── core/                   # Infrastructure: Config, Database Engine, Security
│   │   ├── config.py           # Environment variables (DB URL, CORS, JWKS)
│   │   ├── database.py         # Async SQLAlchemy engine + AsyncSessionLocal
│   │   └── security.py         # AES-256-GCM Cipher & JWT extraction
│   ├── models/                 # Domain Entities: SQLAlchemy PostgreSQL Models
│   │   ├── member.py           # AppPrincipal, MemberProfile, Preferences
│   │   ├── wellbeing.py        # MoodEntry, JournalEntry, WellbeingGoal, Checkin
│   │   ├── intake.py           # IntakeSession, IntakeResponse, Recommendation
│   │   └── peer.py             # MatchRequest, PeerConversation, PeerMessage
│   ├── schemas/                # Interface Adapters: Pydantic DTOs
│   │   ├── member.py
│   │   ├── wellbeing.py
│   │   ├── intake.py
│   │   ├── peer.py
│   │   └── dashboard.py
│   ├── routers/                # Delivery Layer: FastAPI Route Controllers
│   │   ├── health.py           # /health/ready, /health/live
│   │   ├── member.py           # /api/v1/me, /api/v1/members/me/profile, preferences
│   │   ├── dashboards.py       # /api/v1/members/me/summary (Live DB aggregation)
│   │   ├── wellbeing.py        # /api/v1/wellbeing/moods, journal, goals
│   │   ├── intakes.py          # /api/v1/intakes, responses
│   │   └── peer.py             # /api/v1/peer/match-requests, conversations
│   └── main.py                 # FastAPI Application entrypoint & CORS
├── pyproject.toml              # Dependencies managed via uv
├── Dockerfile                  # Container definition
└── .env                        # Local environment variables
```

---

## 🚀 How to Run

```bash
cd backend/mindspace-fastapi

# Run with uv
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

- **Interactive Swagger Docs**: [http://localhost:8080/docs](http://localhost:8080/docs)
- **ReDoc**: [http://localhost:8080/redoc](http://localhost:8080/redoc)
- **Health Check**: [http://localhost:8080/health/ready](http://localhost:8080/health/ready)
