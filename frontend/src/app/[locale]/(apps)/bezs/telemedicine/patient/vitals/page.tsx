import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function VitalsPage() {
  const locale = await getLocale();
  redirect({ href: "/mindspace/member/mood", locale });
}
