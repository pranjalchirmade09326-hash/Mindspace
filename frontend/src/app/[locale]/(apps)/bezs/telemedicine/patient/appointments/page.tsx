import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function PatientAppointmentsPage() {
  const locale = await getLocale();
  redirect({ href: "/mindspace/member/my-support", locale });
}
