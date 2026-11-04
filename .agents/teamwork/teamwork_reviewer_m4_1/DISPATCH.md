# Task Assignment: Reviewer 1 (Milestone 4 — Performance & Diagnostics)

## Role and Identity
- **Agent Type**: `teamwork_reviewer`
- **Assigned Identity**: `reviewer_m4_1`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_reviewer_m4_1\`
- **Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

## Mandatory Context Files (Read FIRST)
1. `d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user requirements)
2. `d:\Mindspace\PROJECT.md` (Global architecture, contracts, and layout)
3. `d:\Mindspace\TEST_READY.md` (E2E test suite definition)
4. `d:\Mindspace\.agents\teamwork\teamwork_worker_m4\handoff.md` (Worker implementation report)

## Objective
Objectively review Milestone 4 implementation:
1. `frontend/src/modules/server/auth/get-session.ts`: `React.cache()` memoization, probe timeout <= 250ms (200ms), `try ... finally { clearTimeout(timeout); }`.
2. `frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts`: Axios timeout <= 2000ms (1500ms), error handling.
3. 5 `loading.tsx` skeletons:
   - `frontend/src/app/[locale]/(apps)/bezs/telemedicine/doctor/loading.tsx`
   - `frontend/src/app/[locale]/(apps)/bezs/telemedicine/doctor/dashboard/loading.tsx`
   - `frontend/src/app/[locale]/(apps)/bezs/telemedicine/patient/loading.tsx`
   - `frontend/src/app/[locale]/(apps)/bezs/telemedicine/admin/(resources)/organizations/loading.tsx`
   - `frontend/src/app/[locale]/(apps)/bezs/telemedicine/admin/loading.tsx`
4. Recharts SSR hydration guards (`isMounted`) across 4 chart components.
5. `MenuBar.tsx` fetch cleanup, `DashboardOverview.tsx` doctor name split fix, port configs.
6. Run tests independently:
   - `node tests/e2e/runner.ts --feature=F9`
   - `node tests/e2e/runner.ts --feature=F10`
   - `node tests/e2e/runner.ts --feature=F11`
   - `node tests/e2e/runner.ts --syntax-only`

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_reviewer_m4_1\handoff.md`) following the Handoff Protocol.
- State your verdict: **APPROVE** or **REQUEST_CHANGES**.
- Notify the orchestrator via `send_message` with your verdict and handoff path.


## 2026-11-02T17:55:14Z
[Message] sender=9c79083f-30f1-4b3f-83d0-f404b182ce44 priority=MESSAGE_PRIORITY_HIGH
You are reviewer_m4_1. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_reviewer_m4_1\. Read d:\Mindspace\.agents\teamwork\teamwork_reviewer_m4_1\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md). Review Milestone 4 code changes, run verification tests independently, document findings in your handoff.md, and send your verdict (APPROVE or REQUEST_CHANGES) to your parent orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message.
