import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMindspaceAuthSession } from "@/modules/server/mindspace/api-client";
import { enforceMindspaceRoleAccess } from "@/modules/server/mindspace/role-guard";
import { WellbeingCompanionChat } from "@/modules/client/mindspace/companion/WellbeingCompanionChat";

export default async function MemberCompanionPage() {
  await enforceMindspaceRoleAccess("member");

  const session = await getMindspaceAuthSession();
  const locale = await getLocale();

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const basePath = `/${locale}/mindspace/member`;

  return (
    <WellbeingCompanionChat
      userName={session.name ?? "Member"}
      basePath={basePath}
    />
  );
}
