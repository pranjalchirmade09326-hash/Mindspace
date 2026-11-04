/**
 * Patient intake page.
 *
 * Route: /[locale]/(apps)/bezs/telemedicine/patient/intake
 *
 * Server component. Requires the Better Auth session and captures MindSpace
 * intake consent before mounting the chat.
 */

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMindspaceAuthSession } from "@/modules/server/mindspace/api-client";
import { MindspaceIntakeGate } from "@/modules/client/telemedicine/patient/component/intake/MindspaceIntakeGate";
import { TextIntake } from "@/modules/client/telemedicine/patient/component/intake/TextIntake";

/**
 * Patient intake page — renders the text chat intake directly.
 */
export default async function IntakePage() {
  const session = await getMindspaceAuthSession();
  const locale = await getLocale();

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const basePath = `/${locale}/bezs/telemedicine/patient`;
  const userName = session.name ?? "Member";

  return (
    <MindspaceIntakeGate channel="text" locale={locale}>
      {(intakeId) => (
        <TextIntake intakeId={intakeId} basePath={basePath} userName={userName} />
      )}
    </MindspaceIntakeGate>
  );
}
