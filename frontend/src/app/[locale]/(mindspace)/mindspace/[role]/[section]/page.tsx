import { MindspaceRoleSection } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleSectionData } from "@/modules/server/mindspace/role-dashboards";

export default async function MindspaceRoleSectionPage({
  params,
}: {
  params: Promise<{ role: string; section: string }>;
}) {
  const { role, section } = await params;
  await enforceMindspaceRoleAccess(role);
  const sectionData = await loadRoleSectionData(role, section);
  return <MindspaceRoleSection roleId={role} sectionId={section} sectionData={sectionData} />;
}
