# Mindspace Frontend Integration Guide

Complete guide for integrating the frontend with the Mindspace backend API.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Environment Configuration](#environment-configuration)
- [Authentication Flow](#authentication-flow)
- [API Client Setup](#api-client-setup)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Frontend-Backend Communication Flow

```
┌──────────────────────┐
│   React/Vue App      │
│  (Frontend)          │
└──────────────┬───────┘
               │ HTTP/REST
               │ (Bearer Token)
               ▼
┌──────────────────────┐
│  API Client Layer    │
│  (axios/fetch)       │
└──────────────┬───────┘
               │ JSON
               │
               ▼
┌──────────────────────┐
│  FastAPI Backend     │
│  (app/routers)       │
└──────────────┬───────┘
               │
               ▼
┌──────────────────────┐
│  Database Layer      │
│  (SQLAlchemy ORM)    │
└──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │  PostgreSQL  │
        └──────────────┘
```

### Three Dashboard Modules

1. **Admin Dashboard**
   - Manages admin users and system health
   - Endpoints: `/api/v1/admins/*`
   - Features: User management, permissions, system monitoring

2. **Supervisor Dashboard**
   - Manages team supervisors and performance
   - Endpoints: `/api/v1/supervisors/*`
   - Features: Team management, productivity tracking

3. **Safety Dashboard**
   - Manages safety officers and risk assessment
   - Endpoints: `/api/v1/safety/*`
   - Features: Risk monitoring, incident tracking, interventions

---

## Environment Configuration

### Frontend .env Setup

Create `frontend/.env` file with:

```bash
# API Configuration
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws

# Feature Flags
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_LOGGING=true

# Performance
VITE_API_TIMEOUT_MS=30000
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL_MINUTES=5

# Authentication
VITE_AUTH_ENABLED=true
VITE_AUTH_TOKEN_KEY=mindspace_auth_token
```

### Environment Variables Reference

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| VITE_API_URL | Backend API base URL | http://localhost:8000/api/v1 | Yes |
| VITE_WS_URL | WebSocket URL for real-time | ws://localhost:8000/ws | No |
| VITE_ENABLE_REAL_TIME | Enable real-time features | true | No |
| VITE_ENABLE_LOGGING | Enable console logging | false (prod) | No |
| VITE_API_TIMEOUT_MS | API request timeout | 30000 | No |
| VITE_CACHE_ENABLED | Enable response caching | true | No |
| VITE_CACHE_TTL_MINUTES | Cache time-to-live | 5 | No |

### Production Configuration

For production deployment, update environment variables:

```bash
# .env.production
VITE_API_URL=https://api.mindspace.com/api/v1
VITE_WS_URL=wss://api.mindspace.com/ws
VITE_ENABLE_LOGGING=false
VITE_API_TIMEOUT_MS=60000
```

---

## Authentication Flow

### Token-Based Authentication

```
┌─────────────────────────────────────────┐
│  1. User Login / Obtain Token           │
│     POST /auth/login                    │
│     Response: { token, expires_in }     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  2. Store Token                         │
│     localStorage.setItem('token', ...)  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  3. Include in Requests                 │
│     Header: Authorization: Bearer token │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  4. Token Refresh (if expired)          │
│     POST /auth/refresh                  │
│     New token obtained                  │
└─────────────────────────────────────────┘
```

### Implementation Example

**Using Axios Interceptor**:

```javascript
// api-client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT_MS || 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add Bearer token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh it
      const newToken = await refreshToken();
      localStorage.setItem(
        import.meta.env.VITE_AUTH_TOKEN_KEY,
        newToken
      );
      // Retry original request
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## API Client Setup

### Recommended Libraries

- **Axios**: HTTP client for requests
- **React Query** or **SWR**: Data fetching and caching
- **Zustand** or **Redux**: State management
- **TypeScript**: Type safety

### Basic API Client Module

```typescript
// api/client.ts
import apiClient from './api-client';
import { AxiosError } from 'axios';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

// Admin endpoints
export const adminApi = {
  getById: (id: string) => 
    apiClient.get<AdminResponse>(`/admins/${id}`),
  
  getStats: (id: string) => 
    apiClient.get<AdminStatsResponse>(`/admins/${id}/stats`),
  
  list: (limit = 50, offset = 0) =>
    apiClient.get<AdminResponse[]>(`/admins?limit=${limit}&offset=${offset}`),
  
  search: (filters: SearchFilters) =>
    apiClient.post<AdminResponse[]>(`/admins/search`, filters),
  
  create: (data: AdminCreateRequest) =>
    apiClient.post<AdminCreatedResponse>(`/admins`, data),
  
  update: (id: string, data: AdminUpdateRequest) =>
    apiClient.post<AdminResponse>(`/admins/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete(`/admins/${id}`),
  
  health: () =>
    apiClient.get(`/admins/health`),
};

// Similar patterns for supervisorApi and safetyApi
```

### React Hook Pattern

```typescript
// hooks/useAdmins.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '../api/client';

export const useAdmins = (limit = 50, offset = 0) => {
  return useQuery({
    queryKey: ['admins', limit, offset],
    queryFn: () => adminApi.list(limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateAdmin = () => {
  return useMutation({
    mutationFn: (data) => adminApi.create(data),
    onSuccess: () => {
      // Invalidate admins list cache
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
};
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Continue normally |
| 201 | Created | Show success message |
| 204 | No Content | Success, no data |
| 400 | Bad Request | Show validation errors |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show permission denied |
| 404 | Not Found | Show "Not found" message |
| 409 | Conflict | Show duplicate error |
| 422 | Unprocessable | Show validation errors |
| 500 | Server Error | Show error message, retry |
| 503 | Unavailable | Show maintenance message |

### Error Handling Strategy

```typescript
// utils/error-handler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

export const handleApiError = (error: AxiosError): ApiError => {
  const status = error.response?.status || 500;
  const data = error.response?.data as any;
  
  switch (status) {
    case 400:
      return new ApiError(400, 'Invalid request', data?.detail);
    case 401:
      // Redirect to login
      window.location.href = '/login';
      return new ApiError(401, 'Unauthorized');
    case 403:
      return new ApiError(403, 'Access denied');
    case 404:
      return new ApiError(404, 'Resource not found');
    case 409:
      return new ApiError(409, 'Resource already exists');
    case 422:
      return new ApiError(422, 'Validation error', data?.detail);
    case 500:
      return new ApiError(500, 'Server error');
    case 503:
      return new ApiError(503, 'Service unavailable');
    default:
      return new ApiError(status, error.message || 'Unknown error');
  }
};

export const showErrorToUser = (error: ApiError) => {
  // Use your UI notification system
  if (error.status === 401 || error.status === 403) {
    // Critical auth error
    showErrorAlert(error.message);
  } else if (error.status >= 500) {
    // Server error
    showWarningAlert('Server error, please try again later');
  } else {
    // Client error
    showErrorAlert(error.message);
  }
};
```

### Retry Logic

```typescript
// api/retry-config.ts
export const retryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoff: 2, // exponential backoff multiplier
  
  shouldRetry: (error: AxiosError) => {
    const status = error.response?.status;
    // Retry on network errors or 5xx server errors
    return !error.response || status === 408 || status === 429 || status >= 500;
  },
};

// Use with axios-retry plugin
import axiosRetry from 'axios-retry';

axiosRetry(apiClient, {
  retries: retryConfig.maxRetries,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: retryConfig.shouldRetry,
});
```

---

## Performance Optimization

### Caching Strategy

```typescript
// cache/cache-manager.ts
class CacheManager {
  private cache = new Map<string, CacheEntry>();
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  set<T>(key: string, value: T, ttlMs = 5 * 60 * 1000) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }
  
  clear(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
    } else {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
  }
}

export const cacheManager = new CacheManager();
```

### Pagination Best Practices

```typescript
// hooks/usePaginatedList.ts
export const usePaginatedList = (endpoint, pageSize = 50) => {
  const [page, setPage] = useState(0);
  
  const { data, isLoading, error } = useQuery({
    queryKey: [endpoint, page, pageSize],
    queryFn: () => fetch(`${endpoint}?limit=${pageSize}&offset=${page * pageSize}`),
    keepPreviousData: true, // Keep previous data while loading
  });
  
  return {
    items: data || [],
    isLoading,
    error,
    currentPage: page,
    setPage,
    hasMore: (data?.length || 0) === pageSize,
  };
};
```

### Lazy Loading

```typescript
// components/AdminList.tsx
import { useInfiniteQuery } from '@tanstack/react-query';

export function AdminList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['admins'],
    queryFn: ({ pageParam = 0 }) =>
      adminApi.list(50, pageParam * 50),
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 50 ? pages.length : undefined,
  });
  
  return (
    <>
      {data?.pages.map(page =>
        page.map(admin => <AdminCard key={admin.id} admin={admin} />)
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </>
  );
}
```

### Request Batching

```typescript
// utils/batch-requests.ts
const batchQueue: (() => Promise<any>)[] = [];
let batchTimer: number | null = null;

export const batchRequest = (request: () => Promise<any>): Promise<any> => {
  return new Promise((resolve) => {
    batchQueue.push(() => request().then(resolve));
    
    if (!batchTimer) {
      batchTimer = window.setTimeout(() => {
        Promise.all(batchQueue.map(r => r())).finally(() => {
          batchQueue.length = 0;
          batchTimer = null;
        });
      }, 50); // Batch within 50ms
    }
  });
};
```

---

## Best Practices

### 1. State Management

```typescript
// store/adminStore.ts
import { create } from 'zustand';

export const useAdminStore = create((set) => ({
  admins: [],
  selectedAdmin: null,
  
  setAdmins: (admins) => set({ admins }),
  setSelectedAdmin: (admin) => set({ selectedAdmin: admin }),
  addAdmin: (admin) => set((state) => ({
    admins: [...state.admins, admin]
  })),
  updateAdmin: (id, updates) => set((state) => ({
    admins: state.admins.map(a => a.id === id ? { ...a, ...updates } : a)
  })),
}));
```

### 2. Type Safety

```typescript
// types/api.ts
export interface AdminResponse {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'moderator';
  permissions: string[];
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stats?: AdminStatsResponse;
}

export interface AdminStatsResponse {
  id: string;
  admin_id: string;
  total_users: number;
  active_listeners: number;
  system_health_percent: number;
  avg_quality_score: number;
}
```

### 3. Code Organization

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios instance
│   │   ├── endpoints.ts       # API routes
│   │   └── interceptors.ts    # Request/response handlers
│   ├── hooks/
│   │   ├── useAdmins.ts
│   │   ├── useSupervisors.ts
│   │   └── useSafety.ts
│   ├── store/
│   │   ├── adminStore.ts
│   │   ├── uiStore.ts
│   │   └── authStore.ts
│   ├── components/
│   │   ├── Admin/
│   │   ├── Supervisor/
│   │   └── Safety/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── Login.tsx
│   └── App.tsx
```

### 4. Loading States

```typescript
export function AdminDashboard() {
  const { data: admins, isLoading, error } = useAdmins();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorBoundary error={error} />;
  if (!admins) return <EmptyState />;
  
  return <AdminTable admins={admins} />;
}
```

---

## Troubleshooting

### Common Issues

**Issue 1: CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Ensure backend has CORS middleware enabled for frontend origin

**Issue 2: 401 Unauthorized on all requests**
```
error: { status: 401, message: 'Unauthorized' }
```
**Solution**: Check token is stored and included in headers
```typescript
const token = localStorage.getItem('mindspace_auth_token');
console.log('Token stored:', !!token);
```

**Issue 3: Slow API responses**
```
API takes 5+ seconds to respond
```
**Solution**: Enable caching and pagination
```typescript
const { data } = useQuery({
  queryKey: ['admins'],
  queryFn: adminApi.list,
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});
```

**Issue 4: Stale data in UI**
```
Data doesn't update after creation/update
```
**Solution**: Invalidate relevant queries
```typescript
await invalidateQueries({ queryKey: ['admins'] });
```

### Debug Checklist

- [ ] API URL correct in .env
- [ ] Backend running and accessible
- [ ] CORS headers present
- [ ] Authentication token valid and included
- [ ] Network tab shows correct requests/responses
- [ ] Browser console shows no errors
- [ ] API response format matches type definitions
- [ ] Cache not causing stale data

---

**Next Steps**:
- Review [BACKEND_API_REFERENCE.md](BACKEND_API_REFERENCE.md) for detailed endpoints
- Check [COMPLETE_DASHBOARD_BUILD_GUIDE.md](COMPLETE_DASHBOARD_BUILD_GUIDE.md) for system architecture
- See [QUICK_START.md](QUICK_START.md) for setup instructions

**Version**: 1.0  
**Last Updated**: 2024-01-15
