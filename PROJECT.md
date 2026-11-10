# Project: MindSpace Auth Journey & Member Provisioning Integration

## Architecture
MindSpace integrates a multi-tier production architecture spanning:
1. **Next.js 16 Frontend App Router (`frontend/`, Port 4000)**:
   - Marketing landing page (`/[locale]`), localized navigation bar (`RootNavbar`), role-specific workspace layout (`AppNavbar`, `NavUser`).
   - Authentication pages (`/[locale]/login`, `/[locale]/signup`) integrated with Better Auth React client (`authClient.signIn.email`, `authClient.signUp.email`).
   - Route aliases redirecting legacy or standard URLs (`/sign-in`, `/auth/signin`, `/sign-up`, `/auth/signup`, `/dashboard`).
   - Resilient server-side session resolution (`getServerSession()`) and bearer token propagation to FastAPI.
2. **Better Auth IAM Service (`backend/mindspace-iam/`, Port 5001)**:
   - Headless Node.js authentication microservice running on port 5001.
   - Prisma adapter targeting PostgreSQL (port 5433, database `mindspace`, schema `iam`).
   - Core tables: `iam.user`, `iam.account`, `iam.session`, `iam.verification`, `iam.jwks`.
   - Cryptographic Ed25519 JWKS endpoint (`/api/auth/jwks`) and signed JWT token minting (`/api/auth/token`).
3. **Core API Backend (`backend/mindspace-fastapi/`, Port 8080)**:
   - Python 3.12+ FastAPI backend implementing strict Clean Architecture:
     - **Domain Layer**: Pure entities (`Principal`, `MemberProfile`, `MemberPreference`, `RoleAssignment`) and repository interfaces (`IMemberRepository`).
     - **Application Layer**: Use cases (`ProvisionMemberUseCase`, `GetMemberProfileUseCase`) orchestrating business logic and transactions.
     - **Infrastructure Layer**: SQLAlchemy models, async session management, `SqlAlchemyMemberRepository`, and `BetterAuthTokenVerifier`.
     - **Interfaces / Presentation Layer**: FastAPI routers (`app/routers/member.py`) using dependency injection to execute use cases.
   - Manages domain member persistence in PostgreSQL `public` schema (`app_principals`, `member_profiles`, `member_preferences`, `role_assignments`).
4. **PostgreSQL Database (Port 5433, Database `mindspace`)**:
   - Schema `iam`: Holds identity and credential data managed by Better Auth.
   - Schema `public`: Holds domain entities managed by FastAPI Clean Architecture.
   - Logical linkage: Coordinated via user subject ID (`user_id` == `iam.user.id`).

```
  Browser / Client
      │
      ├───────────────────────┐
      │ (Sign-Up / Sign-In)   │ (App / Page Load)
      ▼                       ▼
  [Better Auth IAM]      [Next.js 16 Frontend]
  (Port 5001, schema:iam) (Port 4000, App Router)
      │                       │
      │ Session & JWT         │ Bearer <JWT>
      └──────────────────────►│
                              │ (Provision Member / API)
                              ▼
                     [FastAPI Clean Arch Backend]
                     (Port 8080, schema:public)
                     ├── Interfaces (Routers & DTOs)
                     ├── Application (ProvisionMemberUseCase)
                     ├── Domain (Entities & Repository Interfaces)
                     └── Infrastructure (SQLAlchemy, Session, JWKS)
                              │
                              ▼
                     [PostgreSQL Database]
                     (Port 5433, db: mindspace)
                     ├── Schema 'iam': user, account, session, jwks
                     └── Schema 'public': app_principals, member_profiles,
                                          member_preferences, role_assignments
```

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Landing Page Session Bar | `RootNavbar` dynamically switches between auth CTA buttons ("Sign In", "Get started") and active dashboard shortcut ("Open Dashboard") based on session state. | M3 | survey |
| 2 | Frontend User Sign-Up | Real Better Auth registration (`authClient.signUp.email`), validating passwords >= 10 chars, creating IAM account and redirecting to dashboard. | M3 | survey |
| 3 | Frontend User Sign-In | Real Better Auth login (`authClient.signIn.email`), validating credentials, establishing session cookie, and redirecting to dashboard. | M3 | survey |
| 4 | Route Aliases & Redirects | Redirects for `/sign-in`, `/auth/signin` -> `/login`, `/sign-up`, `/auth/signup` -> `/signup`, `/dashboard` -> `/mindspace/member`. | M3 | survey |
| 5 | Resilient Session Fetching | Increase abort timeouts in `get-session.ts` and `api-client.ts` to >= 5000ms, removing artificial sub-second timeouts and `/api/auth/dev-login` bypass. | M3 | survey |
| 6 | Better Auth IAM Endpoints | Better Auth Node.js service exposing `/api/auth/sign-up/email`, `/api/auth/sign-in/email`, `/api/auth/get-session`, `/api/auth/token`, `/api/auth/jwks`. | M2 | survey |
| 7 | IAM Schema Persistence | Tables in `iam` schema (`user`, `account`, `session`, `verification`, `jwks`) persisting on PostgreSQL port 5433. | M2 | survey |
| 8 | Clean Architecture Domain Layer | Domain entities (`Principal`, `MemberProfile`, `MemberPreference`, `RoleAssignment`) and repository interface `IMemberRepository`. | M1 | survey |
| 9 | Clean Architecture Application Layer | `ProvisionMemberUseCase` orchestrating atomic, idempotent member provisioning. | M1 | survey |
| 10 | Clean Architecture Infrastructure Layer | `SqlAlchemyMemberRepository` handling database persistence and `BetterAuthTokenVerifier` handling JWT tokens. | M1 | survey |
| 11 | Clean Architecture Interfaces Layer | Refactored `app/routers/member.py` delegating to use cases via FastAPI dependency injection. | M1 | survey |
| 12 | Atomic Member Provisioning | Idempotent endpoint `POST /api/v1/members/me/provision` creating `app_principals`, `member_profiles`, `member_preferences`, and `role_assignments` in single commit. | M1 | survey |
| 13 | Public Schema Persistence | Domain records persist in PostgreSQL `public` schema on port 5433 with complete referential integrity. | M1 | survey |
| 14 | Automated Verification Test Infra | Test harness running E2E flow across frontend auth, IAM, FastAPI, and PostgreSQL persistence. | M4 | survey |
| 15 | End-to-End Verification Suite | Automated tests for Tiers 1-4 verifying registration, login, navbar state, Clean Arch provisioning, and dual-schema persistence. | M4 | survey |
| 16 | Final Adversarial Hardening & Audit | Tier 5 adversarial coverage and Forensic Integrity Audit ensuring zero integrity violations and 100% test pass. | M5 | survey |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Clean Architecture & Member Provisioning | Refactor `backend/mindspace-fastapi` into Domain, Application, Infrastructure, and Interface layers. Implement atomic `ProvisionMemberUseCase` and `SqlAlchemyMemberRepository` persisting to `public` schema. | none | IN_PROGRESS |
| M2 | Better Auth IAM Service & Database Persistence | Verify & configure Better Auth server on port 5001, ensure database schema `iam` on port 5433 is fully migrated, verify token minting and JWKS. | none | PLANNED |
| M3 | Frontend Landing Page, Auth Flow & Nav Integration | Wire `frontend/` sign-up and sign-in to Better Auth, remove `dev-login` bypass, add route aliases (`/sign-in`, `/sign-up`, `/dashboard`), update `RootNavbar` session state, wire member provisioning. | M1, M2 | PLANNED |
| M4 | E2E Automated Verification Suite & Test Readiness | Develop automated test suite verifying full user journey, IAM persistence, FastAPI provisioning, and PostgreSQL dual-schema integrity. Publish `TEST_READY.md`. | M1, M2, M3 | PLANNED |
| M5 | Final Verification, Adversarial Hardening & Audit | Execute 100% E2E test suite (Tiers 1-4), execute Tier 5 adversarial stress testing, and obtain clean Forensic Integrity Audit. | M4 | PLANNED |

---

## Interface Contracts

### Better Auth IAM (`5001`) ↔ Frontend (`4000`)
- `POST /api/auth/sign-up/email`:
  - Request: `{ "email": string, "password": string (>= 10 chars), "name": string, "callbackURL": string }`
  - Response: `{ "user": { "id": string, "name": string, "email": string, "role": string }, "session": { "token": string, "expiresAt": string } }`
  - Headers: `Set-Cookie: better-auth.session_token=...; Path=/; HttpOnly; SameSite=Lax`
- `POST /api/auth/sign-in/email`:
  - Request: `{ "email": string, "password": string, "callbackURL": string, "rememberMe": boolean }`
  - Response: `{ "user": { "id": string, ... }, "session": { "token": string, ... } }`
  - Headers: `Set-Cookie: better-auth.session_token=...; Path=/; HttpOnly; SameSite=Lax`
- `GET /api/auth/token`:
  - Headers: `Cookie: better-auth.session_token=...`
  - Response: `{ "token": "<JWT string>" }`
- `GET /api/auth/jwks`:
  - Response: `{ "keys": [ { "kty": "OKP", "crv": "Ed25519", "x": "...", "alg": "EdDSA", "use": "sig", "kid": "..." } ] }`

### Frontend (`4000`) ↔ FastAPI Backend (`8080`)
- `POST /api/v1/members/me/provision`:
  - Headers: `Authorization: Bearer <JWT string>`
  - Request Body: none
  - Response: `{ "status": "provisioned", "userId": string, "displayName": string }`
  - Error: `401 Unauthorized` (invalid/missing token), `500 Internal Server Error` (unhandled DB error)
- `GET /api/v1/me`:
  - Headers: `Authorization: Bearer <JWT string>`
  - Response: `{ "userId": string, "displayName": string, "activeRoles": string[] }`

### FastAPI Backend (`8080`) ↔ PostgreSQL (Port 5433, db `mindspace`, schema `public`)
- `app_principals`: `(user_id TEXT PK, account_state TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)`
- `member_profiles`: `(user_id TEXT PK REFERENCES app_principals, display_name TEXT, eligibility_state TEXT, profile_state TEXT)`
- `member_preferences`: `(user_id TEXT PK REFERENCES app_principals, locale TEXT, timezone TEXT, preferred_languages TEXT[], support_preferences JSONB)`
- `role_assignments`: `(id UUID PK, user_id TEXT REFERENCES app_principals, role_code TEXT, assignment_state TEXT, granted_at TIMESTAMPTZ)`

---

## Code Layout
- `backend/mindspace-fastapi/app/`
  - `domain/`: Pure business entities (`principal.py`, `member_profile.py`, `role_assignment.py`) and repository interfaces (`member_repository.py`).
  - `application/`: Use cases (`provision_member.py`, `get_member.py`).
  - `infrastructure/`: SQLAlchemy models (`models/`), repository implementations (`repositories/sqlalchemy_member_repository.py`), security (`security.py`), database (`database.py`).
  - `interfaces/`: FastAPI routers (`routers/member.py`), Pydantic schemas (`schemas/`).
- `backend/mindspace-iam/`
  - `src/`: `server.ts`, `auth.ts`, `config.ts`, `roles.ts`, `demo-users.ts`.
  - `prisma/`: `schema.prisma`, `migrations/`.
- `frontend/`
  - `src/app/[locale]/(marketing)/`: Landing page (`page.tsx`), navigation components (`RootNavbar.tsx`).
  - `src/app/[locale]/(auth)/`: `login/page.tsx`, `signup/page.tsx`.
  - `src/app/[locale]/(mindspace)/`: `layout.tsx`, `mindspace/member/page.tsx`.
  - `src/modules/client/auth/betterauth/`: `auth-client.ts`.
  - `src/modules/server/auth/`: `get-session.ts`.
  - `src/modules/server/mindspace/`: `api-client.ts`.
- `tests/e2e/`: End-to-end automated verification scripts.
