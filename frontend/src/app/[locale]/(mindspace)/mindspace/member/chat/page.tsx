import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMindspaceAuthSession } from "@/modules/server/mindspace/api-client";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { MindspaceTextIntake } from "@/modules/client/mindspace/intake/MindspaceTextIntake";

export default async function MemberChatPage() {
  await enforceMindspaceRoleAccess("member");

  const session = await getMindspaceAuthSession();
  const locale = await getLocale();

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const basePath = `/${locale}/mindspace/member`;

  return (
    <MindspaceTextIntake
      locale={locale}
      basePath={basePath}
      userName={session.name ?? "Member"}
    />
  );
}
