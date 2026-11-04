## 2026-11-02T15:56:06Z
You are the Worker for Milestone 3 (Live Profile Data Integration).
Your working directory is: d:\Mindspace\.agents\teamwork\teamwork_worker_m3\
Parent Orchestrator Conversation ID: f259537a-753b-4eb0-a461-a95fe0e79c51

MANDATORY FIRST STEP:
Read d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md, d:\Mindspace\PROJECT.md, d:\Mindspace\TEST_READY.md, and d:\Mindspace\.agents\teamwork\teamwork_explorer_survey_2\handoff.md before making any changes.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

SCOPE & EXCLUSIVE WRITE OWNERSHIP:
You exclusively own:
- frontend/src/app/[locale]/(apps)/layout.tsx
- frontend/src/modules/client/shared/components/NavUser.tsx
- frontend/src/modules/client/shared/components/SidebarNavUser.tsx
- frontend/src/modules/client/shared/components/navbar/AppNavbar.tsx
- frontend/src/modules/client/shared/components/menubar/MenuBar.tsx
- frontend/src/modules/server/auth/require-profile.ts
- frontend/src/app/api/auth/dev-login/route.ts (persistence enhancements)
- backend/fhir-gql/app/auth/dependencies.py
- frontend/scripts/test-data/seed.ts (or profile DB seed scripts)

MISSION:
Implement live PostgreSQL profile data integration and frontend display (Requirement R3):
1. Role Propagation & Header/Sidebar Display:
   - In `frontend/src/app/[locale]/(apps)/layout.tsx`: Forward `role` from session (`session.user.role || session.session.activeRole || "patient"`) inside the `user` prop passed to `<AppNavbar>` and `<MenuBar>`.
   - In `frontend/src/modules/client/shared/components/navbar/AppNavbar.tsx` and `NavUser.tsx`: Define `role?: string | null` in `TUser`. Render user name and a clear role badge (e.g., Doctor, Patient, Administrator) in `NavUser` in the header.
   - In `frontend/src/modules/client/shared/components/menubar/MenuBar.tsx` and `SidebarNavUser.tsx`: Define `role?: string | null` in `TUser`. Render user name and role in `SidebarNavUser` in the sidebar.
2. Dynamic Profile Guard Fallbacks:
   - In `frontend/src/modules/server/auth/require-profile.ts`:
     Update `requirePractitionerProfile` and `requirePatientProfile` so fallback profiles dynamically derive identity (name, email, user_id) from the active session (`getServerSession()`) rather than static mock defaults ("Dr. John Smith", "Sarah Jenkins").
3. Live Profile PostgreSQL Persistence:
   - In `dev-login/route.ts` and/or seed utilities: Ensure that authenticated user accounts persist clinical profile records in PostgreSQL (`PractitionerModel` with `practitioner_name` and `practitioner_telecom` for doctor; `PatientModel` with `patient_name` and `patient_telecom` for patient) so database queries return live profile data.
4. Token Claims Alignment:
   - In `backend/fhir-gql/app/auth/dependencies.py`: Align `dev-jwt-token` claims with session user IDs (`usr-doctor-01`, `usr-patient-01`, `usr-admin-01`).

VERIFICATION:
- Run `node tests/e2e/runner.ts --feature=F5,F6,F7,F8` to verify header/sidebar display, PostgreSQL persistence, and dynamic fallback tests pass.
- Run typecheck in frontend to verify zero errors in modified components.
- Document commands and results in d:\Mindspace\.agents\teamwork\teamwork_worker_m3\handoff.md.

CONSTRAINTS:
- Under NO circumstances run `git push`.
- Maintain progress.md in your working directory with `Last visited: [timestamp]` header.

## 2026-11-02T16:06:31Z
**Context**: Milestone 3 - Live Profile Data Integration Implementation
**Content**: 10 minutes have elapsed since dispatch. Please report your implementation progress on Tasks 1-4 and estimated completion time.
**Action**: Update progress.md with latest timestamp and reply with status update.
