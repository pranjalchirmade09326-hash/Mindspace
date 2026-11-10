# Mindspace Complete Dashboard Build Guide

A comprehensive guide to the Mindspace dashboard system architecture, setup, deployment, and testing.

**Table of Contents**
- [System Overview](#system-overview)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Setup Instructions](#setup-instructions)
- [Deployment Guide](#deployment-guide)
- [Testing Strategy](#testing-strategy)
- [Troubleshooting](#troubleshooting)

---

## System Overview

Mindspace is a comprehensive dashboard management system built with FastAPI (Python backend) and React/Vue (frontend). The system manages three primary domains:

1. **Admin Module**: Administration and super-admin functionality
2. **Supervisor Module**: Supervisory oversight and team management
3. **Safety Module**: Safety monitoring and incident tracking

### Key Features

- **Multi-tenant Architecture**: Separate dashboards for admins, supervisors, and safety officers
- **Real-time Updates**: WebSocket support for live data updates
- **Advanced Analytics**: Comprehensive statistics and reporting
- **Role-based Access Control (RBAC)**: Fine-grained permission system
- **Audit Logging**: Complete audit trail of all modifications
- **Scalable Design**: Async/await patterns for high concurrency
- **Production-ready**: Comprehensive error handling and monitoring

---

## Architecture

### High-Level System Architecture

\\\mermaid
graph TB
    subgraph Client["Client Layer"]
        Web["Web Frontend<br/>React/Vue"]
        Mobile["Mobile App<br/>Optional"]
    end
    
    subgraph Gateway["API Gateway"]
        NginxLB["Nginx Load Balancer<br/>HTTPS/HTTP2"]
        CORS["CORS Handler"]
    end
    
    subgraph Backend["Backend Services"]
        AdminAPI["Admin API<br/>app/routers/admins.py"]
        SuperAPI["Supervisor API<br/>app/routers/supervisors.py"]
        SafetyAPI["Safety API<br/>app/routers/safetys.py"]
        AuthSvc["Authentication<br/>JWT/OAuth2"]
        Cache["Redis Cache<br/>Optional"]
    end
    
    subgraph Data["Data Layer"]
        PostgreSQL["PostgreSQL Database<br/>admins, supervisors,<br/>safety_officers,<br/>stats tables"]
        Backup["Backup Storage<br/>S3/Azure Blob"]
    end
    
    subgraph Monitor["Monitoring & Logging"]
        Prometheus["Prometheus<br/>Metrics"]
        Sentry["Sentry<br/>Error Tracking"]
        Logs["Log Aggregation<br/>ELK/Datadog"]
    end
    
    Web -->|HTTP/WSS| NginxLB
    Mobile -->|HTTP/WSS| NginxLB
    NginxLB --> CORS
    CORS --> AdminAPI
    CORS --> SuperAPI
    CORS --> SafetyAPI
    AdminAPI --> AuthSvc
    SuperAPI --> AuthSvc
    SafetyAPI --> AuthSvc
    AdminAPI --> PostgreSQL
    SuperAPI --> PostgreSQL
    SafetyAPI --> PostgreSQL
    AdminAPI --> Cache
    SuperAPI --> Cache
    SafetyAPI --> Cache
    PostgreSQL --> Backup
    AdminAPI --> Prometheus
    SuperAPI --> Prometheus
    SafetyAPI --> Prometheus
    AdminAPI --> Sentry
    SuperAPI --> Sentry
    SafetyAPI --> Sentry
\\\

### Module Architecture

Each module (Admin, Supervisor, Safety) follows a 4-layer architecture:

\\\mermaid
graph TB
    subgraph API["API Layer"]
        Router["Router<br/>app/routers/{module}.py"]
        Schema["Schema<br/>Pydantic Models"]
    end
    
    subgraph Service["Service Layer"]
        Business["Business Logic<br/>Calculations, Validation"]
        Auth["Authorization<br/>Permission Checks"]
    end
    
    subgraph Data["Data Access Layer"]
        ORM["SQLAlchemy ORM<br/>Query Building"]
        Session["Async Session<br/>Connection Management"]
    end
    
    subgraph Database["Database Layer"]
        MainTable["{module} Table<br/>Main Records"]
        StatsTable["{module}_stats Table<br/>Aggregated Stats"]
        Indexes["Indexes<br/>Query Optimization"]
    end
    
    Router --> Schema
    Schema --> Business
    Business --> Auth
    Auth --> ORM
    ORM --> Session
    Session --> MainTable
    Session --> StatsTable
    MainTable --> Indexes
    StatsTable --> Indexes
\\\

### Entity-Relationship Diagram

\\\mermaid
erDiagram
    ADMINS ||--|| ADMIN_STATS : has
    SUPERVISORS ||--|| SUPERVISOR_STATS : has
    SAFETY_OFFICERS ||--|| SAFETY_STATS : has
    
    ADMINS {
        string id PK
        string user_id
        string email
        string name
        enum role "admin, super_admin, moderator"
        boolean is_active
        datetime created_at
        datetime updated_at
        text permissions "JSON array"
    }
    
    ADMIN_STATS {
        string id PK
        string admin_id FK
        integer total_actions
        integer total_events_managed
        integer total_users_managed
        float avg_response_time_ms
        datetime last_active
        datetime created_at
        datetime updated_at
    }
    
    SUPERVISORS {
        string id PK
        string user_id
        string email
        string name
        string department
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    SUPERVISOR_STATS {
        string id PK
        string supervisor_id FK
        integer total_supervised
        integer incidents_reported
        float avg_resolution_time_hours
        datetime last_active
        datetime created_at
        datetime updated_at
    }
    
    SAFETY_OFFICERS {
        string id PK
        string user_id
        string email
        string name
        enum status "low, medium, high, critical"
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    SAFETY_STATS {
        string id PK
        string safety_id FK
        integer total_incidents
        integer critical_incidents
        float safety_score
        datetime last_inspection
        datetime created_at
        datetime updated_at
    }
\\\

---

## File Structure

\\\
mindspace/
├── backend/
│   └── mindspace-fastapi/
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py                    # FastAPI application entry point
│       │   ├── core/
│       │   │   ├── config.py              # Configuration settings
│       │   │   ├── database.py            # Database connection setup
│       │   │   ├── security.py            # JWT/OAuth2 security
│       │   │   └── logging.py             # Logging configuration
│       │   ├── models/
│       │   │   ├── __init__.py
│       │   │   ├── admin.py               # AdminDB, AdminStatsDB models
│       │   │   ├── supervisor.py          # SupervisorDB, SupervisorStatsDB models
│       │   │   ├── safety.py              # SafetyDB, SafetyStatsDB models
│       │   │   └── base.py                # Base model classes
│       │   ├── schemas/
│       │   │   ├── __init__.py
│       │   │   ├── admin.py               # Pydantic Admin schemas
│       │   │   ├── supervisor.py          # Pydantic Supervisor schemas
│       │   │   └── safety.py              # Pydantic Safety schemas
│       │   ├── routers/
│       │   │   ├── __init__.py
│       │   │   ├── admins.py              # Admin endpoints
│       │   │   ├── supervisors.py         # Supervisor endpoints
│       │   │   └── safetys.py             # Safety endpoints
│       │   ├── routes/
│       │   │   └── admins.py              # Alternative admin routes
│       │   ├── dependencies/
│       │   │   ├── __init__.py
│       │   │   └── auth.py                # Authentication dependencies
│       │   ├── utils/
│       │   │   ├── __init__.py
│       │   │   ├── helpers.py             # Utility functions
│       │   │   └── validators.py          # Data validators
│       │   └── middleware/
│       │       ├── __init__.py
│       │       ├── auth.py                # Authentication middleware
│       │       ├── cors.py                # CORS configuration
│       │       └── logging.py             # Request/response logging
│       ├── tests/
│       │   ├── __init__.py
│       │   ├── conftest.py                # Pytest configuration
│       │   ├── unit/
│       │   │   ├── test_admin_model.py
│       │   │   ├── test_supervisor_model.py
│       │   │   └── test_safety_model.py
│       │   └── integration/
│       │       └── test_admin_supervisor_safety_integration.py
│       ├── alembic/                       # Database migrations
│       │   ├── versions/
│       │   ├── env.py
│       │   └── script.py.mako
│       ├── scripts/
│       │   ├── seed_data.py               # Database seeding
│       │   └── create_admin.py            # Admin user creation
│       ├── requirements.txt               # Python dependencies
│       ├── .env.example                   # Example environment variables
│       ├── .env.production                # Production environment
│       ├── Dockerfile                     # Docker containerization
│       ├── docker-compose.yml             # Multi-container orchestration
│       └── README.md                      # Backend documentation
├── frontend/
│   └── mindspace-dashboard/
│       ├── src/
│       │   ├── main.tsx                   # App entry point
│       │   ├── App.tsx                    # Root component
│       │   ├── components/
│       │   │   ├── AdminDashboard.tsx
│       │   │   ├── SupervisorDashboard.tsx
│       │   │   └── SafetyDashboard.tsx
│       │   ├── pages/
│       │   │   ├── AdminPage.tsx
│       │   │   ├── SupervisorPage.tsx
│       │   │   └── SafetyPage.tsx
│       │   ├── services/
│       │   │   ├── api.ts                 # API client
│       │   │   └── auth.ts                # Authentication service
│       │   ├── store/
│       │   │   └── (Redux/Zustand state management)
│       │   ├── hooks/
│       │   │   └── (Custom React hooks)
│       │   └── styles/
│       │       └── (Global CSS/Tailwind)
│       ├── public/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── .env.example
│       └── README.md
├── QUICK_START.md                         # Quick setup guide
├── BACKEND_API_REFERENCE.md               # API documentation
├── DATABASE_SCHEMA_GUIDE.md               # Database documentation
├── FRONTEND_INTEGRATION_GUIDE.md          # Frontend integration
├── DEPLOYMENT_CHECKLIST.md                # Deployment guide
├── COMPLETE_DASHBOARD_BUILD_GUIDE.md      # This file
└── README.md                              # Project overview
\\\

---

## Database Schema

### Schema Overview

The database consists of 6 tables organized into 3 modules. Each module has a main table and a stats table.

### Admin Module Tables

**admins**
\\\sql
CREATE TABLE admins (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'super_admin', 'moderator')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    permissions JSON,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_user_id ON admins(user_id);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_is_active ON admins(is_active);
CREATE INDEX idx_admins_created_at ON admins(created_at);
\\\

**admin_stats**
\\\sql
CREATE TABLE admin_stats (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL UNIQUE,
    total_actions INTEGER NOT NULL DEFAULT 0,
    total_events_managed INTEGER NOT NULL DEFAULT 0,
    total_users_managed INTEGER NOT NULL DEFAULT 0,
    avg_response_time_ms FLOAT NOT NULL DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_stats_admin_id ON admin_stats(admin_id);
CREATE INDEX idx_admin_stats_created_at ON admin_stats(created_at);
\\\

### Supervisor Module Tables

**supervisors**
\\\sql
CREATE TABLE supervisors (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supervisors_user_id ON supervisors(user_id);
CREATE INDEX idx_supervisors_email ON supervisors(email);
CREATE INDEX idx_supervisors_is_active ON supervisors(is_active);
CREATE INDEX idx_supervisors_created_at ON supervisors(created_at);
\\\

**supervisor_stats**
\\\sql
CREATE TABLE supervisor_stats (
    id VARCHAR(36) PRIMARY KEY,
    supervisor_id VARCHAR(36) NOT NULL UNIQUE,
    total_supervised INTEGER NOT NULL DEFAULT 0,
    incidents_reported INTEGER NOT NULL DEFAULT 0,
    avg_resolution_time_hours FLOAT NOT NULL DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE
);

CREATE INDEX idx_supervisor_stats_supervisor_id ON supervisor_stats(supervisor_id);
CREATE INDEX idx_supervisor_stats_created_at ON supervisor_stats(created_at);
\\\

### Safety Module Tables

**safety_officers**
\\\sql
CREATE TABLE safety_officers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_safety_officers_user_id ON safety_officers(user_id);
CREATE INDEX idx_safety_officers_email ON safety_officers(email);
CREATE INDEX idx_safety_officers_status ON safety_officers(status);
CREATE INDEX idx_safety_officers_is_active ON safety_officers(is_active);
CREATE INDEX idx_safety_officers_created_at ON safety_officers(created_at);
\\\

**safety_stats**
\\\sql
CREATE TABLE safety_stats (
    id VARCHAR(36) PRIMARY KEY,
    safety_id VARCHAR(36) NOT NULL UNIQUE,
    total_incidents INTEGER NOT NULL DEFAULT 0,
    critical_incidents INTEGER NOT NULL DEFAULT 0,
    safety_score FLOAT NOT NULL DEFAULT 100.0,
    last_inspection TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (safety_id) REFERENCES safety_officers(id) ON DELETE CASCADE
);

CREATE INDEX idx_safety_stats_safety_id ON safety_stats(safety_id);
CREATE INDEX idx_safety_stats_created_at ON safety_stats(created_at);
\\\

---

## API Endpoints

### Admin Module (8 endpoints)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/admins/{id} | Fetch admin by ID with stats | Required |
| GET | /api/v1/admins/{id}/stats | Fetch admin stats | Required |
| GET | /api/v1/admins | List admins with pagination | Required |
| POST | /api/v1/admins/search | Search admins with filters | Required |
| POST | /api/v1/admins | Create new admin | Required |
| POST | /api/v1/admins/{id} | Update admin | Required |
| DELETE | /api/v1/admins/{id} | Delete admin | Required |
| GET | /api/v1/admins/health | Health check | Optional |

### Supervisor Module (8 endpoints)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/supervisors/{id} | Fetch supervisor by ID with stats | Required |
| GET | /api/v1/supervisors/{id}/stats | Fetch supervisor stats | Required |
| GET | /api/v1/supervisors | List supervisors with pagination | Required |
| POST | /api/v1/supervisors/search | Search supervisors with filters | Required |
| POST | /api/v1/supervisors | Create new supervisor | Required |
| POST | /api/v1/supervisors/{id} | Update supervisor | Required |
| DELETE | /api/v1/supervisors/{id} | Delete supervisor | Required |
| GET | /api/v1/supervisors/health | Health check | Optional |

### Safety Module (8 endpoints)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/safety/{id} | Fetch safety officer by ID with stats | Required |
| GET | /api/v1/safety/{id}/stats | Fetch safety officer stats | Required |
| GET | /api/v1/safety | List safety officers with pagination | Required |
| POST | /api/v1/safety/search | Search safety officers with filters | Required |
| POST | /api/v1/safety | Create new safety officer | Required |
| POST | /api/v1/safety/{id} | Update safety officer | Required |
| DELETE | /api/v1/safety/{id} | Delete safety officer | Required |
| GET | /api/v1/safety/health | Health check | Optional |

**Total: 24 endpoints (8 × 3 modules)**

---

## Setup Instructions

### Prerequisites

- Python 3.9 or higher
- PostgreSQL 12 or higher
- Node.js 16+ (for frontend)
- Git
- pip/npm package managers

### Backend Setup

1. **Clone repository**
   \\\ash
   git clone https://github.com/yourorg/mindspace.git
   cd mindspace/backend/mindspace-fastapi
   \\\

2. **Create virtual environment**
   \\\ash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \\\

3. **Install dependencies**
   \\\ash
   pip install -r requirements.txt
   \\\

4. **Configure database**
   \\\ash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your database URL
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/mindspace_db
   \\\

5. **Create database**
   \\\ash
   createdb -U postgres mindspace_db
   \\\

6. **Run migrations**
   \\\ash
   alembic upgrade head
   \\\

7. **Load seed data (optional)**
   \\\ash
   python scripts/seed_data.py
   \\\

8. **Start backend server**
   \\\ash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   \\\

### Frontend Setup

1. **Navigate to frontend directory**
   \\\ash
   cd ../../frontend/mindspace-dashboard
   \\\

2. **Install dependencies**
   \\\ash
   npm install
   \\\

3. **Configure environment**
   \\\ash
   cp .env.example .env.local
   
   # Edit .env.local
   VITE_API_URL=http://localhost:8000/api/v1
   \\\

4. **Start development server**
   \\\ash
   npm run dev
   \\\

5. **Access frontend**
   - Open browser: http://localhost:5173
   - Login with default credentials

---

## Deployment Guide

### Docker Deployment

#### Build Docker Image

\\\ash
# From backend directory
docker build -t mindspace-api:latest .
\\\

#### Docker Compose (Complete Stack)

\\\ash
docker-compose up -d
\\\

This starts:
- PostgreSQL database
- API server (Uvicorn)
- Frontend (React build)
- Nginx reverse proxy

#### Environment Configuration

Create \.env.production\:

\\\ash
# Database
DATABASE_URL=postgresql+asyncpg://mindspace_user:strong_password@postgres:5432/mindspace_db
DB_POOL_SIZE=20

# API
API_WORKERS=4
DEBUG=false
LOG_LEVEL=INFO

# Security
SECRET_KEY=your-very-long-random-secret-key-minimum-32-chars
ALGORITHM=HS256

# CORS
CORS_ORIGINS=["https://mindspace.com"]

# Monitoring
SENTRY_DSN=your-sentry-dsn
ENABLE_METRICS=true
\\\

### Production Checklist

- [ ] All dependencies updated and compatible
- [ ] Secrets stored in environment variables (not in code)
- [ ] Database backups configured
- [ ] SSL certificates installed and configured
- [ ] Rate limiting enabled
- [ ] Logging and monitoring configured
- [ ] Error tracking (Sentry) enabled
- [ ] Health checks working
- [ ] Performance monitoring active
- [ ] Security headers configured

### Scaling Considerations

**Horizontal Scaling**
- Use load balancer (Nginx, HAProxy, or cloud LB)
- Deploy multiple API instances
- Use external PostgreSQL (managed service)
- Cache layer (Redis) for performance

**Vertical Scaling**
- Increase server CPU/RAM
- Optimize database indexes
- Tune connection pool size
- Enable query caching

---

## Testing Strategy

### Unit Testing

Test individual components in isolation:

\\\ash
pytest tests/unit/ -v
\\\

Coverage:
- Model validation
- Schema serialization
- Utility functions
- Business logic

### Integration Testing

Test modules end-to-end:

\\\ash
pytest tests/integration/ -v
\\\

Coverage:
- All 24 endpoints
- Database relationships
- Data consistency
- Error handling
- Pagination/filtering
- Concurrent requests

### End-to-End Testing

Test complete user workflows:

\\\ash
npm run test:e2e
\\`\

Coverage:
- User login
- Dashboard access
- CRUD operations
- Search/filter
- Export functionality

### Test Data

Use fixtures for consistent test data:

\\\python
@pytest.fixture
async def admin_fixture():
    # Create test admin
    admin = AdminDB(
        id=str(uuid4()),
        user_id="test_user",
        email="test@example.com",
        name="Test Admin",
        role=AdminRoleEnum.admin,
        is_active=True
    )
    yield admin
    # Cleanup
\\\

### Performance Testing

Verify system performance under load:

\\\ash
# Load testing with k6
k6 run tests/performance/load-test.js

# Results
# - Response time < 500ms for list endpoints
# - Response time < 200ms for single record endpoints
# - Throughput > 100 requests/second
\\\

---

## Troubleshooting

### Common Issues

**Issue: Database Connection Error**

\\\
ERROR: psycopg2.OperationalError: could not translate host name "localhost" to address
\\\

**Solution:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure password is correct
- Test connection: \psql -U postgres -h localhost -d mindspace_db\

**Issue: Authentication Failed**

\\\
ERROR: Invalid token or credentials
\\\

**Solution:**
- Verify SECRET_KEY in environment
- Check token expiration
- Ensure Authorization header format: \Bearer <token>\
- Verify JWT algorithm matches

**Issue: CORS Error**

\\\
Access to XMLHttpRequest blocked by CORS policy
\\\

**Solution:**
- Verify frontend origin in CORS_ORIGINS
- Check Content-Type header
- Ensure preflight OPTIONS requests handled
- Test with: \curl -H "Origin: http://localhost:5173" -v http://localhost:8000/api/v1/admins\

**Issue: High Response Time**

**Solution:**
- Check database query performance
- Verify indexes exist
- Enable query logging: \echo_pool=True\ in database config
- Use EXPLAIN ANALYZE for slow queries
- Check connection pool exhaustion

**Issue: Memory Leak**

**Solution:**
- Monitor memory usage: \docker stats\
- Check for unclosed async sessions
- Verify connection pool limits
- Review event loop handling

### Debug Logging

Enable debug logging:

\\\ash
# Start with debug logging
LOG_LEVEL=DEBUG uvicorn app.main:app --reload

# Or in code:
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug("Debug message")
\\\

### Database Debug

\\\sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'mindspace_db';

-- Check slow queries (requires pg_stat_statements extension)
SELECT query, calls, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Check indexes
SELECT schemaname, tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public';

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
\\\

---

## Performance Best Practices

1. **Use async/await throughout** - Never use blocking calls
2. **Enable connection pooling** - Set pool_size and max_overflow
3. **Index frequently queried columns** - user_id, email, created_at
4. **Use eager loading** - Load related stats with selectinload()
5. **Implement caching** - Redis for frequently accessed data
6. **Optimize queries** - Limit columns selected, use LIMIT/OFFSET
7. **Monitor slow queries** - Enable query logging and analysis
8. **Batch operations** - Combine multiple updates when possible
9. **Use pagination** - Never return entire dataset
10. **Compress responses** - Enable gzip compression

---

## Additional Resources

- **API Documentation**: See BACKEND_API_REFERENCE.md
- **Database Documentation**: See DATABASE_SCHEMA_GUIDE.md
- **Frontend Integration**: See FRONTEND_INTEGRATION_GUIDE.md
- **Quick Start**: See QUICK_START.md
- **Deployment Checklist**: See DEPLOYMENT_CHECKLIST.md

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Maintained By**: Engineering Team
