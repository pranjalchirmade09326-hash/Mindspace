# Mindspace Codebase Survey & Analysis Report
**Explorer 3 — UI Rendering Performance, Runtime Diagnostics & Port Configurations**
**Date**: 2026-11-02
**Target Workspace**: `d:\Mindspace`

---

## Executive Summary

This report delivers a comprehensive investigation into the Mindspace Telemedicine and FHIR Healthcare platform codebase, specifically addressing:
1. **Rendering Performance (< 1s target)** across the primary dashboards (`/en/bezs/telemedicine/doctor/dashboard`, `/en/bezs/telemedicine/patient`, `/en/bezs/telemedicine/admin/organizations`) and navigation transitions.
2. **Runtime Console Errors** (hydration mismatches, unmemoized fetches, undefined property access, unhandled promise rejections).
3. **Multi-Service Port Bindings and Configurations** (Next.js 4000, FastAPI fhir-server 8000, fhir-gql 8005, PostgreSQL 5434/5436/5489, Redis 6379/6381).
4. **Existing Test Suites & Verification Tooling**.
5. **Concrete Remediation Plan** for downstream implementation.

---

## 1. Multi-Service Port Bindings & Infrastructure Configuration

### 1.1 Service Map and Port Allocation

| Service | Target Port | Configured File(s) | Actual Port / URL | Status / Collision Assessment |
|---|---|---|---|---|
| **Next.js Frontend** | `4000` | `frontend/package.json`<br>`frontend/.env`<br>`frontend/next.config.ts` | `4000`<br>`NEXT_PUBLIC_APP_URL=http://localhost:4000`<br>`next dev --webpack -H 0.0.0.0 -p 4000` | **CLEAN**: No port conflicts. Bound to 0.0.0.0:4000. |
| **FastAPI `fhir-server`** | `8000` | `backend/README.md`<br>`backend/fhir-server/.env`<br>`frontend/.env` | `8000`<br>`FHIR_SERVER_URL=http://localhost:8000`<br>`NEXT_PUBLIC_FHIR_SERVER_URL=http://localhost:8000` | **PORT COLLISION RISK IN CONFIGS**: See Section 1.2 below. |
| **FastAPI `fhir-gql` Gateway** | `8005` | `backend/README.md`<br>`backend/fhir-gql/.env`<br>`frontend/.env` | `8005`<br>`FHIR_GQL_URL=http://localhost:8005/api/v1`<br>`FHIR_GRAPHQL_URL=http://localhost:8005/graphql` | **CLEAN**: Router paths align with `/api/v1` and `/graphql`. |
| **Frontend PostgreSQL** | `5434` | `frontend/docker-compose.dev.yml`<br>`frontend/docker-compose.yml`<br>`frontend/.env` | `5434:5432`<br>`DATABASE_URL="postgresql://drgodly:drgodly@localhost:5434/drgodly?schema=public"` | **CLEAN**: Dedicated port 5434, no collision with system Postgres (5432). |
| **Backend FHIR PostgreSQL** | `5436` | `backend/docker-compose.yml`<br>`backend/fhir-server/.env` | `5436:5432`<br>`FHIR_DATABASE_URL=postgresql+asyncpg://user:password@localhost:5436/fhir-server` | **CLEAN**: Dedicated port 5436, completely isolated from frontend DB. |
| **FHIR Staging PostgreSQL** | `5489` | `backend/fhir-staging/.env`<br>`backend/fhir-staging/docker-compose.yml` | `5489:5432`<br>`STAGING_DATABASE_URL=postgresql+asyncpg://...:5489/fhir-staging` | **CLEAN**: Dedicated port 5489. |
| **Backend Redis** | `6381` | `backend/docker-compose.yml`<br>`backend/fhir-server/.env`<br>`backend/fhir-gql/.env` | `6381:6379`<br>`REDIS_URL=redis://localhost:6381/0` | **CLEAN**: Mapped to host port 6381. |
| **Frontend Redis** (Optional) | `6379` | `frontend/docker-compose.yml` | `6379:6379`<br>`# REDIS_URL=redis://localhost:6379` | **NOTE**: Frontend docker-compose exposes 6379; safe as backend uses 6381. |
| **BetterAuth IAM** | `5001` | `frontend/.env`<br>`backend/fhir-gql/.env` | `http://localhost:5001` | **PERFORMANCE RISK**: When not running, causes 1.2s request hangs. |

### 1.2 Configuration Discrepancies & Port Conflicts Found
1. **`.env.example` vs `.env` Port Divergence**:
   - In `frontend/.env.example` lines 33-34:
     ```env
     FHIR_SERVER_URL=http://localhost:8001
     NEXT_PUBLIC_FHIR_SERVER_URL=http://localhost:8001
     ```
   - In `frontend/.env` lines 19-20:
     ```env
     FHIR_SERVER_URL=http://localhost:8000
     NEXT_PUBLIC_FHIR_SERVER_URL=http://localhost:8000
     ```
   - *Impact*: Developers or automated scripts using `.env.example` point to port 8001 instead of 8000, causing connection refused errors.
2. **Port 8000 Over-Subscription in `frontend/.env`**:
   - In `frontend/.env` lines 42, 71, 75:
     ```env
     NEXT_PUBLIC_LIVEKIT_AGENT_URL=http://localhost:8000
     FILENEST_API_URL=http://localhost:8000
     NEXT_PUBLIC_FILENEST_API_URL=http://localhost:8000
     ```
   - *Impact*: Port 8000 is assigned to `fhir-server`. Pointing FileNest and LiveKit agent to port 8000 causes mock requests or external calls to hit the FHIR REST API rather than their respective services.
3. **Typo in `frontend/.env.example` line 36**:
   - `FHIR_STAGING_SERVER_URL=http://localost8002/api/v1/staging-records` (missing colon and typo in localhost).

---

## 2. Authentication & Navigation Routing Defects

### 2.1 Route Destination Mismatch
The user requirements specify exact dashboard targets upon sign-in / sign-up:
- **Doctor**: `/en/bezs/telemedicine/doctor/dashboard`
- **Patient**: `/en/bezs/telemedicine/patient`
- **Admin**: `/en/bezs/telemedicine/admin/organizations`

#### Observed Behavior in Code:
1. **`frontend/src/app/api/auth/dev-login/route.ts`** (Lines 24-32):
   ```typescript
   const defaultRedirect =
     role === "doctor"
       ? `/bezs/telemedicine/doctor`
       : role === "admin"
       ? `/bezs/telemedicine/admin`
       : `/bezs/telemedicine/patient`;
   ```
   - For Doctor, it redirects to `/bezs/telemedicine/doctor` (which is a different view: `DoctorDashboard` with day schedule) rather than `/bezs/telemedicine/doctor/dashboard` (`DashboardOverview` practice analytics)!
   - For Admin, it redirects to `/bezs/telemedicine/admin`, which then executes a secondary server redirect (`TelemedicineAdminPage` at `frontend/src/app/[locale]/(apps)/bezs/telemedicine/admin/page.tsx` line 19) to `/bezs/telemedicine/admin/organizations`! This adds an unnecessary 307 redirect hop.
2. **`frontend/src/modules/server/auth/get-session.ts`** (`getDevSession`, Lines 17-21):
   ```typescript
   const redirectUrl = isDoctor
     ? "/bezs/telemedicine/doctor"
     : isAdmin
     ? "/bezs/telemedicine/admin"
     : "/bezs/telemedicine/patient";
   ```
   - Same mismatched redirect URLs embedded in the session object.

---

## 3. Rendering Performance Bottlenecks (> 1s Causes)

### 3.1 Primary Bottleneck: Blocking 1200ms Fetch in `getServerSession()`
- **Location**: `frontend/src/modules/server/auth/get-session.ts`, lines 86-105:
  ```typescript
  try {
    const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    if (authUrl && authUrl.startsWith("http")) {
      const hdrs = await headers();
      const cookie = hdrs.get("cookie") || "";

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(`${authUrl}/api/auth/get-session`, {
        headers: { cookie },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) return await res.json();
    }
  } catch {
    // Continue
  }
  ```
- **Mechanism**:
  - Whenever `drgodly_session` cookie is absent, or when BetterAuth is unreachable, `getServerSession()` initiates an HTTP request to `http://localhost:5001/api/auth/get-session` with a **1200ms (1.2 second)** timeout.
  - In local development or testing without BetterAuth active, every unauthenticated request hangs for 1200ms before falling back.
  - This single call instantly breaches the `< 1s` rendering SLA.

### 3.2 Unmemoized Duplicate Calls Across the Server Component Tree
- `getServerSession()` is invoked redundantly across every page request:
  1. `frontend/src/app/[locale]/(apps)/layout.tsx` (line 12)
  2. `frontend/src/app/[locale]/(apps)/bezs/telemedicine/admin/layout.tsx` (line 27)
  3. `frontend/src/app/[locale]/(apps)/bezs/telemedicine/admin/(resources)/organizations/page.tsx` (line 23)
  4. `frontend/src/modules/server/presentation/actions/procedures.ts` (`authenticatedProcedure`, line 35) for every server action executed.
- **Missing React Cache**: `getServerSession()` is a standard async function, **not wrapped in `React.cache()`**. As a result, React cannot de-duplicate calls within the same server render pass. If the cookie is missing or slow, this penalty compounds.

### 3.3 Complete Absence of Suspense Boundaries and `loading.tsx`
- **Location**: Whole `frontend/src/app` tree.
- **Finding**: There are **zero** `loading.tsx` files in the frontend repository (`find_by_name` returned 0 results).
- **Mechanism**: In Next.js App Router, when an async Server Component page fetches data (e.g. `DoctorDashboardOverviewPage`, `PatientPage`, `OrganizationsPage`), Next.js **blocks the client-side router transition** until all async promises on the server resolve. Without `loading.tsx` or `<Suspense>`, the browser gives zero visual feedback, navigation appears frozen, and the Time to First Byte (TTFB) / Route Transition Duration equals the sum of all server fetches.

### 3.4 Unbounded Axios Timeout (10s) in `OrganizationRestApiService`
- **Location**: `frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts` line 58:
  ```typescript
  this.client = axios.create({
    baseURL: `${url}/organizations`,
    headers: { "Content-Type": "application/json" },
    timeout: 10_000, // 10 seconds!
  });
  ```
- **Mechanism**:
  - `OrganizationsPage` (`organizations/page.tsx` line 28) executes:
    `const [data] = await listOrganizationsAction({...});`
  - Unlike `doctor/dashboard/page.tsx` (which wraps queries in a 200ms timeout race) or `patient/page.tsx` (which also uses a 200ms timeout race), `OrganizationsPage` directly awaits `listOrganizationsAction`.
  - If `fhir-gql` on port 8005 is starting up, cold, or degraded, `OrganizationsPage` blocks rendering for up to **10 seconds**.

### 3.5 Client-Side Fetch Waterfalls on Layout & Page Mount
1. **`MenuBar.tsx` Context Fetch Waterfall**:
   - Location: `frontend/src/modules/client/shared/components/menubar/MenuBar.tsx` lines 131-152:
     On every mount inside `(apps)` layout, `useEffect` triggers a client-side fetch to `${NEXT_PUBLIC_BETTER_AUTH_URL}/api/me/context` with a 600ms abort timeout.
     While fetching, `MenuBar` renders `<NavSkeleton />`, causing layout shift and flickering during the first 600ms of navigation.
2. **`VitalsInsights.tsx` Multi-Page Sequential Loop**:
   - Location: `frontend/src/modules/client/telemedicine/shared/components/vitals/VitalsInsights.tsx` lines 291-316:
     `useQuery` executes a sequential `for (let page = 0; page < MAX_PAGES; page++)` loop calling `listVitalsAction` over server actions up to 5 times sequentially. This creates an unnecessary network waterfall on the patient dashboard.

### 3.6 Dev-Mode Webpack Buffer Thrashing
- **Location**: `frontend/next.config.ts` lines 9-12:
  ```typescript
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  ```
- **Mechanism**: `pagesBufferLength: 2` instructs Next.js dev server to keep only 2 compiled pages in memory. As soon as a user clicks through Doctor -> Patient -> Admin, the Doctor page is evicted from memory. Clicking back to Doctor causes webpack to recompile the page from scratch, causing a 2-4 second hang in dev mode.

---

## 4. Runtime Console Errors & Diagnostics

### 4.1 Recharts SSR Hydration Incompatibilities
- **Locations**:
  - `AppointmentTrendChart.tsx`
  - `AppointmentStatusChart.tsx`
  - `AppointmentBarChart.tsx`
  - `AppointmentSummaryChart.tsx`
  - `VitalsInsights.tsx`
- **Issue**:
  Recharts' `<ResponsiveContainer width="100%" height="...">` attempts to measure parent container DOM nodes using ResizeObserver. During SSR and React 19 hydration, the container has no physical dimensions, emitting console warnings:
  - `The width(-1) and height(-1) of chart should be greater than 0`
  - React hydration mismatches on SVGs rendered with 0 dimensions vs client dimensions.
- **Remedy**: Mount charts with a client-side hydration guard (`const [mounted, setMounted] = useState(false)`) or static fallback aspect ratio / CSS dimensions until mounted.

### 4.2 Missing Role Propagation to Header and Sidebar
- **Requirement R3**: "Ensure user profile details (such as name and role) are persisted in PostgreSQL, loaded via backend FHIR services and active session, and displayed accurately in the frontend header and sidebar."
- **Code Observation**:
  - In `frontend/src/app/[locale]/(apps)/layout.tsx` lines 24-30:
    ```typescript
    const user = {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      username: session.user.username,
      activeOrganizationId: session.session.activeOrganizationId,
    };
    ```
    The `role` property (`session.user.role` or `session.session.activeRole`) is **completely omitted** from the `user` object!
  - In `frontend/src/modules/client/shared/components/navbar/AppNavbar.tsx` (line 15) and `NavUser.tsx` (line 16):
    The `TUser` type does not define `role`, and `NavUser` only renders `name`, `username`, and `email`. The user's role is never displayed in the header.
  - In `frontend/src/modules/client/shared/components/menubar/MenuBar.tsx` (line 24) and `SidebarNavUser.tsx` (line 18):
    `TUser` also omits `role`, and `SidebarNavUser` only renders `name` and `email`. The user's role is never displayed in the sidebar.

### 4.3 Name Display Formatting Bug in Doctor Dashboard
- **Location**: `frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/DashboardOverview.tsx` line 231:
  ```typescript
  <h1 className="text-2xl font-semibold">
    Practice Overview — Dr. {doctorName.split(" ")[0]}
  </h1>
  ```
- **Issue**: When `doctorName` is `"Dr. John Smith"`, `doctorName.split(" ")[0]` evaluates to `"Dr."`. The UI renders: `"Practice Overview — Dr. Dr."`! If `doctorName` is empty, it can produce undefined errors.

### 4.4 Unhandled Promise Rejections & Empty State Failures
- In `VitalsInsights.tsx` line 304:
  `if (err) throw err;` inside `useQuery` queryFn without error boundary catches will log unhandled exceptions to console if the backend is unavailable.
- In `dev-login/route.ts`:
  Sets cookies using `drgodly_session`. In `get-session.ts`, `JSON.parse` is wrapped in try-catch, but if the session cookie is malformed, it silently continues to the 1.2s BetterAuth blocking fetch.

---

## 5. Existing Test Suites & Verification Tooling

### 5.1 Backend Test Suites
- **Location**: `backend/fhir-server/tests/`
- **Framework**: `pytest`, `pytest-asyncio`, `httpx`
- **Configuration**: `backend/fhir-server/pyproject.toml`
- **Harness**: `conftest.py` configures SQLite in-memory DB (`sqlite+aiosqlite:///:memory:`), mock rate-limiting, and sequence emulation.
- **Coverage**: 41 integration test directories under `backend/fhir-server/tests/integration/` (`appointment`, `patient`, `practitioner`, `organization`, `location`, `vitals`, etc.).
- **Execution Command**:
  ```bash
  cd d:\Mindspace\backend\fhir-server
  uv run pytest
  ```

### 5.2 Frontend Test Tooling & Scripts
- **Current State**:
  - `frontend/package.json` contains **NO automated test framework** (no Jest, Vitest, Cypress, or Playwright installed).
  - Scripts available: `dev`, `dev-test`, `build`, `start`, `lint`, `db:generate`, `db:push`, `seed:test-data`.
  - `frontend/scripts/test-data/seed.ts`:
    A robust script that generates and seeds realistic multi-disease outpatient clinical records into the backend.
    Usage: `pnpm seed:test-data -- --scenario diabetes-followup --patient-id 1 --practitioner-id 1 --dry-run`

### 5.3 Required Automated Verification for Worker
Because frontend automated tests are not pre-installed, Worker must build a lightweight, self-contained verification harness (e.g. Node/TypeScript script or Playwright) that validates:
1. HTTP 200 and redirect destinations for Doctor, Patient, and Admin auth flows.
2. End-to-end rendering duration (< 1s) for:
   - `/en/bezs/telemedicine/doctor/dashboard`
   - `/en/bezs/telemedicine/patient`
   - `/en/bezs/telemedicine/admin/organizations`
3. Verification that user name and role appear in HTML/DOM output.
4. Clean absence of unhandled exceptions or 500 errors.

---

## 6. Recommended Remediation Plan for Worker

| Phase | Target Area | Exact File(s) to Modify | Action / Remediation |
|---|---|---|---|
| **Phase 1** | **Service & Port Alignment** | `frontend/.env`<br>`frontend/.env.example` | 1. Fix `FHIR_SERVER_URL` in `.env.example` from port 8001 to 8000.<br>2. Disambiguate `FILENEST_API_URL` and `NEXT_PUBLIC_LIVEKIT_AGENT_URL` from port 8000.<br>3. Fix typo in `FHIR_STAGING_SERVER_URL`. |
| **Phase 2** | **Auth Routing & Redirects** | `frontend/src/app/api/auth/dev-login/route.ts`<br>`frontend/src/modules/server/auth/get-session.ts` | 1. Update `defaultRedirect` for Doctor: `/bezs/telemedicine/doctor/dashboard`.<br>2. Update `defaultRedirect` for Admin: `/bezs/telemedicine/admin/organizations`.<br>3. Align `getDevSession()` redirect URLs to match. |
| **Phase 3** | **Performance & Session Optimization** | `frontend/src/modules/server/auth/get-session.ts`<br>`frontend/next.config.ts` | 1. Wrap `getServerSession()` with `React.cache()` to deduplicate calls within a single render pass.<br>2. Shorten BetterAuth network timeout from 1200ms to 200ms (or bypass immediately if `drgodly_session` cookie is present).<br>3. In `next.config.ts`, increase `onDemandEntries.pagesBufferLength` to 10 to eliminate dev page thrashing. |
| **Phase 4** | **Suspense Boundaries & Timeouts** | `frontend/src/app/[locale]/(apps)/bezs/telemedicine/admin/(resources)/organizations/page.tsx`<br>`frontend/src/app/[locale]/(apps)/.../loading.tsx` | 1. Add `loading.tsx` skeletons for dashboard routes to enable instant streaming.<br>2. Add a 250ms fallback timeout race to `listOrganizationsAction` in `OrganizationsPage` matching Doctor & Patient dashboards.<br>3. Wrap Recharts chart containers with hydration mounted checks. |
| **Phase 5** | **Profile & Role Header/Sidebar Display** | `frontend/src/app/[locale]/(apps)/layout.tsx`<br>`frontend/src/modules/client/shared/components/navbar/AppNavbar.tsx`<br>`frontend/src/modules/client/shared/components/NavUser.tsx`<br>`frontend/src/modules/client/shared/components/menubar/MenuBar.tsx`<br>`frontend/src/modules/client/shared/components/SidebarNavUser.tsx` | 1. In `(apps)/layout.tsx`, include `role: session.session.activeRole || session.user.role` in the `user` object.<br>2. Update `TUser` in `AppNavbar`, `NavUser`, `MenuBar`, `SidebarNavUser` to accept `role?: string`.<br>3. Render role badge / role text in `NavUser` dropdown and `SidebarNavUser` profile tile.<br>4. Fix `"Practice Overview — Dr. Dr."` string split in `DashboardOverview.tsx`. |
| **Phase 6** | **Automated Verification Harness** | `frontend/scripts/verify-performance.ts` (or equivalent test runner) | Implement programmatic verification script testing auth login, sub-second route rendering, role display, and port health. |

---

## 7. File & Line Index of Critical Points

- `frontend/.env.example`: Lines 33-36 (Port 8001 and typo)
- `frontend/package.json`: Lines 6-7 (Next.js port 4000)
- `frontend/next.config.ts`: Lines 9-12 (`pagesBufferLength: 2`)
- `frontend/src/app/api/auth/dev-login/route.ts`: Lines 24-32 (Redirect routes)
- `frontend/src/modules/server/auth/get-session.ts`: Lines 86-105 (1200ms timeout), Lines 17-21 (`getDevSession` URLs)
- `frontend/src/app/[locale]/(apps)/layout.tsx`: Lines 12, 24-30 (Missing `role` propagation)
- `frontend/src/modules/client/shared/components/navbar/AppNavbar.tsx`: Lines 15-21, 64 (Missing role)
- `frontend/src/modules/client/shared/components/NavUser.tsx`: Lines 16-21, 61-72 (Missing role badge)
- `frontend/src/modules/client/shared/components/menubar/MenuBar.tsx`: Lines 24-30, 131-152 (Missing role & 600ms fetch)
- `frontend/src/modules/client/shared/components/SidebarNavUser.tsx`: Lines 18-23, 65-70 (Missing role badge)
- `frontend/src/app/[locale]/(apps)/bezs/telemedicine/doctor/dashboard/page.tsx`: Lines 67-178 (Doctor dashboard fetch & layout)
- `frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/DashboardOverview.tsx`: Line 231 (`"Dr. Dr."` bug)
- `frontend/src/app/[locale]/(apps)/bezs/telemedicine/patient/page.tsx`: Lines 27-71 (Patient dashboard)
- `frontend/src/modules/client/telemedicine/shared/components/vitals/VitalsInsights.tsx`: Lines 291-318 (Sequential query loop)
- `frontend/src/app/[locale]/(apps)/bezs/telemedicine/admin/(resources)/organizations/page.tsx`: Lines 21-64 (Blocking fetch without timeout)
- `frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts`: Line 58 (10s Axios timeout)
- `backend/docker-compose.yml`: Lines 10-11 (Postgres 5436), Lines 17-18 (Redis 6381)
- `frontend/docker-compose.dev.yml`: Lines 18-19 (Postgres 5434)
- `backend/fhir-server/pyproject.toml`: Lines 23-34 (`pytest` suite)
- `backend/fhir-server/tests/conftest.py`: Lines 1-60 (SQLite test harness)
