# Task Assignment: Reviewer 2 (Milestone 4 — Performance & Diagnostics)

## Role and Identity
- **Agent Type**: `teamwork_reviewer`
- **Assigned Identity**: `reviewer_m4_2`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_reviewer_m4_2\`
- **Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

## Mandatory Context Files (Read FIRST)
1. `d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user requirements)
2. `d:\Mindspace\PROJECT.md` (Global architecture, contracts, and layout)
3. `d:\Mindspace\TEST_READY.md` (E2E test suite definition)
4. `d:\Mindspace\.agents\teamwork\teamwork_worker_m4\handoff.md` (Worker implementation report)

## Objective
Objectively review Milestone 4 implementation:
1. Examine code changes across all 14 files modified/created in Milestone 4.
2. Verify Next.js App Router streaming compatibility of all 5 `loading.tsx` skeletons (no illegal hooks, clean SSR syntax, layout matching).
3. Verify Recharts hydration fix: ensure `isMounted` state prevents React error #418 and 0-dimension warnings on initial SSR.
4. Verify `get-session.ts` and `organization.rest.service.ts` timeouts adhere to `< 1s` performance contract.
5. Verify `MenuBar.tsx` fetch cleanup, `DashboardOverview.tsx` doctor name split fix, and port isolation.
6. Run tests independently:
   - `node tests/e2e/runner.ts --feature=F9`
   - `node tests/e2e/runner.ts --feature=F10`
   - `node tests/e2e/runner.ts --feature=F11`
   - `node tests/e2e/runner.ts --syntax-only`

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_reviewer_m4_2\handoff.md`) following the Handoff Protocol.
- State your verdict: **APPROVE** or **REQUEST_CHANGES**.
- Notify the orchestrator via `send_message` with your verdict and handoff path.

## 2026-11-02T17:55:36Z
You are reviewer_m4_2. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_reviewer_m4_2\. Read d:\Mindspace\.agents\teamwork\teamwork_reviewer_m4_2\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md). Review Milestone 4 streaming skeletons, hydration guards, timeouts, and port configs. Run verification tests independently, document findings in your handoff.md, and send your verdict (APPROVE or REQUEST_CHANGES) to your parent orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message.
