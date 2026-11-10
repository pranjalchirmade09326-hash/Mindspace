# Database Migration & Seed Data Index

**Project:** Mindspace FastAPI Backend  
**Module:** Admin, Supervisor, Safety  
**Created:** 2026-11-11  
**Status:** ✅ Complete and Ready to Deploy

---

## 📂 File Directory

### Core Files
```
D:\Mindspace\backend\mindspace-fastapi\
├── migrations/
│   └── 001_create_admin_supervisor_safety_tables.sql    (6.5 KB)
│       └── SQL DDL for all 6 tables with 27 indexes
│
├── seeds/
│   └── admin_supervisor_safety_seed.py                  (16.4 KB)
│       └── Python seed data module with 30 test records
│
├── scripts/
│   └── seed_db.py                                       (9.9 KB)
│       └── Automation script for migration + seeding
│
├── DATABASE_MIGRATION_README.md                         (15.6 KB)
│   └── Complete documentation & schema definitions
│
├── MIGRATION_EXECUTION_GUIDE.md                         (12.5 KB)
│   └── Step-by-step execution & verification guide
│
└── MIGRATION_INDEX.md                                   (This file)
    └── Quick reference & navigation guide
```

---

## 🚀 Quick Links

### For First-Time Setup
1. **Start Here:** [MIGRATION_EXECUTION_GUIDE.md](MIGRATION_EXECUTION_GUIDE.md)
   - Step 1: Prerequisites Check
   - Step 2: Install Dependencies
   - Step 3: Configure Database Connection
   - Step 4: Verify Connection
   - Step 5: Execute Seeder

### For Complete Schema Details
1. **Schema Reference:** [DATABASE_MIGRATION_README.md](DATABASE_MIGRATION_README.md)
   - AdminDB Table Definition
   - AdminStatsDB Table Definition
   - SupervisorDB Table Definition
   - SupervisorStatsDB Table Definition
   - SafetyDB Table Definition
   - SafetyStatsDB Table Definition

### For Implementation Details
1. **Seed Data:** [seeds/admin_supervisor_safety_seed.py](seeds/admin_supervisor_safety_seed.py)
2. **Migration SQL:** [migrations/001_create_admin_supervisor_safety_tables.sql](migrations/001_create_admin_supervisor_safety_tables.sql)
3. **Execution Script:** [scripts/seed_db.py](scripts/seed_db.py)

---

## 📋 Execution Checklist

### Pre-Execution
- [ ] Python 3.8+ installed
- [ ] PostgreSQL installed and running
- [ ] Database 'mindspace' created (or auto-created)
- [ ] PostgreSQL user 'postgres' configured
- [ ] Terminal access to project directory

### Setup Steps
- [ ] Install sqlalchemy: `pip install sqlalchemy psycopg2-binary`
- [ ] Set DB_USER environment variable
- [ ] Set DB_PASSWORD environment variable
- [ ] Set DB_HOST environment variable
- [ ] Set DB_PORT environment variable
- [ ] Set DB_NAME environment variable
- [ ] Verify connection: `psql -U postgres -h localhost -d mindspace -c "SELECT 1"`

### Execution
- [ ] Navigate to project: `cd D:\Mindspace\backend\mindspace-fastapi`
- [ ] Run seeder: `python scripts/seed_db.py`
- [ ] Verify success (no errors)
- [ ] Check output report

### Post-Execution Verification
- [ ] Verify tables exist: `psql -U postgres -h localhost -d mindspace -c "\dt"`
- [ ] Count admin records: `SELECT COUNT(*) FROM admin_db;`
- [ ] Count supervisor records: `SELECT COUNT(*) FROM supervisor_db;`
- [ ] Count safety records: `SELECT COUNT(*) FROM safety_db;`
- [ ] Verify foreign keys: `SELECT COUNT(*) FROM admin_stats_db;`
- [ ] Test sample query: `SELECT email, role FROM admin_db LIMIT 1;`

---

## 🔧 Common Tasks

### Task 1: Initial Setup and Seeding
```bash
# 1. Install dependencies
pip install sqlalchemy psycopg2-binary

# 2. Set environment variables (Linux/Mac)
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=mindspace

# 3. Run seeder
python scripts/seed_db.py

# 4. Verify
psql -U postgres -h localhost -d mindspace -c "SELECT COUNT(*) FROM admin_db;"
```

### Task 2: Clear and Reseed
```bash
# Removes existing data and reseeds with fresh data
python scripts/seed_db.py --clear
```

### Task 3: Preview Without Changes
```bash
# Shows what would be done without making changes
python scripts/seed_db.py --dry-run
```

### Task 4: Verbose Execution (Debug)
```bash
# Shows detailed logging for troubleshooting
python scripts/seed_db.py --verbose
```

### Task 5: Verify Data Integrity
```bash
# Check all tables have expected record counts
psql -U postgres -h localhost -d mindspace << EOF
SELECT 'admin_db' as table_name, COUNT(*) FROM admin_db
UNION ALL SELECT 'admin_stats_db', COUNT(*) FROM admin_stats_db
UNION ALL SELECT 'supervisor_db', COUNT(*) FROM supervisor_db
UNION ALL SELECT 'supervisor_stats_db', COUNT(*) FROM supervisor_stats_db
UNION ALL SELECT 'safety_db', COUNT(*) FROM safety_db
UNION ALL SELECT 'safety_stats_db', COUNT(*) FROM safety_stats_db;
EOF
```

### Task 6: View Sample Admin
```bash
psql -U postgres -h localhost -d mindspace << EOF
SELECT email, role, department, is_active FROM admin_db LIMIT 5;
EOF
```

### Task 7: View Sample Supervisor
```bash
psql -U postgres -h localhost -d mindspace << EOF
SELECT email, experience_level, team_size, performance_rating FROM supervisor_db LIMIT 5;
EOF
```

### Task 8: View Sample Safety Officer
```bash
psql -U postgres -h localhost -d mindspace << EOF
SELECT email, risk_score, status, needs_intervention FROM safety_db LIMIT 5;
EOF
```

### Task 9: Rollback - Clear All Data
```bash
python scripts/seed_db.py --clear
```

### Task 10: Rollback - Drop All Tables
```bash
psql -U postgres -h localhost -d mindspace << EOF
DROP TABLE IF EXISTS safety_stats_db;
DROP TABLE IF EXISTS safety_db;
DROP TABLE IF EXISTS supervisor_stats_db;
DROP TABLE IF EXISTS supervisor_db;
DROP TABLE IF EXISTS admin_stats_db;
DROP TABLE IF EXISTS admin_db;
EOF
```

---

## 📊 Data Summary

| Module | Records | Types | Metrics |
|--------|---------|-------|---------|
| Admin | 5 + 5 stats | super_admin, admin, moderator | users managed, sessions, actions |
| Supervisor | 5 + 5 stats | junior, mid, senior, lead | quality score, productivity, workload |
| Safety | 5 + 5 stats | safe, medium, high, critical, review | risk score, alerts, incidents, response time |
| **Total** | **30** | **5 unique types** | **15+ metrics** |

---

## 🔍 Table Definitions (Quick Reference)

### AdminDB
- **Columns:** 10 (id, user_id, role, permissions, department, email, phone, is_active, created_at, updated_at)
- **Constraints:** UUID PK, FK to user_db, unique email, check role enum
- **Indexes:** 6 basic + 1 composite

### AdminStatsDB
- **Columns:** 11 (id, admin_id, total_users_managed, active_sessions, actions_performed, reports_generated, alerts_issued, system_changes_made, avg_response_time_ms, last_activity_date, timestamps)
- **Constraints:** UUID PK, unique FK to admin_db
- **Indexes:** 2

### SupervisorDB
- **Columns:** 12 (id, user_id, first_name, last_name, email, phone, team_size, performance_rating, department, experience_level, is_active, timestamps)
- **Constraints:** UUID PK, FK to user_db, unique email, check role enum
- **Indexes:** 6 basic + 1 composite

### SupervisorStatsDB
- **Columns:** 12 (id, supervisor_id, team_members, active_sessions, avg_quality_score, total_workload, team_productivity_percent, coaching_sessions_conducted, performance_improvements, escalations_handled, last_review_date, timestamps)
- **Constraints:** UUID PK, unique FK to supervisor_db
- **Indexes:** 2

### SafetyDB
- **Columns:** 12 (id, user_id, first_name, last_name, email, phone, risk_score, status, last_assessment_date, needs_intervention, is_active, timestamps)
- **Constraints:** UUID PK, FK to user_db, unique email, check status enum, check risk_score 0-100
- **Indexes:** 6 basic + 1 composite (high-risk filter)

### SafetyStatsDB
- **Columns:** 13 (id, safety_id, high_risk_users, alerts_active, incidents_reported, avg_response_time_minutes, escalations_made, assessment_completion_rate, critical_cases, cases_resolved, intervention_success_rate, last_escalation_date, timestamps)
- **Constraints:** UUID PK, unique FK to safety_db
- **Indexes:** 2

---

## 🐛 Troubleshooting Quick Links

### Connection Issues
→ See [MIGRATION_EXECUTION_GUIDE.md - Issue 1: Connection Refused](MIGRATION_EXECUTION_GUIDE.md#issue-1-connection-refused)

### Authentication Issues
→ See [MIGRATION_EXECUTION_GUIDE.md - Issue 2: Authentication Failed](MIGRATION_EXECUTION_GUIDE.md#issue-2-authentication-failed)

### Foreign Key Errors
→ See [MIGRATION_EXECUTION_GUIDE.md - Issue 3: Foreign Key Constraint Error](MIGRATION_EXECUTION_GUIDE.md#issue-3-foreign-key-constraint-error)

### Duplicate Key Errors
→ See [MIGRATION_EXECUTION_GUIDE.md - Issue 4: Duplicate Key Error](MIGRATION_EXECUTION_GUIDE.md#issue-4-duplicate-key-error)

### Permission Issues
→ See [MIGRATION_EXECUTION_GUIDE.md - Issue 5: Permission Denied](MIGRATION_EXECUTION_GUIDE.md#issue-5-permission-denied)

---

## 📈 Dashboard Integration

### Dashboards Can Query:

**Admin Dashboard Query**
```sql
SELECT a.email, a.role, s.total_users_managed, s.active_sessions
FROM admin_db a
JOIN admin_stats_db s ON a.id = s.admin_id
WHERE a.is_active = true;
```

**Supervisor Dashboard Query**
```sql
SELECT s.email, s.team_size, st.avg_quality_score, st.team_productivity_percent
FROM supervisor_db s
JOIN supervisor_stats_db st ON s.id = st.supervisor_id
WHERE s.is_active = true;
```

**Safety Dashboard Query**
```sql
SELECT sf.email, sf.risk_score, sf.status, st.alerts_active, st.incidents_reported
FROM safety_db sf
LEFT JOIN safety_stats_db st ON sf.id = st.safety_id
WHERE sf.is_active = true;
```

→ See [DATABASE_MIGRATION_README.md - Dashboard Integration](DATABASE_MIGRATION_README.md#dashboard-integration) for complete queries

---

## 📚 Additional Resources

### Official Documentation
- [DATABASE_MIGRATION_README.md](DATABASE_MIGRATION_README.md) - Complete reference
- [MIGRATION_EXECUTION_GUIDE.md](MIGRATION_EXECUTION_GUIDE.md) - Execution steps & verification

### Files
- [migrations/001_create_admin_supervisor_safety_tables.sql](migrations/001_create_admin_supervisor_safety_tables.sql) - SQL schema
- [seeds/admin_supervisor_safety_seed.py](seeds/admin_supervisor_safety_seed.py) - Test data
- [scripts/seed_db.py](scripts/seed_db.py) - Automation script

### PostgreSQL Resources
- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)

---

## ✅ Verification Commands (Copypaste Ready)

```bash
# Test database connection
psql -U postgres -h localhost -d mindspace -c "SELECT 1"

# List all tables
psql -U postgres -h localhost -d mindspace -c "\dt"

# Count records in each table
psql -U postgres -h localhost -d mindspace << EOF
SELECT 'admin_db' as table_name, COUNT(*) FROM admin_db
UNION ALL SELECT 'admin_stats_db', COUNT(*) FROM admin_stats_db
UNION ALL SELECT 'supervisor_db', COUNT(*) FROM supervisor_db
UNION ALL SELECT 'supervisor_stats_db', COUNT(*) FROM supervisor_stats_db
UNION ALL SELECT 'safety_db', COUNT(*) FROM safety_db
UNION ALL SELECT 'safety_stats_db', COUNT(*) FROM safety_stats_db;
EOF

# View sample admin data
psql -U postgres -h localhost -d mindspace -c "SELECT email, role, department FROM admin_db LIMIT 3;"

# View sample supervisor data
psql -U postgres -h localhost -d mindspace -c "SELECT email, experience_level, team_size FROM supervisor_db LIMIT 3;"

# View sample safety data
psql -U postgres -h localhost -d mindspace -c "SELECT email, risk_score, status FROM safety_db LIMIT 3;"

# Verify foreign keys
psql -U postgres -h localhost -d mindspace -c "SELECT COUNT(*) FROM admin_db a JOIN admin_stats_db s ON a.id = s.admin_id;"

# List all indexes
psql -U postgres -h localhost -d mindspace -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE tablename IN ('admin_db', 'supervisor_db', 'safety_db') ORDER BY tablename;"
```

---

## 📞 Support

For detailed help with specific tasks:

| Question | Resource |
|----------|----------|
| How do I run the seeder? | [MIGRATION_EXECUTION_GUIDE.md - Step 5](MIGRATION_EXECUTION_GUIDE.md#step-5-execute-seeder) |
| What's in each table? | [DATABASE_MIGRATION_README.md - Table Structure](DATABASE_MIGRATION_README.md#table-structure) |
| How do I verify the data? | [MIGRATION_EXECUTION_GUIDE.md - Verification](MIGRATION_EXECUTION_GUIDE.md#verification) |
| What if something fails? | [MIGRATION_EXECUTION_GUIDE.md - Troubleshooting](MIGRATION_EXECUTION_GUIDE.md#-troubleshooting) |
| How do I undo the changes? | [MIGRATION_EXECUTION_GUIDE.md - Rollback](MIGRATION_EXECUTION_GUIDE.md#rollback-instructions) |
| What data is included? | [DATABASE_MIGRATION_README.md - Data Characteristics](DATABASE_MIGRATION_README.md#data-characteristics) |
| How do I integrate dashboards? | [DATABASE_MIGRATION_README.md - Dashboard Integration](DATABASE_MIGRATION_README.md#dashboard-integration) |

---

## 📝 Notes

- **Created:** 2026-11-11
- **Status:** ✅ Complete and ready to deploy
- **Total Files:** 5 (1 SQL + 1 Python seed + 1 Python script + 3 documentation)
- **Total Records:** 30 (5 per module + stats)
- **Total Tables:** 6
- **Total Indexes:** 27 (24 basic + 3 composite)
- **Environment:** Windows 10+, PostgreSQL 12+, Python 3.8+

---

**Last Updated:** 2026-11-11  
**Status:** ✅ Ready for Production Deployment
