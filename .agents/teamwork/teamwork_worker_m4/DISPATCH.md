# Task Assignment: Worker Milestone 4 (Sub-Second Performance & Console Diagnostics)

## Role and Identity
- **Agent Type**: `teamwork_worker`
- **Assigned Identity**: `worker_m4`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_worker_m4\`
- **Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

## Mandatory Context Files (Read FIRST)
1. `d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user requirements)
2. `d:\Mindspace\PROJECT.md` (Global architecture, contracts, and layout)
3. `d:\Mindspace\TEST_READY.md` (E2E test suite definition)
4. `d:\Mindspace\.agents\teamwork\teamwork_explorer_m4_1\handoff.md` (Fast session & organization service timeout analysis)
5. `d:\Mindspace\.agents\teamwork\teamwork_explorer_m4_2\handoff.md` (Dashboard streaming & 5 loading.tsx specifications)
6. `d:\Mindspace\.agents\teamwork\teamwork_explorer_m4_3\handoff.md` (Console error diagnostics & port isolation fixes)

## Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Non-Negotiable Git Constraint
> Under no circumstances run `git push`. All changes must remain strictly local until explicitly commanded by the user.

## Implementation Tasks (Exclusive Write Ownership)

### 1. Fast Session Resolution & Timeout Cleanup
- File: `frontend/src/modules/server/auth/get-session.ts`
- Action:
  - Keep `getServerSession = cache(...)`.
  - Reduce probe timeout to `200` ms (`setTimeout(() => controller.abort(), 200)`).
  - Wrap fetch in `try ... finally { clearTimeout(timeout); }` to eliminate Node.js event loop timer leaks.

### 2. Organization Service Bounded Timeout
- File: `frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts`
- Action:
  - In constructor, update `timeout: 10_000` to `timeout: 1500` (bounded <= 2000ms).
  - In `handleError`, add check for `error.code === "ECONNABORTED" || error.message?.includes("timeout")` and throw `BadGatewayError("fhir-gql request timed out after 1500ms")`.

### 3. Dashboard Streaming & Suspense Boundaries (5 loading.tsx Skeletons)
- Implement exactly as specified in Explorer 2 handoff report:
  1. `frontend/src/app/[locale]/(apps)/bezs/telemedicine/doctor/loading.tsx` (resolves test `T2.F9.5`)
  2. `frontend/src/app/[locale]/(apps)/bezs/telemedicine/doctor/dashboard/loading.tsx` (re-exports `../loading`)
  3. `frontend/src/app/[locale]/(apps)/bezs/telemedicine/patient/loading.tsx` (12-column grid matching PatientDashboard)
  4. `frontend/src/app/[locale]/(apps)/bezs/telemedicine/admin/(resources)/organizations/loading.tsx` (DataTableSkeleton 6 cols, 8 rows)
  5. `frontend/src/app/[locale]/(apps)/bezs/telemedicine/admin/loading.tsx` (re-exports `organizations/loading`)

### 4. Recharts SSR Hydration Guards
- Files:
  - `frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/AppointmentTrendChart.tsx`
  - `frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/AppointmentStatusChart.tsx`
  - `frontend/src/modules/client/telemedicine/patient/component/dashboard/AppointmentBarChart.tsx`
  - `frontend/src/modules/client/telemedicine/shared/components/vitals/VitalsInsights.tsx` (`VitalTabPanel` and `BloodPressurePanel`)
- Action:
  - Add client mounting state (`const [isMounted, setIsMounted] = useState(false); useEffect(() => setIsMounted(true), []);`).
  - Render `ResponsiveContainer` only when `isMounted === true`.

### 5. MenuBar Fetch Cancellation & Status Check
- File: `frontend/src/modules/client/shared/components/menubar/MenuBar.tsx`
- Action:
  - Refactor lines 132–154 to add `isSubscribed` flag in `useEffect`, check `if (!res.ok) return { apps: [] }`, and return cleanup function `() => { isSubscribed = false; clearTimeout(timer); controller.abort(); }`.

### 6. Doctor Heading Name Split Fix
- File: `frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/DashboardOverview.tsx`
- Action:
  - Fix title to avoid `"Practice Overview — Dr. Dr."`: derive `doctorDisplayName` by stripping any leading `"Dr."` or `"Dr "` prefix from `doctorName` and extracting first name cleanly (or "Doctor"). Render `Practice Overview — {doctorDisplayName}`.

### 7. Port Configuration Isolation
- File: `backend/fhir-gql/docker-compose.yml` -> Change line 5 from `"8000:8000"` to `"8005:8000"`.
- File: `frontend/.env.example` -> Fix port 8000 on line 33, fix typo on line 36, fix Redis 6381 on line 93.

## Verification Requirements
Worker must run and document passing results for:
1. `node tests/e2e/runner.ts --feature=F9` (All 10 tests must PASS, specifically verifying `T2.F9.5` passes)
2. `node tests/e2e/runner.ts --feature=F10` (All 10 tests must PASS)
3. `node tests/e2e/runner.ts --feature=F11`
4. `node tests/e2e/runner.ts --syntax-only` (125/125 PASSED)
5. `git status` (verify no unowned files or git push)

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_worker_m4\handoff.md`) following the Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
- Notify orchestrator via `send_message` with your report path.


## 2026-11-02T17:37:47Z
[Message] timestamp=2026-11-02T17:37:47Z sender=9c79083f-30f1-4b3f-83d0-f404b182ce44 priority=MESSAGE_PRIORITY_HIGH content=You are worker_m4. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_worker_m4\. Read d:\Mindspace\.agents\teamwork\teamwork_worker_m4\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Under no circumstances run `git push`. All changes must remain strictly local until explicitly commanded by the user.

Implement all Milestone 4 tasks (get-session timeout & cache, organization service timeout <= 2000ms, 5 loading.tsx skeletons, Recharts hydration guards, MenuBar fetch safety, doctor heading name split fix, and port configuration cleanup). Run and document passing results for `node tests/e2e/runner.ts --feature=F9`, `node tests/e2e/runner.ts --feature=F10`, `node tests/e2e/runner.ts --feature=F11`, and `node tests/e2e/runner.ts --syntax-only`. Write your handoff.md and notify the parent orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message.
