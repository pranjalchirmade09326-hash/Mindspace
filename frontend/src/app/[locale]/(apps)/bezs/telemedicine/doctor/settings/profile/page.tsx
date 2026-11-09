import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function DoctorSettingsProfilePage() {
  const locale = await getLocale();
  redirect({ href: "/mindspace/listener/availability", locale });
}
