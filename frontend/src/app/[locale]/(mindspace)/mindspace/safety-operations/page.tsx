import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleOverviewData } from "@/modules/server/mindspace/role-dashboards";

export default async function SafetyOperationsOverviewPage() {
  await enforceMindspaceRoleAccess("safety-operations");
  const overviewData = await loadRoleOverviewData("safety-operations");
  return (
    <MindspaceRoleDashboard
      roleId="safety-operations"
      overviewData={overviewData}
    />
  );
}
