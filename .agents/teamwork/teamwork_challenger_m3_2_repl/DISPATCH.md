# Task Assignment: Challenger 2 (Milestone 3 — Live Profile Data Integration)

## Role and Identity
- **Agent Type**: `teamwork_challenger`
- **Assigned Identity**: `challenger_m3_2_repl`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_challenger_m3_2_repl\`
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
1. Concurrency and identity switching: simulate doctor -> patient -> admin rapid switching. Ensure profile state does not leak across sessions.
2. PostgreSQL persistence resilience in `dev-login/route.ts`: verify parameterized SQL injection safety, verify behavior when PostgreSQL database is offline or times out (500ms timeout check).
3. JWT token claim decoding in `backend/fhir-gql/app/auth/dependencies.py`: verify that decoded `sub` claims match session IDs (`usr-doctor-01`, `usr-patient-01`, `usr-admin-01`).
4. Run tests:
   - `.\frontend\node_modules\.bin\tsx --tsconfig frontend/tsconfig.json tests/verify_m3_profile.ts`
   - `node tests/e2e/runner.ts --feature=F8`

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_challenger_m3_2_repl\handoff.md`) with concrete empirical findings.
- Include explicit verdict: **APPROVE** or **REQUEST_CHANGES**.
- Notify the orchestrator via `send_message` with your verdict and handoff path.


## 2026-11-02T16:57:48Z
You are challenger_m3_2_repl. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_challenger_m3_2_repl\. Read d:\Mindspace\.agents\teamwork\teamwork_challenger_m3_2_repl\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md). Empirically challenge Milestone 3 concurrency, switching, PostgreSQL persistence and offline fallback, and token subject claims. Run verification tests, document findings in your handoff.md, and send your verdict (APPROVE or REQUEST_CHANGES) to your parent orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message.
