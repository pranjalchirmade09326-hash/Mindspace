# Task Assignment: Challenger 1 (Milestone 3 — Live Profile Data Integration)

## Role and Identity
- **Agent Type**: `teamwork_challenger`
- **Assigned Identity**: `challenger_m3_1_repl`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_challenger_m3_1_repl\`
- **Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

## Mandatory Context Files (Read FIRST)
1. `d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user requirements)
2. `d:\Mindspace\PROJECT.md` (Global architecture, contracts, and layout)
3. `d:\Mindspace\TEST_READY.md` (E2E test suite definition)
4. `d:\Mindspace\.agents\teamwork\teamwork_worker_m3\handoff.md` (Worker implementation report)
5. `d:\Mindspace\.agents\teamwork\teamwork_reviewer_m3_2\handoff.md` (Reviewer 2 report)

## Objective
Empirically challenge Milestone 3 implementation: Live Profile Data Integration.
Adversarial focus:
1. DOM rendering stress testing: NavUser & SidebarNavUser under extreme inputs (empty string, single character, long names > 100 chars, special characters, null/undefined role, unexpected roles).
2. `require-profile.ts` behavior when session is unauthenticated, corrupted, or slow. Verify that timeout <= 250ms is always honored and returns valid FHIR structures without throwing unhandled exceptions.
3. Test suite execution:
   - `.\frontend\node_modules\.bin\tsx --tsconfig frontend/tsconfig.json tests/verify_m3_profile.ts`
   - `node tests/e2e/runner.ts --feature=F8`
   - `node tests/e2e/runner.ts --tier=3`

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_challenger_m3_1_repl\handoff.md`) with concrete stress test results.
- Include explicit verdict: **APPROVE** or **REQUEST_CHANGES**.
- Notify the orchestrator via `send_message` with your verdict and handoff path.


## 2026-11-02T16:57:43Z
[Message] timestamp=2026-11-02T16:57:43Z sender=9c79083f-30f1-4b3f-83d0-f404b182ce44 priority=MESSAGE_PRIORITY_HIGH content=You are challenger_m3_1_repl. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_challenger_m3_1_repl\. Read d:\Mindspace\.agents\teamwork\teamwork_challenger_m3_1_repl\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md). Empirically challenge Milestone 3 live profile integration under extreme and boundary conditions, run verification tests, document findings in your handoff.md, and send your verdict (APPROVE or REQUEST_CHANGES) to your parent orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message.
