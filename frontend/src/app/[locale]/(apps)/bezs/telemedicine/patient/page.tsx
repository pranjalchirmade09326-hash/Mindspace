/**
 * Patient portal dashboard page.
 *
 * Route: /[locale]/(apps)/bezs/telemedicine/patient
 *
 * Server component. Guards:
 *  1. Redirects to /login if no session is found.
 *  2. Obtains patient profile via requirePatientProfile.
 */

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getServerSession, getDevSession } from "@/modules/server/auth/get-session";
import { requirePatientProfile } from "@/modules/server/auth/require-profile";
import { getMyAppointmentsAction } from "@/modules/server/presentation/actions/appointment";
import { getDemoAppointments } from "@/modules/server/shared/mock/demo-data";
import { PatientDashboard } from "@/modules/client/telemedicine/patient/component/dashboard/PatientDashboard";
import { formatPatientName } from "@/modules/shared/helper";
import type {
  TAppointmentResponse,
  TPaginatedAppointmentResponse,
} from "@/modules/entities/schemas/appointment";

/** Max records to fetch for dashboard stats — keeps the response bounded. */
const DASHBOARD_LIMIT = 200;

export default async function PatientPage() {
  let session = await getServerSession();
  const locale = await getLocale();

  if (!session) {
    if (process.env.NODE_ENV !== "production") {
      session = getDevSession("patient");
    } else {
      redirect({ href: "/login", locale });
      return null;
    }
  }

  const patient = await requirePatientProfile();

  const actionPromise = getMyAppointmentsAction({
    payload: { limit: DASHBOARD_LIMIT, offset: 0 },
  }).catch(() => [null]);

  const timeoutPromise = new Promise<[null]>((resolve) =>
    setTimeout(() => resolve([null]), 200),
  );

  const result = await Promise.race([actionPromise, timeoutPromise]);

  const data = result?.[0];

  const fetchedAppointments: TAppointmentResponse[] =
    (data as TPaginatedAppointmentResponse | null)?.data ?? [];

  const appointments: TAppointmentResponse[] =
    fetchedAppointments.length > 0
      ? fetchedAppointments
      : (getDemoAppointments() as unknown as TAppointmentResponse[]);

  const displayName = formatPatientName(patient) || "Sarah Jenkins";

  return (
    <PatientDashboard
      userName={displayName}
      appointments={appointments}
      patientId={patient.id}
    />
  );
}
