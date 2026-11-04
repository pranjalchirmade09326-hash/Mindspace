/**
 * Doctor appointments list page.
 *
 * Route: /[locale]/(apps)/bezs/telemedicine/doctor/appointments
 *
 * Server component. Guards:
 *  1. Redirects to /login if no session.
 *  2. Obtains practitioner profile via requirePractitionerProfile.
 */

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getServerSession, getDevSession } from "@/modules/server/auth/get-session";
import { requirePractitionerProfile } from "@/modules/server/auth/require-profile";
import { AppointmentDemo } from "@/modules/client/telemedicine/doctor/component/appointment-demo/AppointmentDemo";
import { fetchDemoTabPage } from "@/modules/client/telemedicine/doctor/component/appointment-demo/demoQueries";
import { DoctorModalProvider } from "@/modules/client/telemedicine/doctor/provider/DoctorModalProvider";

const INITIAL_PAGE_SIZE = 10;

export default async function DoctorAppointmentsPage() {
  let session = await getServerSession();
  const locale = await getLocale();

  if (!session) {
    if (process.env.NODE_ENV !== "production") {
      session = getDevSession("doctor");
    } else {
      redirect({ href: "/login", locale });
      return null;
    }
  }

  const practitioner = await requirePractitionerProfile();

  const orgId = session.session.activeOrganizationId ?? null;
  const base = `/${locale}/bezs/telemedicine/doctor`;

  const initialToday = await Promise.race([
    fetchDemoTabPage({
      tab: "today",
      practitionerId: practitioner.id,
      orgId,
      pageIndex: 0,
      pageSize: INITIAL_PAGE_SIZE,
      sort: "date",
    }).catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), 200)),
  ]);

  return (
    <>
      <AppointmentDemo
        initialToday={initialToday as any}
        practitionerId={practitioner.id}
        orgId={orgId}
        viewHref={`${base}/appointments`}
        clinicalRecordsHref={`${base}/records`}
      />

      <DoctorModalProvider />
    </>
  );
}
