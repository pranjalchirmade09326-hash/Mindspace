# 🚀 MindSpace Demo Setup Guide - Complete Workflow

## 📋 Overview

आपका MindSpace platform अब **production-ready** है with:
- ✅ Professional Landing Page (Hero, Features, CTA)
- ✅ Complete Auth System (Sign In, Sign Up)
- ✅ Demo Login with 5 Pre-configured Accounts
- ✅ Member Dashboard (Profile, Stats, Journal)
- ✅ Listener Dashboard (Profile, Performance Metrics)
- ✅ Database Integration with Prisma & PostgreSQL
- ✅ Custom UI Components with Tailwind CSS
- ✅ Role-Based Routing & Navigation

---

## 🎯 Demo Accounts

### Members (Role: member)
```
Account 1:
├─ Email: member@demo.com
├─ Password: demo123456
├─ Name: Sarah Chen
├─ Mood: Happy
├─ Journal Entries: 15
├─ Support Sessions: 3
└─ Consecutive Days: 7

Account 2:
├─ Email: member2@demo.com
├─ Password: demo123456
├─ Name: Alex Rivera
├─ Mood: Anxious
├─ Journal Entries: 8
├─ Support Sessions: 2
└─ Consecutive Days: 4
```

### Listeners (Role: listener)
```
Account 1:
├─ Email: listener@demo.com
├─ Password: demo123456
├─ Name: Marcus Johnson
├─ Rating: 4.8/5.0
├─ Total Conversations: 42
├─ Active: Yes
└─ Specialty: Anxiety Support

Account 2:
├─ Email: listener2@demo.com
├─ Password: demo123456
├─ Name: Emma Williams
├─ Rating: 4.9/5.0
├─ Total Conversations: 58
├─ Active: Yes
└─ Specialty: Life Transitions
```

### Admin (Role: admin)
```
├─ Email: admin@demo.com
├─ Password: demo123456
└─ Name: Admin User
```

---

## 🔧 Installation & Setup

### Step 1: Install Dependencies
```bash
cd D:\Mindspace\frontend
pnpm install
```

### Step 2: Environment Configuration
Create `.env.local` file:
```bash
# Database
DATABASE_URL="postgresql://mindspace:mindspace@localhost:5435/mindspace"

# Frontend URLs
NEXT_PUBLIC_APP_URL="http://localhost:4000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:8080/api/v1"

# Better Auth
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:5001"
NEXT_PUBLIC_BETTER_AUTH_CLIENT_ID="your-client-id"
BETTER_AUTH_SECRET="your-secret"
```

### Step 3: Database Setup

#### Option A: Using Docker Compose (Recommended)
```bash
cd D:\Mindspace\frontend
docker compose up -d

# Wait for services to be healthy
docker compose ps
```

#### Option B: Manual PostgreSQL Setup
```bash
# Start PostgreSQL on port 5435
# Create database 'mindspace'
# Run migrations
cd D:\Mindspace\frontend
pnpm exec prisma migrate deploy
```

### Step 4: Seed Demo Data
```bash
# Run demo user seed script
cd D:\Mindspace\frontend
pnpm exec tsx scripts/test-data/demo-users-seed.ts

# OR use API endpoint (when server is running)
curl -X POST http://localhost:4000/api/seed/demo-users
```

### Step 5: Start the Application

#### Local Development
```bash
cd D:\Mindspace\frontend
pnpm dev
```

#### Docker Compose
```bash
cd D:\Mindspace\frontend
docker compose up -d
```

---

## 🌐 Access URLs

| Page | URL | Purpose |
|------|-----|---------|
| **Landing Page** | http://localhost:4000/en | Marketing homepage |
| **Demo Login** | http://localhost:4000/en/demo-login | Quick demo access |
| **Sign In** | http://localhost:4000/en/login | Regular sign-in |
| **Sign Up** | http://localhost:4000/en/signup | New account registration |
| **Member Dashboard** | http://localhost:4000/en/mindspace/member | Member workspace |
| **Listener Dashboard** | http://localhost:4000/en/mindspace/listener | Listener workspace |
| **Admin Dashboard** | http://localhost:4000/en/mindspace/admin | Admin console |

---

## 🧪 Testing Workflow

### Test 1: Landing Page Flow
1. Go to: `http://localhost:4000/en`
2. Verify landing page displays:
   - ✅ MindSpace logo and branding
   - ✅ Hero section with intro
   - ✅ Features section
   - ✅ "Try Demo" button
3. Click "Try Demo" → should go to `/demo-login`

### Test 2: Demo Login
1. Go to: `http://localhost:4000/en/demo-login`
2. Verify all 5 demo accounts displayed:
   - ✅ 2 Member accounts (Sarah Chen, Alex Rivera)
   - ✅ 2 Listener accounts (Marcus, Emma)
   - ✅ 1 Admin account
3. Click on any account card
4. See credentials popup (email & password)
5. Click "Copy Email" or "Copy Password"

### Test 3: Member Dashboard Flow
1. From demo login, click on **Sarah Chen** (member)
2. System should:
   - ✅ Copy credentials to clipboard
   - ✅ Show notification "Credentials copied!"
   - ✅ Auto-populate email & password in sign-in form
3. Click "Sign In" button
4. Should redirect to: `/en/mindspace/member`
5. Verify dashboard displays:
   - ✅ Profile header with Sarah's name
   - ✅ Statistics grid with:
      - Journal Entries: 15
      - Support Sessions: 3
      - Consecutive Days: 7
   - ✅ Mood indicator
   - ✅ Refresh button works
   - ✅ Responsive on mobile/tablet/desktop

### Test 4: Listener Dashboard Flow
1. Go to: `http://localhost:4000/en/demo-login`
2. Click on **Marcus Johnson** (listener)
3. Verify credentials copied
4. Sign in
5. Should redirect to: `/en/mindspace/listener`
6. Verify dashboard displays:
   - ✅ Profile header with Marcus's name
   - ✅ Statistics grid with:
      - Total Conversations: 42
      - Rating: 4.8/5.0
      - Active: Yes
   - ✅ Specialties displayed
   - ✅ Response time metrics
   - ✅ Refresh button works

### Test 5: Sign-Out & Re-login
1. From any dashboard, click logout (if available)
2. Should redirect to landing page
3. Try regular sign-in (not demo)
4. Use demo credentials: `member@demo.com` / `demo123456`
5. Should work same as demo flow

### Test 6: Mobile Responsiveness
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on multiple viewport sizes:
   - ✅ Mobile (375px)
   - ✅ Tablet (768px)
   - ✅ Desktop (1024px+)
4. Verify all elements adapt properly

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── app/
│   │   └── [locale]/
│   │       ├── (marketing)/
│   │       │   ├── page.tsx              # Landing page
│   │       │   └── layout.tsx
│   │       ├── (auth)/
│   │       │   ├── login/page.tsx        # Sign-in
│   │       │   ├── signup/page.tsx       # Sign-up
│   │       │   ├── demo-login/page.tsx   # Demo login (NEW)
│   │       │   └── callback/page.tsx     # Auth callback
│   │       └── (mindspace)/
│   │           └── mindspace/
│   │               ├── member/           # Member workspace
│   │               └── listener/         # Listener workspace
│   │
│   └── modules/
│       ├── client/
│       │   ├── (marketing)/
│       │   │   └── components/
│       │   │       ├── RootNavbar.tsx
│       │   │       ├── Hero.tsx
│       │   │       ├── Features.tsx
│       │   │       └── Cta.tsx
│       │   │
│       │   ├── auth/
│       │   │   ├── auth-client.ts
│       │   │   └── auth-context.ts       # (NEW)
│       │   │
│       │   ├── shared/
│       │   │   └── components/
│       │   │       ├── demo-login.tsx    # (NEW)
│       │   │       └── AppLogo.tsx
│       │   │
│       │   └── mindspace/
│       │       ├── member/
│       │       │   ├── domain/
│       │       │   ├── application/
│       │       │   ├── infrastructure/
│       │       │   └── presentation/
│       │       │       └── components/
│       │       │           ├── MemberDashboard.tsx
│       │       │           ├── ProfileHeader.tsx
│       │       │           └── DashboardStatsGrid.tsx
│       │       │
│       │       └── listener/
│       │           ├── domain/
│       │           ├── application/
│       │           ├── infrastructure/
│       │           └── presentation/
│       │               └── components/
│       │                   ├── ListenerDashboard.tsx
│       │                   ├── ListenerProfileHeader.tsx
│       │                   └── ListenerStatsGrid.tsx
│
├── prisma/
│   ├── schema/
│   │   └── schema.prisma                 # Database schema (updated)
│   └── migrations/
│       └── 20261110204831_add_demo_profiles/  # (NEW)
│           └── migration.sql
│
└── scripts/
    └── test-data/
        ├── seed.ts
        └── demo-users-seed.ts            # (NEW)
```

---

## 🎨 Key Features Implemented

### 1. **Landing Page** (`/en`)
- Modern hero section
- Feature highlights
- Testimonials
- Call-to-action buttons
- Responsive design
- Dark mode support

### 2. **Demo Login Page** (`/en/demo-login`)
- 5 pre-configured demo accounts
- Copy-to-clipboard credentials
- Color-coded by role
- Account descriptions
- Direct sign-in integration
- Loading states

### 3. **Sign-In Integration**
- Auto-fill demo credentials
- Role-based routing
- Error handling
- Loading indicators
- Remember me option

### 4. **Member Dashboard** (`/en/mindspace/member`)
- User profile header
- Statistics grid (journal, sessions, streak)
- Mood indicator
- Quick actions
- Responsive sidebar
- Dark mode support

### 5. **Listener Dashboard** (`/en/mindspace/listener`)
- Profile with rating
- Performance metrics
- Availability status
- Active conversation count
- Specialty tags
- Professional layout

### 6. **Database Models**
```prisma
model MemberProfile {
  - id, userId (1:1 with Better Auth)
  - displayName, avatar
  - moodToday, journalEntries, supportSessions
  - consecutiveDays, lastActive
  - bio, preferredTopics (JSON array)
  - timestamps
}

model ListenerProfile {
  - id, userId (1:1 with Better Auth)
  - displayName, avatar
  - totalConversations, rating, responseTime
  - activeNow (boolean)
  - availability, specialties (JSON arrays)
  - trainingStatus
  - timestamps
}

model DemoUser {
  - id, email, password (hashed)
  - role (member/listener/admin)
  - profile (JSON blob)
  - timestamp
}
```

---

## 🔐 Security Features

✅ **Password Hashing** - Demo passwords are bcrypt hashed in database
✅ **Session Management** - JWT tokens via Better Auth
✅ **CSRF Protection** - Built-in Next.js protection
✅ **Secure Cookies** - HttpOnly, Secure flags set
✅ **Role-Based Access** - Middleware validates user role
✅ **API Protection** - Rate limiting on seed endpoints
✅ **Input Validation** - Zod schemas for all inputs

---

## 🐛 Troubleshooting

### Issue: "Cannot find module" errors
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm exec prisma generate
```

### Issue: Database connection failed
```bash
# Check PostgreSQL is running
docker compose ps

# Or manually connect
psql -h localhost -p 5435 -U mindspace -d mindspace
```

### Issue: Demo accounts not found
```bash
# Verify migration applied
pnpm exec prisma migrate status

# Seed demo data
pnpm exec tsx scripts/test-data/demo-users-seed.ts
```

### Issue: Styles not loading
```bash
# Rebuild Tailwind CSS
pnpm exec tailwindcss -i ./src/globals.css -o ./src/app/globals.css

# Or clear Next.js cache
rm -rf .next
pnpm dev
```

---

## 📊 Database Schema Visualization

```
Better Auth (External)
    ↓
    ├── User → Member Dashboard
    │           ├── MemberProfile
    │           ├── Mood Tracking
    │           └── Journal Entries
    │
    └── User → Listener Dashboard
                ├── ListenerProfile
                ├── Performance Metrics
                └── Availability
```

---

## 🚀 Production Deployment

### Docker Build
```bash
cd frontend
docker build -t mindspace:latest .
docker run -p 4000:3000 mindspace:latest
```

### Vercel Deployment
```bash
# Push to git
git add .
git commit -m "Ready for deployment"
git push origin main

# Deploy via Vercel Dashboard
# or CLI: vercel deploy --prod
```

### Environment Variables (Production)
```
NEXT_PUBLIC_APP_URL=https://mindspace.app
DATABASE_URL=postgresql://user:pass@host/db
NEXT_PUBLIC_BETTER_AUTH_URL=https://auth.mindspace.app
```

---

## 📞 Support

For issues or questions:
1. Check logs: `docker compose logs -f frontend`
2. Verify database: `psql -c "SELECT * FROM member_profiles;"`
3. Check migrations: `pnpm exec prisma migrate status`
4. Review browser console for client-side errors

---

**Last Updated**: November 11, 2026
**Status**: ✅ Production Ready
**Version**: 1.0.0
