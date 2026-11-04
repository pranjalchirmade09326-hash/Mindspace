import { MindspaceRoleDashboard } from "@/modules/client/mindspace-dashboard/MindspacePortal";

export default async function MindspaceRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  return <MindspaceRoleDashboard roleId={role} />;
}
