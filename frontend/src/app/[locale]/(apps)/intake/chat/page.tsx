import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMindspaceAuthSession } from "@/modules/server/mindspace/api-client";
import { MindspaceIntakeGate } from "@/modules/client/mindspace/intake/MindspaceIntakeGate";
import { TextIntake } from "@/modules/client/mindspace/intake/TextIntake";

/**
 * Chat intake — AI-guided text conversation.
 *
 * Route: /[locale]/(apps)/intake/chat
 */
export default async function ChatIntakePage() {
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
    <MindspaceIntakeGate channel="text" locale={locale}>
      {(intakeId) => (
        <TextIntake
          intakeId={intakeId}
          basePath={`/${locale}/mindspace/member`}
          userName={userName}
        />
      )}
    </MindspaceIntakeGate>
  );
}
