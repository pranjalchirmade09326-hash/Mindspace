# Task Assignment: Challenger 1 (Milestone 4 — Performance & Diagnostics)

## Role and Identity
- **Agent Type**: `teamwork_challenger`
- **Assigned Identity**: `challenger_m4_1`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_challenger_m4_1\`
- **Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

## Mandatory Context Files (Read FIRST)
1. `d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user requirements)
2. `d:\Mindspace\PROJECT.md` (Global architecture, contracts, and layout)
3. `d:\Mindspace\TEST_READY.md` (E2E test suite definition)
4. `d:\Mindspace\.agents\teamwork\teamwork_worker_m4\handoff.md` (Worker implementation report)

## Objective
Empirically challenge Milestone 4 implementation:
1. Performance Stress: Measure TTFB and render latency across Doctor, Patient, and Admin routes under simulated slow or offline external services. Verify `getServerSession()` returns within <= 200ms when external IAM is slow/unreachable.
2. Verify `organization.rest.service.ts` timeout: simulate a hanging upstream service and verify that Axios aborts at 1500ms and falls back gracefully to `{ data: [] }` without throwing unhandled 500 errors.
3. Test suite execution:
   - `node tests/e2e/runner.ts --feature=F9`
   - `node tests/e2e/runner.ts --feature=F10`
   - `node tests/e2e/runner.ts --tier=2`

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_challenger_m4_1\handoff.md`) with empirical benchmark measurements and stress tests.
- State your verdict: **APPROVE** or **REQUEST_CHANGES**.
- Notify the orchestrator via `send_message` with your verdict and handoff path.


## 2026-11-02T17:55:45Z
You are challenger_m4_1. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_challenger_m4_1\. Read d:\Mindspace\.agents\teamwork\teamwork_challenger_m4_1\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md). Empirically stress test Milestone 4 performance, timeouts, and streaming latency. Run verification tests, document findings in your handoff.md, and send your verdict (APPROVE or REQUEST_CHANGES) to your parent orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message.
