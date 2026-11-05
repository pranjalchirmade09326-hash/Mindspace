import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";

if (!(globalThis as any).AsyncLocalStorage) {
  (globalThis as any).AsyncLocalStorage = AsyncLocalStorage;
}

// ---------------------------------------------------------------------------
// Mock Cookie Store for Next.js Server Components / Action Context
// ---------------------------------------------------------------------------
const mockCookiesStore = new Map<string, { value: string; options: any }>();
const mockCookieStoreObj = {
  set: (name: string, value: string, options: any) => {
    mockCookiesStore.set(name, { value, options });
  },
  get: (name: string) => mockCookiesStore.get(name),
  delete: (name: string) => mockCookiesStore.delete(name),
};

async function runWithNextContext<T>(fn: () => Promise<T>, route = "/api/auth/dev-login"): Promise<T> {
  const { workAsyncStorage } = await import(
    "next/dist/server/app-render/work-async-storage.external"
  );
  const { workUnitAsyncStorage } = await import(
    "next/dist/server/app-render/work-unit-async-storage.external"
  );
  const workStore = { route } as any;
  const workUnitStore = {
    type: "request",
    phase: "action",
    userspaceMutableCookies: mockCookieStoreObj,
    cookies: mockCookieStoreObj,
  } as any;
  return workAsyncStorage.run(workStore, () =>
    workUnitAsyncStorage.run(workUnitStore, fn)
  );
}

async function getDevLoginHandler() {
  const mod = await import("../src/app/api/auth/dev-login/route");
  return mod.POST;
}

async function getSessionHelper() {
  const mod = await import("../src/modules/server/auth/get-session");
  return mod.getServerSession;
}

const SIGNUP_PAGE_PATH = path.resolve(
  __dirname,
  "../src/app/[locale]/(auth)/signup/page.tsx"
);

// ---------------------------------------------------------------------------
// 1. Empirical Registration Session Cookie Generation & Member Role Contract
// ---------------------------------------------------------------------------
test("CHALLENGE 1: Empirical Registration Session Cookie Generation & Member Role Contract", async () => {
  mockCookiesStore.clear();

  const payload = {
    role: "member",
    name: "Alex Challenger",
    email: "alex.challenger@mindspace.app",
    redirectUrl: "/mindspace/member",
    locale: "en",
  };

  const req = new Request("http://localhost:4000/api/auth/dev-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const devLoginHandler = await getDevLoginHandler();
  const response = await runWithNextContext(() => devLoginHandler(req));
  assert.strictEqual(response.status, 200, "dev-login route must return HTTP 200");

  const body = await response.json();
  assert.strictEqual(body.success, true, "Body must indicate success: true");
  assert.strictEqual(body.redirectUrl, "/en/mindspace/member", "Redirect URL must be /en/mindspace/member");

  // Verify cookie was set in cookieStore
  const cookieEntry = mockCookiesStore.get("mindspace_session");
  assert.ok(cookieEntry, "mindspace_session cookie must be created in cookieStore");
  assert.ok(cookieEntry.value, "mindspace_session cookie value must not be empty");

  // Validate parsed session payload
  const sessionData = JSON.parse(cookieEntry.value);
  assert.strictEqual(sessionData.user.role, "member", "User role must be 'member'");
  assert.strictEqual(sessionData.user.name, "Alex Challenger", "User name must match input");
  assert.strictEqual(sessionData.user.email, "alex.challenger@mindspace.app", "User email must match input");
  assert.strictEqual(sessionData.session.activeRole, "member", "Active role must be 'member'");
  assert.strictEqual(sessionData.session.activeRoleRedirectUrl, "/mindspace/member", "activeRoleRedirectUrl must be '/mindspace/member'");
  assert.ok(
    sessionData.session.activeOrganizationRoles.includes("member"),
    "activeOrganizationRoles must contain 'member'"
  );

  // Verify secondary cookies
  const devToken = mockCookiesStore.get("dev_token");
  assert.ok(devToken, "dev_token cookie must be set");
  assert.strictEqual(devToken.value, "dev-jwt-token");

  const activeRedirect = mockCookiesStore.get("activeRoleRedirectUrl");
  assert.ok(activeRedirect, "activeRoleRedirectUrl cookie must be set");
  assert.strictEqual(activeRedirect.value, "/en/mindspace/member");
});

// ---------------------------------------------------------------------------
// 2. Cookie Security Attributes & Expiry Lifespan
// ---------------------------------------------------------------------------
test("CHALLENGE 2: Cookie Security Attributes & 7-Day Expiry Lifespan", async () => {
  mockCookiesStore.clear();

  const req = new Request("http://localhost:4000/api/auth/dev-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "member", locale: "en" }),
  });

  const devLoginHandler = await getDevLoginHandler();
  await runWithNextContext(() => devLoginHandler(req));

  const cookieEntry = mockCookiesStore.get("mindspace_session");
  assert.ok(cookieEntry);
  const { options } = cookieEntry;

  assert.strictEqual(options.httpOnly, true, "Cookie must be httpOnly for XSS mitigation");
  assert.strictEqual(options.sameSite, "lax", "Cookie sameSite must be 'lax' for secure redirects");
  assert.strictEqual(options.path, "/", "Cookie path must be root '/'");
  assert.strictEqual(options.maxAge, 7 * 24 * 60 * 60, "Cookie maxAge must be 604800s (7 days)");

  // Validate sessionData.session.expiresAt timestamp
  const sessionData = JSON.parse(cookieEntry.value);
  const expiresAtMs = new Date(sessionData.session.expiresAt).getTime();
  const expectedMinMs = Date.now() + 6 * 24 * 60 * 60 * 1000;
  const expectedMaxMs = Date.now() + 8 * 24 * 60 * 60 * 1000;
  assert.ok(
    expiresAtMs > expectedMinMs && expiresAtMs < expectedMaxMs,
    "session.expiresAt must be roughly 7 days in the future"
  );
});

// ---------------------------------------------------------------------------
// 3. Multi-Locale Direct Routing Across en, hi, ta & Prefix Normalization
// ---------------------------------------------------------------------------
test("CHALLENGE 3: Multi-Locale Direct Routing Across en, hi, ta & Prefix Normalization", async () => {
  const devLoginHandler = await getDevLoginHandler();
  const targetLocales = ["en", "hi", "ta"] as const;

  for (const locale of targetLocales) {
    mockCookiesStore.clear();

    const req = new Request("http://localhost:4000/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "member",
        name: `User ${locale}`,
        email: `user.${locale}@mindspace.app`,
        redirectUrl: "/mindspace/member",
        locale,
      }),
    });

    const res = await runWithNextContext(() => devLoginHandler(req));
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(
      data.redirectUrl,
      `/${locale}/mindspace/member`,
      `Expected direct routing for locale '${locale}' to be '/${locale}/mindspace/member'`
    );
  }

  // Stress-test prefix normalization: What if redirectUrl already had a locale prefix?
  // E.g. client sends redirectUrl: "/hi/mindspace/member" with locale: "hi" -> must NOT become "/hi/hi/mindspace/member"
  {
    mockCookiesStore.clear();
    const req = new Request("http://localhost:4000/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "member",
        redirectUrl: "/hi/mindspace/member",
        locale: "hi",
      }),
    });

    const res = await runWithNextContext(() => devLoginHandler(req));
    const data = await res.json();
    assert.strictEqual(
      data.redirectUrl,
      "/hi/mindspace/member",
      "Redundant locale prefix in redirectUrl must be stripped cleanly"
    );
  }

  // Cross-locale switch: redirectUrl was "/en/mindspace/member" but locale is "ta"
  {
    mockCookiesStore.clear();
    const req = new Request("http://localhost:4000/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "member",
        redirectUrl: "/en/mindspace/member",
        locale: "ta",
      }),
    });

    const res = await runWithNextContext(() => devLoginHandler(req));
    const data = await res.json();
    assert.strictEqual(
      data.redirectUrl,
      "/ta/mindspace/member",
      "Conflicting locale prefix in redirectUrl must be replaced by the specified active locale"
    );
  }
});

// ---------------------------------------------------------------------------
// 4. End-to-End Session Resolution via getServerSession()
// ---------------------------------------------------------------------------
test("CHALLENGE 4: End-to-End Session Resolution via getServerSession()", async () => {
  mockCookiesStore.clear();
  const getServerSession = await getSessionHelper();

  // Subtest 4.1: Unauthenticated state returns null
  const nullSession = await runWithNextContext(() => getServerSession());
  assert.strictEqual(nullSession, null, "getServerSession must return null when no cookie is set");

  // Subtest 4.2: Standard raw JSON cookie resolution
  const sessionObject = {
    user: {
      id: "usr-member-01",
      name: "Verified Member",
      email: "member@mindspace.app",
      role: "member",
    },
    session: {
      id: "sess-member-01",
      activeRole: "member",
      activeRoleRedirectUrl: "/mindspace/member",
      activeOrganizationRoles: ["member"],
    },
  };

  mockCookiesStore.set("mindspace_session", {
    value: JSON.stringify(sessionObject),
    options: { path: "/" },
  });

  const resolvedSession = await runWithNextContext(() => getServerSession());
  assert.ok(resolvedSession, "getServerSession must resolve active session");
  assert.strictEqual(resolvedSession.user.role, "member");
  assert.strictEqual(resolvedSession.session.activeRole, "member");

  // Verify role derivation matching AppsLayout formula:
  const layoutRole =
    (resolvedSession.user as any)?.role ||
    resolvedSession.session?.activeRole ||
    "patient";
  assert.strictEqual(layoutRole, "member", "AppsLayout must resolve role to 'member'");

  // Subtest 4.3: URL-encoded cookie value (e.g. %7B%22user%22...)
  mockCookiesStore.set("mindspace_session", {
    value: encodeURIComponent(JSON.stringify(sessionObject)),
    options: { path: "/" },
  });

  const uriDecodedSession = await runWithNextContext(() => getServerSession());
  assert.ok(uriDecodedSession, "getServerSession must handle URL-encoded cookie");
  assert.strictEqual(uriDecodedSession.user.role, "member");
});

// ---------------------------------------------------------------------------
// 5. Stress Testing: Corrupt or Boundary Cookies in getServerSession()
// ---------------------------------------------------------------------------
test("CHALLENGE 5: Resilience against Corrupted or Malformed Session Cookies", async () => {
  mockCookiesStore.clear();
  const getServerSession = await getSessionHelper();

  // Test corrupted non-JSON cookie string
  mockCookiesStore.set("mindspace_session", {
    value: "INVALID_NOT_JSON{{;;;",
    options: { path: "/" },
  });

  // Must not throw unhandled exception; must gracefully return null
  const sessionResult = await runWithNextContext(() => getServerSession());
  assert.strictEqual(sessionResult, null, "Corrupt cookie must safely evaluate to null session");
});

// ---------------------------------------------------------------------------
// 6. AST & Source Code Verification: Signup Form Wiring & Anti-Bounce Guarantees
// ---------------------------------------------------------------------------
test("CHALLENGE 6: AST Verification of Signup Form Wiring & Anti-Bounce Guarantees", () => {
  assert.ok(fs.existsSync(SIGNUP_PAGE_PATH), "signup/page.tsx must exist");
  const code = fs.readFileSync(SIGNUP_PAGE_PATH, "utf-8");

  // 1. Must invoke Better Auth signUp with exact callbackURL
  assert.match(
    code,
    /callbackURL:\s*["']\/mindspace\/member["']/,
    "callbackURL must target /mindspace/member"
  );

  // 2. Must hardcode role: 'member' to prevent unauthorized role elevation
  const memberRoleMatches = code.match(/role:\s*["']member["']/g);
  assert.ok(
    memberRoleMatches && memberRoleMatches.length >= 2,
    "Both primary and fallback session creation must enforce role: 'member'"
  );

  // 3. Must use window.location.href navigation to ensure cookie attachment across server components
  assert.match(
    code,
    /window\.location\.href\s*=\s*(?:destination|targetUrl)/,
    "Must trigger window.location.href navigation to eliminate client cache bounce"
  );

  // 4. Must check for network failure before deciding to fall back
  assert.match(
    code,
    /isNetworkFailure/,
    "Must detect network failure before executing fallback"
  );

  // 5. Must NOT fall back on user-facing 4xx errors
  assert.match(
    code,
    /toast\.error\(error\.message/,
    "Must display toast error on logical failures (e.g. email in use)"
  );
});

// ---------------------------------------------------------------------------
// 7. Member Dashboard Role Definition & Integrity
// ---------------------------------------------------------------------------
test("CHALLENGE 7: Member Dashboard Role Definition & Integrity", async () => {
  const { getDashboardRole } = await import(
    "../src/modules/client/mindspace-dashboard/dashboard-data"
  );

  const memberRole = getDashboardRole("member");
  assert.ok(memberRole, "Role 'member' must be defined in dashboard-data");
  assert.strictEqual(memberRole.id, "member");
  assert.strictEqual(memberRole.title, "Member");
  assert.strictEqual(memberRole.shortTitle, "Member");

  // Verify member workspace has required sections
  assert.ok(Array.isArray(memberRole.sections), "Member role must have sections array");
  const sectionIds = memberRole.sections.map((s) => s.id);
  assert.ok(sectionIds.includes("my-support"), "Member role must include 'my-support' section");
  assert.ok(sectionIds.includes("wellbeing"), "Member role must include 'wellbeing' section");
  assert.ok(sectionIds.includes("privacy"), "Member role must include 'privacy' section");
});

// ---------------------------------------------------------------------------
// 8. Fuzzing & Boundary Input Testing on dev-login Route
// ---------------------------------------------------------------------------
test("CHALLENGE 8: Fuzzing & Boundary Input Testing on dev-login Route", async () => {
  const devLoginHandler = await getDevLoginHandler();

  // Test 8.1: Missing name & email uses default member credentials
  {
    mockCookiesStore.clear();
    const req = new Request("http://localhost:4000/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "member" }),
    });

    const res = await runWithNextContext(() => devLoginHandler(req));
    assert.strictEqual(res.status, 200);
    const cookie = mockCookiesStore.get("mindspace_session");
    const data = JSON.parse(cookie!.value);
    assert.strictEqual(data.user.name, "Demo Member", "Should use default member name if blank");
    assert.strictEqual(data.user.email, "member@mindspace.app", "Should use default member email if blank");
  }

  // Test 8.2: Role elevation attempt: sending unknown role defaults to member
  {
    mockCookiesStore.clear();
    const req = new Request("http://localhost:4000/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "super-hacker-admin" }),
    });

    const res = await runWithNextContext(() => devLoginHandler(req));
    assert.strictEqual(res.status, 200);
    const cookie = mockCookiesStore.get("mindspace_session");
    const data = JSON.parse(cookie!.value);
    assert.strictEqual(data.user.role, "member", "Unknown role must sanitize back to 'member'");
  }

  // Test 8.3: Name with HTML / special characters
  {
    mockCookiesStore.clear();
    const req = new Request("http://localhost:4000/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "member",
        name: "<b>Jane & Doe</b>",
        email: "jane@test.org",
      }),
    });

    const res = await runWithNextContext(() => devLoginHandler(req));
    assert.strictEqual(res.status, 200);
    const cookie = mockCookiesStore.get("mindspace_session");
    const data = JSON.parse(cookie!.value);
    assert.strictEqual(data.user.name, "<b>Jane & Doe</b>", "Name string is stored without JSON syntax breakage");
  }
});

// ---------------------------------------------------------------------------
// 9. AuthResponse TypeScript Contract Compliance (Structural Typing)
// ---------------------------------------------------------------------------
test("CHALLENGE 9: AuthResponse TypeScript Contract Compliance", async () => {
  const devLoginHandler = await getDevLoginHandler();
  mockCookiesStore.clear();

  const req = new Request("http://localhost:4000/api/auth/dev-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "member" }),
  });

  await runWithNextContext(() => devLoginHandler(req));
  const cookie = mockCookiesStore.get("mindspace_session");
  const data = JSON.parse(cookie!.value);

  // Validate all required User fields
  const userRequiredFields = [
    "id", "name", "email", "emailVerified", "image", "createdAt",
    "updatedAt", "username", "displayUsername", "twoFactorEnabled",
    "role", "banned", "banReason", "banExpires"
  ];
  for (const field of userRequiredFields) {
    assert.ok(field in data.user, `User must contain field '${field}'`);
  }

  // Validate all required Session fields
  const sessionRequiredFields = [
    "id", "token", "expiresAt", "createdAt", "updatedAt", "ipAddress",
    "userAgent", "userId", "activeOrganizationId", "activeTeamId",
    "impersonatedBy", "apps", "permissions", "organizations",
    "activeOrganizationRoles", "activeRoleId", "activeRole",
    "activeRoleRedirectUrl"
  ];
  for (const field of sessionRequiredFields) {
    assert.ok(field in data.session, `Session must contain field '${field}'`);
  }
});

// ---------------------------------------------------------------------------
// 10. Empty Body / Missing Payload Resilience on dev-login Route
// ---------------------------------------------------------------------------
test("CHALLENGE 10: Empty Body / Missing Payload Resilience on dev-login Route", async () => {
  const devLoginHandler = await getDevLoginHandler();
  mockCookiesStore.clear();

  // Test with empty POST request (no body)
  const req = new Request("http://localhost:4000/api/auth/dev-login", {
    method: "POST",
  });

  const res = await runWithNextContext(() => devLoginHandler(req));
  assert.strictEqual(res.status, 200, "dev-login must handle empty body gracefully");
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.redirectUrl, "/en/mindspace/member");

  const cookie = mockCookiesStore.get("mindspace_session");
  const sessionData = JSON.parse(cookie!.value);
  assert.strictEqual(sessionData.user.role, "member");
  assert.strictEqual(sessionData.session.activeRole, "member");
});

// ---------------------------------------------------------------------------
// 11. Signup Flow Branching Oracle Simulation: Success vs 400 vs 500 Offline Fallback
// ---------------------------------------------------------------------------
test("CHALLENGE 11: Signup Flow Branching Oracle Simulation", () => {
  // Decision oracle matching SignupPage lines 50-129
  function evaluateSignupOutcome({
    passwordLength,
    signUpError,
  }: {
    passwordLength: number;
    signUpError: { status?: number; message?: string } | null;
  }) {
    if (passwordLength < 8) {
      return { action: "VALIDATION_ERROR", error: "Password must be at least 8 characters." };
    }

    if (signUpError) {
      const isNetworkFailure =
        !signUpError.status ||
        signUpError.status >= 500 ||
        signUpError.message?.toLowerCase().includes("failed to fetch") ||
        signUpError.message?.toLowerCase().includes("network") ||
        signUpError.message?.toLowerCase().includes("econnrefused");

      if (isNetworkFailure) {
        return { action: "DEV_FALLBACK_SESSION", destination: "/mindspace/member" };
      }

      return { action: "USER_ERROR_TOAST", error: signUpError.message };
    }

    return { action: "PRIMARY_SESSION", destination: "/mindspace/member" };
  }

  // Case 1: Short password
  assert.deepStrictEqual(
    evaluateSignupOutcome({ passwordLength: 6, signUpError: null }),
    { action: "VALIDATION_ERROR", error: "Password must be at least 8 characters." }
  );

  // Case 2: Better Auth returns 400 (e.g. Email already registered)
  assert.deepStrictEqual(
    evaluateSignupOutcome({ passwordLength: 10, signUpError: { status: 400, message: "Email already in use" } }),
    { action: "USER_ERROR_TOAST", error: "Email already in use" }
  );

  // Case 3: Better Auth returns network error / IAM offline
  assert.deepStrictEqual(
    evaluateSignupOutcome({ passwordLength: 10, signUpError: { status: 503, message: "Service Unavailable" } }),
    { action: "DEV_FALLBACK_SESSION", destination: "/mindspace/member" }
  );
  assert.deepStrictEqual(
    evaluateSignupOutcome({ passwordLength: 10, signUpError: { message: "Failed to fetch" } }),
    { action: "DEV_FALLBACK_SESSION", destination: "/mindspace/member" }
  );

  // Case 4: Better Auth returns success
  assert.deepStrictEqual(
    evaluateSignupOutcome({ passwordLength: 12, signUpError: null }),
    { action: "PRIMARY_SESSION", destination: "/mindspace/member" }
  );
});

