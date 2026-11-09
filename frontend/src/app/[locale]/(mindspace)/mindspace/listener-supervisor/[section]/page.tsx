import { MindspaceRoleSection } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleSectionData } from "@/modules/server/mindspace/role-dashboards";

export default async function SupervisorSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await enforceMindspaceRoleAccess("listener-supervisor");
  const sectionData = await loadRoleSectionData("listener-supervisor", section);
  return (
    <MindspaceRoleSection
      roleId="listener-supervisor"
      sectionId={section}
      sectionData={sectionData}
    />
  );
}
