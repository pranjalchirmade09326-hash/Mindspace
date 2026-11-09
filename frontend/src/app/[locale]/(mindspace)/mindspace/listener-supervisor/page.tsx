import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleOverviewData } from "@/modules/server/mindspace/role-dashboards";

export default async function SupervisorOverviewPage() {
  await enforceMindspaceRoleAccess("listener-supervisor");
  const overviewData = await loadRoleOverviewData("listener-supervisor");
  return (
    <MindspaceRoleDashboard
      roleId="listener-supervisor"
      overviewData={overviewData}
    />
  );
}
