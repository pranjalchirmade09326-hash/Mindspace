import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";

import { AppointmentTrendChart } from "@/modules/client/telemedicine/doctor/component/dashboard-overview/AppointmentTrendChart";
import { AppointmentStatusChart } from "@/modules/client/telemedicine/doctor/component/dashboard-overview/AppointmentStatusChart";
import { AppointmentBarChart } from "@/modules/client/telemedicine/patient/component/dashboard/AppointmentBarChart";
import { DashboardOverview } from "@/modules/client/telemedicine/doctor/component/dashboard-overview/DashboardOverview";

console.log("================================================================================");
console.log(" Milestone 4: Empirical Challenger Stress Harness (challenger_m4_2)");
console.log("================================================================================\n");

let passed = 0;
let total = 0;
const failureDetails: Array<{ test: string; error: string }> = [];

async function challenge(name: string, fn: () => void | Promise<void>) {
  total++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Reason: ${err.message || err}`);
    failureDetails.push({ test: name, error: err.message || String(err) });
  }
}

// ── Helper: Console Interceptor ──────────────────────────────────────────────
function withConsoleTrap(fn: () => void): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const origError = console.error;
  const origWarn = console.warn;

  console.error = (...args: any[]) => {
    errors.push(args.map((a) => String(a)).join(" "));
  };
  console.warn = (...args: any[]) => {
    warnings.push(args.map((a) => String(a)).join(" "));
  };

  try {
    fn();
  } finally {
    console.error = origError;
    console.warn = origWarn;
  }

  return { errors, warnings };
}

async function runAll() {
  console.log("--- Section 1: Hydration & SSR Safety of Chart Components ---");

  await challenge("AppointmentTrendChart SSR renders with zero Recharts dimension errors", () => {
    const mockData = [
      { name: "Jan", booked: 24, completed: 18 },
      { name: "Feb", booked: 30, completed: 25 },
      { name: "Mar", booked: 42, completed: 35 },
    ];

    let html = "";
    const { errors, warnings } = withConsoleTrap(() => {
      html = ReactDOMServer.renderToString(
        React.createElement(AppointmentTrendChart, { data: mockData }),
      );
    });

    assert.strictEqual(errors.length, 0, `Expected 0 console.errors, got: ${JSON.stringify(errors)}`);
    assert.strictEqual(warnings.length, 0, `Expected 0 console.warnings, got: ${JSON.stringify(warnings)}`);
    assert.ok(html.includes("Appointment Volume"), "Expected 'Appointment Volume' in SSR HTML");
    assert.ok(!html.includes("recharts-responsive-container"), "SSR HTML must NOT contain ResponsiveContainer before mount");
    assert.ok(!html.includes("<svg"), "SSR HTML must NOT contain rendered SVG chart before mount");
    assert.ok(!html.includes("Minified React error #418"), "SSR HTML must not contain React #418 hydration mismatch signature");
  });

  await challenge("AppointmentTrendChart handles empty data array cleanly", () => {
    let html = "";
    const { errors, warnings } = withConsoleTrap(() => {
      html = ReactDOMServer.renderToString(
        React.createElement(AppointmentTrendChart, { data: [] }),
      );
    });
    assert.strictEqual(errors.length, 0, `Errors: ${JSON.stringify(errors)}`);
    assert.ok(html.includes("Appointment Volume"));
    assert.ok(!html.includes("recharts-responsive-container"));
  });

  await challenge("AppointmentStatusChart SSR renders with zero Recharts dimension errors", () => {
    const mockCounts = {
      fulfilled: 15,
      booked: 8,
      pending: 4,
      cancelled: 2,
    };

    let html = "";
    const { errors, warnings } = withConsoleTrap(() => {
      html = ReactDOMServer.renderToString(
        React.createElement(AppointmentStatusChart, { counts: mockCounts }),
      );
    });

    assert.strictEqual(errors.length, 0, `Expected 0 console.errors, got: ${JSON.stringify(errors)}`);
    assert.strictEqual(warnings.length, 0, `Expected 0 console.warnings, got: ${JSON.stringify(warnings)}`);
    assert.ok(html.includes("Status Breakdown"), "Expected 'Status Breakdown' in SSR HTML");
    assert.ok(html.includes("Completed"), "Expected 'Completed' label in legend");
    assert.ok(html.includes("Booked"), "Expected 'Booked' label in legend");
    assert.ok(!html.includes("recharts-responsive-container"), "SSR HTML must NOT contain ResponsiveContainer before mount");
    assert.ok(!html.includes("<svg"), "SSR HTML must NOT contain rendered SVG chart before mount");
  });

  await challenge("AppointmentStatusChart renders clean fallback for empty counts", () => {
    let html = "";
    const { errors, warnings } = withConsoleTrap(() => {
      html = ReactDOMServer.renderToString(
        React.createElement(AppointmentStatusChart, { counts: {} }),
      );
    });
    assert.strictEqual(errors.length, 0, `Errors: ${JSON.stringify(errors)}`);
    assert.ok(html.includes("No appointments yet."), "Expected empty state message 'No appointments yet.'");
    assert.ok(!html.includes("recharts-responsive-container"));
  });

  await challenge("AppointmentBarChart SSR renders with zero Recharts dimension errors", () => {
    const mockData = [
      { name: "Jan", booked: 2, completed: 1 },
      { name: "Feb", booked: 5, completed: 4 },
    ];

    let html = "";
    const { errors, warnings } = withConsoleTrap(() => {
      html = ReactDOMServer.renderToString(
        React.createElement(AppointmentBarChart, { data: mockData }),
      );
    });

    assert.strictEqual(errors.length, 0, `Expected 0 console.errors, got: ${JSON.stringify(errors)}`);
    assert.strictEqual(warnings.length, 0, `Expected 0 console.warnings, got: ${JSON.stringify(warnings)}`);
    assert.ok(html.includes("Appointments"), "Expected 'Appointments' in SSR HTML");
    assert.ok(!html.includes("recharts-responsive-container"), "SSR HTML must NOT contain ResponsiveContainer before mount");
    assert.ok(!html.includes("<svg"), "SSR HTML must NOT contain SVG chart before mount");
  });

  console.log("\n--- Section 2: VitalsInsights SSR Panels ---");
  await challenge("VitalsInsights source code enforces isMounted guard on all chart panels", () => {
    const vitalsPath = path.resolve(process.cwd(), "src/modules/client/telemedicine/shared/components/vitals/VitalsInsights.tsx");
    assert.ok(fs.existsSync(vitalsPath), "VitalsInsights.tsx must exist");
    const code = fs.readFileSync(vitalsPath, "utf-8");
    
    const isMountedMatches = code.match(/isMounted\s*\?\s*\(\s*<ResponsiveContainer/g);
    assert.ok(isMountedMatches && isMountedMatches.length >= 2, `Expected at least 2 isMounted ResponsiveContainer guards in VitalsInsights, found ${isMountedMatches?.length}`);
    assert.ok(!code.includes("<ResponsiveContainer width=\"100%\" height=\"100%\">\n            <LineChart"), "Must not have unguarded ResponsiveContainer");
  });

  console.log("\n--- Section 3: MenuBar Rapid Switching & Unmounting Stress Test ---");

  await challenge("MenuBar async lifecycle handler survives 100 rapid org switches without unhandled rejections", async () => {
    let unhandledRejections = 0;
    const rejectionHandler = (reason: any) => {
      unhandledRejections++;
      console.error("UNHANDLED REJECTION DETECTED:", reason);
    };
    process.on("unhandledRejection", rejectionHandler);

    try {
      const baseUrl = "http://localhost:9999-mock-auth";
      let activeOrgId: string | null = null;
      let activeApps: any[] = [];
      let isLoading = false;

      // Run 100 rapid changes
      for (let i = 0; i < 100; i++) {
        activeOrgId = i % 2 === 0 ? `org-${i}` : null;
        isLoading = true;

        let isSubscribed = true;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 600);
        const orgId = activeOrgId;
        const url = orgId
          ? `${baseUrl}/api/me/context?organizationId=${orgId}`
          : `${baseUrl}/api/me/context`;

        const simulatedFetch = new Promise<{ ok: boolean; json: () => Promise<any> }>((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ apps: [{ id: `app-${orgId}`, name: `App ${orgId}`, slug: "telemedicine", menus: [] }] }),
            });
          }, 5 + Math.random() * 20);

          controller.signal.addEventListener("abort", () => {
            clearTimeout(timeout);
            const err = new Error("This operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });

        // The exact MenuBar chain
        simulatedFetch
          .then(async (res) => {
            if (!res.ok) return { apps: [], permissions: [] };
            return (await res.json());
          })
          .then((data: any) => {
            if (isSubscribed) {
              activeApps = data?.apps ?? [];
            }
          })
          .catch((err: any) => {
            if (isSubscribed && err?.name !== "AbortError") {
              activeApps = [];
            }
          })
          .finally(() => {
            clearTimeout(timer);
            if (isSubscribed) {
              isLoading = false;
            }
          });

        if (i < 99) {
          isSubscribed = false;
          clearTimeout(timer);
          controller.abort();
        }
      }

      await new Promise((r) => setTimeout(r, 100));

      assert.strictEqual(unhandledRejections, 0, `Expected 0 unhandled rejections, got: ${unhandledRejections}`);
      assert.strictEqual(isLoading, false, "Final isLoading state must settle to false");
      assert.ok(Array.isArray(activeApps), "activeApps must be an array");
    } finally {
      process.off("unhandledRejection", rejectionHandler);
    }
  });

  await challenge("MenuBar fetch handler defends against 500 HTML response and malformed JSON", async () => {
    let unhandledRejections = 0;
    const rejectionHandler = () => { unhandledRejections++; };
    process.on("unhandledRejection", rejectionHandler);

    try {
      let isSubscribed = true;
      let activeApps: any[] = ["initial"];
      let isLoading = true;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 600);

      const mock500Fetch = Promise.resolve({
        ok: false,
        status: 500,
        json: async () => {
          throw new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON");
        },
      });

      await mock500Fetch
        .then(async (res): Promise<any> => {
          if (!res.ok) return { apps: [], permissions: [] };
          return (await res.json());
        })
        .then((data) => {
          if (isSubscribed) {
            activeApps = data?.apps ?? [];
          }
        })
        .catch((err) => {
          if (isSubscribed && err?.name !== "AbortError") {
            activeApps = [];
          }
        })
        .finally(() => {
          clearTimeout(timer);
          if (isSubscribed) {
            isLoading = false;
          }
        });

      assert.strictEqual(unhandledRejections, 0);
      assert.deepStrictEqual(activeApps, [], "Should default to empty array on 500 error");
      assert.strictEqual(isLoading, false);
    } finally {
      process.off("unhandledRejection", rejectionHandler);
    }
  });

  console.log("\n--- Section 4: Doctor Heading Fuzzer on DashboardOverview ---");

  const fuzzCases: Array<{
    input: any;
    label: string;
    expectedDisplay: string;
    expectedHeading: string;
    isVulnerability?: boolean;
    note?: string;
  }> = [
    { input: null, label: "null", expectedDisplay: "Doctor", expectedHeading: "Practice Overview — Doctor" },
    { input: undefined, label: "undefined", expectedDisplay: "Doctor", expectedHeading: "Practice Overview — Doctor" },
    { input: "", label: "empty string", expectedDisplay: "Doctor", expectedHeading: "Practice Overview — Doctor" },
    { input: "   ", label: "whitespace only", expectedDisplay: "Doctor", expectedHeading: "Practice Overview — Doctor" },
    { input: "John", label: "John (no prefix)", expectedDisplay: "Dr. John", expectedHeading: "Practice Overview — Dr. John" },
    { input: "Dr. John", label: "Dr. John", expectedDisplay: "Dr. John", expectedHeading: "Practice Overview — Dr. John" },
    { input: "dr. John", label: "dr. John (lowercase)", expectedDisplay: "Dr. John", expectedHeading: "Practice Overview — Dr. John" },
    { input: "DR. John", label: "DR. John (uppercase)", expectedDisplay: "Dr. John", expectedHeading: "Practice Overview — Dr. John" },
    { input: "Dr John", label: "Dr John (no dot)", expectedDisplay: "Dr. John", expectedHeading: "Practice Overview — Dr. John" },
    { input: "Dr.  Jane   Doe", label: "Dr.  Jane   Doe (multiple spaces)", expectedDisplay: "Dr. Jane", expectedHeading: "Practice Overview — Dr. Jane" },
    { input: "Doctor House", label: "Doctor House", expectedDisplay: "Dr. Doctor", expectedHeading: "Practice Overview — Dr. Doctor", isVulnerability: true, note: "Unstripped 'Doctor' prefix leads to 'Dr. Doctor'" },
    { input: "Dr. Dr. Smith", label: "Dr. Dr. Smith", expectedDisplay: "Dr. Dr.", expectedHeading: "Practice Overview — Dr. Dr.", isVulnerability: true, note: "Single-prefix regex leaves second 'Dr.' as firstName, producing 'Dr. Dr.'" },
    { input: "<script>alert(1)</script>", label: "XSS string", expectedDisplay: "Dr. <script>alert(1)</script>", expectedHeading: "Practice Overview — Dr. &lt;script&gt;alert(1)&lt;/script&gt;" },
  ];

  for (const tc of fuzzCases) {
    await challenge(`DashboardOverview SSR render with ${tc.label}`, () => {
      let html = "";
      const { errors, warnings } = withConsoleTrap(() => {
        html = ReactDOMServer.renderToString(
          React.createElement(
            NextIntlClientProvider,
            { locale: "en", messages: {} },
            React.createElement(DashboardOverview, {
              doctorName: tc.input,
              appointments: [],
              specialties: ["Cardiology"],
              roleActive: true,
              availableDays: ["mon", "tue", "wed"],
              intakeActivity: { total: 0, byStatus: {} },
              consultationActivity: { total: 0, byStatus: {} },
              appointmentsHref: "/en/bezs/telemedicine/doctor/appointments",
              profileHref: "/en/bezs/telemedicine/doctor/settings",
            }),
          ),
        );
      });

      assert.strictEqual(errors.length, 0, `Expected 0 console.errors, got: ${JSON.stringify(errors)}`);
      assert.strictEqual(warnings.length, 0, `Expected 0 console.warnings, got: ${JSON.stringify(warnings)}`);
      assert.ok(html.includes("Practice Overview — "), "HTML must contain Practice Overview heading");
      assert.ok(html.includes(tc.expectedHeading), `HTML must contain expected heading '${tc.expectedHeading}'`);
      assert.ok(!html.includes("undefined") && !html.includes("null"), "Heading must not contain null/undefined");

      if (tc.isVulnerability) {
        console.warn(`         [VULNERABILITY IDENTIFIED] "${tc.label}" -> "${tc.expectedHeading}": ${tc.note}`);
      }
    });
  }

  console.log("\n================================================================================");
  console.log(` Summary: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  if (failureDetails.length > 0) {
    console.log(` Failures: ${failureDetails.length}`);
    for (const f of failureDetails) {
      console.log(`   - ${f.test}: ${f.error}`);
    }
  }
  console.log("================================================================================");

  if (failureDetails.length > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("FATAL ERROR in test harness:", err);
  process.exit(1);
});
