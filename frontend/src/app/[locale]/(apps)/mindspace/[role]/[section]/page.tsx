import { MindspaceRoleSection } from "@/modules/client/mindspace-dashboard/MindspacePortal";

export default async function MindspaceRoleSectionPage({
  params,
}: {
  params: Promise<{ role: string; section: string }>;
}) {
  const { role, section } = await params;
  return <MindspaceRoleSection roleId={role} sectionId={section} />;
}
