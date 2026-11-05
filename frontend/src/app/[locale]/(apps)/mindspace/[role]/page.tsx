import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { getMindspaceDashboardData } from "@/modules/server/mindspace/dashboard-data";

export default async function MindspaceRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const live = await getMindspaceDashboardData(role);
  return <MindspaceRoleDashboard roleId={role} live={live} />;
}
