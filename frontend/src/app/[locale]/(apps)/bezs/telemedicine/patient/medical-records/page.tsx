import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function MedicalRecordsPage() {
  const locale = await getLocale();
  redirect({ href: "/mindspace/member/wellbeing", locale });
}
