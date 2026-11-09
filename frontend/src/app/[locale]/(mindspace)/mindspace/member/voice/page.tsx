import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMindspaceAuthSession } from "@/modules/server/mindspace/api-client";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { MindspaceVoiceIntake } from "@/modules/client/mindspace/intake/MindspaceVoiceIntake";

export default async function MemberVoicePage() {
  await enforceMindspaceRoleAccess("member");

  const session = await getMindspaceAuthSession();
  const locale = await getLocale();

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const basePath = `/${locale}/mindspace/member`;

  return (
    <MindspaceVoiceIntake
      locale={locale}
      basePath={basePath}
      userName={session.name ?? "Member"}
    />
  );
}
