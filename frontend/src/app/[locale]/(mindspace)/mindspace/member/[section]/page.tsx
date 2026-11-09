import { MindspaceRoleSection } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleSectionData } from "@/modules/server/mindspace/role-dashboards";

export default async function MemberSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await enforceMindspaceRoleAccess("member");
  const sectionData = await loadRoleSectionData("member", section);
  return (
    <MindspaceRoleSection
      roleId="member"
      sectionId={section}
      sectionData={sectionData}
    />
  );
}

