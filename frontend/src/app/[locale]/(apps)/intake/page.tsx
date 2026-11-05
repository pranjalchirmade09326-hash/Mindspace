import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMindspaceAuthSession } from "@/modules/server/mindspace/api-client";
import { IntakeChoice } from "@/modules/client/mindspace/intake/IntakeChoice";

/**
 * Intake channel picker — chat or voice.
 *
 * Route: /[locale]/(apps)/intake
 */
export default async function IntakeIndexPage() {
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
  return <IntakeChoice />;
}
