import { MindspaceRoleSection } from "@/modules/client/mindspace-dashboard/MindspacePortal";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { loadRoleSectionData } from "@/modules/server/mindspace/role-dashboards";

export default async function SafetyOperationsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await enforceMindspaceRoleAccess("safety-operations");
  const sectionData = await loadRoleSectionData("safety-operations", section);
  return (
    <MindspaceRoleSection
      roleId="safety-operations"
      sectionId={section}
      sectionData={sectionData}
    />
  );
}
