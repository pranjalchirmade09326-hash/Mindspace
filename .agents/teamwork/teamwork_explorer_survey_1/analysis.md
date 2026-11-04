# Comprehensive Analysis: Authentication and Role-Based Dashboard Routing

**Explorer**: Survey Explorer 1 (Auth & Routing)  
**Date**: 2026-11-02  
**Codebase**: Mindspace (`d:\Mindspace\frontend`, `d:\Mindspace\backend`)  
**Status**: Read-Only Survey Complete  

---

## Executive Summary

A comprehensive, end-to-end investigation of the Mindspace authentication architecture, session management, and role-based dashboard routing mechanisms was conducted. The application is built on a customized Next.js 16 App Router architecture using the `proxy.ts` convention (replacing deprecated `middleware.ts`), dual session management (local cookie-backed session `drgodly_session` and external BetterAuth IAM fallback), clean-architecture server actions via `zsa`, and FHIR R4 backend services over PostgreSQL and Redis.

The investigation identified **8 critical discrepancies and bugs** preventing error-free, sub-second routing to role dashboards and live profile display:
1. **Doctor Routing Discrepancy**: Doctor sign-in and sign-up redirect to `/en/bezs/telemedicine/doctor` (today's appointment schedule view) instead of `/en/bezs/telemedicine/doctor/dashboard` (practice overview dashboard).
2. **Admin Routing Inefficiency**: Admin sign-in and sign-up redirect to `/en/bezs/telemedicine/admin`, which triggers an unnecessary secondary server-side redirect hop to `/en/bezs/telemedicine/admin/organizations`, increasing latency and violating direct routing.
3. **Session Mock Fallbacks Out of Sync**: `getDevSession()` in `get-session.ts` hardcodes outdated redirection URLs for Doctor and Admin, propagating wrong redirect targets to intermediate routes (`/bezs`, `/bezs/telemedicine`) and OAuth token handlers.
4. **Missing Role Presentation in UI**: The header (`AppNavbar` / `NavUser`) and sidebar (`MenuBar` / `SidebarNavUser`) do not receive or render user role badges, violating Requirement R3.
5. **Sidebar Navigation Discrepancies**: Menu items in `menu-datas.ts` link Doctor Overview to `/bezs/telemedicine/doctor` and Admin Overview to `/bezs/telemedicine/admin`.
6. **Marketing Navigation and Fallbacks**: Landing page navbar, hero, and CTA components fallback to `/bezs/telemedicine/doctor`.
7. **Timeout Latency Violations**: `getServerSession()` uses a 1200ms timeout when attempting to reach external BetterAuth, which breaches the < 1s sub-second rendering requirement if the IAM service is offline.
8. **Lack of PostgreSQL Profile Sync in Auth Handlers**: `/api/auth/dev-login` sets in-memory cookie sessions without ensuring matching Patient/Practitioner profile records exist in PostgreSQL.

---

## 1. Authentication and Registration Flows

### 1.1 Architecture & Conventions
- **Next.js Version**: Next.js 16.2.4 with React 19.2.4.
- **Middleware / Proxy File**: `frontend/src/proxy.ts` (Next.js 16 convention replacing `middleware.ts`).
  - Configured with `next-intl` routing middleware: `createMiddleware(routing)`.
  - Matcher: `"/((?!api|trpc|_next|_vercel|docs|.*\\..*).*)"`.
  - Supported locales: `["en", "hi", "ta"]` with default `"en"` (`src/i18n/routing.ts:4-5`).
  - Auth route guards are intentionally not located in `proxy.ts` but are handled via Server Component layouts (`AppsLayout`, `TelemedicineAdminLayout`) and ZSA server action procedures (`authenticatedProcedure`, `adminProcedure`).
- **Session Cookie Names**:
  - `drgodly_session`: JSON-serialized session string containing `{ user, session }`.
  - `dev_token`: Bearer token string `"dev-jwt-token"`.

### 1.2 Sign-In Flow (`/[locale]/login`)
- **File**: `frontend/src/app/[locale]/(auth)/login/page.tsx`
- **Implementation**:
  - Quick 1-click access buttons for Doctor, Patient, and Admin (lines 108–176).
  - Credentials form allowing role selection and email/password submission (lines 189–262).
  - Handler `handleLogin(role, customEmail)` calls `POST /api/auth/dev-login`:
    ```typescript
    // src/app/[locale]/(auth)/login/page.tsx:28-43
    const res = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        role,
        locale,
        email: customEmail || email,
        name:
          role === "doctor"
            ? "Dr. John Smith"
            : role === "admin"
            ? "Hospital Administrator"
            : "Sarah Jenkins",
      }),
    });
    ```
  - On response:
    ```typescript
    // src/app/[locale]/(auth)/login/page.tsx:56
    window.location.href = data.redirectUrl;
    ```
  - **Issue**: Does not provide `redirectUrl` in payload, leaving destination resolution to the server endpoint which returns the incorrect doctor/admin routes.

### 1.3 Account Creation / Registration Flow (`/[locale]/signup`)
- **File**: `frontend/src/app/[locale]/(auth)/signup/page.tsx`
- **Implementation**:
  - Role selection buttons: Doctor, Patient, Admin (lines 92–141).
  - Form fields: Full Name, Email Address, Clinic Name (conditional for Doctor), Password.
  - Handler `handleSignup(e)` calls `POST /api/auth/dev-login`:
    ```typescript
    // src/app/[locale]/(auth)/signup/page.tsx:32-42
    const res = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        role,
        locale,
        email: email || `${role}@drgodly.com`,
        name: name || (role === "doctor" ? "Dr. New Doctor" : role === "admin" ? "New Administrator" : "New Patient"),
      }),
    });
    ```
  - On response:
    ```typescript
    // src/app/[locale]/(auth)/signup/page.tsx:53
    window.location.href = data.redirectUrl;
    ```
  - **Issue**: Suffers from the exact same redirect flaw as login.

### 1.4 Auth API Handlers
- **File**: `frontend/src/app/api/auth/dev-login/route.ts`
  - Defines the redirect mappings:
    ```typescript
    // src/app/api/auth/dev-login/route.ts:24-29
    const defaultRedirect =
      role === "doctor"
        ? `/bezs/telemedicine/doctor`
        : role === "admin"
        ? `/bezs/telemedicine/admin`
        : `/bezs/telemedicine/patient`;

    const redirectPath = (body.redirectUrl || defaultRedirect).replace(/^\/(?:en|hi|ta)/, "");
    const fullRedirectUrl = `/${locale}${redirectPath}`;
    ```
  - Constructs `sessionData`:
    - `user.id`: `"usr-" + role + "-01"`
    - `user.role`: `activeRole` (`"application-admin"` for admin, else `role`)
    - `session.activeRoleRedirectUrl`: `redirectPath`
  - Sets cookies `drgodly_session` and `dev_token` (HTTP-only, Lax, 7 days).
  - Returns `{ success: true, redirectUrl: fullRedirectUrl }`.
- **File**: `frontend/src/app/api/auth/dev-logout/route.ts`
  - Deletes `drgodly_session` and `dev_token` cookies.
- **File**: `frontend/src/app/api/auth/token/route.ts`
  - Exchanges OAuth2 code for tokens with BetterAuth.
  - Appends `redirectUrl: session?.session.activeRoleRedirectUrl`.

### 1.5 PKCE OAuth Flow
- **File**: `frontend/src/app/[locale]/(auth)/callback/page.tsx`
  - Validates `state` against `localStorage.getItem("oauth_state")`.
  - POSTs to `/api/auth/token` with `code` and `codeVerifier`.
  - Line 68: `window.location.href = data.redirectUrl ?? "/";`.

---

## 2. Role-Based Redirection Logic Analysis

### 2.1 Role Destination Mapping
The specification mandates three exact dashboard routes:
| Role | Target Route | Current Code Redirect | Discrepancy / Bug |
|---|---|---|---|
| **Doctor** | `/en/bezs/telemedicine/doctor/dashboard` | `/en/bezs/telemedicine/doctor` | **Mismatch**: Routes to schedule list view instead of practice analytics overview dashboard |
| **Patient** | `/en/bezs/telemedicine/patient` | `/en/bezs/telemedicine/patient` | **Match**: Routes directly to patient portal dashboard |
| **Admin** | `/en/bezs/telemedicine/admin/organizations` | `/en/bezs/telemedicine/admin` | **Inefficiency / Extra Hop**: Routes to intermediate landing page which issues a 307 redirect to `/organizations` |

### 2.2 Deep Dive: Doctor Routes
1. `/[locale]/(apps)/bezs/telemedicine/doctor/page.tsx`:
   - Title: "Doctor portal dashboard page"
   - Component: `<DoctorDashboard appointments={appointments} ... />`
   - Purpose: Day view of appointments + appointment detail sheet.
2. `/[locale]/(apps)/bezs/telemedicine/doctor/dashboard/page.tsx`:
   - Title: "Doctor practice-overview dashboard page"
   - Component: `<DashboardOverview ... />`
   - Purpose: Full practice analytics snapshot (AppointmentTrendChart, AppointmentStatusChart, StatCards for Today/This Week/Pending/Completed/Cancelled, RecentAppointmentsTable, PracticeProfileCard, OrgActivityPanel).
   - **Conclusion**: The requirement specifically targets `/en/bezs/telemedicine/doctor/dashboard`.

### 2.3 Deep Dive: Admin Routes
1. `/[locale]/(apps)/bezs/telemedicine/admin/page.tsx`:
   ```typescript
   // src/app/[locale]/(apps)/bezs/telemedicine/admin/page.tsx:17-20
   export default async function TelemedicineAdminPage() {
     const locale = await getLocale();
     redirect({ href: "/bezs/telemedicine/admin/organizations", locale });
   }
   ```
   - Redirects to `/bezs/telemedicine/admin/organizations`.
2. `/[locale]/(apps)/bezs/telemedicine/admin/(resources)/organizations/page.tsx`:
   - The primary resource management screen rendering `<OrganizationsTable />` and `<OrganizationModalProvider />`.
   - **Conclusion**: Redirecting directly to `/en/bezs/telemedicine/admin/organizations` removes the intermediate server component execution and redirect roundtrip.

---

## 3. Discrepancies, Bugs, and Failure Modes

### Bug Inventory Table

| ID | Category | File Path | Line(s) | Description |
|---|---|---|---|---|
| **BUG-01** | Routing | `src/app/api/auth/dev-login/route.ts` | 24–29 | `defaultRedirect` maps Doctor to `/bezs/telemedicine/doctor` and Admin to `/bezs/telemedicine/admin`. |
| **BUG-02** | Session | `src/modules/server/auth/get-session.ts` | 17–21 | `getDevSession()` sets `activeRoleRedirectUrl` to `/bezs/telemedicine/doctor` and `/bezs/telemedicine/admin`. |
| **BUG-03** | UI / Profile | `src/app/[locale]/(apps)/layout.tsx` | 24–30 | `AppsLayout` omits `role` from the `user` object passed to `MenuBar` and `AppNavbar`. |
| **BUG-04** | UI / Profile | `src/modules/client/shared/components/navbar/AppNavbar.tsx` & `NavUser.tsx` | 15–23, 61–73 | Header user profile dropdown lacks role prop and does not display role badge. |
| **BUG-05** | UI / Profile | `src/modules/client/shared/components/menubar/MenuBar.tsx` & `SidebarNavUser.tsx` | 24–31, 65–71 | Sidebar user profile footer lacks role prop and does not display role badge. |
| **BUG-06** | Navigation | `src/modules/client/shared/components/menubar/menu-datas.ts` | 43, 108 | Sidebar data links "Doctor Overview" to `/bezs/telemedicine/doctor` and "Admin Overview" to `/bezs/telemedicine/admin`. |
| **BUG-07** | Landing Links | `src/modules/client/(marketing)/components/RootNavbar.tsx`, `Hero.tsx`, `Cta.tsx` | 82, 142 (RootNavbar); 141 (Hero); 87 (Cta) | Marketing CTAs and nav links fall back to `/bezs/telemedicine/doctor`. |
| **BUG-08** | Performance | `src/modules/server/auth/get-session.ts` | 93 | External BetterAuth timeout is 1200ms; if offline and no cookie, exceeds <1s render budget. |
| **BUG-09** | Console Error | `src/modules/client/shared/components/menubar/MenuBar.tsx` | 131–148 | `fetchContext` fires HTTP request to `:5001` without offline guard, producing red console errors. |
| **BUG-10** | Intermediate | `src/app/[locale]/(apps)/bezs/page.tsx` & `bezs/telemedicine/page.tsx` | 8–12 | Relies on `activeRoleRedirectUrl` with fallback to `patient/profile`. |

---

## 4. Data Models, Interface Boundaries, and PostgreSQL Integration

### 4.1 Frontend Session Model (`src/modules/server/auth/types.ts`)
```typescript
export type User = {
  id: string;               // e.g. "usr-doctor-01"
  name: string;             // e.g. "Dr. John Smith"
  email: string;            // e.g. "doctor@drgodly.com"
  emailVerified: boolean;
  image: string | null;
  role: string;             // "doctor" | "patient" | "application-admin"
  username: string;
  ...
};

export type Session = {
  id: string;
  token: string;
  userId: string;
  activeOrganizationId: string | null;
  activeRole: string;       // "doctor" | "patient" | "application-admin"
  activeRoleRedirectUrl: string | null;
  ...
};
```

### 4.2 Backend FHIR & PostgreSQL Data Models
- **Database**: PostgreSQL 16 on port 5434 (frontend data) and PostgreSQL 15 on port 5436 (FHIR core).
- **Patient Model** (`backend/fhir-server/app/models/patient/patient.py:36-110`):
  - Table: `patient`
  - Columns: `id` (Integer PK), `patient_id` (Unique sequence), `user_id` (String indexed), `org_id` (String indexed), `gender`, `birth_date`, `active`.
  - Child Table: `patient_name` (`family`, `given`, `text`).
- **Practitioner Model** (`backend/fhir-server/app/models/practitioner/practitioner.py:31-64`):
  - Table: `practitioner`
  - Columns: `id` (Integer PK), `practitioner_id` (Unique sequence), `user_id` (String indexed), `org_id` (String), `gender`, `active`.
  - Child Table: `practitioner_name` (`family`, `given`, `prefix`, `text`).
- **FHIR Gateway Resolution** (`backend/fhir-gql/app/routers/patient.py:282` & `practitioner.py:228`):
  - `GET /patients/me` -> resolves `user_id=actor.sub` from token.
  - `GET /practitioners/me` -> resolves `user_id=actor.sub` from token.
  - When `token == "dev-jwt-token"`, `sub` defaults to `dev-user-001`.
- **Frontend Profile Helpers** (`src/modules/server/auth/require-profile.ts`):
  - `requirePatientProfile()`: calls `getPatientMeAction()` (bounded with 150ms timeout) -> returns `TPatientResponse`.
  - `requirePractitionerProfile()`: calls `getMyPractitionerAction()` (bounded with 150ms timeout) -> returns `TPractitionerResponse`.

---

## 5. Sub-Second Rendering & Performance Verification Plan

### 5.1 Root Causes of Slow Renders
1. **Unbounded Network Calls**: Unreachable external services (BetterAuth on port 5001) hanging for 1200ms in `getServerSession()`.
2. **Double Navigation Hops**: Admin landing page redirecting from `/admin` to `/admin/organizations`.
3. **Client-Side Fetch Errors in Layout**: `MenuBar.tsx` fetching context from `:5001`.

### 5.2 Optimizations Required
1. Ensure `getServerSession()` relies strictly on `drgodly_session` cookie in development, capping external BetterAuth timeout to 250ms max.
2. Route directly to `/en/bezs/telemedicine/doctor/dashboard` and `/en/bezs/telemedicine/admin/organizations` from auth forms and dev-login.
3. Guard `fetchContext` in `MenuBar.tsx` to immediately no-op if in dev mode or BetterAuth is not responsive.
4. Pass role into `AppsLayout` user context and render instantly via Server Components without client-side waterfalls.

---

## 6. Recommended Remediation Plan for the Worker

### Phase 1: Authentication & Redirection Mappings (R1)
1. **Update `src/app/api/auth/dev-login/route.ts`**:
   - Change `defaultRedirect`:
     - Doctor: `/bezs/telemedicine/doctor/dashboard`
     - Admin: `/bezs/telemedicine/admin/organizations`
     - Patient: `/bezs/telemedicine/patient`
   - Ensure `sessionData.session.activeRoleRedirectUrl` uses the updated dashboard path.
2. **Update `src/modules/server/auth/get-session.ts`**:
   - Update `getDevSession(role)`:
     - Doctor: `/bezs/telemedicine/doctor/dashboard`
     - Admin: `/bezs/telemedicine/admin/organizations`
     - Patient: `/bezs/telemedicine/patient`
   - Cap `fetch(`${authUrl}/api/auth/get-session`)` timeout to 250ms.
3. **Update Login and Signup Handlers**:
   - In `src/app/[locale]/(auth)/login/page.tsx` and `signup/page.tsx`:
     - Ensure fallback redirects and form submit flows use the full role-specific URLs.
4. **Update `src/app/[locale]/(apps)/bezs/telemedicine/doctor/page.tsx`**:
   - Add redirect to `/bezs/telemedicine/doctor/dashboard` (parallel to `admin/page.tsx`) so that direct visits to `/doctor` cleanly land on `/dashboard`.

### Phase 2: Navigation & Menu Consistency
1. **Update `src/modules/client/shared/components/menubar/menu-datas.ts`**:
   - Set Doctor Overview URL: `/bezs/telemedicine/doctor/dashboard`.
   - Set Admin Overview URL: `/bezs/telemedicine/admin/organizations`.
2. **Update Marketing Components**:
   - `src/modules/client/(marketing)/components/RootNavbar.tsx`: Update Doctor Dashboard link and fallback to `/bezs/telemedicine/doctor/dashboard`.
   - `src/modules/client/(marketing)/components/Hero.tsx` & `Cta.tsx`: Update fallback to `/bezs/telemedicine/doctor/dashboard`.

### Phase 3: Profile Data Integration in Header & Sidebar (R3)
1. **Update `AppsLayout` (`src/app/[locale]/(apps)/layout.tsx`)**:
   - Extract `role: session.user.role || session.session.activeRole` and pass it in `user`.
2. **Update `AppNavbar` and `NavUser`**:
   - Extend `TUser` type with `role?: string`.
   - Render role badge (e.g. `<Badge variant="secondary">` with "Doctor", "Patient", or "Admin") in `NavUser` dropdown.
3. **Update `MenuBar` and `SidebarNavUser`**:
   - Extend `TUser` type with `role?: string`.
   - Render role label or badge in the sidebar footer user section.

### Phase 4: Performance & Console Cleanup (R2)
1. **Clean up `src/modules/client/shared/components/menubar/MenuBar.tsx`**:
   - Guard `fetchContext` so it avoids failed network requests when BetterAuth is not available.
2. **Remove Debug Logs**:
   - Remove `console.log(session)` from `src/app/[locale]/(apps)/bezs/telemedicine/admin/(resources)/organizations/page.tsx:37`.
