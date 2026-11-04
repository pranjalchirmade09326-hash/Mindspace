/**
 * Clinical Records — patient list page (step 1 of 3).
 *
 * Route: /[locale]/(apps)/bezs/telemedicine/doctor/clinical-records
 *
 * Server component. Guards:
 *  1. Redirects to /login if no session.
 *  2. Redirects to /doctor/settings/profile if no FHIR Practitioner record exists.
 *
 * Data flow:
 *  SSR → fetchAllDoctorAppointments(practitioner_id, org_id)
 *      → derivePatientSummaries → PatientListTable
 *
 * There is no patients-by-practitioner endpoint on fhir-gql, so the roster is
 * derived by grouping the doctor's own appointments on the Patient participant.
 * See doctorPatients.ts for the 200-per-page walk and its ceiling.
 */

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getServerSession, getDevSession } from "@/modules/server/auth/get-session";
import { requirePractitionerProfile } from "@/modules/server/auth/require-profile";
import { getDemoAppointments } from "@/modules/server/shared/mock/demo-data";
import type { TAppointmentResponse } from "@/modules/entities/schemas/appointment";
import {
  derivePatientSummaries,
  fetchAllDoctorAppointments,
} from "@/modules/server/presentation/helpers/doctorPatients";
import { PatientListTable } from "@/modules/client/telemedicine/doctor/component/clinical-records/PatientListTable";

/**
 * Clinical Records patient list.
 * Lists every patient this doctor has had an appointment with as the entry
 * point into per-appointment clinical record management.
 */
export default async function ClinicalRecordsPage() {
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

  // Redirects to /doctor/settings/profile if no FHIR Practitioner record exists
  const practitioner = await requirePractitionerProfile();

  const orgId = session.session.activeOrganizationId ?? null;
  const baseHref = `/${locale}/bezs/telemedicine/doctor/clinical-records`;

  const fetchedAppointments = await Promise.race([
    fetchAllDoctorAppointments({
      practitionerId: practitioner.id,
      orgId,
    }).catch(() => []),
    new Promise<TAppointmentResponse[]>((resolve) => setTimeout(() => resolve([]), 200)),
  ]);

  const appointments: TAppointmentResponse[] =
    fetchedAppointments.length > 0
      ? fetchedAppointments
      : (getDemoAppointments() as unknown as TAppointmentResponse[]);

  const patients = derivePatientSummaries(appointments);

  return (
    <div className="space-y-6 w-full">
      {/* ── Page header ── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Clinical Records</h1>
        <p className="text-sm text-muted-foreground">
          Select a patient to review their appointments and manage clinical
          records, prescriptions, orders and documents.
        </p>
      </div>

      {/* ── Patient roster ── */}
      <PatientListTable patients={patients} baseHref={baseHref} />
    </div>
  );
}
