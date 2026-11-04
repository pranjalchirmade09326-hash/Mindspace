# Milestone 4 Investigation Report: Console Diagnostics & Port Cleanliness

**Author**: `explorer_m4_3`  
**Date**: 2026-11-02  
**Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_explorer_m4_3\`  
**Target Milestone**: Milestone 4 — Sub-Second Performance & Console Diagnostics (Features 13 & 14)  
**Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

---

## 1. Observation

### Scope 1: Recharts SSR Hydration Warnings
1. **`frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/AppointmentTrendChart.tsx`**:
   - Lines 13–25: Declared as `"use client"` and directly imports `ResponsiveContainer`, `BarChart`, `CartesianGrid`, etc. from `"recharts"`.
   - Line 59:
     ```tsx
     <ResponsiveContainer width="100%" height="90%">
       <BarChart data={data} barSize={20}>
     ```
   - SSR Behavior: In Next.js App Router, `"use client"` components are pre-rendered on the server into HTML. `ResponsiveContainer` attempts to measure container dimensions via DOM APIs (`offsetWidth`, `clientHeight`, `ResizeObserver`). On the server, DOM measurements do not exist (`width: 0, height: 0`), triggering console warning: `The width(0) and height(0) of chart should be greater than 0...` and React hydration mismatch (#418) when SVG elements render on the client.
2. **`frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/AppointmentStatusChart.tsx`**:
   - Lines 15–18: Imports `ResponsiveContainer` directly from `"recharts"`.
   - Line 80:
     ```tsx
     <ResponsiveContainer width="100%" height="100%">
       <PieChart>
     ```
   - SSR Behavior: Unguarded `ResponsiveContainer` rendered inside `<div className="relative flex-1 min-h-0">`.
3. **`frontend/src/modules/client/telemedicine/patient/component/dashboard/AppointmentBarChart.tsx`**:
   - Lines 11–23: Imports `ResponsiveContainer` directly from `"recharts"`.
   - Line 57:
     ```tsx
     <ResponsiveContainer width="100%" height="90%">
       <BarChart data={data} barSize={20}>
     ```
   - SSR Behavior: Identical unguarded SSR render pattern.
4. **`frontend/src/modules/client/telemedicine/shared/components/vitals/VitalsInsights.tsx`**:
   - Lines 34–50: Direct import of `ResponsiveContainer` from `"recharts"`.
   - Line 167 (in `VitalTabPanel`):
     ```tsx
     <ResponsiveContainer width="100%" height="100%">
       <LineChart data={trend} ...>
     ```
   - Line 210 (in `BloodPressurePanel`):
     ```tsx
     <ResponsiveContainer width="100%" height="100%">
       <LineChart data={merged} ...>
     ```
   - SSR Behavior: Two separate subcomponents directly instantiate `ResponsiveContainer` without client mounting guards.

---

### Scope 2: MenuBar Client-Side Fetch Safety
1. **`frontend/src/modules/client/shared/components/menubar/MenuBar.tsx`**:
   - Lines 132–153:
     ```tsx
     const fetchContext = useCallback((orgId?: string | null) => {
       const base = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
       if (!base) {
         setAllApps([]);
         return Promise.resolve();
       }
       const controller = new AbortController();
       const timer = setTimeout(() => controller.abort(), 600);
       const url = orgId
         ? `${base}/api/me/context?organizationId=${orgId}`
         : `${base}/api/me/context`;

       return fetch(url, { credentials: "include", signal: controller.signal })
         .then((res) => res.json() as Promise<ContextResponse>)
         .then((data) => setAllApps(data.apps ?? []))
         .catch(() => setAllApps([]))
         .finally(() => clearTimeout(timer));
     }, []);

     useEffect(() => {
       fetchContext(user.activeOrganizationId).finally(() => setIsLoading(false));
     }, [fetchContext, user.activeOrganizationId]);
     ```
   - **Flaws directly observed**:
     - No HTTP status check (`res.ok`): If the IAM service returns 401, 404, or a 500 HTML error page, `fetch` resolves. Then `res.json()` fails with `SyntaxError: Unexpected token '<' in JSON`.
     - Missing unmount / cancellation cleanup: `useEffect` returns no cleanup function. If the component unmounts during the 600ms timeout or during network transit, `setAllApps` or `setIsLoading` are invoked on an unmounted component.
     - Race conditions: Multiple successive changes to `user.activeOrganizationId` will spawn overlapping concurrent fetches with no cancellation of previous controllers.

---

### Scope 3: Doctor Heading Name Split Bug
1. **`frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/DashboardOverview.tsx`**:
   - Lines 230–232:
     ```tsx
     <h1 className="text-2xl font-semibold">
       Practice Overview — Dr. {doctorName.split(" ")[0]}
     </h1>
     ```
2. **`frontend/src/app/[locale]/(apps)/bezs/telemedicine/doctor/dashboard/page.tsx`**:
   - Line 150:
     ```tsx
     const doctorName = getPractitionerDisplayName(practitioner.name) || "Dr. John Smith";
     ```
3. **`frontend/src/modules/client/telemedicine/shared/components/clinical/practitionerFormat.ts`**:
   - Lines 24–33:
     ```tsx
     export function getPractitionerDisplayName(name?: TPractitionerNameResponse[] | null): string {
       if (!name || name.length === 0) return "Doctor";
       const first = name[0];
       const parts = [...(first.given ?? []), first.family ?? ""].filter(Boolean);
       if (parts.length === 0) return first.text || "Doctor";
       const prefix = first.prefix?.[0] || "Dr.";
       return `${prefix} ${parts.join(" ")}`;
     }
     ```
   - **Direct Bug**: `doctorName` is already formatted as `"Dr. John Smith"`. Calling `doctorName.split(" ")[0]` extracts token `"Dr."`.
   - **Rendered Output**:
     `Practice Overview — Dr. Dr.`
   - In addition, if `doctorName` contains consecutive spaces (`"Dr.   John"`), `.split(" ")` extracts an empty token `""`. If `doctorName` is nullish, it crashes with `TypeError`.

---

### Scope 4: Port Cleanliness & Isolation
1. **`backend/fhir-gql/docker-compose.yml`**:
   - Lines 4–5:
     ```yaml
     ports:
       - "8000:8000"
     ```
   - **Direct Collision**: FHIR GraphQL is mapped to host port 8000, colliding directly with `backend/fhir-server/docker-compose.yml` line 9 (`"8000:8000"`). Host port must be 8005.
2. **`frontend/docker-compose.yml`**:
   - Lines 39–40:
     ```yaml
     ports:
       - "6379:6379"
     ```
   - **Conflict**: Frontend compose attempts to allocate default Redis on port 6379, while backend compose (`backend/docker-compose.yml` line 18) maps Redis to 6381.
3. **`frontend/.env.example`**:
   - Line 33: `FHIR_SERVER_URL=http://localhost:8001` (violates port 8000 standard).
   - Line 36: `FHIR_STAGING_SERVER_URL=http://localost8002/api/v1/staging-records` (typo: missing 'h' and ':').
   - Line 93: `# REDIS_URL=redis://localhost:6379` (diverges from canonical port 6381).
4. **`backend/fhir-server/docker-compose.dev.yml` & `backend/fhir-gql/docker-compose.dev.yml`**:
   - Default fallback environment variables (`POSTGRES_PORT:-5432`, `REDIS_PORT:-6379`) point to default ports 5432 and 6379 instead of dedicated ports 5436 and 6381.
5. **Windows Socket Status for Port 5434**:
   - Socket binding test on 127.0.0.1:
     - Ports 4000, 8000, 8005, 5436, 6381: `canBind: true` (clean).
     - Port 5434: `canBind: false, code: EADDRINUSE; connect: EACCES`.
     - In Windows, a background Docker container (`drgodly-postgres-dev`) or WSL2 network proxy holds a reservation on port 5434.

---

### Scope 5: E2E Test Suite Status (F10 & F11)
- Command: `node tests/e2e/runner.ts --feature=F10`
  - Result: **10/10 PASSED (100%)** in 70ms.
- Command: `node tests/e2e/runner.ts --feature=F11`
  - Result: **9/10 PASSED (90%)** in 42ms.
  - Failing test: `T1.F11.4 Frontend PostgreSQL target port 5434 isolation (EADDRINUSE socket on host)`.

---

## 2. Logic Chain

1. **Recharts Hydration Safety**:
   - *Premise*: Next.js App Router renders `"use client"` components on the server first.
   - *Observation*: `AppointmentTrendChart`, `AppointmentStatusChart`, `AppointmentBarChart`, and `VitalsInsights` render Recharts `ResponsiveContainer` on the server where container dimensions are 0.
   - *Inference*: Recharts generates console dimension warnings and React emits hydration mismatch error #418 when the client injects SVG geometries.
   - *Deduction*: Introducing an `isMounted` state via `useEffect(() => setIsMounted(true), [])` guarantees that server and client initial render output an identical placeholder div, completely eliminating SSR hydration warnings and React error #418.

2. **MenuBar Fetch Hardening**:
   - *Premise*: Browser console must maintain 0 unhandled runtime errors even when network dependencies are unavailable or slow.
   - *Observation*: `MenuBar.tsx` fetches without checking `res.ok`, and lacks unmount cancellation.
   - *Inference*: When BetterAuth returns HTML or is aborted, unhandled promise rejections or unmounted state updates can occur.
   - *Deduction*: Refactoring to an unmount-tracked `useEffect` with `isSubscribed` flag, `if (!res.ok) return { apps: [] }`, and AbortController cleanup ensures 100% console cleanliness.

3. **Doctor Heading Name Resolution**:
   - *Premise*: Doctor heading must render clean, professional practitioner name without title stutter.
   - *Observation*: `getPractitionerDisplayName()` formats names as `"Dr. <Given> <Family>"`. `DashboardOverview.tsx` line 231 prepends `"Dr. "` to `doctorName.split(" ")[0]`, yielding `"Dr. Dr."`.
   - *Inference*: `doctorName.split(" ")[0]` was written under the mistaken assumption that `doctorName` omitted the title.
   - *Deduction*: Stripping any leading `"Dr."` or `"Dr "` prefix via regex `/^dr\.?\s*/i` and tokenizing with `/\s+/` allows safe extraction of either the first name (e.g. `"Dr. John"`) or the full title-safe name (`"Dr. John Smith"`), resolving the `"Dr. Dr."` bug and handling multi-space strings safely.

4. **Port Binding Cleanliness**:
   - *Premise*: R4 mandates clean binding without port collisions across :4000, :8000, :8005, :5434, :5436, :6381.
   - *Observation*: `backend/fhir-gql/docker-compose.yml` maps port 8000:8000 instead of 8005:8000.
   - *Inference*: Running both backend compose stacks will trigger an immediate fatal Docker port allocation crash.
   - *Deduction*: Updating `fhir-gql` port mapping to `8005:8000` eliminates the collision.

---

## 3. Caveats

1. **Docker Daemon Access in Sandbox**: Docker CLI is not directly accessible within the sandboxed environment due to Windows named pipe permissions (`//./pipe/docker_engine`). Host port availability was verified via direct TCP socket probes (`net.createServer` and `net.Socket`).
2. **Port 5434 Host Reservation**: Port 5434 is currently reserved by an existing host process (or previous Docker container). When the backend developer launches Docker compose, starting `drgodly-postgres-dev` will allow `isPortListening(5434)` to return `true`.
3. **No Direct Code Changes**: In accordance with the Explorer archetype instructions, no source files were modified during this investigation.

---

## 4. Conclusion & Actionable Recommendations

### Recommendation 1: Recharts Client-Mount Guard
Apply an `isMounted` guard to all chart components:

#### A. `AppointmentTrendChart.tsx`
```tsx
// File: frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/AppointmentTrendChart.tsx
import { useState, useEffect } from "react";
...
export function AppointmentTrendChart({ data }: AppointmentTrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="rounded-xl p-4 h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-semibold">Appointment Volume</h2>
        <p className="text-xs text-muted-foreground">Last 6 months</p>
      </div>

      <div className="w-full h-[90%] min-h-[160px]">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={20}>
              ...
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </Card>
  );
}
```

#### B. `AppointmentStatusChart.tsx`
```tsx
// File: frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/AppointmentStatusChart.tsx
import { useState, useEffect } from "react";
...
export function AppointmentStatusChart({ counts }: AppointmentStatusChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  ...
  return (
    <Card className="p-4 h-full flex flex-col">
      ...
      <div className="relative flex-1 min-h-[180px]">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              ...
            </PieChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      ...
    </Card>
  );
}
```

#### C. `AppointmentBarChart.tsx`
```tsx
// File: frontend/src/modules/client/telemedicine/patient/component/dashboard/AppointmentBarChart.tsx
import { useState, useEffect } from "react";
...
export function AppointmentBarChart({ data }: AppointmentBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="rounded-xl p-4 h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-semibold">Appointments</h2>
      </div>

      <div className="w-full h-[90%] min-h-[160px]">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={20}>
              ...
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </Card>
  );
}
```

#### D. `VitalsInsights.tsx`
In `VitalTabPanel` and `BloodPressurePanel`:
```tsx
// File: frontend/src/modules/client/telemedicine/shared/components/vitals/VitalsInsights.tsx
import { useState, useEffect } from "react";
...
function VitalTabPanel({ label, unit, trend, strokeVar }: VitalTabPanelProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const latest = trend.at(-1);

  return (
    <div className="space-y-2">
      <p className="text-2xl font-semibold leading-none">
        {latest?.value ?? "—"}
        <span className="text-sm font-normal text-muted-foreground ml-1.5">{unit}</span>
      </p>
      <div className="h-44">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <ChartChrome />
              <Line ... />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
}
```
Apply the same pattern to `BloodPressurePanel`.

---

### Recommendation 2: MenuBar Defensive Fetch & Cleanup
Replace lines 132–154 in `frontend/src/modules/client/shared/components/menubar/MenuBar.tsx`:

```tsx
  useEffect(() => {
    let isSubscribed = true;
    const base = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    if (!base) {
      setAllApps([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 600);
    const orgId = user.activeOrganizationId;
    const url = orgId
      ? `${base}/api/me/context?organizationId=${orgId}`
      : `${base}/api/me/context`;

    fetch(url, { credentials: "include", signal: controller.signal })
      .then((res) => {
        if (!res.ok) return { apps: [] };
        return res.json() as Promise<ContextResponse>;
      })
      .then((data) => {
        if (isSubscribed) {
          setAllApps(data?.apps ?? []);
        }
      })
      .catch((err) => {
        if (isSubscribed && err?.name !== "AbortError") {
          setAllApps([]);
        }
      })
      .finally(() => {
        clearTimeout(timer);
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [user.activeOrganizationId]);
```

---

### Recommendation 3: Doctor Heading Name Resolution
In `frontend/src/modules/client/telemedicine/doctor/component/dashboard-overview/DashboardOverview.tsx`:

```tsx
  // Derive safe practitioner display name
  const doctorDisplayName = useMemo(() => {
    const raw = (doctorName ?? "").trim();
    if (!raw) return "Doctor";
    const withoutPrefix = raw.replace(/^dr\.?\s*/i, "").trim();
    const tokens = withoutPrefix.split(/\s+/).filter(Boolean);
    const firstName = tokens[0] || "Doctor";
    return `Dr. ${firstName}`;
  }, [doctorName]);
```

Update line 231:
```tsx
<<<< BEFORE (Line 230-232)
        <h1 className="text-2xl font-semibold">
          Practice Overview — Dr. {doctorName.split(" ")[0]}
        </h1>
==== AFTER
        <h1 className="text-2xl font-semibold">
          Practice Overview — {doctorDisplayName}
        </h1>
>>>>
```

---

### Recommendation 4: Port Collision Resolution
1. **`backend/fhir-gql/docker-compose.yml`**:
   Change line 5 from `"8000:8000"` to `"8005:8000"`.
2. **`frontend/docker-compose.yml`**:
   Remove or comment out unused Redis service on port `6379:6379`.
3. **`frontend/.env.example`**:
   - Change line 33 from `FHIR_SERVER_URL=http://localhost:8001` to `http://localhost:8000`.
   - Change line 36 from `http://localost8002/...` to `http://localhost:8002/...`.
   - Change line 93 from `redis://localhost:6379` to `redis://localhost:6381`.

---

## 5. Verification Method

To independently verify these findings and implementations:

1. **Test Suite Verification**:
   ```bash
   node tests/e2e/runner.ts --feature=F10
   node tests/e2e/runner.ts --feature=F11
   ```
   - Target criteria: 10/10 PASS on F10, 10/10 PASS on F11 once Postgres container is running.

2. **Hydration & Error Audit Verification**:
   ```bash
   node tests/e2e/runner.ts --filter=T1.F10.1,T1.F10.5,T2.F10.1,T2.F10.2,T2.F10.5
   ```
   - Verifies 0 React #418 errors, 0 runtime console errors, and multi-space name splitting safety.

3. **Port Socket Inspection**:
   ```bash
   node tests/e2e/runner.ts --filter=T1.F11.1,T1.F11.2,T1.F11.3,T1.F11.5,T2.F11.5
   ```
   - Verifies all 6 required services (:4000, :8000, :8005, :5434, :5436, :6381) bind cleanly without over-subscription.
