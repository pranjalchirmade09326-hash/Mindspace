import { MindspaceRoleSection } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { getMindspaceDashboardData } from "@/modules/server/mindspace/dashboard-data";
import { getServerSession } from "@/modules/server/auth/get-session";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { resolveWorkspaceAccess } from "@/modules/shared/rbac";

/**
 * Server-side RBAC guard (defense in depth alongside src/middleware.ts):
 * a Member can only open sections under /mindspace/member, a Listener only
 * under /mindspace/listener. Unauthorized users go to the sign-in page.
 */
export default async function MindspaceRoleSectionPage({
  params,
}: {
  params: Promise<{ role: string; section: string }>;
}) {
  const { role, section } = await params;
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
  return <MindspaceRoleSection roleId={role} sectionId={section} live={live} />;
}
