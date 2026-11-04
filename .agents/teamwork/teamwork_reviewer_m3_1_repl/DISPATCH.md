# Task Assignment: Reviewer 1 (Milestone 3 — Live Profile Data Integration)

## Role and Identity
- **Agent Type**: `teamwork_reviewer`
- **Assigned Identity**: `reviewer_m3_1_repl`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_reviewer_m3_1_repl\`
- **Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

## Mandatory Context Files (Read FIRST)
1. `d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user requirements)
2. `d:\Mindspace\PROJECT.md` (Global architecture, contracts, and layout)
3. `d:\Mindspace\TEST_READY.md` (E2E test suite definition)
4. `d:\Mindspace\.agents\teamwork\teamwork_worker_m3\handoff.md` (Worker implementation report)
5. `d:\Mindspace\.agents\teamwork\teamwork_reviewer_m3_2\handoff.md` (Reviewer 2 report)

## Objective
Review Milestone 3 implementation: Live Profile Data Integration.
Verify:
1. Role forwarding in `frontend/src/app/[locale]/(apps)/layout.tsx` to `<MenuBar>` and `<AppNavbar>`.
2. Header role badge & user name rendering in `frontend/src/modules/client/shared/components/NavUser.tsx` and `AppNavbar.tsx`.
3. Sidebar role badge & user name rendering in `frontend/src/modules/client/shared/components/SidebarNavUser.tsx` and `MenuBar.tsx`.
4. Dynamic profile guard fallbacks in `frontend/src/modules/server/auth/require-profile.ts` (bounded timeout <= 250ms, regex `/setTimeout\([^,]+,\s*(\d+)\)/`, user identity derived from session).
5. PostgreSQL persistence in `frontend/src/app/api/auth/dev-login/route.ts` and `frontend/scripts/test-data/seed.ts` with safe offline handling.
6. Dev token subject alignment in `backend/fhir-gql/app/auth/dependencies.py`.
7. Execute verification commands:
   - `.\frontend\node_modules\.bin\tsx --tsconfig frontend/tsconfig.json tests/verify_m3_profile.ts`
   - `node tests/e2e/runner.ts --feature=F8`
   - `node tests/e2e/runner.ts --syntax-only`

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_reviewer_m3_1_repl\handoff.md`) following the Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
- Include explicit verdict: **APPROVE** or **REQUEST_CHANGES**.
- Notify the orchestrator via `send_message` with your verdict and handoff path.


## 2026-11-02T16:57:30Z
From: 9c79083f-30f1-4b3f-83d0-f404b182ce44
Content: You are reviewer_m3_1_repl. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_reviewer_m3_1_repl\. Read d:\Mindspace\.agents\teamwork\teamwork_reviewer_m3_1_repl\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md). Execute the review of Milestone 3, run all verification tests, document findings in your handoff.md, and send your verdict (APPROVE or REQUEST_CHANGES) to your parent orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message.
