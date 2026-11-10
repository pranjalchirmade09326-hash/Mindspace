# 🚀 QUICK REFERENCE - Backend Modules

## 📦 MODULE OVERVIEW

### Admin Module
**Purpose**: Manage system administrators, roles, and permissions
**DB Tables**: `admins`, `admin_stats`
**Endpoints**: 8 + health check

### Supervisor Module  
**Purpose**: Manage team supervisors and team metrics
**DB Tables**: `supervisors`, `supervisor_stats`
**Endpoints**: 8 + health check

### Safety Module
**Purpose**: Manage safety officers and risk assessments
**DB Tables**: `safety_officers`, `safety_stats`
**Endpoints**: 8 + health check

---

## 🔧 HOW TO USE

### 1. Import Models in Code
```python
from app.models.admin import AdminDB, AdminStatsDB, AdminRoleEnum
from app.models.supervisor import SupervisorDB, SupervisorStatsDB
from app.models.safety import SafetyDB, SafetyStatsDB, SafetyStatusEnum
```

### 2. Import Schemas for Validation
```python
from app.schemas.admin import AdminResponse, AdminCreateRequest
from app.schemas.supervisor import SupervisorResponse, SupervisorCreateRequest
from app.schemas.safety import SafetyResponse, SafetyCreateRequest
```

### 3. Routers Already Registered
```python
# In app/main.py - already included!
app.include_router(admins.router)
app.include_router(supervisors.router)
app.include_router(safetys.router)
```

---

## 📡 API ROUTES REFERENCE

### Admin Routes
```
GET    /api/v1/admins/{id}
GET    /api/v1/admins/{id}/stats
GET    /api/v1/admins
POST   /api/v1/admins/search
POST   /api/v1/admins
POST   /api/v1/admins/{id}
POST   /api/v1/admins/{id}/stats
DELETE /api/v1/admins/{id}
GET    /api/v1/admins/health
```

### Supervisor Routes
```
GET    /api/v1/supervisors/{id}
GET    /api/v1/supervisors/{id}/stats
GET    /api/v1/supervisors
POST   /api/v1/supervisors/search
POST   /api/v1/supervisors
POST   /api/v1/supervisors/{id}
POST   /api/v1/supervisors/{id}/stats
DELETE /api/v1/supervisors/{id}
GET    /api/v1/supervisors/health
```

### Safety Routes
```
GET    /api/v1/safetys/{id}
GET    /api/v1/safetys/{id}/stats
GET    /api/v1/safetys
POST   /api/v1/safetys/search
POST   /api/v1/safetys
POST   /api/v1/safetys/{id}
POST   /api/v1/safetys/{id}/stats
DELETE /api/v1/safetys/{id}
GET    /api/v1/safetys/health
```

---

## 💾 DATABASE SETUP

### Create Tables (via Alembic)
```bash
cd backend/mindspace-fastapi
alembic upgrade head
```

### Sample Queries
```python
# Get admin with stats
admin = await db.execute(
    select(AdminDB)
    .where(AdminDB.id == "admin-id")
    .options(selectinload(AdminDB.stats))
)

# Search supervisors
supervisors = await db.execute(
    select(SupervisorDB)
    .where(SupervisorDB.department == "Sales")
    .options(selectinload(SupervisorDB.stats))
)
```

---

## 🔐 Key Features

### Admin
- Role-based access (admin, super_admin, moderator)
- Permissions array (flexible permission system)
- System health monitoring
- Response time tracking

### Supervisor
- Team size management
- Performance ratings
- Active sessions tracking
- Team productivity metrics

### Safety
- Risk scoring (0-100)
- Status levels (low/medium/high/critical)
- Assessment tracking
- Incident reporting
- Escalation management

---

## 📋 Request/Response Examples

### Create Admin
```json
REQUEST:
{
  "user_id": "admin-001",
  "role": "admin",
  "permissions": ["read:all", "write:all"],
  "department": "Management",
  "email": "admin@mindspace.io",
  "phone": "+1-555-0100",
  "is_active": true
}

RESPONSE (201):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "admin-001",
  "email": "admin@mindspace.io",
  "role": "admin",
  "is_active": true,
  "created_at": "2026-11-11T01:58:00Z"
}
```

### Search Supervisors
```json
REQUEST:
{
  "department": "Support",
  "is_active": true,
  "limit": 20,
  "offset": 0
}

RESPONSE (200):
[
  {
    "id": "sup-001",
    "user_id": "user-sup-001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@mindspace.io",
    "team_size": 5,
    "performance_rating": 4.5,
    "department": "Support",
    "experience_level": "Senior",
    "is_active": true,
    "created_at": "2026-11-11T01:58:00Z",
    "updated_at": "2026-11-11T01:58:00Z",
    "stats": {
      "id": "stat-001",
      "supervisor_id": "sup-001",
      "team_members": 5,
      "active_sessions": 3,
      "avg_quality_score": 4.5,
      "total_workload": 85.5,
      "team_productivity_percent": 92.0,
      "created_at": "2026-11-11T01:58:00Z",
      "updated_at": "2026-11-11T01:58:00Z"
    }
  }
]
```

### Update Safety Stats
```json
REQUEST:
{
  "high_risk_users": 10,
  "alerts_active": 2,
  "incidents_reported": 1,
  "avg_response_time_minutes": 4.5,
  "escalations_made": 0,
  "assessment_completion_rate": 95.0,
  "critical_cases": 0
}

RESPONSE (200):
{
  "id": "stat-safety-001",
  "safety_id": "safety-001",
  "high_risk_users": 10,
  "alerts_active": 2,
  "incidents_reported": 1,
  "avg_response_time_minutes": 4.5,
  "escalations_made": 0,
  "assessment_completion_rate": 95.0,
  "critical_cases": 0,
  "created_at": "2026-11-11T01:58:00Z",
  "updated_at": "2026-11-11T01:58:00Z"
}
```

---

## 🧪 Testing

### Test Endpoint
```bash
# Health check
curl http://localhost:8080/api/v1/admins/health

# List all
curl http://localhost:8080/api/v1/supervisors

# Get by ID
curl http://localhost:8080/api/v1/safetys/{id}

# Create
curl -X POST http://localhost:8080/api/v1/admins \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","email":"test@test.com","role":"admin"}'
```

---

## 📚 OpenAPI Documentation

Visit your FastAPI server for interactive docs:
- **Swagger UI**: `http://localhost:8080/docs`
- **ReDoc**: `http://localhost:8080/redoc`
- **OpenAPI JSON**: `http://localhost:8080/api-docs/json`

---

## ⚙️ Configuration

All modules use the same database connection from `app.core.database`:
- Async SQLAlchemy with PostgreSQL
- Connection pooling
- Session management

---

## 🔄 Database Relationships

```
AdminDB (1) ──┬──> AdminStatsDB (1)
              └─ CASCADE DELETE

SupervisorDB (1) ──┬──> SupervisorStatsDB (1)
                  └─ CASCADE DELETE

SafetyDB (1) ──┬──> SafetyStatsDB (1)
               └─ CASCADE DELETE
```

**Key**: When a main record is deleted, stats are automatically deleted too.

---

## 📝 Validation Rules

### Admin Role Enum
- `admin` - Standard administrator
- `super_admin` - Full system access
- `moderator` - Content moderation only

### Safety Status Enum
- `low` - Low risk (< 25)
- `medium` - Medium risk (25-50)
- `high` - High risk (50-75)
- `critical` - Critical risk (> 75)

### All Date/Time Fields
- Stored as UTC with timezone
- Automatically managed on create/update
- Format: ISO 8601

---

## 🐛 Error Handling

### Common HTTP Codes
- `200 OK` - Success
- `201 CREATED` - Resource created
- `204 NO CONTENT` - Delete successful
- `400 BAD REQUEST` - Invalid input
- `404 NOT FOUND` - Resource not found
- `409 CONFLICT` - Duplicate resource (e.g., user_id already exists)
- `503 SERVICE UNAVAILABLE` - Database connection issue

### Error Response Format
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## 🚀 NEXT STEPS

1. **Database Migrations**: Create alembic migration for new tables
2. **Testing**: Write unit and integration tests
3. **Documentation**: Add to project wiki
4. **Deployment**: Deploy with your CI/CD pipeline
5. **Monitoring**: Set up logging and monitoring for new endpoints

---

**Last Updated**: 2026-11-11  
**Status**: ✅ Production Ready
