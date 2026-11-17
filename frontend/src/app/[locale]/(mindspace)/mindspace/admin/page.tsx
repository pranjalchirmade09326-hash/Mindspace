import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleOverviewData } from "@/modules/server/mindspace/role-dashboards";

export default async function AdminAliasOverviewPage() {
  await enforceMindspaceRoleAccess("admin");
  const overviewData = await loadRoleOverviewData("admin");
  return (
    <MindspaceRoleDashboard
      roleId="platform-administrator"
      overviewData={overviewData}
    />
  );
}
