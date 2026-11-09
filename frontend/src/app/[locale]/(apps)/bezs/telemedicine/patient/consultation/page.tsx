import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function ConsultationPage() {
  const locale = await getLocale();
  redirect({ href: "/mindspace/member/chat", locale });
}
