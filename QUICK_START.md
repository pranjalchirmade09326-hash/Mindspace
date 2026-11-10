# Mindspace Quick Start Guide

Get the Mindspace platform up and running in 5 minutes!

## Prerequisites

- Python 3.9+
- PostgreSQL 12+
- Node.js 16+
- Git
- pip or uv package manager

## Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/your-org/mindspace.git
cd mindspace

# Backend setup
cd backend/mindspace-fastapi
uv sync  # or: pip install -r requirements.txt

# Frontend setup (in another terminal)
cd frontend
npm install  # or: pnpm install
```

## Step 2: Database Setup (1 minute)

```bash
# Backend directory: backend/mindspace-fastapi

# Run migrations
alembic upgrade head

# (Optional) Seed sample data
python scripts/seed_data.py
```

## Step 3: Start Backend API (1 minute)

```bash
# In backend/mindspace-fastapi directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend API available at: **http://localhost:8000**
API Documentation at: **http://localhost:8000/docs** (Swagger UI)

## Step 4: Start Frontend (1 minute)

```bash
# In frontend directory
npm run dev  # or: pnpm dev
```

Frontend available at: **http://localhost:5173** (or similar)

## First API Call

```bash
# Test the health endpoint
curl http://localhost:8000/api/v1/health

# Create an admin user
curl -X POST http://localhost:8000/api/v1/admins \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_001",
    "email": "admin@mindspace.com",
    "role": "admin",
    "permissions": ["read", "write"],
    "department": "Management"
  }'
```

## First Dashboard Access

1. Open **http://localhost:5173** in your browser
2. Log in with test credentials (if seed data was loaded)
3. Navigate to Admin Dashboard, Supervisor Dashboard, or Safety Dashboard

## Environment Variables

Create `.env` file in backend/mindspace-fastapi:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost/mindspace_db

# API Configuration
API_VERSION=v1
DEBUG=True
LOG_LEVEL=INFO

# Authentication (if applicable)
AUTH_SECRET_KEY=your-secret-key-here
```

Create `.env` file in frontend:

```bash
# API Configuration
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws

# Feature Flags
VITE_ENABLE_REAL_TIME=true
```

## Common Issues & Solutions

### Issue: "Connection refused" on database

**Solution**: Ensure PostgreSQL is running
```bash
# Windows (PowerShell)
Get-Service PostgreSQL*

# Linux/Mac
brew services list  # macOS
sudo service postgresql status  # Linux
```

### Issue: "Module not found: sqlalchemy"

**Solution**: Reinstall dependencies
```bash
cd backend/mindspace-fastapi
uv sync --force
# or
pip install -r requirements.txt
```

### Issue: "Uvicorn not found"

**Solution**: Install from backend directory
```bash
cd backend/mindspace-fastapi
pip install uvicorn fastapi sqlalchemy
```

### Issue: Port 8000 already in use

**Solution**: Use different port
```bash
uvicorn app.main:app --reload --port 8001
```

### Issue: Frontend can't connect to backend

**Solution**: Check VITE_API_URL in frontend .env
```bash
# Should match your backend URL
VITE_API_URL=http://localhost:8000/api/v1
```

## Verify Installation

```bash
# Check Python version
python --version  # Should be 3.9+

# Check PostgreSQL version
psql --version

# Check Node version
node --version

# Test backend API
curl -s http://localhost:8000/api/v1/health | jq

# Test frontend (should return HTML)
curl -s http://localhost:5173 | head -20
```

## Next Steps

1. Read the [COMPLETE_DASHBOARD_BUILD_GUIDE.md](COMPLETE_DASHBOARD_BUILD_GUIDE.md) for architecture overview
2. Check [BACKEND_API_REFERENCE.md](BACKEND_API_REFERENCE.md) for API documentation
3. Review [DATABASE_SCHEMA_GUIDE.md](DATABASE_SCHEMA_GUIDE.md) for database structure
4. Set up IDE debugger (see [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md))

## Quick Reference

| Component | URL | Command |
|-----------|-----|---------|
| Backend API | http://localhost:8000 | `uvicorn app.main:app --reload` |
| API Docs | http://localhost:8000/docs | (Auto-generated) |
| Frontend | http://localhost:5173 | `npm run dev` |
| Database | localhost:5432 | `psql -U postgres` |

## Support

- **Docs**: See markdown files in project root
- **API Issues**: Check http://localhost:8000/docs
- **Database Issues**: Review DATABASE_SCHEMA_GUIDE.md
- **Frontend Issues**: Check browser console for errors

---

**Ready to develop?** Go to [COMPLETE_DASHBOARD_BUILD_GUIDE.md](COMPLETE_DASHBOARD_BUILD_GUIDE.md) for the full architecture!
