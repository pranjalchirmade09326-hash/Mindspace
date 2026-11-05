import { headers, cookies } from "next/headers";
import { cache } from "react";
import { AuthResponse } from "./types";

/**
 * MindSpace role ids — mirrors the dashboards defined in
 * modules/client/mindspace-dashboard/dashboard-data.ts.
 */
const MINDSpace_ROLES = [
  "member",
  "listener",
  "listener-supervisor",
  "safety-operations",
  "platform-administrator",
] as const;

type MindspaceRole = (typeof MINDSpace_ROLES)[number];

const ROLE_LABELS: Record<MindspaceRole, { name: string; email: string }> = {
  member: { name: "Demo Member", email: "member@mindspace.app" },
  listener: { name: "Demo Listener", email: "listener@mindspace.app" },
  "listener-supervisor": {
    name: "Demo Supervisor",
    email: "supervisor@mindspace.app",
  },
  "safety-operations": {
    name: "Demo Safety Ops",
    email: "safety@mindspace.app",
  },
  "platform-administrator": {
    name: "Demo Administrator",
    email: "admin@mindspace.app",
  },
};

/**
 * Builds a local dev session for one of the five MindSpace roles.
 * Used only outside production so the app shell can be previewed without
 * a live identity provider.
 *
 * @param role - MindSpace role id (defaults to "member").
 * @returns A synthetic Better-Auth-shaped session response.
 */
export function getDevSession(role = "member"): AuthResponse {
  const normalized = (role || "member").toString().trim().toLowerCase();
  const cleanRole = (MINDSpace_ROLES as readonly string[]).includes(normalized)
    ? (normalized as MindspaceRole)
    : "member";
  const { name, email } = ROLE_LABELS[cleanRole];
  const redirectUrl = `/mindspace/${cleanRole}`;

  return {
    user: {
      id: `usr-${cleanRole}-01`,
      name,
      email,
      emailVerified: true,
      image: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      username: cleanRole,
      displayUsername: name,
      twoFactorEnabled: false,
      role: cleanRole,
      banned: false,
      banReason: null,
      banExpires: null,
    },
    session: {
      id: `sess-${cleanRole}-01`,
      token: "dev-jwt-token",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ipAddress: "127.0.0.1",
      userAgent: "Local Dev Browser",
      userId: `usr-${cleanRole}-01`,
      activeOrganizationId: "org-default-01",
      activeTeamId: null,
      impersonatedBy: null,
      apps: ["mindspace"],
      permissions: ["*"],
      organizations: [
        {
          id: "org-default-01",
          name: "MindSpace",
          slug: "mindspace",
          logo: null,
        },
      ],
      activeOrganizationRoles: [cleanRole],
      activeRoleId: `role-${cleanRole}`,
      activeRole: cleanRole,
      activeRoleRedirectUrl: redirectUrl,
    },
  } as AuthResponse;
}

export const getServerSession = cache(async function getServerSession(): Promise<AuthResponse | null> {
  // 1. Check local session cookie first (for local dev mode)
  try {
    const cookieStore = await cookies();
    const devCookie = cookieStore.get("mindspace_session");
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
      const timeout = setTimeout(() => controller.abort(), 200);

      try {
        const res = await fetch(`${authUrl}/api/auth/get-session`, {
          headers: { cookie },
          cache: "no-store",
          signal: controller.signal,
        });

        if (res.ok) {
          return await res.json();
        }
      } finally {
        clearTimeout(timeout);
      }
    }
  } catch {
    // Continue
  }

  // 3. If no session cookie or active BetterAuth session, return null so unauthenticated users see Sign In / Sign Up
  return null;
});
