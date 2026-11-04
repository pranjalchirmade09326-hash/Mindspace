# Handoff Report: Milestone 4 — Fast Session & Service Timeouts

**Author**: `explorer_m4_1` (`teamwork_explorer`)  
**Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_explorer_m4_1\`  
**Target Milestone**: Milestone 4 (Sub-Second Performance & Console Diagnostics)  
**Assigned Scope**: Investigation of `frontend/src/modules/server/auth/get-session.ts` (React.cache memoization, external probe timeout <= 250ms) and `frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts` (Axios timeout <= 2000ms, fallback handling).

---

## 1. Observation

### 1.1 `frontend/src/modules/server/auth/get-session.ts`
- **Line 2**: `import { cache } from "react";`
- **Line 80**:
  ```typescript
  export const getServerSession = cache(async function getServerSession(): Promise<AuthResponse | null> {
    // 1. Check local session cookie first (for local dev mode)
    try {
      const cookieStore = await cookies();
      const devCookie = cookieStore.get("drgodly_session");
      if (devCookie?.value) {
        const raw = devCookie.value.startsWith("%")
          ? decodeURIComponent(devCookie.value)
          : devCookie.value;
        return JSON.parse(raw) as AuthResponse;
      }
    } catch {
      // Continue to external check
    }

    // 2. Fall back to external BetterAuth if configured and reachable
    try {
      const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
      if (authUrl && authUrl.startsWith("http")) {
        const hdrs = await headers();
        const cookie = hdrs.get("cookie") || "";

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 250);

        const res = await fetch(`${authUrl}/api/auth/get-session`, {
          headers: { cookie },
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          return await res.json();
        }
      }
    } catch {
      // Continue
    }

    // 3. If no session cookie or active BetterAuth session, return null so unauthenticated users see Sign In / Sign Up
    return null;
  });
  ```
- **Observations on `get-session.ts`**:
  1. `React.cache()` wrapping is already in place around `getServerSession`, fulfilling Feature 10 in `PROJECT.md` and satisfying `T2.F9.3`.
  2. External probe timeout on line 103 is `250` ms (`setTimeout(() => controller.abort(), 250)`).
  3. **Event Loop Timer Leak**: If `fetch()` rejects before line 110 (e.g. `ECONNREFUSED`, DNS failure, or network abort), execution jumps directly to `catch` on line 116. `clearTimeout(timeout)` on line 110 is skipped, leaving an active timer in the Node.js event loop until 250ms elapses.
  4. **Cookie Resolution**: Local `drgodly_session` cookie is parsed first in < 1ms. If valid JSON is present, external network fetch is bypassed completely.
  5. **`getDevSession`**: Defined on lines 5–78, returning mock `AuthResponse` objects with role-specific IDs (`usr-doctor-01`, `usr-admin-01`, `usr-patient-01`) and sanitized redirect URLs (`/bezs/telemedicine/doctor/dashboard`, `/bezs/telemedicine/admin/organizations`, `/bezs/telemedicine/patient`). It is invoked by `layout.tsx` in non-production environments when `getServerSession()` returns `null`.

---

### 1.2 `frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts`
- **Lines 50–60**:
  ```typescript
  constructor() {
    const url = process.env.FHIR_GQL_URL;
    if (!url) throw new Error("FHIR_GQL_URL is not configured");

    this.client = axios.create({
      baseURL: `${url}/organizations`,
      headers: { "Content-Type": "application/json" },
      // 10 s timeout — aligns with the fhir-gql service's own FHIR client default.
      timeout: 10_000,
    });
  ```
- **Observations on `organization.rest.service.ts`**:
  1. **Line 58 sets `timeout: 10_000` (10 seconds)**.
  2. If the upstream service (`fhir-gql` on port 8005) hangs or becomes unresponsive, any server component that fetches organizations (such as `OrganizationsPage` at `/admin/organizations`) will block SSR rendering for up to 10 seconds.
  3. This directly violates the project latency SLA: *Dashboard pages and transitions render in under 1 second (< 1s)* (R2 in `ORIGINAL_REQUEST.md`, Feature 12 in `PROJECT.md`).
  4. In `handleError` (lines 72–109), when an Axios timeout occurs (`ECONNABORTED` with no `error.response`), `switch (error.response?.status)` defaults to:
     ```typescript
     throw new BadGatewayError(
       `fhir-gql error ${error.response?.status ?? "unknown"}: ${message}`,
     );
     ```
  5. In `OrganizationsPage` (`frontend/src/app/[locale]/(apps)/bezs/telemedicine/admin/(resources)/organizations/page.tsx` lines 28–40):
     ```typescript
     const [data] = await listOrganizationsAction({
       payload: {
         limit: 20,
         offset: 0,
         org_id: orgId ?? undefined,
       },
     });
     const initialData = data ?? { total: 0, limit: 20, offset: 0, data: [] };
     ```
     `listOrganizationsAction` returns a tuple `[data, err]` via `runWithTransport` and `mapErrorToZSA`. When `BadGatewayError` is thrown, `data` is `null`, and `OrganizationsPage` safely falls back to `{ total: 0, limit: 20, offset: 0, data: [] }`. The page does not crash, but the 10-second hang delays rendering.

---

### 1.3 Test Suite Inventory & Test Path Defect
- **`tests/e2e/suites/tier1-features.ts` (lines 1150–1180, Test `T1.F9.5`)**:
  ```typescript
  {
    id: "T1.F9.5",
    tier: 1,
    featureId: "F9",
    featureName: "Dashboard Rendering Latency < 1000ms",
    title: "BetterAuth probe timeout bound in get-session.ts",
    description: "External auth fetch timeout in get-session.ts must not exceed 250ms (survey found 1200ms defect)",
    run: async (): Promise<TestAssertionResult> => {
      const filePath = path.resolve(
        process.cwd(),
        "frontend/src/modules/server/auth/get-session.ts",
      );
      let passed = false;
      let actual = "File not found";
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const match = content.match(/setTimeout\([^,]+,\s*(\d+)\)/);
        if (match) {
          const timeoutMs = Number(match[1]);
          passed = timeoutMs <= 250;
          actual = `${timeoutMs}ms`;
        }
      }
      return { passed, expected: "<= 250ms", actual, ... };
    },
  }
  ```
  - Result: Currently **PASSES** because `250 <= 250`. Notice that the test requires a regex match on `/setTimeout\([^,]+,\s*(\d+)\)/`.

- **`tests/e2e/suites/tier2-boundaries.ts` (lines 1085–1112, Test `T2.F9.3`)**:
  ```typescript
  {
    id: "T2.F9.3",
    title: "React.cache memoization in getServerSession check",
    run: async (): Promise<TestAssertionResult> => {
      const filePath = path.resolve(
        process.cwd(),
        "frontend/src/modules/server/auth/get-session.ts",
      );
      let passed = false;
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        passed = content.includes("React.cache") || content.includes("cache(");
      }
      ...
    }
  }
  ```
  - Result: Currently **PASSES** because `cache` is imported from `"react"` and used to wrap `getServerSession`.

- **`tests/e2e/suites/tier2-boundaries.ts` (lines 1114–1145, Test `T2.F9.4`)**:
  ```typescript
  {
    id: "T2.F9.4",
    title: "Organization service timeout bound in organization.rest.service.ts",
    description: "Axios timeout in organization.rest.service.ts must be bounded (<= 2000ms)",
    run: async (): Promise<TestAssertionResult> => {
      const filePath = path.resolve(
        process.cwd(),
        "frontend/src/modules/server/presentation/services/rest/organization.rest.service.ts",
      );
      let passed = true;
      let actual = "Not found or safe";
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const match = content.match(/timeout:\s*(\d+)/);
        if (match) {
          const timeout = Number(match[1]);
          passed = timeout <= 2000;
          actual = `${timeout}ms`;
        }
      }
      return { passed, expected: "Timeout <= 2000ms", actual, ... };
    }
  }
  ```
  - **CRITICAL DEFECT DETECTED IN TEST SUITE**:
    Line 1124 checks `frontend/src/modules/server/presentation/services/rest/organization.rest.service.ts`.
    The actual file in the repository is at `frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts`.
    Because `fs.existsSync(filePath)` evaluated to `false`, the test returned `passed = true` with `actual = "Not found or safe"`.
    This masked the fact that `organization.rest.service.ts` still has `timeout: 10_000`!

- **Current Test Execution (`node tests/e2e/runner.ts --filter=F9`)**:
  ```
   ✓ PASS [T1.F9.1] Doctor dashboard HTTP render latency < 1000ms (2ms)
   ✓ PASS [T1.F9.2] Patient portal HTTP render latency < 1000ms (2ms)
   ✓ PASS [T1.F9.3] Admin organizations HTTP render latency < 1000ms (2ms)
   ✓ PASS [T1.F9.4] End-to-end dev-login transition latency < 1000ms (2ms)
   ✓ PASS [T1.F9.5] BetterAuth probe timeout bound in get-session.ts (1ms)
   ✓ PASS [T2.F9.1] Latency under large session cookie payload (4KB) (2ms)
   ✓ PASS [T2.F9.2] Consecutive requests average latency benchmark (p50 < 500ms) (1ms)
   ✓ PASS [T2.F9.3] React.cache memoization in getServerSession check (0ms)
   ✓ PASS [T2.F9.4] Organization service timeout bound in organization.rest.service.ts (0ms)
   ✗ FAIL [T2.F9.5] Dashboard loading suspense boundary audit (0ms)
  ```

---

## 2. Logic Chain

1. **Step 1 (Session Memoization Impact)**:
   - In Next.js App Router, a single request to a route like `/admin/organizations` traverses multiple server component files:
     `(apps)/layout.tsx` -> `telemedicine/admin/layout.tsx` -> `admin/organizations/page.tsx` -> `organization.actions.ts`.
   - Without memoization, each component would independently read cookies or trigger network requests.
   - Wrapping `getServerSession` in React's `cache()` ensures that the initial promise is deduplicated and shared across the entire React component subtree for that HTTP request.
   - Since `getServerSession` accepts zero parameters, all invocations within a single render cycle resolve against the same cache key in < 1ms.

2. **Step 2 (External IAM Probe Timeout Budget)**:
   - When an unauthenticated visitor accesses the application without a `drgodly_session` cookie, `getServerSession` probes `NEXT_PUBLIC_BETTER_AUTH_URL`.
   - The overall sub-second render budget is 1000ms. If the external probe took 1200ms (as surveyed in earlier versions), the page would fail the SLA.
   - Bounding the probe to `<= 250ms` (specifically recommending `200ms`) reserves at least 750–800ms for database queries, layouts, and page streaming.
   - The `T1.F9.5` test asserts `/setTimeout\([^,]+,\s*(\d+)\)/` <= 250ms.
   - Wrapping the fetch with `try ... finally { clearTimeout(timeout); }` is required to prevent unhandled timer handles from delaying Node event loop termination.

3. **Step 3 (Axios Timeout in Organization Service)**:
   - `OrganizationRestApiService` instantiates Axios with `timeout: 10_000` (line 58).
   - In `OrganizationsPage`, `listOrganizationsAction` is awaited directly in the server component during SSR.
   - If `fhir-gql` (:8005) hangs or drops packets, Axios waits for 10 seconds before throwing an error.
   - Consequently, the browser experiences a 10+ second blank screen/TTFB before any fallback or error page renders.
   - Setting `timeout: 1500` (or `1000`) guarantees that if `fhir-gql` fails to respond within 1.5s, Axios immediately throws an `ECONNABORTED` error.

4. **Step 4 (Graceful Fallback Mechanics)**:
   - When Axios throws on timeout, `handleError(error)` maps the `AxiosError` (where `error.response` is undefined) to `BadGatewayError`.
   - The action runner `runWithTransport` catches this and lets `mapErrorToZSA` convert it to a safe action error tuple `[null, error]`.
   - In `OrganizationsPage`:
     `const initialData = data ?? { total: 0, limit: 20, offset: 0, data: [] };`
     Because `data` is `null`, `initialData` defaults to an empty list `{ total: 0, limit: 20, offset: 0, data: [] }`.
     The page renders cleanly with an empty table rather than throwing an unhandled 500 error.
   - Therefore, reducing the timeout to 1500ms prevents page hangs while fully preserving graceful degradation.

5. **Step 5 (Resolution of Test Path Discrepancy)**:
   - In `tests/e2e/suites/tier2-boundaries.ts`, `T2.F9.4` points to `frontend/src/modules/server/presentation/services/rest/organization.rest.service.ts`.
   - Because the file is located at `frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts`, `T2.F9.4` had a false-positive pass.
   - To make the test genuinely verify the timeout, either:
     a) Update `T2.F9.4` to check `core/organization/infrastructure/services/organization.rest.service.ts` (with fallback to presentation); OR
     b) Add a proxy/re-export file at `frontend/src/modules/server/presentation/services/rest/organization.rest.service.ts` containing the bounded timeout.

---

## 3. Caveats

1. **Dashboard Streaming & Suspense (`loading.tsx`)**:
   - `T2.F9.5` is currently failing because `frontend/src/app/[locale]/(apps)/bezs/telemedicine/doctor/loading.tsx` is not yet created. This is within Milestone 4 scope but assigned to other explorer/worker streams.
2. **Other REST Services**:
   - Other domain REST services (e.g. `healthcare-service.rest.service.ts`, `schedule.rest.service.ts`, `location.rest.service.ts`) also currently specify `timeout: 10_000`. The current assignment specifically targets `organization.rest.service.ts` (Feature 12). If other admin pages exhibit latency, their timeouts should similarly be bounded to `<= 2000ms`.
3. **Offline Environment**:
   - During offline testing, backend servers on ports 8000/8005/5436 were not active; tests were executed against static code ASTs, regex patterns, and synthetic test responses.

---

## 4. Conclusion & Proposed Code Changes

### 4.1 Proposal for `frontend/src/modules/server/auth/get-session.ts`
**Goal**: Lower timeout to 200ms (safe buffer < 250ms) and eliminate timer leak with `try ... finally`.

```diff
--- a/frontend/src/modules/server/auth/get-session.ts
+++ b/frontend/src/modules/server/auth/get-session.ts
@@ -100,16 +100,19 @@ export const getServerSession = cache(async function getServerSession(): Promise
       const hdrs = await headers();
       const cookie = hdrs.get("cookie") || "";
 
       const controller = new AbortController();
-      const timeout = setTimeout(() => controller.abort(), 250);
+      const timeout = setTimeout(() => controller.abort(), 200);
 
-      const res = await fetch(`${authUrl}/api/auth/get-session`, {
-        headers: { cookie },
-        cache: "no-store",
-        signal: controller.signal,
-      });
-      clearTimeout(timeout);
+      try {
+        const res = await fetch(`${authUrl}/api/auth/get-session`, {
+          headers: { cookie },
+          cache: "no-store",
+          signal: controller.signal,
+        });
+        if (res.ok) {
+          return await res.json();
+        }
+      } finally {
+        clearTimeout(timeout);
+      }
     }
   } catch {
     // Continue
```

### 4.2 Proposal for `frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts`
**Goal**: Reduce Axios timeout from 10_000ms to 1500ms (bounded <= 2000ms) and enhance timeout diagnostic logging.

```diff
--- a/frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts
+++ b/frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts
@@ -55,6 +55,6 @@ export class OrganizationRestApiService implements IOrganizationsService {
     this.client = axios.create({
       baseURL: `${url}/organizations`,
       headers: { "Content-Type": "application/json" },
-      // 10 s timeout — aligns with the fhir-gql service's own FHIR client default.
-      timeout: 10_000,
+      // Bounded timeout (1500ms <= 2000ms) to prevent page hangs on fhir-gql delays
+      timeout: 1500,
     });
@@ -87,6 +87,10 @@ export class OrganizationRestApiService implements IOrganizationsService {
       typeof body?.detail === "string"
         ? body.detail
         : (error.response?.statusText ?? error.message);
 
+    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
+      throw new BadGatewayError("fhir-gql request timed out after 1500ms");
+    }
+
     switch (error.response?.status) {
```

### 4.3 Proposal for `tests/e2e/suites/tier2-boundaries.ts` (Test `T2.F9.4`)
**Goal**: Check the genuine file path while preserving backward compatibility with legacy paths.

```diff
--- a/tests/e2e/suites/tier2-boundaries.ts
+++ b/tests/e2e/suites/tier2-boundaries.ts
@@ -1122,8 +1122,12 @@ export const tier2Tests: TestCase[] = [
     run: async (): Promise<TestAssertionResult> => {
       const start = performance.now();
-      const filePath = path.resolve(
+      const primaryPath = path.resolve(
+        process.cwd(),
+        "frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts",
+      );
+      const legacyPath = path.resolve(
         process.cwd(),
         "frontend/src/modules/server/presentation/services/rest/organization.rest.service.ts",
       );
+      const filePath = fs.existsSync(primaryPath) ? primaryPath : legacyPath;
       let passed = true;
```

---

## 5. Verification Method

To independently verify these findings and proposed changes:

1. **Verify regex compliance and timeout bounds**:
   ```powershell
   node tests/e2e/runner.ts --filter=F9
   ```
   - Expect: `T1.F9.5` PASS (`<= 250ms`).
   - Expect: `T2.F9.3` PASS (`React.cache memoization present`).
   - Expect: `T2.F9.4` PASS (`1500ms` <= 2000ms).

2. **Verify syntax and compilation (dry-run)**:
   ```powershell
   node tests/e2e/runner.ts --syntax-only
   ```
   - Expect: `125 / 125 PASSED (100%)`.

3. **Verify AST and file checks directly**:
   ```powershell
   Select-String -Path "frontend/src/modules/server/auth/get-session.ts" -Pattern "cache\(|setTimeout"
   Select-String -Path "frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts" -Pattern "timeout:"
   ```

4. **Invalidation Conditions**:
   - If `get-session.ts` replaces `setTimeout` with `AbortSignal.timeout(200)`, `T1.F9.5`'s regex (`/setTimeout\([^,]+,\s*(\d+)\)/`) will fail. The regex in `tier1-features.ts` must either be updated or `setTimeout` retained.
   - If `organization.rest.service.ts` timeout is set > 2000ms, `T2.F9.4` will fail.
