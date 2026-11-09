import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMindspaceAuthSession } from "@/modules/server/mindspace/api-client";
import { MindspaceVoiceIntake } from "@/modules/client/telemedicine/patient/component/intake/MindspaceVoiceIntake";

export default async function VoiceIntakePage() {
  const session = await getMindspaceAuthSession();
  const locale = await getLocale();

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const basePath = `/${locale}/bezs/telemedicine/patient`;
  const userName = session.name ?? "Member";

  return (
    <MindspaceVoiceIntake
      locale={locale}
      basePath={basePath}
      userName={userName}
    />
  );
}
