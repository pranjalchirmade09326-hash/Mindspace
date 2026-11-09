import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleOverviewData } from "@/modules/server/mindspace/role-dashboards";

export default async function ListenerOverviewPage() {
  await enforceMindspaceRoleAccess("listener");
  const overviewData = await loadRoleOverviewData("listener");
  return <MindspaceRoleDashboard roleId="listener" overviewData={overviewData} />;
}
