import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getServerSession } from "@/modules/server/auth/get-session";
import { isMindspaceSigninRole, ROLE_HOME } from "@/modules/shared/rbac";
import { MindspaceWorkspaceIndex } from "@/modules/client/mindspace-dashboard/MindspacePortal";

/**
 * Workspace index. A signed-in Member or Listener is routed strictly to their
 * own dashboard; only signed-out visitors (or staff preview roles) see the
 * workspace picker.
 */
export default async function MindspaceWorkspacePage() {
  const locale = await getLocale();
  const session = await getServerSession();
  const userRole = (session?.user as any)?.role ?? session?.session?.activeRole ?? null;

  if (isMindspaceSigninRole(userRole)) {
    redirect({ href: ROLE_HOME[userRole], locale });
    return null;
  }

  return <MindspaceWorkspaceIndex />;
}
