# Original User Request

## Initial Request — 2026-11-05T08:53:43Z

Build a production-ready marketing landing page at `http://localhost:4000/[locale]` and implement role-based authentication and routing flows for sign-up and sign-in across the MindSpace frontend and IAM services.

Working directory: D:\Mindspace
Integrity mode: development

## Requirements

### R1. Marketing Landing Page
Build a complete, responsive marketing landing page in `frontend/src/app/[locale]/page.tsx` (e.g. `http://localhost:4000/en/`) replacing the immediate redirect to `/login`. The landing page must feature MindSpace branding, a hero section, key feature highlights/services, and clear call-to-action buttons ("Get Started" pointing to `/[locale]/signup` and "Sign In" pointing to `/[locale]/login`).

### R2. Sign-Up Registration and Direct Dashboard Routing
Connect the user registration flow to the IAM auth service (`bezs-iam` on port 5001). Registering a new user must persist user data in the IAM database, assign the default role (`member`), establish the authenticated session cookie (`mindspace_session`), and redirect directly to the role dashboard (`/[locale]/mindspace/member`).

### R3. Sign-In Role-Based Redirection
Implement role detection upon user authentication and route signed-in users to their corresponding dashboard:
- `member` (or `patient`) -> `/[locale]/mindspace/member`
- `listener` (or `doctor`) -> `/[locale]/mindspace/listener`
- `listener-supervisor` -> `/[locale]/mindspace/listener-supervisor`
- `safety-operations` -> `/[locale]/mindspace/safety-operations`
- `platform-administrator` (or `admin`) -> `/[locale]/mindspace/platform-administrator`
- Fallback for unrecognized roles -> `/[locale]/mindspace`

### R4. Session Creation and Authentication State Persistence
Ensure session creation (including `mindspace_session` cookie via `/api/auth/dev-login` or the session provider) properly attaches role and user identity, ensuring dashboard routes do not bounce back to login or fail authentication checks. Existing local environment accounts and dev-login mechanisms can be used for authentication.

## Acceptance Criteria

### Marketing Landing Page
- [ ] Navigating to `http://localhost:4000/[locale]` (e.g. `/en/`) renders the complete marketing landing page (MindSpace branding, hero, key features, and CTAs) without redirecting to `/login`.
- [ ] Clicking "Get Started" navigates to `/[locale]/signup` and clicking "Sign In" navigates to `/[locale]/login`.

### Registration and Authentication Routing
- [ ] Submitting the sign-up form creates the user record in IAM, establishes a valid `mindspace_session` cookie with the `member` role, and navigates directly to `/[locale]/mindspace/member`.
- [ ] Signing in as a user with each role navigates to that role's designated dashboard route:
  - `member` (or `patient`) to `/[locale]/mindspace/member`
  - `listener` (or `doctor`) to `/[locale]/mindspace/listener`
  - `listener-supervisor` to `/[locale]/mindspace/listener-supervisor`
  - `safety-operations` to `/[locale]/mindspace/safety-operations`
  - `platform-administrator` (or `admin`) to `/[locale]/mindspace/platform-administrator`
  - Unrecognized or generic role to `/[locale]/mindspace`
- [ ] The `mindspace_session` cookie is established with valid role attributes, allowing authenticated access to dashboard routes without redirect loops back to login.
- [ ] Programmatic verification tests written by the team validate all redirect paths and session persistence.
