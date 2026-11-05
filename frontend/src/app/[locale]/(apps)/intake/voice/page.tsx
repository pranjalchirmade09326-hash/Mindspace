import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMindspaceAuthSession } from "@/modules/server/mindspace/api-client";
import { MindspaceIntakeGate } from "@/modules/client/mindspace/intake/MindspaceIntakeGate";
import { VoiceIntakeTest } from "@/modules/client/mindspace/intake/VoiceIntakeTest";

/**
 * Voice intake — real-time voice conversation with the intake agent.
 *
 * Route: /[locale]/(apps)/intake/voice
 */
export default async function VoiceIntakePage() {
  const locale = await getLocale();
  let session = null;
  try {
    session = await getMindspaceAuthSession();
  } catch {
    session = null;
  }
  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const userName = session.name ?? "Member";
  return (
    <MindspaceIntakeGate channel="voice" locale={locale}>
      {(intakeId) => (
        <VoiceIntakeTest
          intakeId={intakeId}
          basePath={`/${locale}/mindspace/member`}
          userName={userName}
        />
      )}
    </MindspaceIntakeGate>
  );
}
