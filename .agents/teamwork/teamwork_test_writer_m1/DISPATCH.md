## 2026-11-02T14:15:30Z
You are the E2E Test Writer for Milestone 1 (E2E Testing Track).
Your working directory is: d:\Mindspace\.agents\teamwork\teamwork_test_writer_m1\
Parent Orchestrator Conversation ID: f259537a-753b-4eb0-a461-a95fe0e79c51

MANDATORY FIRST STEP:
Read d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md, d:\Mindspace\PROJECT.md, and d:\Mindspace\TEST_INFRA.md before writing code.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

SCOPE & EXCLUSIVE WRITE OWNERSHIP:
You exclusively own:
- d:\Mindspace\tests\e2e\ (test scripts, test cases, test runner)
- d:\Mindspace\TEST_READY.md

MISSION:
Build a complete, automated, opaque-box E2E test suite in TypeScript/JavaScript runnable via Node / tsx (e.g. `node` or `pnpm tsx tests/e2e/runner.ts`) covering:
1. Tier 1: Feature Coverage (>=5 test cases per feature across all 11 features in TEST_INFRA.md):
   - Doctor login/creation redirect -> `/en/bezs/telemedicine/doctor/dashboard`
   - Patient login/creation redirect -> `/en/bezs/telemedicine/patient`
   - Admin login/creation redirect -> `/en/bezs/telemedicine/admin/organizations`
   - Clean URLs without secondary 307 hops
   - Header role and name display in DOM
   - Sidebar role and name display in DOM
   - Profile PostgreSQL persistence check
   - Dynamic profile fallback check
   - Dashboard rendering latency < 1000ms
   - Console error detection
   - Service port binding isolation (:4000, :8000, :8005, :5434, :5436, :6381)
2. Tier 2: Boundary & Corner Cases (>=5 test cases per feature):
   - Missing locale prefix, trailing slashes, unusual email formats, missing cookies, timeout races, rapid repeated logins, case sensitivity in role strings.
3. Tier 3: Cross-Feature Interactions:
   - Pairwise tests covering role switching, concurrent sessions, redirect preservation with original query params, profile refresh after role switch.
4. Tier 4: Real-World Scenarios:
   - 5 end-to-end workflows (Doctor onboarding, Patient telehealth check-in, Admin hospital setup, multi-role session switching, offline external IAM resilience).

When complete, write d:\Mindspace\TEST_READY.md matching the Project Pattern template, run your test runner against available endpoints or verify syntax and execution, deliver d:\Mindspace\.agents\teamwork\teamwork_test_writer_m1\handoff.md, and send_message to Orchestrator.

CONSTRAINTS:
- Under NO circumstances run `git push`.
- Maintain progress.md in your working directory with `Last visited: [timestamp]` header.
