# MindSpace Demo Users & Dashboard Features

## 📋 Overview

यह implementation MindSpace project में निम्नलिखित features जोड़ता है:

1. **Prisma Database Schema** - MemberProfile, ListenerProfile, DemoUser models
2. **Demo User Accounts** - Pre-configured demo credentials for quick testing
3. **Demo Login Page** - Dedicated demo account access interface
4. **Auth Context** - Global user state management
5. **Dashboard Redirect** - Role-based dashboard routing
6. **Landing Page Section** - Demo access showcase on marketing page

---

## 🗄️ Database Schema

### 1. MemberProfile
Member (patient) के लिए profile data store करता है:

```typescript
- id: String (UUID)
- userId: String (Better Auth user ID)
- displayName: String
- avatar: String (URL)
- moodToday: MoodType (enum: HAPPY, SAD, ANXIOUS, NEUTRAL, STRESSED)
- journalEntries: Int
- supportSessions: Int
- consecutiveDays: Int
- lastActive: DateTime
- bio: String
- preferredTopics: Json (array)
- createdAt: DateTime
- updatedAt: DateTime
```

### 2. ListenerProfile
Listener (supporter/counselor) के लिए profile data store करता है:

```typescript
- id: String (UUID)
- userId: String (Better Auth user ID)
- displayName: String
- avatar: String (URL)
- totalConversations: Int
- activeNow: Boolean
- rating: Float (0-5)
- responseTime: Int (minutes)
- availability: Json (array of days)
- specialties: Json (array)
- bio: String
- trainingStatus: TrainingStatus (PENDING, ACTIVE, INACTIVE)
- createdAt: DateTime
- updatedAt: DateTime
```

### 3. DemoUser
Demo login के लिए quick access users:

```typescript
- id: String (UUID)
- email: String (unique)
- password: String (hashed)
- role: String (member, listener, admin)
- profile: Json (profile metadata)
- createdAt: DateTime
```

---

## 👤 Demo Accounts

### Members

**1. Sarah Chen (Member)**
- Email: `member@demo.com`
- Password: `demo123456`
- Mood: Happy 😊
- Journal Entries: 15
- Support Sessions: 3
- Consecutive Days: 7
- Dashboard: `/mindspace/member`

**2. Alex Rivera (Member)**
- Email: `member2@demo.com`
- Password: `demo123456`
- Mood: Anxious 😟
- Journal Entries: 8
- Support Sessions: 2
- Consecutive Days: 4
- Dashboard: `/mindspace/member`

### Listeners

**1. Marcus Johnson (Listener)**
- Email: `listener@demo.com`
- Password: `demo123456`
- Rating: 4.8⭐
- Total Conversations: 42
- Active Now: Yes
- Specialty: Anxiety Support
- Dashboard: `/mindspace/listener`

**2. Emma Williams (Listener)**
- Email: `listener2@demo.com`
- Password: `demo123456`
- Rating: 4.9⭐
- Total Conversations: 58
- Active Now: Yes
- Specialty: Life Transitions
- Dashboard: `/mindspace/listener`

### Admin

**Admin User**
- Email: `admin@demo.com`
- Password: `demo123456`
- Dashboard: `/mindspace/admin`

---

## 🎯 Features & Files

### 1. Database Migration
**File:** `prisma/migrations/20261110204831_add_demo_profiles/`

Prisma migration file जो तीनों नए models को database में add करता है।

```bash
pnpm exec prisma migrate dev --name add_demo_profiles
```

### 2. Auth Context Hook
**File:** `src/modules/client/auth/auth-context.ts`

Global user state management के लिए React context:

```typescript
export const useAuthContext = () => {
  // userId, userRole, displayName
  // memberProfile, listenerProfile
  // isDemoMode, isLoading, error
  // logout(), refreshProfile()
};
```

**Usage:**
```tsx
const { userRole, displayName, logout } = useAuthContext();
```

### 3. Dashboard Redirect Hook
**File:** `src/modules/client/shared/hooks/useDashboardRedirect.ts`

Automatic role-based dashboard routing:

```typescript
const { redirectToDashboard, isLoading } = useDashboardRedirect();
// या custom config के साथ
const { redirectToDashboard } = useDashboardRedirect({
  member: "/custom/member-path",
  listener: "/custom/listener-path"
});
```

### 4. Demo Login Component
**File:** `src/modules/client/shared/components/demo-login.tsx`

सभी demo accounts को cards में display करने वाली component:

```tsx
<DemoLoginComponent 
  onLoginStart={() => console.log("Starting login")}
  onLoginComplete={(role) => console.log("Logged in as", role)}
/>
```

Features:
- All 5 demo accounts के cards
- Copy-to-clipboard for credentials
- Loading states
- Color-coded by role

### 5. Demo Sign-In Page
**File:** `src/app/[locale]/(auth)/demo-login/page.tsx`

Dedicated demo login page जो सभी accounts को showcase करता है।

**Access:** `/en/demo-login` (or `/hi/demo-login` for Hindi)

Features:
- Beautiful gradient backgrounds
- Demo accounts overview
- Info sections for each role
- Direct links to regular sign-in
- Demo credentials display

### 6. Landing Page Demo Section
**File:** `src/modules/client/(marketing)/components/DemoAccessSection.tsx`

Marketing page पर demo access को showcase करता है।

Features:
- Role-based demo experience cards
- What's included section
- Perfect for section
- CTA buttons to demo login

**Integration:**
```tsx
// src/app/[locale]/(marketing)/page.tsx में जोड़ा गया
<DemoAccessSection />
```

### 7. Demo Seed API Route
**File:** `src/app/api/seed/demo-users/route.ts`

Database को demo data से seed करने का API endpoint:

```bash
# Seed demo users
curl -X POST http://localhost:4000/api/seed/demo-users \
  -H "Authorization: Bearer demo-seed-secret"
```

---

## 🚀 Setup & Usage

### Step 1: Database Migration
```bash
cd frontend
pnpm exec prisma migrate dev --name add_demo_profiles
```

### Step 2: Generate Prisma Client
```bash
pnpm db:generate
```

### Step 3: Seed Demo Data

#### Option A: Via API (Production)
```bash
curl -X POST http://localhost:4000/api/seed/demo-users \
  -H "Authorization: Bearer demo-seed-secret" \
  -H "Content-Type: application/json"
```

#### Option B: Direct Script (Development)
```bash
# पहले Prisma को properly setup करें
pnpm tsx scripts/test-data/demo-users-seed.ts
```

### Step 4: Access Demo Login
1. Open: `http://localhost:4000/en/demo-login`
2. Select any demo account
3. Click "Sign in" button
4. Automatically redirected to appropriate dashboard

---

## 🎨 Styling

सभी components Tailwind CSS के साथ fully styled हैं:

**Color Scheme:**
- **Members**: Emerald (green) to Teal - `from-emerald-500 to-teal-600`
- **Listeners**: Cyan to Blue - `from-cyan-500 to-blue-600`
- **Admin**: Purple to Pink - `from-purple-500 to-pink-600`

**Responsive Design:**
- Mobile-first approach
- Grid layouts (grid-cols-1, md:grid-cols-2, lg:grid-cols-3)
- Tailwind breakpoints

**Dark Mode:**
सभी components में dark mode support:
```tsx
dark:bg-emerald-950/20
dark:text-emerald-100
dark:border-emerald-900/40
```

---

## 🔌 Integration Points

### 1. Auth Provider
App के root में wrap करें:

```tsx
// app/layout.tsx या provider file में
import { AuthProvider } from "@/modules/client/auth/auth-context";

<AuthProvider>
  {children}
</AuthProvider>
```

### 2. Landing Page
Demo section पहले से integrate किया गया है:

```tsx
// src/app/[locale]/(marketing)/page.tsx
<DemoAccessSection />
```

### 3. Auth Callback
Existing callback को update करके role-based redirect:

```tsx
const { redirectToDashboard } = useDashboardRedirect();
```

---

## 🧪 Testing Checklist

### Landing Page
- [ ] `/en/` पर demo section दिखता है
- [ ] "Try Demo Accounts" button काम करता है
- [ ] Feature highlights सही दिखते हैं

### Demo Login Page
- [ ] `/en/demo-login` accessible है
- [ ] सभी 5 demo accounts display होते हैं
- [ ] Credentials copy-paste काम करते हैं
- [ ] Color coding सही है

### Sign-In Flow
- [ ] Demo account select करके click करने से login होता है
- [ ] Loader state दिखता है
- [ ] Member → `/mindspace/member` redirect होता है
- [ ] Listener → `/mindspace/listener` redirect होता है
- [ ] Admin → `/mindspace/admin` redirect होता है

### Dashboard Dashboards
- [ ] Member profile data दिखता है
- [ ] Listener profile data दिखता है
- [ ] Logout button काम करता है
- [ ] Demo mode flag सेट होती है

### Responsive Design
- [ ] Mobile (375px) पर सही दिखता है
- [ ] Tablet (768px) पर सही दिखता है
- [ ] Desktop (1024px+) पर सही दिखता है

---

## 📝 Notes

1. **Password Hashing**: Demo seed में SHA256 का use किया गया है। Production में bcrypt का use करें।

2. **Demo Mode Flag**: `localStorage.isDemoMode` set होता है ताकि UI different behavior कर सके।

3. **Shared Data**: सभी demo users का data shared है - कोई भी modification सभी को visible होगा।

4. **Better Auth Integration**: Real authentication के लिए Better Auth के साथ integration करना पड़ेगा।

5. **Profile Pictures**: Dicebear API का use करके random avatars generate होते हैं।

---

## 🔐 Security Considerations

- Demo accounts production में accessible नहीं हैं
- Seed endpoint authorization check करता है
- Demo passwords simple हैं (डेमो के लिए ही)
- localStorage में sensitive data store नहीं करें

---

## 📚 Files Summary

| File | Purpose |
|------|---------|
| `prisma/schema/schema.prisma` | Database models |
| `prisma/migrations/...` | Database migration |
| `src/modules/client/auth/auth-context.ts` | Auth state management |
| `src/modules/client/shared/hooks/useDashboardRedirect.ts` | Dashboard routing |
| `src/modules/client/shared/components/demo-login.tsx` | Demo login component |
| `src/app/[locale]/(auth)/demo-login/page.tsx` | Demo login page |
| `src/modules/client/(marketing)/components/DemoAccessSection.tsx` | Landing page section |
| `src/app/api/seed/demo-users/route.ts` | Seed API endpoint |
| `scripts/test-data/demo-users-seed.ts` | Seed script |

---

✅ **Setup Complete!** Demo users and dashboard features अब MindSpace में ready हैं।
