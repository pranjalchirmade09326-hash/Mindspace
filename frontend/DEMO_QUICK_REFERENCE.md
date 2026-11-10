# MindSpace Demo Users - Quick Reference

## 🎯 Quick Start

### 1. Database Setup
```bash
cd frontend
pnpm exec prisma migrate dev --name add_demo_profiles
pnpm db:generate
```

### 2. Seed Demo Data
```bash
# API endpoint को call करें
curl -X POST http://localhost:4000/api/seed/demo-users \
  -H "Authorization: Bearer demo-seed-secret"
```

### 3. Access Demo Login
Open: `http://localhost:4000/en/demo-login`

---

## 👤 Demo Credentials

### Members
| Name | Email | Password | Mood | Status |
|------|-------|----------|------|--------|
| Sarah Chen | member@demo.com | demo123456 | Happy 😊 | ✅ Active |
| Alex Rivera | member2@demo.com | demo123456 | Anxious 😟 | ✅ Active |

### Listeners
| Name | Email | Password | Rating | Status |
|------|-------|----------|--------|--------|
| Marcus Johnson | listener@demo.com | demo123456 | 4.8⭐ | ✅ Active |
| Emma Williams | listener2@demo.com | demo123456 | 4.9⭐ | ✅ Active |

### Admin
| Name | Email | Password | Status |
|------|-------|----------|--------|
| Admin User | admin@demo.com | demo123456 | ✅ Active |

---

## 📂 New Files Created

```
frontend/
├── prisma/
│   ├── schema/
│   │   └── schema.prisma (updated)
│   └── migrations/
│       └── 20261110204831_add_demo_profiles/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── seed/demo-users/route.ts (new)
│   │   └── [locale]/
│   │       ├── (auth)/
│   │       │   └── demo-login/page.tsx (new)
│   │       └── (marketing)/page.tsx (updated)
│   └── modules/
│       └── client/
│           ├── auth/
│           │   └── auth-context.ts (new)
│           ├── (marketing)/components/
│           │   └── DemoAccessSection.tsx (new)
│           └── shared/
│               ├── components/
│               │   └── demo-login.tsx (new)
│               └── hooks/
│                   └── useDashboardRedirect.ts (new)
├── scripts/test-data/
│   └── demo-users-seed.ts (new)
└── DEMO_USERS_SETUP.md (new)
```

---

## 🎨 Components & Hooks

### DemoLoginComponent
सभी demo accounts को cards में display करता है।
```tsx
import { DemoLoginComponent } from "@/modules/client/shared/components/demo-login";
<DemoLoginComponent />
```

### useAuthContext
Global user state access करता है।
```tsx
const { userRole, displayName, isDemoMode } = useAuthContext();
```

### useDashboardRedirect
Role-based dashboard routing करता है।
```tsx
const { redirectToDashboard, isLoading } = useDashboardRedirect();
```

### DemoAccessSection
Marketing page पर demo showcase करता है।
```tsx
import DemoAccessSection from "@/modules/client/(marketing)/components/DemoAccessSection";
<DemoAccessSection />
```

---

## 🧪 Testing URLs

| Page | URL |
|------|-----|
| Landing Page | `http://localhost:4000/en/` |
| Demo Login | `http://localhost:4000/en/demo-login` |
| Member Dashboard | `http://localhost:4000/en/mindspace/member` |
| Listener Dashboard | `http://localhost:4000/en/mindspace/listener` |
| Admin Dashboard | `http://localhost:4000/en/mindspace/admin` |
| Demo Seed (Admin) | `POST /api/seed/demo-users` |

---

## 🔧 API Endpoints

### POST /api/seed/demo-users
Demo users को database में seed करता है।

**Headers:**
```
Authorization: Bearer demo-seed-secret
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Demo users seeded successfully",
  "results": {
    "members": ["member@demo.com", "member2@demo.com"],
    "listeners": ["listener@demo.com", "listener2@demo.com"],
    "admin": "admin@demo.com"
  }
}
```

**Response (Error):**
```json
{
  "error": "Unauthorized"
}
```

---

## 💾 Database Schema

### Tables Created
- `member_profiles` - Member data
- `listener_profiles` - Listener data
- `demo_users` - Demo login accounts

### Key Relationships
- DemoUser → MemberProfile (1:1, via userId)
- DemoUser → ListenerProfile (1:1, via userId)

---

## 🎯 Features

✅ Database Schema (MemberProfile, ListenerProfile, DemoUser)
✅ Prisma Migration
✅ Demo User Seed (5 accounts)
✅ Demo Login Page
✅ Auth Context Hook
✅ Dashboard Redirect Hook
✅ Landing Page Demo Section
✅ Demo Login Component
✅ API Seed Endpoint
✅ Full Tailwind Styling
✅ Dark Mode Support
✅ Responsive Design
✅ Documentation

---

## 📖 Files Reference

| File | Type | Purpose |
|------|------|---------|
| DEMO_USERS_SETUP.md | Docs | Complete setup guide |
| DEMO_QUICK_REFERENCE.md | Docs | Quick reference |
| schema.prisma | Database | Schema definition |
| migration | Database | Migration file |
| auth-context.ts | Hook | Auth state |
| useDashboardRedirect.ts | Hook | Dashboard routing |
| demo-login.tsx | Component | Demo login UI |
| DemoAccessSection.tsx | Component | Landing page section |
| demo-login/page.tsx | Page | Demo login page |
| seed/demo-users/route.ts | API | Seed endpoint |
| demo-users-seed.ts | Script | Seed script |

---

✨ **Ready to use!** सभी demo features production-ready हैं।
