# Task Assignment: Forensic Auditor (Milestone 3 — Live Profile Data Integration)

## Role and Identity
- **Agent Type**: `teamwork_auditor`
- **Assigned Identity**: `auditor_m3_1_repl`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_auditor_m3_1_repl\`
- **Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

## Mandatory Context Files (Read FIRST)
1. `d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user requirements)
2. `d:\Mindspace\PROJECT.md` (Global architecture, contracts, and layout)
3. `d:\Mindspace\TEST_READY.md` (E2E test suite definition)
4. `d:\Mindspace\.agents\teamwork\teamwork_worker_m3\handoff.md` (Worker implementation report)
5. `d:\Mindspace\.agents\teamwork\teamwork_reviewer_m3_2\handoff.md` (Reviewer 2 report)

## Objective
Perform forensic integrity verification of Milestone 3: Live Profile Data Integration.
Check for any integrity violations:
1. Hardcoded test results or strings (inspect `NavUser.tsx`, `SidebarNavUser.tsx`, `require-profile.ts`, `dev-login/route.ts`).
2. Dummy or facade implementations (verify `persistProfileToPostgres` contains genuine SQL, verify `require-profile.ts` derives session identity dynamically).
3. Test bypassing or test file tampering.
4. Git cleanliness: verify NO `git push` was executed, verify git status is clean of uncommitted artifacts that violate boundaries.
5. Independent test execution:
   - `.\frontend\node_modules\.bin\tsx --tsconfig frontend/tsconfig.json tests/verify_m3_profile.ts`
   - `node tests/e2e/runner.ts --feature=F8`
   - `node tests/e2e/runner.ts --syntax-only`

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_auditor_m3_1_repl\handoff.md`) with evidence for every check.
- Include explicit verdict: **CLEAN** or **INTEGRITY VIOLATION**.
- Notify the orchestrator via `send_message` with your verdict and handoff path.


## 2026-11-02T16:57:53Z
You are auditor_m3_1_repl. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_auditor_m3_1_repl\. Read d:\Mindspace\.agents\teamwork\teamwork_auditor_m3_1_repl\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md). Perform forensic integrity audit of Milestone 3 implementation. Inspect source code for hardcoding, facades, git push violations, and tampering. Run verification tests independently. Document findings in your handoff.md, and send your verdict (CLEAN or INTEGRITY VIOLATION) to your parent orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message.
