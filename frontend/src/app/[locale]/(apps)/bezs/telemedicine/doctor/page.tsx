/**
 * Doctor portal landing page.
 *
 * Route: /[locale]/(apps)/bezs/telemedicine/doctor
 *
 * Redirects immediately to the practice-overview dashboard page.
 */

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function DoctorPage() {
  const locale = await getLocale();
  redirect({ href: "/mindspace/listener", locale });
}
