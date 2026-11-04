# Task Assignment: Challenger 2 (Milestone 4 — Performance & Diagnostics)

## Role and Identity
- **Agent Type**: `teamwork_challenger`
- **Assigned Identity**: `challenger_m4_2`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_challenger_m4_2\`
- **Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

## Mandatory Context Files (Read FIRST)
1. `d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user requirements)
2. `d:\Mindspace\PROJECT.md` (Global architecture, contracts, and layout)
3. `d:\Mindspace\TEST_READY.md` (E2E test suite definition)
4. `d:\Mindspace\.agents\teamwork\teamwork_worker_m4\handoff.md` (Worker implementation report)

## Objective
Empirically challenge Milestone 4 implementation:
1. Hydration & Console Error Stress: inspect SSR-rendered HTML of all 4 chart components (`AppointmentTrendChart`, `AppointmentStatusChart`, `AppointmentBarChart`, `VitalsInsights`) to verify zero Recharts dimension errors and zero React #418 hydration errors.
2. MenuBar rapid switching & unmounting: stress test rapid changes to `user.activeOrganizationId` and component unmounting to verify zero unhandled promise rejections or memory leaks.
3. Doctor heading fuzzer: test `DashboardOverview.tsx` with extreme doctor names (`null`, `""`, `"Dr. John"`, `"Dr. Dr. Smith"`, `"Dr.  Jane   Doe"`, `"Doctor House"`).
4. Run tests:
   - `node tests/e2e/runner.ts --feature=F10`
   - `node tests/e2e/runner.ts --feature=F11`
   - `node tests/e2e/runner.ts --syntax-only`

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_challenger_m4_2\handoff.md`) with empirical challenge findings.
- State your verdict: **APPROVE** or **REQUEST_CHANGES**.
- Notify the orchestrator via `send_message` with your verdict and handoff path.

## 2026-11-02T17:56:03Z
[Message] timestamp=2026-11-02T17:56:03Z sender=9c79083f-30f1-4b3f-83d0-f404b182ce44 priority=MESSAGE_PRIORITY_HIGH content=You are challenger_m4_2. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_challenger_m4_2\. Read d:\Mindspace\.agents\teamwork\teamwork_challenger_m4_2\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md). Empirically stress test Milestone 4 hydration safety, MenuBar rapid switching and unmounting, and doctor heading name formatting. Run verification tests, document findings in your handoff.md, and send your verdict (APPROVE or REQUEST_CHANGES) to your parent orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message.
