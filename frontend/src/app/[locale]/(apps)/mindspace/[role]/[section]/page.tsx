import { MindspaceRoleSection } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { getMindspaceDashboardData } from "@/modules/server/mindspace/dashboard-data";

export default async function MindspaceRoleSectionPage({
  params,
}: {
  params: Promise<{ role: string; section: string }>;
}) {
  const { role, section } = await params;
  const live = await getMindspaceDashboardData(role);
  return <MindspaceRoleSection roleId={role} sectionId={section} live={live} />;
}
