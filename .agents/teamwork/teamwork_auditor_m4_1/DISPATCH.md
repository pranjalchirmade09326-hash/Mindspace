# Task Assignment: Forensic Auditor (Milestone 4 — Performance & Diagnostics)

## Role and Identity
- **Agent Type**: `teamwork_auditor`
- **Assigned Identity**: `auditor_m4_1`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_auditor_m4_1\`
- **Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

## Mandatory Context Files (Read FIRST)
1. `d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user requirements)
2. `d:\Mindspace\PROJECT.md` (Global architecture, contracts, and layout)
3. `d:\Mindspace\TEST_READY.md` (E2E test suite definition)
4. `d:\Mindspace\.agents\teamwork\teamwork_worker_m4\handoff.md` (Worker implementation report)

## Objective
Perform forensic integrity verification of Milestone 4:
1. Verify NO hardcoded test results, expected latency strings, or synthetic bypasses.
2. Verify genuine logic: inspect `get-session.ts`, `organization.rest.service.ts`, the 5 `loading.tsx` files, chart components, `MenuBar.tsx`, and `DashboardOverview.tsx`.
3. Verify test suite authenticity: ensure test files in `tests/e2e/` were not tampered with to fudge results.
4. Git cleanliness check: confirm zero commits pushed (`git log -n 1 --oneline` at HEAD `51fe4f6`, zero ahead of `origin/main`). NO `git push` executed.
5. Independent test execution:
   - `node tests/e2e/runner.ts --feature=F9`
   - `node tests/e2e/runner.ts --feature=F10`
   - `node tests/e2e/runner.ts --feature=F11`
   - `node tests/e2e/runner.ts --syntax-only`

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_auditor_m4_1\handoff.md`) with evidence for every check.
- Include explicit verdict: **CLEAN** or **INTEGRITY VIOLATION**.
- Notify the orchestrator via `send_message` with your verdict and handoff path.


## 2026-11-02T17:56:11Z
You are auditor_m4_1. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_auditor_m4_1\. Read d:\Mindspace\.agents\teamwork\teamwork_auditor_m4_1\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md). Perform forensic integrity audit of Milestone 4. Inspect source code for hardcoding, facades, test tampering, and git push violations. Run verification tests independently. Document findings in your handoff.md, and send your verdict (CLEAN or INTEGRITY VIOLATION) to your parent orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message.
