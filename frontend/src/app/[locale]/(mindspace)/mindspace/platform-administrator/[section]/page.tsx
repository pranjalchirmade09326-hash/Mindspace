import { MindspaceRoleSection } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleSectionData } from "@/modules/server/mindspace/role-dashboards";

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await enforceMindspaceRoleAccess("platform-administrator");
  const sectionData = await loadRoleSectionData("platform-administrator", section);
  return (
    <MindspaceRoleSection
      roleId="platform-administrator"
      sectionId={section}
      sectionData={sectionData}
    />
  );
}
