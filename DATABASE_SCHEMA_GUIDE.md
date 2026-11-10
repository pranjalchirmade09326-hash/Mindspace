# Mindspace Database Schema Guide

Complete documentation of all database tables, columns, relationships, and constraints.

## Table of Contents

- [Overview](#overview)
- [Admin Tables](#admin-tables)
- [Supervisor Tables](#supervisor-tables)
- [Safety Tables](#safety-tables)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Constraints](#constraints)
- [Common Queries](#common-queries)

---

## Overview

The Mindspace database consists of **6 main tables**:

1. **admins** - Admin user records
2. **admin_stats** - Admin performance statistics
3. **supervisors** - Supervisor user records
4. **supervisor_stats** - Supervisor performance statistics
5. **safety_officers** - Safety officer records
6. **safety_stats** - Safety officer statistics

**Database**: PostgreSQL 12+  
**Connection String**: `postgresql+asyncpg://user:password@host:5432/mindspace_db`

---

## Admin Tables

### Table: admins

Primary table for storing admin user information.

**Columns**:

| Column | Type | Nullable | Unique | Default | Description |
|--------|------|----------|--------|---------|-------------|
| id | String(36) | NO | YES | UUID v4 | Primary key - Admin unique identifier |
| user_id | Text | NO | YES | N/A | External user ID (must be unique) |
| role | Enum | NO | NO | ADMIN | Admin role (admin, super_admin, moderator) |
| permissions | ARRAY(Text) | NO | NO | [] | Array of permission strings |
| department | Text | YES | NO | NULL | Department/team name |
| email | Text | NO | NO | N/A | Email address (indexed) |
| phone | Text | YES | NO | NULL | Phone number |
| is_active | Boolean | NO | NO | true | Account active status |
| created_at | DateTime | NO | NO | now() | Record creation timestamp (UTC) |
| updated_at | DateTime | NO | NO | now() | Record last update timestamp (UTC) |

**Primary Key**: `id`  
**Unique Constraints**:
- `uq_admin_user_id`: (user_id)

**Indexes**:
- `idx_admin_user_id`: user_id
- `idx_admin_email`: email
- `idx_admin_is_active`: is_active
- `idx_admin_created_at`: created_at

**Example Record**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_admin_001",
  "role": "admin",
  "permissions": ["read", "write"],
  "department": "Management",
  "email": "admin@mindspace.com",
  "phone": "+1234567890",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-15T14:30:00+00:00"
}
```

---

### Table: admin_stats

Performance and activity statistics for admins.

**Columns**:

| Column | Type | Nullable | Unique | Default | Description |
|--------|------|----------|--------|---------|-------------|
| id | String(36) | NO | YES | UUID v4 | Primary key |
| admin_id | String(36) | NO | YES | N/A | Foreign key to admins.id |
| total_users | Integer | NO | NO | 0 | Total number of managed users |
| active_listeners | Integer | NO | NO | 0 | Currently active listeners |
| pending_reports | Integer | NO | NO | 0 | Number of pending reports |
| system_health_percent | Float | NO | NO | 100.0 | System health percentage (0-100) |
| response_time_ms | Float | NO | NO | 0.0 | Average response time in milliseconds |
| avg_quality_score | Float | NO | NO | 0.0 | Average quality score (0-5) |
| created_at | DateTime | NO | NO | now() | Record creation timestamp |
| updated_at | DateTime | NO | NO | now() | Last update timestamp |

**Primary Key**: `id`  
**Foreign Keys**:
- `admin_id` → `admins.id` (ON DELETE CASCADE)

**Unique Constraints**:
- `uq_admin_stats_admin_id`: (admin_id)

**Indexes**:
- `idx_admin_stats_admin_id`: admin_id
- `idx_admin_stats_created_at`: created_at

**Relationship**: One-to-One with `admins` (one admin has exactly one stats record)

**Example Record**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "admin_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_users": 150,
  "active_listeners": 45,
  "pending_reports": 8,
  "system_health_percent": 98.5,
  "response_time_ms": 125.3,
  "avg_quality_score": 4.7,
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-15T14:30:00+00:00"
}
```

---

## Supervisor Tables

### Table: supervisors

Primary table for storing supervisor user information.

**Columns**:

| Column | Type | Nullable | Unique | Default | Description |
|--------|------|----------|--------|---------|-------------|
| id | String(36) | NO | YES | UUID v4 | Primary key |
| user_id | Text | NO | YES | N/A | External user ID (unique) |
| first_name | Text | NO | NO | N/A | Supervisor first name |
| last_name | Text | NO | NO | N/A | Supervisor last name |
| email | Text | NO | NO | N/A | Email address (indexed) |
| phone | Text | YES | NO | NULL | Phone number |
| team_size | Integer | NO | NO | 0 | Number of team members supervised |
| performance_rating | Float | NO | NO | 0.0 | Performance rating (0-5) |
| department | Text | YES | NO | NULL | Department/division |
| experience_level | Text | YES | NO | NULL | Experience level (junior, mid, senior) |
| is_active | Boolean | NO | NO | true | Account active status |
| created_at | DateTime | NO | NO | now() | Record creation timestamp |
| updated_at | DateTime | NO | NO | now() | Last update timestamp |

**Primary Key**: `id`  
**Unique Constraints**:
- `uq_supervisor_user_id`: (user_id)

**Indexes**:
- `idx_supervisor_user_id`: user_id
- `idx_supervisor_email`: email
- `idx_supervisor_is_active`: is_active
- `idx_supervisor_created_at`: created_at

**Example Record**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "user_id": "user_supervisor_001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@mindspace.com",
  "phone": "+1234567890",
  "team_size": 15,
  "performance_rating": 4.5,
  "department": "Operations",
  "experience_level": "senior",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-15T14:30:00+00:00"
}
```

---

### Table: supervisor_stats

Performance and activity statistics for supervisors.

**Columns**:

| Column | Type | Nullable | Unique | Default | Description |
|--------|------|----------|--------|---------|-------------|
| id | String(36) | NO | YES | UUID v4 | Primary key |
| supervisor_id | String(36) | NO | YES | N/A | Foreign key to supervisors.id |
| team_members | Integer | NO | NO | 0 | Current number of active team members |
| active_sessions | Integer | NO | NO | 0 | Number of currently active sessions |
| avg_quality_score | Float | NO | NO | 0.0 | Average quality score (0-5) |
| total_workload | Float | NO | NO | 0.0 | Total workload percentage (0-100+) |
| team_productivity_percent | Float | NO | NO | 0.0 | Team productivity percentage (0-100) |
| created_at | DateTime | NO | NO | now() | Record creation timestamp |
| updated_at | DateTime | NO | NO | now() | Last update timestamp |

**Primary Key**: `id`  
**Foreign Keys**:
- `supervisor_id` → `supervisors.id` (ON DELETE CASCADE)

**Unique Constraints**:
- `uq_supervisor_stats_supervisor_id`: (supervisor_id)

**Indexes**:
- `idx_supervisor_stats_supervisor_id`: supervisor_id
- `idx_supervisor_stats_created_at`: created_at

**Relationship**: One-to-One with `supervisors`

**Example Record**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "supervisor_id": "550e8400-e29b-41d4-a716-446655440002",
  "team_members": 15,
  "active_sessions": 8,
  "avg_quality_score": 4.6,
  "total_workload": 78.5,
  "team_productivity_percent": 92.3,
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-15T14:30:00+00:00"
}
```

---

## Safety Tables

### Table: safety_officers

Primary table for storing safety officer information.

**Columns**:

| Column | Type | Nullable | Unique | Default | Description |
|--------|------|----------|--------|---------|-------------|
| id | String(36) | NO | YES | UUID v4 | Primary key |
| user_id | Text | NO | YES | N/A | External user ID (unique) |
| first_name | Text | NO | NO | N/A | Officer first name |
| last_name | Text | NO | NO | N/A | Officer last name |
| email | Text | NO | NO | N/A | Email address (indexed) |
| phone | Text | YES | NO | NULL | Phone number |
| risk_score | Float | NO | NO | 0.0 | Current risk score (0-100) |
| status | Enum | NO | NO | LOW | Risk status (low, medium, high, critical) |
| last_assessment_date | Date | YES | NO | NULL | Date of last risk assessment |
| needs_intervention | Boolean | NO | NO | false | Whether intervention is required |
| is_active | Boolean | NO | NO | true | Account active status |
| created_at | DateTime | NO | NO | now() | Record creation timestamp |
| updated_at | DateTime | NO | NO | now() | Last update timestamp |

**Primary Key**: `id`  
**Unique Constraints**:
- `uq_safety_user_id`: (user_id)

**Indexes**:
- `idx_safety_user_id`: user_id
- `idx_safety_email`: email
- `idx_safety_status`: status
- `idx_safety_is_active`: is_active
- `idx_safety_created_at`: created_at

**Example Record**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "user_id": "user_safety_001",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@mindspace.com",
  "phone": "+1234567890",
  "risk_score": 35.2,
  "status": "medium",
  "last_assessment_date": "2024-01-15",
  "needs_intervention": false,
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-15T14:30:00+00:00"
}
```

---

### Table: safety_stats

Statistics for safety officers.

**Columns**:

| Column | Type | Nullable | Unique | Default | Description |
|--------|------|----------|--------|---------|-------------|
| id | String(36) | NO | YES | UUID v4 | Primary key |
| safety_id | String(36) | NO | YES | N/A | Foreign key to safety_officers.id |
| high_risk_users | Integer | NO | NO | 0 | Number of high-risk cases |
| alerts_active | Integer | NO | NO | 0 | Current active alerts |
| incidents_reported | Integer | NO | NO | 0 | Total incidents reported |
| avg_response_time_minutes | Float | NO | NO | 0.0 | Average response time in minutes |
| escalations_made | Integer | NO | NO | 0 | Number of escalations |
| assessment_completion_rate | Float | NO | NO | 0.0 | Percentage of assessments completed (0-100) |
| critical_cases | Integer | NO | NO | 0 | Number of critical cases |
| created_at | DateTime | NO | NO | now() | Record creation timestamp |
| updated_at | DateTime | NO | NO | now() | Last update timestamp |

**Primary Key**: `id`  
**Foreign Keys**:
- `safety_id` → `safety_officers.id` (ON DELETE CASCADE)

**Unique Constraints**:
- `uq_safety_stats_safety_id`: (safety_id)

**Indexes**:
- `idx_safety_stats_safety_id`: safety_id
- `idx_safety_stats_created_at`: created_at

**Relationship**: One-to-One with `safety_officers`

**Example Record**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "safety_id": "550e8400-e29b-41d4-a716-446655440004",
  "high_risk_users": 12,
  "alerts_active": 3,
  "incidents_reported": 5,
  "avg_response_time_minutes": 15.5,
  "escalations_made": 2,
  "assessment_completion_rate": 85.5,
  "critical_cases": 1,
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-15T14:30:00+00:00"
}
```

---

## Relationships

```
┌─────────────────┐
│    admins       │
│─────────────────│
│ id (PK)         │
│ user_id (UQ)    │◄─────┐
│ email           │      │
│ role            │      │
│ ...             │      │
└─────────────────┘      │ One-to-One
                         │ Cascade Delete
┌─────────────────┐      │
│  admin_stats    │      │
│─────────────────│      │
│ id (PK)         │      │
│ admin_id (FK)───┼──────┘
│ ...             │
└─────────────────┘

┌──────────────────┐
│  supervisors     │
│──────────────────│
│ id (PK)          │
│ user_id (UQ)     │◄─────┐
│ email            │      │
│ ...              │      │
└──────────────────┘      │ One-to-One
                          │ Cascade Delete
┌──────────────────┐      │
│supervisor_stats  │      │
│──────────────────│      │
│ id (PK)          │      │
│ supervisor_id(FK)├──────┘
│ ...              │
└──────────────────┘

┌──────────────────┐
│ safety_officers  │
│──────────────────│
│ id (PK)          │
│ user_id (UQ)     │◄─────┐
│ email            │      │
│ status           │      │
│ ...              │      │
└──────────────────┘      │ One-to-One
                          │ Cascade Delete
┌──────────────────┐      │
│  safety_stats    │      │
│──────────────────│      │
│ id (PK)          │      │
│ safety_id (FK)───┼──────┘
│ ...              │
└──────────────────┘
```

**Cascade Delete**: When a parent record (admin, supervisor, safety_officer) is deleted, its associated stats record is automatically deleted.

---

## Indexes

**Purpose of Indexes**:
- Improve query performance for common filtering operations
- Enforce uniqueness constraints
- Speed up ordering and sorting

**Admin Indexes**:
```sql
CREATE INDEX idx_admin_user_id ON admins(user_id);
CREATE INDEX idx_admin_email ON admins(email);
CREATE INDEX idx_admin_is_active ON admins(is_active);
CREATE INDEX idx_admin_created_at ON admins(created_at);
```

**Admin Stats Indexes**:
```sql
CREATE INDEX idx_admin_stats_admin_id ON admin_stats(admin_id);
CREATE INDEX idx_admin_stats_created_at ON admin_stats(created_at);
```

**Supervisor Indexes**:
```sql
CREATE INDEX idx_supervisor_user_id ON supervisors(user_id);
CREATE INDEX idx_supervisor_email ON supervisors(email);
CREATE INDEX idx_supervisor_is_active ON supervisors(is_active);
CREATE INDEX idx_supervisor_created_at ON supervisors(created_at);
```

**Supervisor Stats Indexes**:
```sql
CREATE INDEX idx_supervisor_stats_supervisor_id ON supervisor_stats(supervisor_id);
CREATE INDEX idx_supervisor_stats_created_at ON supervisor_stats(created_at);
```

**Safety Officer Indexes**:
```sql
CREATE INDEX idx_safety_user_id ON safety_officers(user_id);
CREATE INDEX idx_safety_email ON safety_officers(email);
CREATE INDEX idx_safety_status ON safety_officers(status);
CREATE INDEX idx_safety_is_active ON safety_officers(is_active);
CREATE INDEX idx_safety_created_at ON safety_officers(created_at);
```

**Safety Stats Indexes**:
```sql
CREATE INDEX idx_safety_stats_safety_id ON safety_stats(safety_id);
CREATE INDEX idx_safety_stats_created_at ON safety_stats(created_at);
```

---

## Constraints

### Unique Constraints

```sql
-- Admin unique constraints
CONSTRAINT uq_admin_user_id UNIQUE (user_id)

-- Admin Stats unique constraints
CONSTRAINT uq_admin_stats_admin_id UNIQUE (admin_id)

-- Supervisor unique constraints
CONSTRAINT uq_supervisor_user_id UNIQUE (user_id)

-- Supervisor Stats unique constraints
CONSTRAINT uq_supervisor_stats_supervisor_id UNIQUE (supervisor_id)

-- Safety Officer unique constraints
CONSTRAINT uq_safety_user_id UNIQUE (user_id)

-- Safety Stats unique constraints
CONSTRAINT uq_safety_stats_safety_id UNIQUE (safety_id)
```

### Foreign Key Constraints

```sql
-- Admin Stats FK
CONSTRAINT fk_admin_stats_admin_id
FOREIGN KEY (admin_id) REFERENCES admins(id)
ON DELETE CASCADE
ON UPDATE CASCADE

-- Supervisor Stats FK
CONSTRAINT fk_supervisor_stats_supervisor_id
FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)
ON DELETE CASCADE
ON UPDATE CASCADE

-- Safety Stats FK
CONSTRAINT fk_safety_stats_safety_id
FOREIGN KEY (safety_id) REFERENCES safety_officers(id)
ON DELETE CASCADE
ON UPDATE CASCADE
```

---

## Common Queries

### Admin Queries

**Get admin with stats**:
```sql
SELECT 
    a.id, a.user_id, a.email, a.role,
    s.total_users, s.system_health_percent, s.avg_quality_score
FROM admins a
LEFT JOIN admin_stats s ON a.id = s.admin_id
WHERE a.id = '550e8400-e29b-41d4-a716-446655440000';
```

**List active admins with high quality scores**:
```sql
SELECT 
    a.id, a.email, a.role, s.avg_quality_score
FROM admins a
JOIN admin_stats s ON a.id = s.admin_id
WHERE a.is_active = true AND s.avg_quality_score >= 4.5
ORDER BY s.avg_quality_score DESC
LIMIT 50;
```

**Find admins by department**:
```sql
SELECT * FROM admins
WHERE department = 'Management'
ORDER BY created_at DESC;
```

### Supervisor Queries

**Get supervisor with team stats**:
```sql
SELECT 
    s.id, s.first_name, s.last_name, s.email,
    st.team_members, st.active_sessions, st.team_productivity_percent
FROM supervisors s
LEFT JOIN supervisor_stats st ON s.id = st.supervisor_id
WHERE s.id = '550e8400-e29b-41d4-a716-446655440002';
```

**List supervisors ordered by team productivity**:
```sql
SELECT 
    s.id, s.first_name, s.last_name, st.team_productivity_percent
FROM supervisors s
JOIN supervisor_stats st ON s.id = st.supervisor_id
WHERE s.is_active = true
ORDER BY st.team_productivity_percent DESC;
```

### Safety Queries

**Find high-risk safety cases**:
```sql
SELECT 
    so.id, so.first_name, so.last_name, so.risk_score, so.status,
    ss.high_risk_users, ss.alerts_active, ss.critical_cases
FROM safety_officers so
JOIN safety_stats ss ON so.id = ss.safety_id
WHERE so.status IN ('high', 'critical')
ORDER BY so.risk_score DESC;
```

**Get safety officers needing intervention**:
```sql
SELECT so.id, so.email, so.risk_score, ss.alerts_active
FROM safety_officers so
JOIN safety_stats ss ON so.id = ss.safety_id
WHERE so.needs_intervention = true AND so.is_active = true;
```

### Performance Queries

**Get slow response time admins**:
```sql
SELECT a.email, s.response_time_ms, s.avg_quality_score
FROM admins a
JOIN admin_stats s ON a.id = s.admin_id
WHERE s.response_time_ms > 500
ORDER BY s.response_time_ms DESC;
```

**Health dashboard summary**:
```sql
SELECT 
    (SELECT COUNT(*) FROM admins WHERE is_active) as active_admins,
    (SELECT COUNT(*) FROM supervisors WHERE is_active) as active_supervisors,
    (SELECT COUNT(*) FROM safety_officers WHERE is_active) as active_safety_officers,
    (SELECT AVG(system_health_percent) FROM admin_stats) as avg_system_health,
    (SELECT AVG(team_productivity_percent) FROM supervisor_stats) as avg_team_productivity;
```

---

## Data Types

| SQL Type | Python Type | Example |
|----------|-------------|---------|
| String(36) | str | "550e8400-e29b-41d4-a716-446655440000" |
| Text | str | "admin@mindspace.com" |
| Integer | int | 42 |
| Float | float | 4.5 |
| Boolean | bool | true/false |
| DateTime(tz) | datetime | 2024-01-15T14:30:00+00:00 |
| Date | date | 2024-01-15 |
| Enum | enum | "admin", "low", "medium" |
| ARRAY(Text) | list | ["read", "write"] |

---

## Backup & Recovery

**Backup**:
```bash
pg_dump --host localhost --user postgres mindspace_db > backup.sql
```

**Restore**:
```bash
psql --host localhost --user postgres < backup.sql
```

**Export to CSV**:
```bash
psql -U postgres -d mindspace_db -c "\COPY admins TO 'admins.csv' CSV HEADER"
```

---

**Last Updated**: 2024-01-15  
**Schema Version**: 1.0  
**Database**: PostgreSQL 12+
