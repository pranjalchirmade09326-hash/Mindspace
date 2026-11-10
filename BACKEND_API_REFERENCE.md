# Mindspace Backend API Reference

Complete API documentation for all 24 endpoints across Admin, Supervisor, and Safety modules.

## Table of Contents

- [Authentication](#authentication)
- [Admin Module (8 endpoints)](#admin-module)
- [Supervisor Module (8 endpoints)](#supervisor-module)
- [Safety Module (8 endpoints)](#safety-module)
- [Error Codes](#error-codes)
- [Pagination](#pagination)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All endpoints require authentication via Bearer token (if enabled).

```bash
Authorization: Bearer {token}
```

## Admin Module

Base URL: `/api/v1/admins`

### 1. Get Admin by ID

**Endpoint**: `GET /api/v1/admins/{id}`

**Description**: Fetch a single admin with statistics

**Parameters**:
- `id` (path, required): Admin UUID

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_admin_001",
  "email": "admin@mindspace.com",
  "role": "admin",
  "permissions": ["read", "write", "delete"],
  "department": "Management",
  "phone": "+1234567890",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z",
  "stats": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "admin_id": "550e8400-e29b-41d4-a716-446655440000",
    "total_users": 150,
    "active_listeners": 45,
    "pending_reports": 8,
    "system_health_percent": 98.5,
    "response_time_ms": 125.3,
    "avg_quality_score": 4.7,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: Admin with given ID not found
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Database connection error

**Example**:
```bash
curl -X GET http://localhost:8000/api/v1/admins/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {token}"
```

---

### 2. Get Admin Statistics

**Endpoint**: `GET /api/v1/admins/{id}/stats`

**Description**: Fetch detailed statistics for a single admin

**Parameters**:
- `id` (path, required): Admin UUID

**Response** (200 OK):
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
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Admin or stats not found
- `401 Unauthorized`: Authentication failed

**Example**:
```bash
curl -X GET http://localhost:8000/api/v1/admins/550e8400-e29b-41d4-a716-446655440000/stats
```

---

### 3. List All Admins (Paginated)

**Endpoint**: `GET /api/v1/admins`

**Description**: List all admins with pagination support

**Query Parameters**:
- `limit` (integer, optional, default: 50): Number of records per page (1-500)
- `offset` (integer, optional, default: 0): Number of records to skip

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user_admin_001",
    "email": "admin@mindspace.com",
    "role": "admin",
    "permissions": ["read", "write"],
    "department": "Management",
    "phone": "+1234567890",
    "is_active": true,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z",
    "stats": { /* stats object */ }
  },
  { /* more admins */ }
]
```

**Example**:
```bash
# Get first 10 admins
curl -X GET "http://localhost:8000/api/v1/admins?limit=10&offset=0"

# Get next 10 admins
curl -X GET "http://localhost:8000/api/v1/admins?limit=10&offset=10"
```

---

### 4. Search/Filter Admins

**Endpoint**: `POST /api/v1/admins/search`

**Description**: Search admins with advanced filters

**Request Body**:
```json
{
  "email": "admin",
  "department": "Management",
  "role": "admin",
  "is_active": true,
  "limit": 50,
  "offset": 0
}
```

**Response** (200 OK):
```json
[
  { /* filtered admin objects */ }
]
```

**Search Fields**:
- `email` (string, optional): Partial email match (case-insensitive)
- `department` (string, optional): Exact department match
- `role` (string, optional): Exact role match (admin, super_admin, moderator)
- `is_active` (boolean, optional): Active status filter
- `limit` (integer, optional): Pagination limit
- `offset` (integer, optional): Pagination offset

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/admins/search \
  -H "Content-Type: application/json" \
  -d '{
    "department": "Management",
    "is_active": true,
    "limit": 20
  }'
```

---

### 5. Create Admin

**Endpoint**: `POST /api/v1/admins`

**Description**: Create a new admin user

**Request Body**:
```json
{
  "user_id": "user_admin_001",
  "email": "newadmin@mindspace.com",
  "role": "admin",
  "permissions": ["read", "write"],
  "department": "Management",
  "phone": "+1234567890"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_admin_001",
  "email": "newadmin@mindspace.com",
  "role": "admin",
  "permissions": ["read", "write"],
  "department": "Management",
  "phone": "+1234567890",
  "is_active": true,
  "created_at": "2024-01-15T14:30:00Z",
  "updated_at": "2024-01-15T14:30:00Z",
  "stats": null
}
```

**Validation Rules**:
- `user_id`: Required, must be unique
- `email`: Required, valid email format
- `role`: Required, must be one of: admin, super_admin, moderator
- `permissions`: Array of permission strings
- `department`: Optional string

**Error Responses**:
- `400 Bad Request`: Validation failed or duplicate user_id
- `409 Conflict`: User ID already exists
- `422 Unprocessable Entity`: Invalid request body

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/admins \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_admin_001",
    "email": "newadmin@mindspace.com",
    "role": "admin",
    "permissions": ["read", "write"]
  }'
```

---

### 6. Update Admin

**Endpoint**: `POST /api/v1/admins/{id}`

**Description**: Update an existing admin

**Parameters**:
- `id` (path, required): Admin UUID

**Request Body** (all fields optional):
```json
{
  "email": "newemail@mindspace.com",
  "role": "super_admin",
  "permissions": ["read", "write", "delete"],
  "department": "Executive",
  "phone": "+9876543210",
  "is_active": true
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_admin_001",
  "email": "newemail@mindspace.com",
  "role": "super_admin",
  "permissions": ["read", "write", "delete"],
  "department": "Executive",
  "phone": "+9876543210",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T15:45:00Z",
  "stats": { /* stats object */ }
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/admins/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "role": "super_admin",
    "department": "Executive"
  }'
```

---

### 7. Delete Admin

**Endpoint**: `DELETE /api/v1/admins/{id}`

**Description**: Delete an admin and associated statistics

**Parameters**:
- `id` (path, required): Admin UUID

**Response** (204 No Content):
```
(empty body)
```

**Cascade Behavior**:
- Associated AdminStatsDB record is automatically deleted
- All admin permissions are revoked

**Error Responses**:
- `404 Not Found`: Admin not found
- `403 Forbidden`: Insufficient permissions to delete

**Example**:
```bash
curl -X DELETE http://localhost:8000/api/v1/admins/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {token}"
```

---

### 8. Admin Health Check

**Endpoint**: `GET /api/v1/admins/health`

**Description**: Health check for admin service

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T15:50:00Z",
  "database": "connected",
  "total_admins": 42,
  "active_admins": 38
}
```

**Example**:
```bash
curl -X GET http://localhost:8000/api/v1/admins/health
```

---

## Supervisor Module

Base URL: `/api/v1/supervisors`

### 1. Get Supervisor by ID

**Endpoint**: `GET /api/v1/supervisors/{id}`

**Response** (200 OK):
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
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z",
  "stats": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "supervisor_id": "550e8400-e29b-41d4-a716-446655440002",
    "team_members": 15,
    "active_sessions": 8,
    "avg_quality_score": 4.6,
    "total_workload": 78.5,
    "team_productivity_percent": 92.3,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

---

### 2. Get Supervisor Statistics

**Endpoint**: `GET /api/v1/supervisors/{id}/stats`

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "supervisor_id": "550e8400-e29b-41d4-a716-446655440002",
  "team_members": 15,
  "active_sessions": 8,
  "avg_quality_score": 4.6,
  "total_workload": 78.5,
  "team_productivity_percent": 92.3,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

---

### 3. List All Supervisors

**Endpoint**: `GET /api/v1/supervisors`

**Query Parameters**:
- `limit` (default: 50, max: 500)
- `offset` (default: 0)

**Example**:
```bash
curl -X GET "http://localhost:8000/api/v1/supervisors?limit=20&offset=0"
```

---

### 4. Search Supervisors

**Endpoint**: `POST /api/v1/supervisors/search`

**Request Body**:
```json
{
  "email": "john",
  "department": "Operations",
  "experience_level": "senior",
  "is_active": true,
  "limit": 50,
  "offset": 0
}
```

---

### 5. Create Supervisor

**Endpoint**: `POST /api/v1/supervisors`

**Request Body**:
```json
{
  "user_id": "user_supervisor_001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@mindspace.com",
  "phone": "+1234567890",
  "team_size": 15,
  "performance_rating": 4.5,
  "department": "Operations",
  "experience_level": "senior"
}
```

---

### 6. Update Supervisor

**Endpoint**: `POST /api/v1/supervisors/{id}`

**Request Body** (optional fields):
```json
{
  "email": "newemail@mindspace.com",
  "team_size": 18,
  "performance_rating": 4.7,
  "is_active": true
}
```

---

### 7. Delete Supervisor

**Endpoint**: `DELETE /api/v1/supervisors/{id}`

**Response**: 204 No Content

---

### 8. Supervisor Health Check

**Endpoint**: `GET /api/v1/supervisors/health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T15:50:00Z",
  "database": "connected",
  "total_supervisors": 28,
  "active_supervisors": 26
}
```

---

## Safety Module

Base URL: `/api/v1/safety`

### 1. Get Safety Officer by ID

**Endpoint**: `GET /api/v1/safety/{id}`

**Response** (200 OK):
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
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z",
  "stats": {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "safety_id": "550e8400-e29b-41d4-a716-446655440004",
    "high_risk_users": 12,
    "alerts_active": 3,
    "incidents_reported": 5,
    "avg_response_time_minutes": 15.5,
    "escalations_made": 2,
    "assessment_completion_rate": 85.5,
    "critical_cases": 1,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

---

### 2. Get Safety Statistics

**Endpoint**: `GET /api/v1/safety/{id}/stats`

**Response** (200 OK):
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
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

---

### 3. List All Safety Officers

**Endpoint**: `GET /api/v1/safety`

**Example**:
```bash
curl -X GET "http://localhost:8000/api/v1/safety?limit=20&offset=0"
```

---

### 4. Search Safety Officers

**Endpoint**: `POST /api/v1/safety/search`

**Request Body**:
```json
{
  "email": "jane",
  "status": "high",
  "is_active": true,
  "limit": 50,
  "offset": 0
}
```

---

### 5. Create Safety Officer

**Endpoint**: `POST /api/v1/safety`

**Request Body**:
```json
{
  "user_id": "user_safety_001",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@mindspace.com",
  "phone": "+1234567890",
  "risk_score": 35.2,
  "status": "medium",
  "last_assessment_date": "2024-01-15"
}
```

---

### 6. Update Safety Officer

**Endpoint**: `POST /api/v1/safety/{id}`

**Request Body** (optional fields):
```json
{
  "email": "newemail@mindspace.com",
  "risk_score": 42.5,
  "status": "high",
  "needs_intervention": true
}
```

---

### 7. Delete Safety Officer

**Endpoint**: `DELETE /api/v1/safety/{id}`

**Response**: 204 No Content

---

### 8. Safety Health Check

**Endpoint**: `GET /api/v1/safety/health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T15:50:00Z",
  "database": "connected",
  "total_safety_officers": 18,
  "active_safety_officers": 17,
  "critical_cases": 2
}
```

---

## Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no response body |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (duplicate) |
| 422 | Unprocessable Entity | Validation error in request body |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Database/service unavailable |

---

## Pagination

All list endpoints support pagination via query parameters.

```
GET /api/v1/{module}?limit=20&offset=40
```

**Parameters**:
- `limit`: Records per page (1-500, default: 50)
- `offset`: Records to skip (default: 0)

**Example**:
```bash
# Page 1: records 0-19
curl -X GET "http://localhost:8000/api/v1/admins?limit=20&offset=0"

# Page 2: records 20-39
curl -X GET "http://localhost:8000/api/v1/admins?limit=20&offset=20"

# Page 3: records 40-59
curl -X GET "http://localhost:8000/api/v1/admins?limit=20&offset=40"
```

---

## Rate Limiting

Rate limits (if enabled):
- **Default**: 100 requests per minute per IP
- **Authenticated Users**: 1000 requests per minute
- **Status**: Check `X-RateLimit-*` headers in response

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705330800
```

---

## Content Types

All endpoints expect and return JSON.

**Request**:
```
Content-Type: application/json
```

**Response**:
```
Content-Type: application/json; charset=utf-8
```

---

**API Version**: v1  
**Base URL**: `/api/v1`  
**Documentation**: See [docs/api](docs/api) for detailed specifications
