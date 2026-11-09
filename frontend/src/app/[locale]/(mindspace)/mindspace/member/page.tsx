import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleOverviewData } from "@/modules/server/mindspace/role-dashboards";

export default async function MemberOverviewPage() {
  await enforceMindspaceRoleAccess("member");
  const overviewData = await loadRoleOverviewData("member");
  return <MindspaceRoleDashboard roleId="member" overviewData={overviewData} />;
}

