# Database Migration Execution Guide

**Project:** Mindspace FastAPI Backend  
**Created:** 2026-11-11  
**Status:** ✅ Complete and Ready for Execution

---

## 📋 Files Created

### 1. SQL Migration
```
File: migrations/001_create_admin_supervisor_safety_tables.sql
Size: 6.5 KB
Purpose: Define database schema for Admin, Supervisor, and Safety modules
```

**Tables Created:**
- `admin_db` - Admin user profiles (5 records)
- `admin_stats_db` - Admin activity statistics (5 records)
- `supervisor_db` - Supervisor profiles (5 records)
- `supervisor_stats_db` - Supervisor team metrics (5 records)
- `safety_db` - Safety officer profiles (5 records)
- `safety_stats_db` - Safety metrics (5 records)

**Indexes:** 24 basic + 3 composite = 27 total indexes

---

### 2. Seed Data Module
```
File: seeds/admin_supervisor_safety_seed.py
Size: 16.4 KB
Purpose: Realistic test data for all modules
```

**Provides Python objects:**
- `ADMIN_SEED_DATA` - 5 admin records
- `ADMIN_STATS_SEED_DATA` - 5 stats records
- `SUPERVISOR_SEED_DATA` - 5 supervisor records
- `SUPERVISOR_STATS_SEED_DATA` - 5 stats records
- `SAFETY_SEED_DATA` - 5 safety officer records
- `SAFETY_STATS_SEED_DATA` - 5 stats records
- `get_all_seed_data()` - Function to retrieve all data as dictionary

---

### 3. Execution Script
```
File: scripts/seed_db.py
Size: 9.9 KB
Purpose: Automated migration execution and data insertion
```

**Features:**
- Auto-connects to PostgreSQL via environment variables
- Executes migration SQL file
- Inserts seed data with error handling
- Comprehensive logging and reporting
- CLI options for different execution modes

---

## 🚀 Execution Steps

### Step 1: Prerequisites Check
```bash
# Verify Python 3.8+
python --version

# Verify PostgreSQL installed
psql --version

# Verify Python packages (if not installed, see Step 2)
python -c "import sqlalchemy; import psycopg2; print('OK')"
```

### Step 2: Install Dependencies
```bash
cd D:\Mindspace\backend\mindspace-fastapi
pip install sqlalchemy psycopg2-binary
```

### Step 3: Configure Database Connection

#### Option A: Environment Variables (Recommended)
```bash
# Linux/Mac
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=mindspace

# Windows PowerShell
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "your_password"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_NAME = "mindspace"

# Windows Command Prompt
set DB_USER=postgres
set DB_PASSWORD=your_password
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=mindspace
```

#### Option B: .env File
```
# Create .env in project root
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mindspace
```

Then load in Python:
```python
from dotenv import load_dotenv
load_dotenv()
```

### Step 4: Verify Database Connection
```bash
# Test connection before running seeder
psql -U postgres -h localhost -d mindspace -c "SELECT 1"

# If connection fails:
# 1. Ensure PostgreSQL service is running
# 2. Verify credentials are correct
# 3. Create database if it doesn't exist:
#    createdb -U postgres -h localhost mindspace
```

### Step 5: Execute Seeder

#### Option 1: Basic Execution (Recommended)
```bash
cd D:\Mindspace\backend\mindspace-fastapi
python scripts/seed_db.py
```

#### Option 2: Clear Existing Data First
```bash
python scripts/seed_db.py --clear
```

#### Option 3: Verbose Output (Debug Mode)
```bash
python scripts/seed_db.py --verbose
```

#### Option 4: Preview Without Changes (Dry Run)
```bash
python scripts/seed_db.py --dry-run
```

#### Option 5: Combine Options
```bash
python scripts/seed_db.py --clear --verbose
```

---

## ✅ Verification

### Check 1: Verify Tables Created
```bash
psql -U postgres -h localhost -d mindspace -c "\dt"
```

Expected output shows these tables:
- admin_db
- admin_stats_db
- supervisor_db
- supervisor_stats_db
- safety_db
- safety_stats_db

### Check 2: Count Records in Each Table
```bash
psql -U postgres -h localhost -d mindspace <<EOF
SELECT 'admin_db' as table_name, COUNT(*) as record_count FROM admin_db
UNION ALL
SELECT 'admin_stats_db', COUNT(*) FROM admin_stats_db
UNION ALL
SELECT 'supervisor_db', COUNT(*) FROM supervisor_db
UNION ALL
SELECT 'supervisor_stats_db', COUNT(*) FROM supervisor_stats_db
UNION ALL
SELECT 'safety_db', COUNT(*) FROM safety_db
UNION ALL
SELECT 'safety_stats_db', COUNT(*) FROM safety_stats_db;
EOF
```

Expected output:
```
      table_name      | record_count
─────────────────────┼──────────────
 admin_db            |            5
 admin_stats_db      |            5
 supervisor_db       |            5
 supervisor_stats_db |            5
 safety_db           |            5
 safety_stats_db     |            5
```

### Check 3: View Sample Data
```bash
# Sample admin record
psql -U postgres -h localhost -d mindspace -c "SELECT email, role, is_active FROM admin_db LIMIT 1;"

# Sample supervisor record
psql -U postgres -h localhost -d mindspace -c "SELECT email, experience_level, team_size FROM supervisor_db LIMIT 1;"

# Sample safety record
psql -U postgres -h localhost -d mindspace -c "SELECT email, risk_score, status FROM safety_db LIMIT 1;"
```

### Check 4: Verify Foreign Key Relationships
```bash
psql -U postgres -h localhost -d mindspace -c "
SELECT 
    admin.id, 
    admin.email,
    stats.admin_id,
    stats.total_users_managed
FROM admin_db admin
JOIN admin_stats_db stats ON admin.id = stats.admin_id
LIMIT 2;"
```

### Check 5: Verify Indexes Created
```bash
psql -U postgres -h localhost -d mindspace -c "
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('admin_db', 'supervisor_db', 'safety_db') 
ORDER BY tablename, indexname;"
```

---

## 📊 Expected Output

### Seeder Execution Output Example
```
INFO:root:Connecting to database: localhost:5432
INFO:root:✓ Database connection successful
INFO:root:Loading seed data...
INFO:root:✓ Loaded 30 seed records
INFO:root:Running migration: 001_create_admin_supervisor_safety_tables.sql
INFO:root:✓ Migration executed: 001_create_admin_supervisor_safety_tables.sql

INFO:root:Inserting seed data...
INFO:root:Inserting into admin_db: 5 records
INFO:root:  [1/5] ✓ john.anderson@mindspace.com
INFO:root:  [2/5] ✓ sarah.martinez@mindspace.com
INFO:root:  [3/5] ✓ michael.chen@mindspace.com
INFO:root:  [4/5] ✓ emily.rodriguez@mindspace.com
INFO:root:  [5/5] ✓ david.thompson@mindspace.com

INFO:root:Inserting into admin_stats_db: 5 records
...

═══════════════════════════════════════════════════════════════════════════
SEED DATA SUMMARY
═══════════════════════════════════════════════════════════════════════════

Data Distribution:
  admin_db                           5 records
  admin_stats_db                     5 records
  supervisor_db                      5 records
  supervisor_stats_db                5 records
  safety_db                          5 records
  safety_stats_db                    5 records
  Total                             30 records

Insertion Results:
  Successfully inserted: 30 records
  Failed inserts:        0 records

✓ All seed data inserted successfully!
```

---

## 🐛 Troubleshooting

### Issue 1: Connection Refused
```
ERROR: could not connect to server: Connection refused
```

**Solutions:**
1. Start PostgreSQL service:
   ```bash
   # Linux
   sudo systemctl start postgresql
   
   # Mac
   brew services start postgresql
   
   # Windows (if using PostgreSQL.exe)
   "C:\Program Files\PostgreSQL\13\bin\pg_ctl" -D "C:\Program Files\PostgreSQL\13\data" start
   ```

2. Check database exists:
   ```bash
   psql -U postgres -h localhost -l | grep mindspace
   ```

3. Create if missing:
   ```bash
   createdb -U postgres -h localhost mindspace
   ```

### Issue 2: Authentication Failed
```
ERROR: FATAL: password authentication failed for user "postgres"
```

**Solutions:**
1. Verify credentials in environment:
   ```bash
   echo $DB_USER $DB_PASSWORD $DB_HOST
   ```

2. Test connection directly:
   ```bash
   psql -U postgres -h localhost -W
   ```

3. Reset PostgreSQL password (if needed):
   ```bash
   # Linux/Mac
   sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'new_password';"
   ```

### Issue 3: Foreign Key Constraint Error
```
ERROR: insert or update on table "admin_db" violates foreign key constraint
```

**Solution:** The `user_db` table doesn't exist. Either:
- Create it first with your user management migration
- Modify the migration to remove FK constraint temporarily
- Modify the migration to use ON DELETE SET NULL

### Issue 4: Duplicate Key Error
```
ERROR: duplicate key value violates unique constraint
```

**Solution:** Run seeder with --clear flag:
```bash
python scripts/seed_db.py --clear
```

This removes existing data before insertion.

### Issue 5: Permission Denied
```
ERROR: permission denied for schema public
```

**Solution:** Grant permissions:
```bash
psql -U postgres -h localhost -d mindspace -c "
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
"
```

---

## 📝 Rollback Instructions

### Option 1: Clear All Data (Keep Tables)
```bash
python scripts/seed_db.py --clear
```

### Option 2: Drop All Tables
```bash
psql -U postgres -h localhost -d mindspace <<EOF
DROP TABLE IF EXISTS safety_stats_db;
DROP TABLE IF EXISTS safety_db;
DROP TABLE IF EXISTS supervisor_stats_db;
DROP TABLE IF EXISTS supervisor_db;
DROP TABLE IF EXISTS admin_stats_db;
DROP TABLE IF EXISTS admin_db;
EOF
```

### Option 3: Drop Entire Database
```bash
dropdb -U postgres -h localhost mindspace
```

---

## 🔄 Re-running the Seeder

### Scenario 1: Run Again with Same Data
```bash
python scripts/seed_db.py --clear
# This clears old data and reinserts fresh seed data
```

### Scenario 2: Add Additional Data
```python
# Edit seeds/admin_supervisor_safety_seed.py
# Add more records to the seed data lists
# Then run seeder normally
python scripts/seed_db.py
```

### Scenario 3: Update Seed Data
```python
# Edit seeds/admin_supervisor_safety_seed.py
# Modify existing records as needed
# Run with --clear to replace with new data
python scripts/seed_db.py --clear
```

---

## 📊 Dashboard Integration

Once data is loaded, dashboards can query:

### Admin Dashboard Query
```sql
SELECT 
    a.email,
    a.role,
    a.department,
    s.total_users_managed,
    s.active_sessions,
    s.actions_performed,
    s.avg_response_time_ms
FROM admin_db a
JOIN admin_stats_db s ON a.id = s.admin_id
WHERE a.is_active = true
ORDER BY s.actions_performed DESC;
```

### Supervisor Dashboard Query
```sql
SELECT 
    s.email,
    s.first_name || ' ' || s.last_name as name,
    s.department,
    s.team_size,
    st.avg_quality_score,
    st.team_productivity_percent,
    st.coaching_sessions_conducted
FROM supervisor_db s
JOIN supervisor_stats_db st ON s.id = st.supervisor_id
WHERE s.is_active = true
ORDER BY st.avg_quality_score DESC;
```

### Safety Dashboard Query
```sql
SELECT 
    sf.email,
    sf.first_name || ' ' || sf.last_name as name,
    sf.risk_score,
    sf.status,
    sf.needs_intervention,
    st.high_risk_users,
    st.alerts_active,
    st.incidents_reported,
    st.intervention_success_rate
FROM safety_db sf
LEFT JOIN safety_stats_db st ON sf.id = st.safety_id
WHERE sf.is_active = true
ORDER BY sf.risk_score DESC;
```

---

## ✨ Summary Checklist

- [ ] Python 3.8+ installed
- [ ] PostgreSQL installed and running
- [ ] sqlalchemy and psycopg2-binary installed
- [ ] Environment variables configured (DB_USER, DB_PASSWORD, etc.)
- [ ] Database connection verified
- [ ] Seeder executed successfully
- [ ] All 30 records inserted (verified with COUNT queries)
- [ ] Foreign keys validated
- [ ] Indexes created
- [ ] Sample data queries work
- [ ] Ready for dashboard integration

---

**Status:** ✅ Ready to Execute  
**Next Step:** Run `python scripts/seed_db.py`  
**Support:** See DATABASE_MIGRATION_README.md for detailed documentation
