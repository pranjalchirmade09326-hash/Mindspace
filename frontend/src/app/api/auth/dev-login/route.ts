import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Dev-login — creates a local `mindspace_session` cookie for one of the five
 * MindSpace roles so the app shell and dashboards can be previewed without a
 * live identity provider. Development only; production builds ignore it.
 *
 * POST body: { role?: "member" | "listener" | "listener-supervisor" |
 *   "safety-operations" | "platform-administrator", name?, email?,
 *   redirectUrl?, locale? }
 */

const MINDSpace_ROLES = [
  "member",
  "listener",
  "listener-supervisor",
  "safety-operations",
  "platform-administrator",
] as const;

type MindspaceRole = (typeof MINDSpace_ROLES)[number];

const ROLE_DEFAULTS: Record<MindspaceRole, { name: string; email: string }> = {
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawRole = (body.role || "member").toString().trim().toLowerCase();
    const role: MindspaceRole = (MINDSpace_ROLES as readonly string[]).includes(rawRole)
      ? (rawRole as MindspaceRole)
      : "member";
    const locale = (body.locale || "en").toString().trim().toLowerCase();
    const defaults = ROLE_DEFAULTS[role];
    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : defaults.name;
    const email =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim()
        : defaults.email;

    const defaultRedirect = `/mindspace/${role}`;
    let redirectPath = (
      typeof body.redirectUrl === "string" && body.redirectUrl
        ? body.redirectUrl
        : defaultRedirect
    ).replace(/^\/(?:en|hi|ta)(?:\/|$)/, "/");
    if (!redirectPath.startsWith("/")) redirectPath = `/${redirectPath}`;
    redirectPath = redirectPath.replace(/\/+/g, "/");
    const fullRedirectUrl = `/${locale}${redirectPath}`;

    const sessionData = {
      user: {
        id: `usr-${role}-01`,
        name,
        email,
        emailVerified: true,
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        username: role,
        displayUsername: name,
        twoFactorEnabled: false,
        role,
        banned: false,
        banReason: null,
        banExpires: null,
      },
      session: {
        id: `sess-${role}-01`,
        token: "dev-jwt-token",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ipAddress: "127.0.0.1",
        userAgent: "Local Dev Browser",
        userId: `usr-${role}-01`,
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
        activeOrganizationRoles: [role],
        activeRoleId: `role-${role}`,
        activeRole: role,
        activeRoleRedirectUrl: redirectPath,
      },
    };

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    };

    const cookieStore = await cookies();
    cookieStore.set("mindspace_session", JSON.stringify(sessionData), cookieOptions);
    cookieStore.set("dev_token", "dev-jwt-token", cookieOptions);
    cookieStore.set("activeRoleRedirectUrl", fullRedirectUrl, cookieOptions);

    const response = NextResponse.json({ success: true, redirectUrl: fullRedirectUrl });
    response.cookies.set("mindspace_session", JSON.stringify(sessionData), cookieOptions);
    response.cookies.set("dev_token", "dev-jwt-token", cookieOptions);
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
