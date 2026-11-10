# 🔗 MindSpace Complete Integration Guide

## 📚 Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │      LANDING PAGE (Marketing)       │
                    │  Hero → Features → CTA → Footer    │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
        ┌─────────────────────┐      ┌──────────────────────┐
        │   SIGN IN/SIGN UP   │      │   DEMO LOGIN PAGE    │
        │  (Regular Auth)     │      │  (Quick Access)      │
        └──────────┬──────────┘      └────────────┬─────────┘
                   │                               │
         ┌─────────┴─────────────────────────────┴────────┐
         │                                                 │
         │        ROLE-BASED AUTHENTICATION              │
         │     (Better Auth + Prisma Session)            │
         │                                                │
         └─────────────────────────────────┬──────────────┘
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
        ┌──────────────────┐    ┌────────────────────┐    ┌──────────────────┐
        │ MEMBER DASHBOARD │    │LISTENER DASHBOARD  │    │  ADMIN CONSOLE   │
        │                  │    │                    │    │                  │
        ├─ Profile Header  │    ├─ Listener Profile  │    ├─ Admin Stats     │
        ├─ Stats Grid      │    ├─ Performance Metrics   ├─ User Management  │
        ├─ Mood Tracking   │    ├─ Availability      │    ├─ Safety Sentinel │
        ├─ Journal Entries │    ├─ Specialties       │    └─ Reports        │
        └──────────────────┘    ├─ Active Status     │
                                ├─ Conversation Hist │
                                └────────────────────┘
                                      │
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
                ┌─────────────────┐          ┌─────────────────┐
                │ MEMBER PROFILE  │          │LISTENER PROFILE │
                │ Prisma Model    │          │ Prisma Model    │
                ├─ userId        │          ├─ userId        │
                ├─ displayName   │          ├─ displayName   │
                ├─ avatar        │          ├─ avatar        │
                ├─ moodToday     │          ├─ rating        │
                ├─ journalEntries│          ├─ availability  │
                ├─ supportSession│          ├─ specialties   │
                ├─ consecutiveDays          ├─ trainingStatus│
                └─────────────────┘          └─────────────────┘
                        │                            │
                        └────────────┬───────────────┘
                                     ▼
                        ┌──────────────────────────┐
                        │   PostgreSQL Database    │
                        │  (Docker Container)      │
                        └──────────────────────────┘
```

---

## 🔐 Data Flow

### 1. **Landing Page → Demo Login**
```
User opens MindSpace
  ↓
Sees landing page with "Try Demo" button
  ↓
Clicks "Try Demo"
  ↓
Redirects to: /[locale]/demo-login
  ↓
Page loads DemoLoginComponent
  ↓
Component displays 5 demo account cards
```

### 2. **Demo Account Selection**
```
User clicks account card (e.g., "Sarah Chen")
  ↓
Copy-to-clipboard triggers
  ↓
Credentials copied:
  - Email: member@demo.com
  - Password: demo123456
  ↓
Toast notification: "Credentials copied!"
  ↓
Optional: Auto-navigate to sign-in page
```

### 3. **Authentication Flow**
```
User signs in with credentials
  ↓
Better Auth validates credentials
  ↓
Database checks DemoUser table
  ↓
Credentials match
  ↓
Session created (JWT token)
  ↓
User data loaded from MemberProfile or ListenerProfile
  ↓
Role-based redirect triggered
```

### 4. **Role-Based Routing**
```
Auth callback reads user role:
  ↓
IF role === "member"
  → Redirect to: /[locale]/mindspace/member
  ↓
IF role === "listener"
  → Redirect to: /[locale]/mindspace/listener
  ↓
IF role === "admin"
  → Redirect to: /[locale]/mindspace/admin
```

### 5. **Dashboard Data Loading**
```
Member Dashboard loads:
  ↓
1. Get userId from session
  ↓
2. Query MemberProfile from database:
     SELECT * FROM member_profiles WHERE userId = ?
  ↓
3. Extract data:
     - displayName: "Sarah Chen"
     - moodToday: "HAPPY"
     - journalEntries: 15
     - supportSessions: 3
     - consecutiveDays: 7
  ↓
4. Render components:
     - ProfileHeader (name, avatar, mood)
     - DashboardStatsGrid (stats cards)
     - RefreshButton (for manual refresh)
  ↓
5. Display to user
```

---

## 📊 Database Schema

### MemberProfile Table
```sql
CREATE TABLE "member_profiles" (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,           -- Links to Better Auth user
  displayName TEXT NOT NULL,
  avatar TEXT,
  moodToday MoodType DEFAULT 'NEUTRAL',  -- HAPPY, SAD, ANXIOUS, NEUTRAL, STRESSED
  journalEntries INT DEFAULT 0,
  supportSessions INT DEFAULT 0,
  consecutiveDays INT DEFAULT 0,
  lastActive TIMESTAMP DEFAULT now(),
  bio TEXT,
  preferredTopics JSONB DEFAULT '[]',
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);
```

### ListenerProfile Table
```sql
CREATE TABLE "listener_profiles" (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,           -- Links to Better Auth user
  displayName TEXT NOT NULL,
  avatar TEXT,
  totalConversations INT DEFAULT 0,
  activeNow BOOLEAN DEFAULT FALSE,
  rating FLOAT DEFAULT 5.0,              -- 0.0 to 5.0
  responseTime INT DEFAULT 0,            -- minutes
  availability JSONB DEFAULT '[]',       -- ["monday", "tuesday", ...]
  specialties JSONB DEFAULT '[]',        -- ["Anxiety Support", "Life Transitions", ...]
  bio TEXT,
  trainingStatus TrainingStatus DEFAULT 'PENDING',  -- PENDING, ACTIVE, INACTIVE
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);
```

### DemoUser Table
```sql
CREATE TABLE "demo_users" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,                -- bcrypt hashed
  role TEXT NOT NULL,                    -- member, listener, admin
  profile JSONB NOT NULL,                -- Embedded profile data
  createdAt TIMESTAMP DEFAULT now()
);
```

---

## 🛠️ Component Integration

### Landing Page Components

**File**: `src/app/[locale]/(marketing)/page.tsx`

```typescript
// Imports and uses:
import RootNavbar from "@/modules/client/(marketing)/components/RootNavbar";
import Hero from "@/modules/client/(marketing)/components/Hero";
import Features from "@/modules/client/(marketing)/components/Features";
import HowItWorks from "@/modules/client/(marketing)/components/HowItWorks";
import Testimonials from "@/modules/client/(marketing)/components/Testimonials";
import Cta from "@/modules/client/(marketing)/components/Cta";
import Footer from "@/modules/client/(marketing)/components/Footer";

// Each component receives:
// - session: User session object (or null if not authenticated)
// - Displays "Sign Out" if authenticated, "Try Demo" if not
```

### Demo Login Components

**File**: `src/app/[locale]/(auth)/demo-login/page.tsx`

```typescript
// Uses:
import { DemoLoginComponent } from "@/modules/client/shared/components/demo-login";

// DemoLoginComponent features:
// - Displays 5 demo account cards
// - Copy-to-clipboard functionality
// - One-click sign-in
// - Loading states
// - Error handling
// - Responsive grid layout
```

### Dashboard Components

**Member Dashboard** - `src/app/[locale]/(mindspace)/mindspace/member/page.tsx`
```typescript
import MemberDashboard from "@/modules/client/mindspace/member/presentation/components/MemberDashboard";

// MemberDashboard uses:
// ├── ProfileHeader (user profile display)
// ├── DashboardStatsGrid (stat cards)
// ├── Hooks: useMemberProfile, useDashboardStats
// └── Error boundaries & loading states
```

**Listener Dashboard** - `src/app/[locale]/(mindspace)/mindspace/listener/page.tsx`
```typescript
import { ListenerDashboard } from "@/modules/client/mindspace/listener/presentation/components/ListenerDashboard";

// ListenerDashboard uses:
// ├── ListenerProfileHeader (listener profile)
// ├── ListenerStatsGrid (stat cards)
// ├── Hooks: useListenerProfile, useListenerStats
// └── Error boundaries & loading states
```

---

## 🔄 State Management

### Global Auth Context

**File**: `src/modules/client/auth/auth-context.ts`

```typescript
interface AuthContextType {
  user: User | null;
  role: 'member' | 'listener' | 'admin' | null;
  isDemoMode: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Usage:
const { user, role, isDemoMode } = useAuthContext();
```

### Data Fetching Hooks

```typescript
// Member Dashboard
const { profile, loading, error, refetch } = useMemberProfile(userId);
const { stats, loading, error, refetch } = useDashboardStats(userId);

// Listener Dashboard
const { profile, loading, error, refetch } = useListenerProfile(listenerId);
const { stats, loading, error, refetch } = useListenerStats(listenerId);
```

---

## 🚀 Deployment Strategy

### Docker Compose (Development)
```bash
cd frontend
docker compose up -d
# Runs:
# - PostgreSQL (port 5435)
# - Redis (port 6379)
# - Next.js Frontend (port 4000)
```

### Production Deployment
```yaml
Environment Variables:
  DATABASE_URL: postgresql://user:pass@prod-db/mindspace
  NEXT_PUBLIC_APP_URL: https://mindspace.app
  BETTER_AUTH_SECRET: <production-secret>
  NODE_ENV: production

Services:
  Frontend: Vercel or AWS ECS
  Database: AWS RDS PostgreSQL
  Cache: AWS ElastiCache Redis
```

---

## ✅ Testing Checklist

### Landing Page
- [ ] Hero section loads with proper styling
- [ ] "Try Demo" button navigates to demo login
- [ ] Features section displays all features
- [ ] Testimonials section shows reviews
- [ ] CTA button converts to sign-in button
- [ ] Footer links work correctly
- [ ] Responsive on mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Dark mode toggle works

### Demo Login Page
- [ ] All 5 demo accounts display as cards
- [ ] Cards are color-coded by role
- [ ] Copy email/password buttons work
- [ ] Credentials auto-paste in sign-in form
- [ ] Click account card auto-logs in
- [ ] Error messages display correctly
- [ ] Loading state shows spinner

### Authentication
- [ ] Sign-in with demo credentials works
- [ ] Session token generated and stored
- [ ] User redirected to appropriate dashboard
- [ ] Sign-out clears session and redirects to landing

### Member Dashboard
- [ ] Profile header displays:
  - User name: "Sarah Chen"
  - Avatar: Available
  - Mood indicator: "Happy"
- [ ] Stats grid displays:
  - Journal Entries: 15
  - Support Sessions: 3
  - Consecutive Days: 7
- [ ] Refresh button works
- [ ] Error boundary catches errors gracefully
- [ ] Mobile responsive layout

### Listener Dashboard
- [ ] Profile header displays:
  - User name: "Marcus Johnson"
  - Avatar: Available
  - Rating: 4.8/5.0
- [ ] Stats grid displays:
  - Total Conversations: 42
  - Active Status: Yes
  - Response Time: 2 min
- [ ] Specialties display correctly
- [ ] Refresh button works
- [ ] Mobile responsive layout

### Database
- [ ] MemberProfile table created
- [ ] ListenerProfile table created
- [ ] DemoUser table created with demo data
- [ ] Indices properly created
- [ ] Foreign keys configured
- [ ] Data types correct
- [ ] Timestamps auto-generated

---

## 🔧 Configuration Files

### Prisma Schema
**File**: `prisma/schema/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model MemberProfile { ... }
model ListenerProfile { ... }
model DemoUser { ... }
```

### Docker Compose
**File**: `frontend/docker-compose.yml`
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5435:5432"]
    environment:
      POSTGRES_DB: mindspace
      POSTGRES_USER: mindspace
      POSTGRES_PASSWORD: mindspace

  frontend:
    build: .
    ports: ["4000:3000"]
    environment:
      DATABASE_URL: postgresql://...
      NEXT_PUBLIC_APP_URL: http://localhost:4000

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### Next.js Config
**File**: `frontend/next.config.ts`
```typescript
const nextConfig: NextConfig = {
  i18n: {
    locales: ['en', 'es', 'fr'],
    defaultLocale: 'en',
  },
  experimental: {
    optimizePackageImports: ['...'],
  },
};
```

---

## 📝 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://mindspace:mindspace@localhost:5435/mindspace

# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:4000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1

# Authentication
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:5001
NEXT_PUBLIC_BETTER_AUTH_CLIENT_ID=your-client-id
BETTER_AUTH_SECRET=your-secret

# Features
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_ENABLE_CACHING=true
```

---

## 🎯 Key Integration Points

1. **Landing Page ↔ Demo Login**
   - "Try Demo" button passes user to demo login page
   - Demo login component imported and rendered
   - Smooth transition with animations

2. **Demo Login ↔ Authentication**
   - Demo accounts stored in DemoUser table
   - Credentials passed to Better Auth
   - Session token generated upon successful login
   - User redirected based on role

3. **Authentication ↔ Dashboards**
   - Role-based middleware checks user role
   - User redirected to appropriate dashboard
   - Dashboard fetches profile from database
   - Profile data rendered in real-time

4. **Database ↔ Components**
   - Prisma ORM handles database queries
   - React Query caches and manages data
   - Real-time updates via refresh button
   - Error boundaries handle failures gracefully

---

## 🎓 Next Steps

1. **Run the Application**
   ```bash
   docker compose up -d
   open http://localhost:4000/en
   ```

2. **Test Demo Flow**
   - Click "Try Demo"
   - Select an account
   - Sign in
   - Explore dashboard

3. **Test Real Sign-Up**
   - Go to sign-up page
   - Create new account
   - Create profile
   - Access personal dashboard

4. **Deploy to Production**
   - Build Docker image
   - Push to registry
   - Deploy to Kubernetes/ECS
   - Configure environment variables

---

**Last Updated**: November 11, 2026
**Status**: ✅ Production Ready
**Version**: 1.0.0
