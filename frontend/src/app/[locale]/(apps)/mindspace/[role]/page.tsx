import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { getMindspaceDashboardData } from "@/modules/server/mindspace/dashboard-data";
import { getServerSession } from "@/modules/server/auth/get-session";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { resolveWorkspaceAccess } from "@/modules/shared/rbac";

/**
 * Server-side RBAC guard (defense in depth alongside src/middleware.ts):
 * a Member can only open /mindspace/member, a Listener only /mindspace/listener.
 * Unauthorized users are redirected to the sign-in page.
 */
export default async function MindspaceRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const locale = await getLocale();

  const session = await getServerSession();
  const userRole =
    (session?.user as any)?.role ?? session?.session?.activeRole ?? null;
  const access = resolveWorkspaceAccess(`/mindspace/${role}`, userRole);
  if (access === "/login") {
    redirect({ href: "/login", locale });
    return null;
  }
  if (access) {
    redirect({ href: access, locale });
    return null;
  }

  const live = await getMindspaceDashboardData(role);
  return <MindspaceRoleDashboard roleId={role} live={live} />;
}
