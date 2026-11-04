/**
 * Telemedicine admin landing page.
 *
 * Layer: app / pages
 * Route: /[locale]/telemedicine/admin
 *
 * Redirects immediately to the Organizations sub-page, which is the primary
 * admin section.
 */

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

/**
 * Redirects /telemedicine/admin → /telemedicine/admin/organizations.
 */
export default async function TelemedicineAdminPage() {
  const locale = await getLocale();
  redirect({ href: "/bezs/telemedicine/admin/organizations", locale });
}
