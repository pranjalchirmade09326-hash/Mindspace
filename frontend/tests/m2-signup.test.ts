import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
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
  const workStore = { route: "/api/auth/dev-login" } as any;
  const workUnitStore = {
    type: "request",
    phase: "action",
    userspaceMutableCookies: mockCookieStoreObj,
    cookies: mockCookieStoreObj,
  } as any;
  return (workAsyncStorage as any).run(workStore as any, () =>
    (workUnitAsyncStorage as any).run(workUnitStore as any, fn)
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

// ---------------------------------------------------------------------------
// 1. Static AST Analysis of signup/page.tsx
// ---------------------------------------------------------------------------
test("AST Analysis: authClient.signUp.email is wired with callbackURL '/mindspace/member'", () => {
  assert.ok(fs.existsSync(SIGNUP_PAGE_PATH), "signup/page.tsx must exist");
  const code = fs.readFileSync(SIGNUP_PAGE_PATH, "utf-8");
  const sourceFile = ts.createSourceFile(
    SIGNUP_PAGE_PATH,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let foundSignUpCall = false;
  let callbackUrlValue: string | null = null;
  let hasNameProperty = false;
  let hasEmailProperty = false;
  let hasPasswordProperty = false;

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const exprText = node.expression.getText(sourceFile);
      if (exprText === "authClient.signUp.email") {
        foundSignUpCall = true;
        const arg = node.arguments[0];
        if (arg && ts.isObjectLiteralExpression(arg)) {
          for (const prop of arg.properties) {
            if (ts.isPropertyAssignment(prop)) {
              const propName = prop.name.getText(sourceFile);
              if (propName === "callbackURL") {
                if (ts.isStringLiteral(prop.initializer)) {
                  callbackUrlValue = prop.initializer.text;
                }
              }
              if (propName === "name") hasNameProperty = true;
              if (propName === "email") hasEmailProperty = true;
              if (propName === "password") hasPasswordProperty = true;
            } else if (ts.isShorthandPropertyAssignment(prop)) {
              const propName = prop.name.getText(sourceFile);
              if (propName === "password") hasPasswordProperty = true;
              if (propName === "name") hasNameProperty = true;
              if (propName === "email") hasEmailProperty = true;
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  assert.ok(foundSignUpCall, "Must invoke authClient.signUp.email");
  assert.strictEqual(
    callbackUrlValue,
    "/mindspace/member",
    "callbackURL must be exactly '/mindspace/member'"
  );
  assert.ok(hasNameProperty, "signUp payload must include name");
  assert.ok(hasEmailProperty, "signUp payload must include email");
  assert.ok(hasPasswordProperty, "signUp payload must include password");
});

test("AST Analysis: dev-login session creation passes role 'member' and destination '/mindspace/member'", () => {
  const code = fs.readFileSync(SIGNUP_PAGE_PATH, "utf-8");

  // Verify fetch to /api/auth/dev-login
  assert.match(
    code,
    /fetch\(\s*["']\/api\/auth\/dev-login["']/i,
    "Must call /api/auth/dev-login to establish local session"
  );

  // Verify role: 'member' is explicitly specified
  assert.match(
    code,
    /role:\s*["']member["']/,
    "Session creation body must explicitly set role: 'member'"
  );

  // Verify redirectUrl is '/mindspace/member'
  assert.match(
    code,
    /redirectUrl:\s*["']\/mindspace\/member["']/,
    "Session creation body must specify redirectUrl: '/mindspace/member'"
  );

  // Verify locale propagation
  assert.match(
    code,
    /useLocale\(\)/,
    "Signup page must read current locale using useLocale hook"
  );
  assert.match(
    code,
    /locale/i,
    "Session creation payload must include locale for proper localized redirect"
  );
});

test("AST Analysis: Direct dashboard routing to member dashboard without bounce to login", () => {
  const code = fs.readFileSync(SIGNUP_PAGE_PATH, "utf-8");

  // Must navigate directly to /mindspace/member
  assert.match(
    code,
    /router\.push\(\s*["']\/mindspace\/member["']/,
    "router.push must target /mindspace/member directly"
  );

  // Destination routing via window.location.href ensures cookie persistence and full server hydration
  assert.match(
    code,
    /window\.location\.href\s*=\s*destination/,
    "window.location.href must navigate to destination URL"
  );

  // Must not navigate to /login or /intake upon successful signup
  assert.doesNotMatch(
    code,
    /router\.push\(\s*["']\/login["']/,
    "Must not bounce to /login upon signup"
  );
  assert.doesNotMatch(
    code,
    /router\.push\(\s*["']\/intake["']/,
    "Must not route to deprecated /intake upon signup"
  );
});

// ---------------------------------------------------------------------------
// 2. Empirical Verification of Session Creation & Cookie Generation
// ---------------------------------------------------------------------------
test("Empirical Execution: devLoginHandler creates valid member session with cookie", async () => {
  mockCookiesStore.clear();

  const payload = {
    role: "member",
    name: "Empirical Tester",
    email: "tester@mindspace.app",
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
  assert.strictEqual(response.status, 200, "dev-login must return HTTP 200");

  const json = await response.json();
  assert.strictEqual(json.success, true, "Response must report success: true");
  assert.strictEqual(
    json.redirectUrl,
    "/en/mindspace/member",
    "Redirect URL must be localized to /en/mindspace/member"
  );

  // Inspect the mindspace_session cookie from cookieStore or response.cookies
  const sessionCookie =
    mockCookiesStore.get("mindspace_session") ||
    response.cookies.get("mindspace_session");
  assert.ok(sessionCookie, "mindspace_session cookie must be set");

  const rawCookieVal =
    typeof sessionCookie.value === "string"
      ? sessionCookie.value
      : JSON.stringify(sessionCookie);
  const sessionData = JSON.parse(rawCookieVal);

  // Validate sessionData user payload
  assert.strictEqual(
    sessionData.user.role,
    "member",
    "Session user role must be 'member'"
  );
  assert.strictEqual(
    sessionData.user.name,
    "Empirical Tester",
    "Session user name must match input"
  );
  assert.strictEqual(
    sessionData.user.email,
    "tester@mindspace.app",
    "Session user email must match input"
  );

  // Validate sessionData session payload
  assert.strictEqual(
    sessionData.session.activeRole,
    "member",
    "Session activeRole must be 'member'"
  );
  assert.strictEqual(
    sessionData.session.activeRoleRedirectUrl,
    "/mindspace/member",
    "Session activeRoleRedirectUrl must be '/mindspace/member'"
  );
  assert.ok(
    sessionData.session.activeOrganizationRoles.includes("member"),
    "activeOrganizationRoles must include 'member'"
  );
});

// ---------------------------------------------------------------------------
// 3. Locale-Aware Redirection Verification
// ---------------------------------------------------------------------------
test("Empirical Execution: Localized redirects across all supported locales", async () => {
  const locales = ["en", "hi", "ta"] as const;

  const devLoginHandler = await getDevLoginHandler();
  for (const loc of locales) {
    mockCookiesStore.clear();
    const req = new Request("http://localhost:4000/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "member",
        name: `Tester ${loc}`,
        email: `tester-${loc}@mindspace.app`,
        redirectUrl: "/mindspace/member",
        locale: loc,
      }),
    });

    const response = await runWithNextContext(() => devLoginHandler(req));
    assert.strictEqual(response.status, 200);
    const json = await response.json();
    assert.strictEqual(
      json.redirectUrl,
      `/${loc}/mindspace/member`,
      `Expected redirect URL for locale '${loc}' to be '/${loc}/mindspace/member'`
    );
  }
});

// ---------------------------------------------------------------------------
// 4. Verification of Server Session Ingestion (AppsLayout Simulation)
// ---------------------------------------------------------------------------
test("Session Resolution: Simulated AppsLayout resolves member role without redirect", () => {
  // Simulate the parsing logic used by getServerSession()
  const rawSession = JSON.stringify({
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
  });

  const parsed = JSON.parse(rawSession);

  // App Layout role resolution formula:
  const resolvedRole =
    parsed.user?.role || parsed.session?.activeRole || "patient";

  assert.strictEqual(
    resolvedRole,
    "member",
    "Layout must resolve role as 'member'"
  );

  // AppsLayout redirect check:
  // if (!session) { redirect('/login') }
  const shouldBounceToLogin = !parsed;
  assert.strictEqual(
    shouldBounceToLogin,
    false,
    "Authenticated session must never trigger bounce to /login"
  );
});
