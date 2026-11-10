# Mindspace Deployment Checklist

Complete pre-deployment verification and deployment guide for production deployment.

## Pre-Deployment Verification

### Code Quality Check

- [ ] All unit tests pass
  ```bash
  pytest tests/unit/ -v
  ```

- [ ] All integration tests pass
  ```bash
  pytest tests/integration/ -v
  ```

- [ ] Code linting passes
  ```bash
  flake8 app/ --max-line-length=120
  ```

- [ ] No critical security warnings
  ```bash
  bandit -r app/
  ```

- [ ] Type checking passes (if using mypy)
  ```bash
  mypy app/
  ```

- [ ] Documentation is complete and current
  - [ ] API documentation updated
  - [ ] Database schema documented
  - [ ] Deployment guide reviewed
  - [ ] README up-to-date

### Performance Verification

- [ ] Database indexes are created and optimized
  ```sql
  SELECT schemaname, tablename, indexname FROM pg_indexes;
  ```

- [ ] Query performance acceptable (< 500ms for list endpoints)
  ```bash
  # Use EXPLAIN ANALYZE in PostgreSQL
  EXPLAIN ANALYZE SELECT * FROM admins LIMIT 50;
  ```

- [ ] No N+1 query problems
  - [ ] Relationships use eager loading (selectinload)
  - [ ] Stats endpoints load related data efficiently

- [ ] API response times acceptable (< 1s for 95th percentile)

- [ ] Frontend build optimized
  ```bash
  npm run build  # Should complete without warnings
  npm run preview  # Test build artifacts
  ```

- [ ] No memory leaks in application
  - [ ] Connection pooling configured
  - [ ] Cache limits set appropriately
  - [ ] Async operations properly handled

### Security Verification

- [ ] All secrets moved to environment variables
  - [ ] Database password NOT in code
  - [ ] API keys NOT in code
  - [ ] Tokens NOT in code

- [ ] HTTPS/TLS configured for production
  ```bash
  # Test SSL configuration
  openssl s_client -connect api.mindspace.com:443
  ```

- [ ] Environment variables documented
  - [ ] All required vars listed
  - [ ] Default values appropriate for production
  - [ ] Sensitive variables marked clearly

- [ ] Authentication working correctly
  - [ ] Tokens properly validated
  - [ ] Token expiration configured
  - [ ] Token refresh implemented

- [ ] CORS properly configured
  ```python
  # app/core/config.py
  CORS_ORIGINS = ["https://mindspace.com"]  # Not "*"
  ```

- [ ] Rate limiting configured
  - [ ] API rate limits set
  - [ ] Per-user limits configured
  - [ ] Monitoring in place

- [ ] Input validation enabled
  - [ ] All Pydantic models have validators
  - [ ] Email validation working
  - [ ] File upload size limits set
  - [ ] Request size limits configured

- [ ] SQL injection protection (SQLAlchemy ORM)
  - [ ] No raw SQL queries
  - [ ] All queries use parameterized statements

- [ ] CSRF protection enabled (if applicable)

### Database Verification

- [ ] Database backup tested
  ```bash
  # Create backup
  pg_dump -U postgres mindspace_db > backup.sql
  
  # Verify backup is readable
  file backup.sql
  ```

- [ ] Database replication configured (if applicable)

- [ ] Database user has minimal required permissions
  ```sql
  -- Production user should not have superuser or createdb
  CREATE USER mindspace_user WITH PASSWORD 'strong-password';
  GRANT CONNECT ON DATABASE mindspace_db TO mindspace_user;
  GRANT USAGE ON SCHEMA public TO mindspace_user;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mindspace_user;
  ```

- [ ] All migrations have been run
  ```bash
  alembic upgrade head
  ```

- [ ] Migration rollback tested
  ```bash
  alembic downgrade -1  # Test going back
  alembic upgrade head  # Return to current
  ```

- [ ] Database connection pooling configured
  ```python
  # app/core/database.py
  engine = create_async_engine(
      DATABASE_URL,
      echo=False,
      pool_size=20,
      max_overflow=10,
      pool_pre_ping=True,
  )
  ```

- [ ] No pending data migrations
  ```bash
  alembic current  # Should show latest revision
  ```

### Infrastructure Verification

- [ ] Server meets minimum requirements
  - [ ] CPU: At least 2 cores
  - [ ] RAM: At least 2GB (4GB recommended)
  - [ ] Disk: At least 10GB free
  - [ ] Network: Stable connection, low latency

- [ ] All required services running
  - [ ] PostgreSQL 12+
  - [ ] Python 3.9+
  - [ ] Reverse proxy (nginx/Apache)
  - [ ] Web server (Uvicorn/Gunicorn)

- [ ] Log storage and rotation configured
  ```bash
  # Configure logrotate
  /var/log/mindspace/*.log {
      daily
      rotate 7
      compress
      delaycompress
      missingok
      notifempty
  }
  ```

- [ ] Monitoring tools installed
  - [ ] Application monitoring (New Relic, Datadog, etc.)
  - [ ] Error tracking (Sentry)
  - [ ] Performance monitoring (APM)

- [ ] Alerts configured
  - [ ] API error rate > 5%
  - [ ] Response time > 1 second
  - [ ] Database connection errors
  - [ ] Server disk usage > 80%
  - [ ] Server CPU > 80%
  - [ ] Server RAM > 90%

---

## Environment Variables Required

### Backend (.env or system environment)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/mindspace_db
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10

# API Configuration
API_VERSION=v1
API_TITLE=Mindspace API
API_DESCRIPTION=Mindspace Dashboard API
DEBUG=false
LOG_LEVEL=INFO

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=4
TIMEOUT=120
KEEP_ALIVE=30

# Security
SECRET_KEY=your-very-long-random-secret-key-minimum-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["https://mindspace.com", "https://www.mindspace.com"]
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
CORS_ALLOW_HEADERS=["*"]

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_REQUESTS_PER_HOUR=5000

# Email (if applicable)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=noreply@mindspace.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
ENABLE_METRICS=true
METRICS_PORT=9090

# External Services
EXTERNAL_AUTH_URL=https://auth-service.com
EXTERNAL_AUTH_KEY=your-api-key
```

### Frontend (.env or deployment config)

```bash
# API Configuration
VITE_API_URL=https://api.mindspace.com/api/v1
VITE_WS_URL=wss://api.mindspace.com/ws

# Environment
VITE_ENVIRONMENT=production
VITE_VERSION=1.0.0

# Features
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_LOGGING=false
VITE_ENABLE_ANALYTICS=true

# Performance
VITE_API_TIMEOUT_MS=30000
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL_MINUTES=5

# Analytics
VITE_ANALYTICS_KEY=your-analytics-key
VITE_SENTRY_DSN=your-sentry-dsn-frontend
```

---

## Database Migration Steps

### Pre-Migration

1. **Backup production database**
   ```bash
   pg_dump -U postgres mindspace_db > mindspace_db_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Notify stakeholders**
   - Team members
   - End users (if needed)
   - Set maintenance window

3. **Verify rollback plan**
   - Test restore from backup
   - Document rollback steps

### Migration Execution

1. **Run Alembic migrations**
   ```bash
   alembic upgrade head
   ```

2. **Verify migration success**
   ```bash
   alembic current  # Should show latest revision
   ```

3. **Check database integrity**
   ```sql
   -- Verify tables exist
   \dt
   
   -- Verify indexes created
   SELECT schemaname, tablename, indexname FROM pg_indexes;
   
   -- Check constraints
   SELECT constraint_name, constraint_type FROM information_schema.table_constraints;
   ```

4. **Test all API endpoints**
   ```bash
   # Run integration tests against new schema
   pytest tests/integration/ -v
   ```

### Post-Migration

1. **Monitor database health**
   - Watch for slow queries
   - Monitor connection pool
   - Check disk usage

2. **Monitor application**
   - Error rate should remain normal
   - No unusual response times
   - All features working

3. **Test user workflows**
   - Create admin
   - Create supervisor
   - Create safety officer
   - Verify stats relationships

---

## Seed Data Loading

### Load Initial Data

```bash
# Option 1: Using provided seed script
python scripts/seed_data.py

# Option 2: Using SQL script
psql -U postgres mindspace_db < seeds/initial_data.sql

# Option 3: Programmatic loading
python -c "
from app.scripts.seed import seed_database
from app.core.database import get_async_session
import asyncio
asyncio.run(seed_database())
"
```

### Verify Seed Data

```bash
# Check counts
psql -U postgres mindspace_db -c "
SELECT 'admins' as table_name, COUNT(*) as count FROM admins
UNION ALL
SELECT 'supervisors', COUNT(*) FROM supervisors
UNION ALL
SELECT 'safety_officers', COUNT(*) FROM safety_officers;
"

# Check sample record
curl http://localhost:8000/api/v1/admins?limit=1
```

---

## Health Checks

### API Health Check

```bash
# Should return 200 and healthy status
curl -X GET http://localhost:8000/api/v1/health

# Check each module
curl -X GET http://localhost:8000/api/v1/admins/health
curl -X GET http://localhost:8000/api/v1/supervisors/health
curl -X GET http://localhost:8000/api/v1/safety/health
```

### Database Health Check

```bash
# Test connection
psql -U postgres -d mindspace_db -c "SELECT 1;"

# Check active connections
psql -U postgres -d mindspace_db -c "
SELECT count(*) as active_connections FROM pg_stat_activity
WHERE datname = 'mindspace_db' AND state = 'active';
"

# Check slow queries
psql -U postgres -d mindspace_db -c "
SELECT query, calls, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"
```

### Application Health Check

```bash
# Check process running
ps aux | grep uvicorn

# Check port listening
netstat -tulpn | grep 8000

# Check logs for errors
tail -f /var/log/mindspace/app.log | grep ERROR

# Monitor metrics (if Prometheus configured)
curl http://localhost:9090/metrics | grep http_requests_total
```

---

## Performance Tuning Parameters

### Database Tuning

```sql
-- app/core/database.py configuration
CREATE_ENGINE_KWARGS = {
    "pool_size": 20,           # Connection pool size
    "max_overflow": 10,        # Max overflow connections
    "pool_recycle": 3600,      # Recycle connections after 1 hour
    "pool_pre_ping": True,     # Test connections before using
    "echo": False,             # Disable query logging in production
}
```

### Application Tuning

```python
# app/core/config.py
class Settings:
    # API Configuration
    API_WORKERS = 4            # Number of uvicorn workers
    REQUEST_TIMEOUT = 120      # Request timeout in seconds
    KEEPALIVE_TIMEOUT = 30     # Keep-alive timeout
    BACKLOG = 2048             # Socket backlog size
    
    # Caching
    CACHE_TTL = 300            # Cache time-to-live in seconds
    CACHE_MAX_SIZE = 1000      # Max cache entries
    
    # Rate Limiting
    RATE_LIMIT_ENABLED = True
    RATE_LIMIT_PER_MINUTE = 100
    RATE_LIMIT_PER_HOUR = 5000
```

### Server Configuration

```bash
# /etc/nginx/sites-available/mindspace
upstream mindspace_app {
    least_conn;
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
}

server {
    listen 443 ssl http2;
    server_name api.mindspace.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/mindspace.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mindspace.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Proxy Configuration
    location /api {
        proxy_pass http://mindspace_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Compression
    gzip on;
    gzip_types text/plain application/json application/javascript;
    gzip_min_length 1000;
}
```

---

## Security Checklist

### Network Security

- [ ] Firewall configured (only necessary ports open)
  - [ ] SSH: 22
  - [ ] HTTP: 80 (redirect to HTTPS)
  - [ ] HTTPS: 443
  - [ ] Database: 5432 (only from app server)

- [ ] DDoS protection enabled
  - [ ] CloudFlare or similar
  - [ ] Rate limiting at network level

- [ ] VPN access for admin operations

- [ ] SSH key-based authentication only (no passwords)

### Application Security

- [ ] HTTPS enforced (no HTTP)
  ```nginx
  if ($scheme != "https") {
      return 301 https://$server_name$request_uri;
  }
  ```

- [ ] Security headers set
  ```nginx
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  ```

- [ ] Input validation enabled
- [ ] Output encoding enabled
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled

### Database Security

- [ ] Minimal privilege user created
- [ ] Password complexity requirements met (min 16 chars, mixed case, numbers, symbols)
- [ ] Default postgres user password changed
- [ ] Connection SSL/TLS enabled
- [ ] Replication slots secured (if applicable)

### Access Control

- [ ] Admin users have strong passwords
- [ ] Token expiration configured (short-lived)
- [ ] Token refresh mechanism implemented
- [ ] Audit logging enabled
  ```python
  # Log all modifications
  @app.middleware("http")
  async def audit_log_middleware(request, call_next):
      if request.method != "GET":
          logger.info(f"{request.method} {request.url.path} by {user_id}")
      return await call_next(request)
  ```

---

## Monitoring Setup

### Application Monitoring

```python
# app/core/monitoring.py
from prometheus_client import Counter, Histogram, Gauge
import time

http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

db_connections = Gauge(
    'db_connections_active',
    'Active database connections'
)
```

### Key Metrics to Monitor

- API response time (p50, p95, p99)
- Error rate (5xx, 4xx)
- Request throughput
- Database connection pool usage
- Database query performance
- Server CPU usage
- Server memory usage
- Server disk usage
- Disk I/O

### Alerting Rules

```yaml
# prometheus-rules.yml
groups:
  - name: mindspace
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 5m
        annotations:
          summary: "API response time too high"
      
      - alert: DatabaseConnectionPoolFull
        expr: db_connections > 18  # 90% of 20
        for: 5m
        annotations:
          summary: "Database connection pool nearly full"
      
      - alert: DiskUsageHigh
        expr: (node_filesystem_avail / node_filesystem_size) < 0.2
        for: 10m
        annotations:
          summary: "Disk usage above 80%"
```

---

## Post-Deployment Verification

### Week 1 Checklist

- [ ] Monitor error rate (should be < 1%)
- [ ] Monitor response times (should be < 500ms)
- [ ] Check user reports of issues
- [ ] Verify backup jobs running
- [ ] Monitor database performance
- [ ] Review application logs daily

### Ongoing Maintenance

- [ ] Security updates applied monthly
- [ ] Database maintenance (VACUUM, ANALYZE) weekly
- [ ] Log rotation verified
- [ ] Backup restoration tested monthly
- [ ] Performance tuning reviewed quarterly

---

**Deployment Completed**: [ ] _Date_  
**Deployed By**: _Name_  
**Deployment Notes**: _Any issues or observations_

**Version**: 1.0  
**Last Updated**: 2024-01-15
