import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleOverviewData } from "@/modules/server/mindspace/role-dashboards";

export default async function MindspaceRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  await enforceMindspaceRoleAccess(role);
  const overviewData = await loadRoleOverviewData(role);
  return <MindspaceRoleDashboard roleId={role} overviewData={overviewData} />;
}
