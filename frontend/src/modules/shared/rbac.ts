/**
 * MindSpace role-based access control (RBAC).
 *
 * Layer: shared / auth
 *
 * Sign-in assigns exactly one workspace role: "member" or "listener".
 * Each role may only access its own dashboard routes — anything else is
 * redirected to the sign-in page.
 */

export const MINDSPACE_SIGNIN_ROLES = ["member", "listener"] as const;

export type MindspaceSigninRole = (typeof MINDSPACE_SIGNIN_ROLES)[number];

/** Route prefix each role is allowed to browse. */
export const ROLE_HOME: Record<MindspaceSigninRole, string> = {
  member: "/mindspace/member",
  listener: "/mindspace/listener",
};

/** Staff-only role ids still referenced by dashboards/preview tooling. */
export const STAFF_ROLES = [
  "listener-supervisor",
  "safety-operations",
  "platform-administrator",
  "ai-agent",
] as const;

export function isMindspaceSigninRole(value: unknown): value is MindspaceSigninRole {
  return (
    typeof value === "string" &&
    (MINDSPACE_SIGNIN_ROLES as readonly string[]).includes(value)
  );
}

/**
 * Decides whether `userRole` may view the workspace at `pathname`.
 * Returns the redirect target:
 *  - null        → allowed
 *  - "/login"    → not signed in
 *  - role home   → signed in but wrong workspace
 */
export function resolveWorkspaceAccess(
  pathname: string,
  userRole?: string | null,
): string | null {
  // In development, allow browsing all role dashboards and demo pages
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  // Normalize locale prefixes.
  const cleanPath = pathname.replace(/^\/(?:en|hi|ta)(?:\/|$)/, "/");

  const workspaceMatch = cleanPath.match(/^\/mindspace\/([^/]+)/);
  if (!workspaceMatch) {
    // Intake flows belong to the member workspace.
    if (cleanPath.startsWith("/intake")) {
      if (!userRole) return "/login";
      if (isMindspaceSigninRole(userRole) && userRole !== "member") {
        return ROLE_HOME[userRole];
      }
    }
    return null;
  }

  const routeRole = workspaceMatch[1];

  if (!userRole) return "/login";
  if (routeRole === userRole) return null;
  if (isMindspaceSigninRole(userRole)) return ROLE_HOME[userRole];

  // Staff roles are session-driven previews; leave those alone.
  return null;
}
