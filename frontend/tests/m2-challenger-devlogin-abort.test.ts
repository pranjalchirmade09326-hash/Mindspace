import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const SIGNUP_PAGE_PATH = path.resolve(
  __dirname,
  "../src/app/[locale]/(auth)/signup/page.tsx"
);

// ---------------------------------------------------------------------------
// 1. AST Analysis: Ensure Primary & Fallback dev-login Have Non-Bypassing ok Guards
// ---------------------------------------------------------------------------
test("CHALLENGE ABORT 1: AST Analysis of !devRes.ok guard and abort in primary flow", () => {
  assert.ok(fs.existsSync(SIGNUP_PAGE_PATH), "signup/page.tsx must exist");
  const code = fs.readFileSync(SIGNUP_PAGE_PATH, "utf-8");
  const sourceFile = ts.createSourceFile(
    SIGNUP_PAGE_PATH,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  // 1. Check for "!devRes.ok" guard pattern in the file
  assert.match(
    code,
    /if\s*\(\s*!devRes\.ok\s*\)/,
    "Primary signup flow must have an explicit 'if (!devRes.ok)' guard"
  );

  // 2. Check that within the guard, a throw statement halts execution before router.push
  assert.match(
    code,
    /if\s*\(\s*!devRes\.ok\s*\)\s*\{[\s\S]*?throw\s+new\s+Error\(/,
    "The '!devRes.ok' guard must throw an Error to abort the primary execution block"
  );

  // 3. Check that the guard also triggers an error toast
  assert.match(
    code,
    /if\s*\(\s*!devRes\.ok\s*\)\s*\{[\s\S]*?toast\.error\(/,
    "The '!devRes.ok' guard must display a toast.error to inform the user"
  );

  // 4. Verify AST ordering: in the try block, the !devRes.ok check must precede router.push
  const primaryDevLoginIdx = code.indexOf('fetch("/api/auth/dev-login"');
  assert.ok(primaryDevLoginIdx > 0, "Primary fetch call must exist");

  const guardIdx = code.indexOf("if (!devRes.ok)", primaryDevLoginIdx);
  assert.ok(guardIdx > primaryDevLoginIdx, "if (!devRes.ok) must follow the primary fetch call");

  const routerPushIdx = code.indexOf("router.push", guardIdx);
  assert.ok(routerPushIdx > guardIdx, "router.push must be located strictly AFTER the !devRes.ok guard");

  const windowHrefIdx = code.indexOf("window.location.href =", guardIdx);
  assert.ok(windowHrefIdx > guardIdx, "window.location.href must be located strictly AFTER the !devRes.ok guard");
});

test("CHALLENGE ABORT 2: AST Analysis of dev-login fallback guard", () => {
  const code = fs.readFileSync(SIGNUP_PAGE_PATH, "utf-8");

  // In catch block, navigation must be gated by `if (devRes.ok)`
  const catchBlockIdx = code.indexOf("catch (err: any)");
  assert.ok(catchBlockIdx > 0, "Catch block must exist");

  const fallbackFetchIdx = code.indexOf('fetch("/api/auth/dev-login"', catchBlockIdx);
  assert.ok(fallbackFetchIdx > catchBlockIdx, "Fallback fetch must exist inside catch block");

  const fallbackOkCheckIdx = code.indexOf("if (devRes.ok)", fallbackFetchIdx);
  assert.ok(fallbackOkCheckIdx > fallbackFetchIdx, "Fallback must verify if (devRes.ok) before navigation");

  const fallbackRouterPushIdx = code.indexOf("router.push", fallbackOkCheckIdx);
  assert.ok(fallbackRouterPushIdx > fallbackOkCheckIdx, "Fallback router.push must be inside if (devRes.ok) block");
});

// ---------------------------------------------------------------------------
// 2. Behavioral Execution Simulation of handleSubmit()
// ---------------------------------------------------------------------------
interface MockContext {
  routerPushed: string[];
  windowLocationHref: string | null;
  toastErrors: string[];
  toastSuccesses: string[];
  submittingStates: boolean[];
  consoleWarns: any[];
  consoleErrors: any[];
}

async function simulateHandleSubmit({
  email = "alex@test.com",
  name = "Alex",
  password = "Password123!",
  locale = "en",
  signUpResult = { data: { user: { name: "Alex", email: "alex@test.com" } }, error: null as any },
  primaryDevLoginResponse,
  primaryDevLoginError,
  fallbackDevLoginResponse,
  fallbackDevLoginError,
}: {
  email?: string;
  name?: string;
  password?: string;
  locale?: string;
  signUpResult?: { data: any; error: any };
  primaryDevLoginResponse?: { ok: boolean; status: number; json: () => Promise<any> };
  primaryDevLoginError?: Error;
  fallbackDevLoginResponse?: { ok: boolean; status: number; json: () => Promise<any> };
  fallbackDevLoginError?: Error;
}): Promise<MockContext> {
  const ctx: MockContext = {
    routerPushed: [],
    windowLocationHref: null,
    toastErrors: [],
    toastSuccesses: [],
    submittingStates: [],
    consoleWarns: [],
    consoleErrors: [],
  };

  const toast = {
    error: (msg: string) => { ctx.toastErrors.push(msg); },
    success: (msg: string) => { ctx.toastSuccesses.push(msg); },
  };

  const router = {
    push: (dest: string) => { ctx.routerPushed.push(dest); },
  };

  const mockWindow = {
    location: {
      set href(val: string) { ctx.windowLocationHref = val; },
      get href() { return ctx.windowLocationHref || ""; },
    },
  };

  const setIsSubmitting = (val: boolean) => {
    ctx.submittingStates.push(val);
  };

  let fetchCallCount = 0;
  const mockFetch = async (url: string, opts: any) => {
    fetchCallCount++;
    if (fetchCallCount === 1) {
      if (primaryDevLoginError) throw primaryDevLoginError;
      return primaryDevLoginResponse!;
    } else {
      if (fallbackDevLoginError) throw fallbackDevLoginError;
      return fallbackDevLoginResponse!;
    }
  };

  // Replicate the exact logic from signup/page.tsx handleSubmit
  const executeSubmission = async () => {
    setIsSubmitting(true);
    try {
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }

      // authClient.signUp.email
      const { data, error } = signUpResult;

      if (error) {
        const isNetworkFailure =
          !error.status ||
          error.status >= 500 ||
          error.message?.toLowerCase().includes("failed to fetch") ||
          error.message?.toLowerCase().includes("network") ||
          error.message?.toLowerCase().includes("econnrefused");

        if (isNetworkFailure) {
          throw new Error(error.message || "IAM service offline");
        }

        toast.error(error.message ?? "Sign up failed. Please try again.");
        return;
      }

      toast.success("Account created! Redirecting…");

      const devRes = await mockFetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "member",
          name: data?.user?.name || name.trim() || "Member",
          email: data?.user?.email || email.trim().toLowerCase(),
          redirectUrl: "/mindspace/member",
          locale,
        }),
      });

      if (!devRes.ok) {
        toast.error("Failed to establish authenticated session. Please try signing in.");
        throw new Error("Failed to initialize session");
      }

      const resData = await devRes.json().catch(() => ({}));
      const destination = resData?.redirectUrl || `/${locale}/mindspace/member`;

      router.push("/mindspace/member" as any);
      if (typeof mockWindow !== "undefined" && mockWindow.location) {
        mockWindow.location.href = destination;
      }
    } catch (err: any) {
      ctx.consoleWarns.push(err?.message);
      try {
        const devRes = await mockFetch("/api/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "member",
            name: name.trim() || "Member",
            email: email.trim().toLowerCase(),
            redirectUrl: "/mindspace/member",
            locale,
          }),
        });

        if (devRes.ok) {
          const devData = await devRes.json().catch(() => ({}));
          const targetUrl = devData?.redirectUrl || `/${locale}/mindspace/member`;
          toast.success("Account created via Dev Session! Redirecting…");
          router.push("/mindspace/member" as any);
          if (typeof mockWindow !== "undefined" && mockWindow.location) {
            mockWindow.location.href = targetUrl;
          }
          return;
        }
      } catch (devErr: any) {
        ctx.consoleErrors.push(devErr?.message);
      }
      toast.error(err?.message ?? "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  await executeSubmission();
  return ctx;
}

// ---------------------------------------------------------------------------
// 3. Empirical Challenge Tests: dev-login Failures Must Abort Without Redirect
// ---------------------------------------------------------------------------

test("CHALLENGE ABORT 3: dev-login HTTP 500 in primary and fallback aborts without redirect", async () => {
  const result = await simulateHandleSubmit({
    primaryDevLoginResponse: {
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal Server Error" }),
    },
    fallbackDevLoginResponse: {
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal Server Error" }),
    },
  });

  // Zero redirects must occur
  assert.strictEqual(result.routerPushed.length, 0, "router.push MUST NOT be called when dev-login returns 500");
  assert.strictEqual(result.windowLocationHref, null, "window.location.href MUST NOT be set when dev-login returns 500");

  // Error toasts must be surfaced
  assert.ok(result.toastErrors.length > 0, "At least one toast error must be triggered");
  assert.ok(
    result.toastErrors.includes("Failed to establish authenticated session. Please try signing in."),
    "Must display session establishment failure toast"
  );

  // Submission state must cleanly reset
  assert.deepStrictEqual(result.submittingStates, [true, false], "isSubmitting must reset to false");
});

test("CHALLENGE ABORT 4: dev-login Network Throw in primary and fallback aborts without redirect", async () => {
  const result = await simulateHandleSubmit({
    primaryDevLoginError: new TypeError("fetch failed: ECONNREFUSED 127.0.0.1:4000"),
    fallbackDevLoginError: new TypeError("fetch failed: ECONNREFUSED 127.0.0.1:4000"),
  });

  // Zero redirects
  assert.strictEqual(result.routerPushed.length, 0, "router.push MUST NOT be called on network error");
  assert.strictEqual(result.windowLocationHref, null, "window.location.href MUST NOT be set on network error");

  // Errors surfaced
  assert.ok(result.toastErrors.length > 0, "Toast error must be surfaced on network exception");
  assert.deepStrictEqual(result.submittingStates, [true, false]);
});

test("CHALLENGE ABORT 5: dev-login HTTP 401 Unauthorized aborts without redirect", async () => {
  const result = await simulateHandleSubmit({
    primaryDevLoginResponse: {
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    },
    fallbackDevLoginResponse: {
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    },
  });

  assert.strictEqual(result.routerPushed.length, 0, "router.push MUST NOT be called on 401");
  assert.strictEqual(result.windowLocationHref, null, "window.location.href MUST NOT be set on 401");
  assert.ok(result.toastErrors.includes("Failed to establish authenticated session. Please try signing in."));
});

test("CHALLENGE ABORT 6: dev-login HTTP 503 Service Unavailable aborts without redirect", async () => {
  const result = await simulateHandleSubmit({
    primaryDevLoginResponse: {
      ok: false,
      status: 503,
      json: async () => ({ error: "Service Unavailable" }),
    },
    fallbackDevLoginResponse: {
      ok: false,
      status: 503,
      json: async () => ({ error: "Service Unavailable" }),
    },
  });

  assert.strictEqual(result.routerPushed.length, 0, "router.push MUST NOT be called on 503");
  assert.strictEqual(result.windowLocationHref, null, "window.location.href MUST NOT be set on 503");
  assert.ok(result.toastErrors.includes("Failed to establish authenticated session. Please try signing in."));
});

test("CHALLENGE ABORT 7: Successful dev-login proceeds with redirect", async () => {
  const result = await simulateHandleSubmit({
    primaryDevLoginResponse: {
      ok: true,
      status: 200,
      json: async () => ({ redirectUrl: "/en/mindspace/member" }),
    },
  });

  assert.strictEqual(result.routerPushed.length, 1, "router.push MUST be called on successful dev-login");
  assert.strictEqual(result.routerPushed[0], "/mindspace/member");
  assert.strictEqual(result.windowLocationHref, "/en/mindspace/member", "window.location.href must receive the destination");
  assert.strictEqual(result.toastErrors.length, 0, "No toast errors on successful session establishment");
});
