import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function DoctorDashboardPage() {
  const locale = await getLocale();
  redirect({ href: "/mindspace/listener", locale });
}
