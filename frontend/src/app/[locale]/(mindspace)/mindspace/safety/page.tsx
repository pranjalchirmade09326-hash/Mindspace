import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleOverviewData } from "@/modules/server/mindspace/role-dashboards";

export default async function SafetyAliasOverviewPage() {
  await enforceMindspaceRoleAccess("safety");
  const overviewData = await loadRoleOverviewData("safety");
  return (
    <MindspaceRoleDashboard
      roleId="safety-operations"
      overviewData={overviewData}
    />
  );
}
