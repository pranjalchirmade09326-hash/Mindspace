import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMindspaceAuthSession } from "@/modules/server/mindspace/api-client";
import { MindspaceIntakeGate } from "@/modules/client/telemedicine/patient/component/intake/MindspaceIntakeGate";
import { VoiceIntakeTest } from "@/modules/client/telemedicine/patient/component/intake/VoiceIntakeTest";

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
    <MindspaceIntakeGate channel="voice" locale={locale}>
      {(intakeId) => (
        <VoiceIntakeTest intakeId={intakeId} basePath={basePath} userName={userName} />
      )}
    </MindspaceIntakeGate>
  );
}
