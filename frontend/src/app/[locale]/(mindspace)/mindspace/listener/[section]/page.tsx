import { MindspaceRoleSection } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleSectionData } from "@/modules/server/mindspace/role-dashboards";

export default async function ListenerSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await enforceMindspaceRoleAccess("listener");
  const sectionData = await loadRoleSectionData("listener", section);
  return (
    <MindspaceRoleSection
      roleId="listener"
      sectionId={section}
      sectionData={sectionData}
    />
  );
}
