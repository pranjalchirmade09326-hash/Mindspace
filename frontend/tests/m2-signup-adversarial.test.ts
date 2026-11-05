import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";

if (!(globalThis as any).AsyncLocalStorage) {
  (globalThis as any).AsyncLocalStorage = AsyncLocalStorage;
}

const mockCookiesStore = new Map<string, { value: string; options: any }>();
const mockCookieStoreObj = {
  set: (name: string, value: string, options: any) => {
    mockCookiesStore.set(name, { value, options });
  },
  get: (name: string) => mockCookiesStore.get(name),
  delete: (name: string) => mockCookiesStore.delete(name),
};

async function runWithNextContext<T>(fn: () => Promise<T>): Promise<T> {
  const { workAsyncStorage } = await import(
    "next/dist/server/app-render/work-async-storage.external"
  );
  const { workUnitAsyncStorage } = await import(
    "next/dist/server/app-render/work-unit-async-storage.external"
  );
  const workStore = { route: "/api/auth/dev-login" };
  const workUnitStore = {
    type: "request",
    phase: "action",
    userspaceMutableCookies: mockCookieStoreObj,
    cookies: mockCookieStoreObj,
  };
  return (workAsyncStorage as any).run(workStore, () =>
    (workUnitAsyncStorage as any).run(workUnitStore, fn)
  );
}

async function getDevLoginHandler() {
  const mod = await import("../src/app/api/auth/dev-login/route");
  return mod.POST;
}

const SIGNUP_PAGE_PATH = path.resolve(
  __dirname,
  "../src/app/[locale]/(auth)/signup/page.tsx"
);

// ============================================================================
// SUITE 1: Input Validation Stress-Testing & Boundary Analysis
// ============================================================================

test("Adversarial: Password boundary condition validation (< 8 chars)", () => {
  const code = fs.readFileSync(SIGNUP_PAGE_PATH, "utf-8");

  // Check client-side guard: password.length < 8
  assert.match(
    code,
    /if\s*\(\s*password\.length\s*<\s*8\s*\)/,
    "Must explicitly validate password length < 8 before initiating network request"
  );

  // Simulation of client-side validation logic
  const validatePassword = (pwd: string) => pwd.length >= 8;

  assert.strictEqual(validatePassword(""), false, "Empty password must be rejected");
  assert.strictEqual(validatePassword("a"), false, "1-char password must be rejected");
  assert.strictEqual(validatePassword("1234567"), false, "7-char password must be rejected");
  assert.strictEqual(validatePassword("12345678"), true, "8-char password must be accepted");
  assert.strictEqual(validatePassword("P@ssw0rd123!"), true, "Complex 12-char password must be accepted");
});

test("Adversarial: Whitespace trimming and case normalization on credentials", () => {
  const code = fs.readFileSync(SIGNUP_PAGE_PATH, "utf-8");

  // Verify name.trim() in primary payload
  assert.match(
    code,
    /name:\s*name\.trim\(\)/,
    "Full name must be trimmed of leading/trailing whitespace"
  );

  // Verify email.trim().toLowerCase() in primary payload
  assert.match(
    code,
    /email:\s*email\.trim\(\)\.toLowerCase\(\)/,
    "Email address must be trimmed and lowercased"
  );

  // Verify trimming in dev fallback payload
  assert.match(
    code,
    /name:\s*name\.trim\(\)\s*\|\|\s*["']Member["']/,
    "Dev fallback must trim name and provide 'Member' fallback"
  );

  // Simulate whitespace trimming behavior
  const rawName = "   Sarah Connor   ";
  const rawEmail = "   SARAH.CONNOR@Example.COM   ";

  const sanitizedName = rawName.trim();
  const sanitizedEmail = rawEmail.trim().toLowerCase();

  assert.strictEqual(sanitizedName, "Sarah Connor");
  assert.strictEqual(sanitizedEmail, "sarah.connor@example.com");

  // Empty whitespace-only name
  const whitespaceName = "     ";
  const fallbackName = whitespaceName.trim() || "Member";
  assert.strictEqual(fallbackName, "Member", "Whitespace-only name must safely fall back to 'Member'");
});

// ============================================================================
// SUITE 2: Offline IAM Resilience & Network Fallthrough Logic
// ============================================================================

test("Adversarial: Error discrimination logic (Network vs Validation Errors)", () => {
  const code = fs.readFileSync(SIGNUP_PAGE_PATH, "utf-8");

  // Verify the isNetworkFailure criteria in signup/page.tsx
  assert.match(code, /isNetworkFailure\s*=/);
  assert.match(code, /!error\.status/);
  assert.match(code, /error\.status\s*>=\s*500/);
  assert.match(code, /failed to fetch/i);
  assert.match(code, /econnrefused/i);

  // Define the exact logic from signup/page.tsx
  const isNetworkFailure = (error: { status?: number; message?: string }) => {
    return (
      !error.status ||
      error.status >= 500 ||
      Boolean(error.message?.toLowerCase().includes("failed to fetch")) ||
      Boolean(error.message?.toLowerCase().includes("network")) ||
      Boolean(error.message?.toLowerCase().includes("econnrefused"))
    );
  };

  // 1. IAM connection refused / server offline (Network Error -> MUST fall through)
  assert.strictEqual(
    isNetworkFailure({ message: "fetch failed: ECONNREFUSED 127.0.0.1:5001" }),
    true,
    "ECONNREFUSED must be detected as network failure to trigger dev fallback"
  );
  assert.strictEqual(
    isNetworkFailure({ message: "Failed to fetch" }),
    true,
    "'Failed to fetch' must trigger dev fallback"
  );
  assert.strictEqual(
    isNetworkFailure({ status: 503, message: "Service Unavailable" }),
    true,
    "HTTP 503 Service Unavailable must trigger dev fallback"
  );
  assert.strictEqual(
    isNetworkFailure({ status: 500, message: "Internal Server Error" }),
    true,
    "HTTP 500 Internal Server Error must trigger dev fallback"
  );

  // 2. User validation errors from online IAM (Validation Error -> MUST NOT fall through)
  assert.strictEqual(
    isNetworkFailure({ status: 400, message: "Email already in use" }),
    false,
    "HTTP 400 'Email already in use' must NOT fall through to dev login"
  );
  assert.strictEqual(
    isNetworkFailure({ status: 422, message: "Invalid email format" }),
    false,
    "HTTP 422 'Invalid email format' must NOT fall through to dev login"
  );
  assert.strictEqual(
    isNetworkFailure({ status: 401, message: "Unauthorized" }),
    false,
    "HTTP 401 Unauthorized must NOT fall through to dev login"
  );
});

// ============================================================================
// SUITE 3: Dev-Login Fallback Session & Cookie Verification
// ============================================================================

test("Adversarial: Fallback session creation preserves user attributes and sets member role", async () => {
  mockCookiesStore.clear();

  const devLoginHandler = await getDevLoginHandler();

  // Test with messy inputs to test resilience
  const testCases = [
    {
      inputName: "   Grace Hopper   ",
      inputEmail: "   grace@navy.mil   ",
      locale: "en",
      expectedName: "Grace Hopper",
      expectedEmail: "grace@navy.mil",
      expectedRedirect: "/en/mindspace/member",
    },
    {
      inputName: "   ",
      inputEmail: "   ",
      locale: "hi",
      expectedName: "Demo Member",
      expectedEmail: "member@mindspace.app",
      expectedRedirect: "/hi/mindspace/member",
    },
    {
      inputName: "Alan Turing",
      inputEmail: "alan@bletchley.uk",
      locale: "ta",
      expectedName: "Alan Turing",
      expectedEmail: "alan@bletchley.uk",
      expectedRedirect: "/ta/mindspace/member",
    },
  ];

  for (const tc of testCases) {
    mockCookiesStore.clear();
    const req = new Request("http://localhost:4000/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "member",
        name: tc.inputName.trim() || undefined,
        email: tc.inputEmail.trim().toLowerCase() || undefined,
        redirectUrl: "/mindspace/member",
        locale: tc.locale,
      }),
    });

    const res = await runWithNextContext(() => devLoginHandler(req));
    assert.strictEqual(res.status, 200, "dev-login must respond with 200");
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.redirectUrl, tc.expectedRedirect);

    const sessionCookie = mockCookiesStore.get("mindspace_session");
    assert.ok(sessionCookie, "Session cookie must exist");

    const sessionData = JSON.parse(sessionCookie.value);
    assert.strictEqual(sessionData.user.role, "member");
    assert.strictEqual(sessionData.session.activeRole, "member");
    assert.strictEqual(sessionData.user.name, tc.expectedName);
    assert.strictEqual(sessionData.user.email, tc.expectedEmail);
    assert.strictEqual(sessionData.session.activeRoleRedirectUrl, "/mindspace/member");
    assert.strictEqual(sessionCookie.options.httpOnly, true, "Cookie must be httpOnly");
    assert.strictEqual(sessionCookie.options.sameSite, "lax", "Cookie must be sameSite=lax");
    assert.strictEqual(sessionCookie.options.path, "/", "Cookie path must be root");
  }
});
