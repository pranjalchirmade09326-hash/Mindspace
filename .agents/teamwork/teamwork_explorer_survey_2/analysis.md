# Comprehensive Backend Services and Live User Profile Integration Survey

**Explorer**: Explorer 2 (Profile Backend Explorer)  
**Date**: 2026-11-02  
**Target System**: Mindspace (FHIR Platform & DrGodly Telemedicine Frontend)

---

## Executive Summary

This investigation surveys the backend architecture, persistence mechanisms, session caching, and frontend profile data flows across the Mindspace repository. 

The primary finding is that live user profile data fails to display or propagate due to **four architectural disconnects**:
1. **Absence of PostgreSQL Persistence in Auth Handler**: Account creation (`/signup`) and sign-in (`/login`) call `/api/auth/dev-login`, which generates a client cookie (`drgodly_session`) but never persists user credentials or FHIR `Practitioner`/`Patient` records into PostgreSQL.
2. **Missing Role Rendering in Header & Sidebar Components**: `AppNavbar`, `MenuBar`, `NavUser`, and `SidebarNavUser` lack role properties in their TypeScript interfaces and omit user role rendering entirely. Furthermore, the root application layout (`(apps)/layout.tsx`) strips the role attribute before passing the `user` object to the navbar and sidebar.
3. **Hardcoded Fallbacks & Aggressive Timeouts in Profile Guards**: In `src/modules/server/auth/require-profile.ts`, `requirePractitionerProfile` and `requirePatientProfile` execute a 150ms timeout against `getMyPractitionerAction()`/`getPatientMeAction()`. Upon timeout or 404, they fall back to hardcoded strings ("Dr. John Smith", "Sarah Jenkins") rather than deriving user identity from the active session.
4. **Dev Token & Subject ID Mismatch**: In `backend/fhir-gql/app/auth/dependencies.py`, the development token bypass hardcodes `sub: "dev-user-001"`, whereas the frontend session uses `id: "usr-${role}-01"`. As a result, backend profile queries looking for `user_id == actor.sub` cannot locate profiles created under session user IDs.
5. **Dashboard Route Redirection Divergence**: `dev-login/route.ts` redirects doctors to `/bezs/telemedicine/doctor` (instead of `/en/bezs/telemedicine/doctor/dashboard`) and admins to `/bezs/telemedicine/admin` (which requires an additional redirect to `/en/bezs/telemedicine/admin/organizations`).

---

## 1. Backend Architecture Survey

### 1.1 Service Layout and Ports

The system is organized into a microservices and orchestration architecture:

| Service | Port | Framework / Tech | Persistence / State | Role |
|---|---|---|---|---|
| **Frontend** | `4000` | Next.js 16 (App Router), React 19, TypeScript, Tailwind | Cookie session (`drgodly_session`), Prisma DB (port 5434) | Web UI, SSR, Server Actions (ZSA) |
| **fhir-server** | `8000` | FastAPI, Uvicorn, SQLAlchemy 2.0, asyncpg, Python 3.12+ | PostgreSQL 15 (port 5436), Redis 7 (port 6381) | Pure FHIR R4 REST API (`/api/fhir/v1/*`), OpenAPI at `/openapi.json` |
| **fhir-gql** | `8005` | FastAPI, Uvicorn, httpx `FhirClient`, Python 3.14+ | Stateless; Redis 7 (port 6381) for rate limiting | Orchestration gateway, JWT validation, RBAC, proxies to `fhir-server` |
| **fhir-mcp** | `8002` | FastAPI, FastMCP, Python 3.14+ | Stateless; proxies upstream to `fhir-server` | MCP gateway auto-generating AI tools |
| **BetterAuth (IAM)** | `5001` | External OIDC / BetterAuth service | PostgreSQL / Redis (External) | External IAM, JWKS provider (mocked/bypassed locally) |
| **PostgreSQL (FHIR)** | `5436` | Docker image `postgres:15-alpine` | Volume: `postgres_data` | Core FHIR database: `fhir-server` |
| **PostgreSQL (App)** | `5434` | Docker image `postgres:16-alpine` | Volume: `postgres_data_dev` | Local app database: `drgodly` (intakes, consultations) |
| **Redis** | `6381` | Docker image `redis:7-alpine` | Volume: `redis_data` | Caching, sessions, rate-limiting |

### 1.2 Database Schemas and Models

Two distinct PostgreSQL databases exist:

#### A. FHIR Core Database (`fhir-server` at `localhost:5436`, DB: `fhir-server`)
Configured in `backend/fhir-server/.env`:
`FHIR_DATABASE_URL=postgresql+asyncpg://user:password@localhost:5436/fhir-server`

Key models in `backend/fhir-server/app/models/`:
- **`PractitionerModel`** (`practitioner` table):
  - Primary Key: `id` (int, autoincrement)
  - Public FHIR ID: `practitioner_id` (int sequence, start 30000)
  - Correlation field: `user_id` (varchar, indexed) — links to JWT/session user ID
  - `org_id` (varchar)
  - `active` (boolean), `gender` (enum `administrative_gender`), `birth_date` (date)
  - Child tables:
    - `practitioner_name`: `id`, `practitioner_id`, `use`, `text`, `family`, `given` (comma-separated), `prefix`
    - `practitioner_telecom`: `id`, `practitioner_id`, `system` (`phone`/`email`), `value`, `use`, `rank`
    - `practitioner_identifier`, `practitioner_address`, `practitioner_qualification`, `practitioner_photo`
- **`PatientModel`** (`patient` table):
  - Primary Key: `id` (int, autoincrement)
  - Public FHIR ID: `patient_id` (int sequence, start 10000)
  - Correlation field: `user_id` (varchar, indexed)
  - `org_id` (varchar, indexed)
  - `active` (boolean), `gender` (enum `patient_gender`), `birth_date` (date)
  - Child tables: `patient_name`, `patient_telecom`, `patient_identifier`, `patient_address`
- **`OrganizationModel`** (`organization` table): sequence start 190000.
- **`AppointmentModel`**, **`EncounterModel`**, **`ObservationModel`**, **`ConditionModel`**, etc.

#### B. Application Database (`drgodly` at `localhost:5434`, DB: `drgodly`)
Configured in `frontend/.env` and managed by Prisma (`frontend/prisma/schema/schema.prisma`):
`DATABASE_URL="postgresql://drgodly:drgodly@localhost:5434/drgodly?schema=public"`

Models:
- `Intake` (`intakes` table): pre-consultation chat transcripts, AI assessment report
- `Consultation` (`consultations` table): video rooms, SOAP notes, extracted clinical FHIR resources
- `AiConsultation` (`ai_consultations` table): standalone AI chat sessions
- `EmrChatSession`, `EmrChatMessage`, `EmrWorkflowState`, `EmrWorkflowStepSubmission`

*Crucial observation*: Prisma schema has **no** `User` or `Account` model. All user correlation across both Prisma and FHIR tables relies on `user_id: String`.

---

## 2. Authentication, Session & Profile Data Flows

### 2.1 The Auth Pipeline
```
[User on /en/login or /en/signup]
             │
             ▼ POST /api/auth/dev-login { role, locale, email, name }
[frontend/src/app/api/auth/dev-login/route.ts]
             │  (Creates sessionData with user & session objects)
             ▼ Sets HttpOnly Cookies:
                - `drgodly_session`: JSON string containing { user, session }
                - `dev_token`: "dev-jwt-token"
             ▼ Returns JSON: { success: true, redirectUrl: "/en" + redirectPath }
```

### 2.2 Server Session Retrieval
In `frontend/src/modules/server/auth/get-session.ts`:
1. `getServerSession()` first inspects the `drgodly_session` cookie. If present, it deserializes and returns the `AuthResponse` object containing `user` and `session`.
2. If no cookie is present, it attempts to fetch from `${NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/get-session` with a 1200ms abort timeout.
3. If neither succeeds, it returns `null`.

### 2.3 Backend Gateway Proxying & JWT Handling
When frontend server actions query FHIR resources:
1. `PractitionerRestApiService` (`src/modules/server/core/practitioner/infrastructure/services/practitioner.rest.service.ts`) creates an Axios client pointing to `FHIR_GQL_URL/practitioners`.
2. A request interceptor attaches `Authorization: Bearer ${await getAuthToken()}`.
3. `getAuthToken()` (`src/modules/server/auth/jwt-token.ts`) reads the `dev_token` cookie, returning `"dev-jwt-token"`.
4. `fhir-gql` receives the request. Its dependency `get_current_user` (`backend/fhir-gql/app/auth/dependencies.py`) decodes the token.
5. In development mode:
   ```python
   if settings.ENVIRONMENT == "development" and (token == "dev-jwt-token" or token.startswith("dev-")):
       return {
           "sub": "dev-user-001",
           "name": "Dev Practitioner",
           "email": "doctor@drgodly.com",
           "role": "practitioner",
           "org_id": "org-default-01",
           "permissions": ["*"],
       }
   ```
6. Downstream endpoint `GET /practitioners/me` (`backend/fhir-gql/app/routers/practitioner.py` -> `practitioner_service.py`) calls `self._client.list(user_id=actor.sub, org_id=actor.org_id, limit=1)`.
7. `fhir-gql` proxies to `fhir-server` port 8000:
   `GET /api/fhir/v1/practitioner?user_id=dev-user-001&org_id=org-default-01`.

---

## 3. UI Component Analysis: Header & Sidebar

### 3.1 Apps Layout (`src/app/[locale]/(apps)/layout.tsx`)
```tsx
const AppsLayout = async ({ children }: { children: React.ReactNode }) => {
  let session = await getServerSession();
  ...
  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    username: session.user.username,
    activeOrganizationId: session.session.activeOrganizationId,
    // BUG: `role` is completely omitted from this object!
  };

  return (
    <SidebarProvider>
      <MenuBar {...user} />
      <SidebarInset className="...">
        <AppNavbar user={user} apps={apps} />
        ...
```

### 3.2 Header User Component (`src/modules/client/shared/components/NavUser.tsx`)
```tsx
type TUser = {
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  // BUG: `role` is not defined in type
};

export function NavUser({ user }: { user: TUser }) {
  ...
  // In DropdownMenuLabel:
  <p className="truncate text-sm font-semibold text-foreground">
    {name}
  </p>
  <p className="truncate text-xs text-muted-foreground">{email}</p>
  // BUG: User role is not displayed anywhere in the header component
}
```

### 3.3 Sidebar User Component (`src/modules/client/shared/components/SidebarNavUser.tsx`)
```tsx
type TUser = {
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  // BUG: `role` is not defined in type
};

export function SidebarNavUser({ user }: { user: TUser }) {
  ...
  // In SidebarMenuButton:
  <div className="grid flex-1 text-start text-sm leading-tight">
    <span className="truncate font-semibold">{name}</span>
    <span className="truncate text-xs text-muted-foreground">{email}</span>
    // BUG: User role is not rendered in collapsed or expanded sidebar button
  </div>
}
```

### 3.4 MenuBar Sidebar Container (`src/modules/client/shared/components/menubar/MenuBar.tsx`)
`MenuBar` receives `TUser` and forwards it to `<SidebarNavUser user={user} />`. Because `role` is absent, the sidebar never displays the active role.

---

## 4. Root Cause Analysis: Why Live Profile Data Fails to Display

| # | Root Cause Disconnect | Affected Files & Lines | Impact |
|---|---|---|---|
| **RC-1** | **No DB Persistence on Auth** | `frontend/src/app/api/auth/dev-login/route.ts`: lines 37–99 | When a user signs in or registers via `/login` or `/signup`, only a browser cookie is written. No PostgreSQL row is inserted or updated in `fhir-server` (`practitioner` or `patient` tables). |
| **RC-2** | **Omission of Role in Layout & Nav Props** | `frontend/src/app/[locale]/(apps)/layout.tsx`: lines 24–30 | The `user` object constructed in `AppsLayout` discards `session.user.role` / `session.session.activeRole`, passing only `name`, `email`, `image`, `username`, and `activeOrganizationId`. |
| **RC-3** | **Missing Role Display in UI** | `frontend/src/modules/client/shared/components/NavUser.tsx`: lines 16–23, 62–72<br>`frontend/src/modules/client/shared/components/SidebarNavUser.tsx`: lines 18–24, 65–70 | `NavUser` and `SidebarNavUser` do not accept or render `role`. The user sees only their name and email, violating Requirement R3. |
| **RC-4** | **Hardcoded Fallbacks & Short Timeout in Profile Guards** | `frontend/src/modules/server/auth/require-profile.ts`: lines 40–78, lines 87–133 | `requirePractitionerProfile` and `requirePatientProfile` race a 150ms timeout. When `fhir-gql` fails or is delayed, it returns hardcoded mock data ("Dr. John Smith", "Sarah Jenkins") instead of falling back to the signed-in session user's details. |
| **RC-5** | **User ID / Token Subject Mismatch** | `frontend/src/app/api/auth/dev-login/route.ts`: line 39 (`id: "usr-${role}-01"`)<br>`backend/fhir-gql/app/auth/dependencies.py`: lines 33–41 (`sub: "dev-user-001"`) | `fhir-gql` resolves `actor.sub` to `"dev-user-001"`, while session records use `"usr-doctor-01"`, causing `GET /practitioners/me` to search for the wrong `user_id`. |
| **RC-6** | **Redirect URL Divergence** | `frontend/src/app/api/auth/dev-login/route.ts`: lines 24–29 | Doctor defaults to `/bezs/telemedicine/doctor` (instead of `/en/bezs/telemedicine/doctor/dashboard`). Admin defaults to `/bezs/telemedicine/admin` (causing an extra hop). |

---

## 5. Exact File Paths, Endpoints, and Models Involved

### Frontend Files
- `d:\Mindspace\frontend\src\app\api\auth\dev-login\route.ts`: Login & session creation endpoint.
- `d:\Mindspace\frontend\src\app\[locale]\(auth)\login\page.tsx`: Sign-in UI.
- `d:\Mindspace\frontend\src\app\[locale]\(auth)\signup\page.tsx`: Sign-up UI.
- `d:\Mindspace\frontend\src\modules\server\auth\get-session.ts`: Session resolution logic.
- `d:\Mindspace\frontend\src\modules\server\auth\jwt-token.ts`: JWT bearer token provider.
- `d:\Mindspace\frontend\src\modules\server\auth\require-profile.ts`: Doctor & Patient profile guards.
- `d:\Mindspace\frontend\src\app\[locale]\(apps)\layout.tsx`: Root authenticated app shell.
- `d:\Mindspace\frontend\src\modules\client\shared\components\navbar\AppNavbar.tsx`: Header navigation bar.
- `d:\Mindspace\frontend\src\modules\client\shared\components\NavUser.tsx`: Header user menu dropdown.
- `d:\Mindspace\frontend\src\modules\client\shared\components\menubar\MenuBar.tsx`: Sidebar menu container.
- `d:\Mindspace\frontend\src\modules\client\shared\components\SidebarNavUser.tsx`: Sidebar footer user profile component.
- `d:\Mindspace\frontend\src\app\[locale]\(apps)\bezs\telemedicine\doctor\dashboard\page.tsx`: Doctor dashboard page.
- `d:\Mindspace\frontend\src\app\[locale]\(apps)\bezs\telemedicine\patient\page.tsx`: Patient dashboard page.
- `d:\Mindspace\frontend\src\app\[locale]\(apps)\bezs\telemedicine\admin\(resources)\organizations\page.tsx`: Admin organizations dashboard.

### Backend Services & Models
- `d:\Mindspace\backend\fhir-server\app\models\practitioner\practitioner.py`: `PractitionerModel`, `PractitionerName`, `PractitionerTelecom`.
- `d:\Mindspace\backend\fhir-server\app\models\patient\patient.py`: `PatientModel`, `PatientName`, `PatientTelecom`.
- `d:\Mindspace\backend\fhir-server\app\routers\practitioner.py`: `POST /api/fhir/v1/practitioner/full`, `GET /api/fhir/v1/practitioner`.
- `d:\Mindspace\backend\fhir-server\app\routers\patient.py`: `POST /api/fhir/v1/patient/full`, `GET /api/fhir/v1/patient`.
- `d:\Mindspace\backend\fhir-gql\app\auth\dependencies.py`: Token decoder and subject mapper.
- `d:\Mindspace\backend\fhir-gql\app\routers\practitioner.py`: Gateway router for `GET /api/v1/practitioners/me`.
- `d:\Mindspace\backend\fhir-gql\app\routers\patient.py`: Gateway router for `GET /api/v1/patients/me`.
- `d:\Mindspace\backend\fhir-gql\app\services\practitioner_service.py`: `get_me` query resolution logic.

---

## 6. Recommended Remediation Plan for the Worker

### Phase 1: Authentication & Routing Correction
1. In `frontend/src/app/api/auth/dev-login/route.ts`:
   - Update `defaultRedirect`:
     - `doctor` → `/bezs/telemedicine/doctor/dashboard`
     - `patient` → `/bezs/telemedicine/patient`
     - `admin` → `/bezs/telemedicine/admin/organizations`
   - Align token and user IDs: Ensure `id` matches `actor.sub` or encode user identity consistently into `dev_token`.

### Phase 2: PostgreSQL Profile Persistence
2. In `frontend/src/app/api/auth/dev-login/route.ts`:
   - When a user signs in or registers with a role:
     - Check if the corresponding FHIR record exists in `fhir-server` (or create/upsert it via direct REST call to `http://localhost:8000/api/fhir/v1/practitioner/full` or `/patient/full`).
     - Split full name into given and family names.
     - Persist `user_id`, `org_id`, `name`, `telecom` (email), and `active: true`.
     - Store the persisted FHIR resource ID in the session object (e.g. `session.user.fhirId = createdId`).

### Phase 3: Header & Sidebar Role & Profile Display
3. In `frontend/src/app/[locale]/(apps)/layout.tsx`:
   - Add `role: session.user.role || session.session.activeRole` to the `user` object passed to `<MenuBar>` and `<AppNavbar>`.
4. In `frontend/src/modules/client/shared/components/SidebarNavUser.tsx`:
   - Extend `type TUser` with `role?: string | null;`.
   - Render the role neatly in both the sidebar footer button (e.g., `<span className="capitalize font-medium text-primary">{role}</span>`) and within the dropdown menu header.
5. In `frontend/src/modules/client/shared/components/NavUser.tsx`:
   - Extend `type TUser` with `role?: string | null;`.
   - Render the role badge/label beside the user name in the header dropdown menu.

### Phase 4: Dynamic Session Fallbacks in Profile Guards
6. In `frontend/src/modules/server/auth/require-profile.ts`:
   - Retrieve `session = await getServerSession()`.
   - In fallback branches of `requirePractitionerProfile` and `requirePatientProfile`, replace hardcoded `"Dr. John Smith"` and `"Sarah Jenkins"` with `session?.user.name` and `session?.user.email`.
   - Increase the race timeout from 150ms to 1200ms so healthy backend queries against `fhir-gql` have adequate time to resolve before falling back.

### Phase 5: Verification & End-to-End Testing
7. Run end-to-end tests across Doctor, Patient, and Admin logins:
   - Verify redirect targets match R1 acceptance criteria.
   - Verify header and sidebar display live user name and capitalized role.
   - Verify page renders in sub-second time (< 1s).
