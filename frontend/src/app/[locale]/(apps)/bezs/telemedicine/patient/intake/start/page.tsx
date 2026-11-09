import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMindspaceAuthSession } from "@/modules/server/mindspace/api-client";
import { IntakeChoice } from "@/modules/client/telemedicine/patient/component/intake/IntakeChoice";

export default async function IntakeStartPage() {
  const session = await getMindspaceAuthSession();
  const locale = await getLocale();

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  return <IntakeChoice />;
}
