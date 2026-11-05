import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { resolveWorkspaceAccess } from "@/modules/shared/rbac";

const intlMiddleware = createMiddleware(routing);

/**
 * Route guard middleware / proxy.
 *
 * 1. Skips static files, _next, api, and extensions so styles/scripts load directly.
 * 2. Runs next-intl locale negotiation for page routes.
 * 3. Applies MindSpace RBAC: /mindspace/[role] and /intake routes are checked
 *    against the `mindspace_session` cookie's role.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never intercept static assets, CSS, JS, or API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isProtected =
    /^\/(?:en|hi|ta)?\/?(mindspace|intake)(\/|$)/.test(pathname);

  if (isProtected) {
    let userRole: string | null = null;
    const rawCookie = request.cookies.get("mindspace_session")?.value;
    if (rawCookie) {
      try {
        const decoded = rawCookie.startsWith("%")
          ? decodeURIComponent(rawCookie)
          : rawCookie;
        const session = JSON.parse(decoded);
        userRole = session?.user?.role ?? session?.session?.activeRole ?? null;
      } catch {
        userRole = null;
      }
    }

    const access = resolveWorkspaceAccess(pathname, userRole);
    if (access === "/login") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (access) {
      return NextResponse.redirect(new URL(access, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
