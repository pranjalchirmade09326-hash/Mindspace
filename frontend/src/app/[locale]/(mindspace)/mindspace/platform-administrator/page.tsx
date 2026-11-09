import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleOverviewData } from "@/modules/server/mindspace/role-dashboards";

export default async function AdminOverviewPage() {
  await enforceMindspaceRoleAccess("platform-administrator");
  const overviewData = await loadRoleOverviewData("platform-administrator");
  return (
    <MindspaceRoleDashboard
      roleId="platform-administrator"
      overviewData={overviewData}
    />
  );
}
