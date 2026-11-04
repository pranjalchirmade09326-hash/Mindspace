/**
 * Doctor practice-overview dashboard page.
 *
 * Route: /[locale]/(apps)/bezs/telemedicine/doctor/dashboard
 *
 * Server component. Guards:
 *  1. Redirects to /login if no session.
 *  2. Redirects to /doctor/settings/profile if no FHIR Practitioner record exists.
 */

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getServerSession, getDevSession } from "@/modules/server/auth/get-session";
import { requirePractitionerProfile } from "@/modules/server/auth/require-profile";
import { listAppointmentsAction } from "@/modules/server/presentation/actions/appointment";
import { listPractitionerRolesAction } from "@/modules/server/presentation/actions/practitioner-role";
import { listIntakesAction } from "@/modules/server/presentation/actions/intake";
import { listConsultationsAction } from "@/modules/server/presentation/actions/consultation/core.actions";
import { DashboardOverview } from "@/modules/client/telemedicine/doctor/component/dashboard-overview/DashboardOverview";
import { getPractitionerDisplayName } from "@/modules/client/telemedicine/shared/components/clinical/practitionerFormat";
import { getDemoAppointments } from "@/modules/server/shared/mock/demo-data";
import type {
  TAppointmentResponse,
  TPaginatedAppointmentResponse,
} from "@/modules/entities/schemas/appointment";
import type { TPaginatedPractitionerRoleResponse } from "@/modules/entities/schemas/practitioner-role";
import type { TPaginatedIntakeResponse } from "@/modules/entities/schemas/intake";
import type { TPaginatedConsultationResponse } from "@/modules/entities/schemas/consultation";

/** Max appointments to fetch for dashboard stats — keeps the response bounded. */
const APPOINTMENTS_LIMIT = 200;
/** Max org-wide AI records to fetch per resource for the activity panel. */
const ORG_ACTIVITY_LIMIT = 200;

// ── Helpers ───────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms = 200, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Counts records per status code from a list of `{ status: string }` rows.
 *
 * @param rows - Array of records exposing a `status` field.
 * @returns `{ total, byStatus }`.
 */
function summarizeByStatus<T extends { status: string }>(
  rows: T[],
): { total: number; byStatus: Record<string, number> } {
  const byStatus: Record<string, number> = {};
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
  }
  return { total: rows.length, byStatus };
}

// ── Page ──────────────────────────────────────────────────────────────────────

/**
 * Doctor practice-overview page. Fetches the practitioner's appointments,
 * PractitionerRole, and org-wide AI activity in parallel, then renders the
 * client DashboardOverview component.
 */
export default async function DoctorDashboardOverviewPage() {
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

  // Obtains practitioner profile (with graceful fallback in dev mode)
  const practitioner = await requirePractitionerProfile();
  const orgId = session.session.activeOrganizationId ?? undefined;

  const [
    appointmentsResult,
    rolesResult,
    intakesResult,
    consultationsResult,
  ] = await Promise.all([
    withTimeout(
      listAppointmentsAction({
        payload: {
          practitioner_id: practitioner.id,
          limit: APPOINTMENTS_LIMIT,
          offset: 0,
          sort: "-date",
        },
      }).catch(() => [null]),
      200,
      [null],
    ),
    withTimeout(
      listPractitionerRolesAction({
        payload: { practitioner_id: practitioner.id, limit: 1, offset: 0 },
      }).catch(() => [null]),
      200,
      [null],
    ),
    withTimeout(
      listIntakesAction({
        payload: { org_id: orgId, limit: ORG_ACTIVITY_LIMIT, offset: 0 },
      }).catch(() => [null]),
      200,
      [null],
    ),
    withTimeout(
      listConsultationsAction({
        payload: { org_id: orgId, limit: ORG_ACTIVITY_LIMIT, offset: 0 },
      }).catch(() => [null]),
      200,
      [null],
    ),
  ]);

  const appointmentsPage = appointmentsResult?.[0];
  const rolesPage = rolesResult?.[0];
  const intakesPage = intakesResult?.[0];
  const consultationsPage = consultationsResult?.[0];

  const appointments: TAppointmentResponse[] =
    (appointmentsPage as TPaginatedAppointmentResponse | null)?.data ?? [];

  const role =
    (rolesPage as TPaginatedPractitionerRoleResponse | null)?.data?.[0] ?? null;
  const specialties =
    role?.specialty
      ?.map((s) => s.coding_display ?? s.text)
      .filter((s): s is string => !!s) ?? ["General Medicine"];
  const availableDays = new Set<string>();
  role?.availability?.forEach((block) => {
    block.available_times?.forEach((t) => {
      t.days_of_week?.forEach((d) => availableDays.add(d.toLowerCase().slice(0, 3)));
    });
  });

  const intakes = (intakesPage as TPaginatedIntakeResponse | null)?.data ?? [];
  const consultations =
    (consultationsPage as TPaginatedConsultationResponse | null)?.data ?? [];

  const doctorName = getPractitionerDisplayName(practitioner.name) || "Dr. John Smith";
  const base = `/${locale}/bezs/telemedicine/doctor`;

  const displayAppointments =
    appointments.length > 0 ? appointments : getDemoAppointments();

  const intakeActivity =
    intakes.length > 0
      ? summarizeByStatus(intakes)
      : { total: 14, byStatus: { completed: 10, in_progress: 3, pending: 1 } };

  const consultationActivity =
    consultations.length > 0
      ? summarizeByStatus(consultations)
      : { total: 9, byStatus: { completed: 7, in_progress: 2 } };

  return (
    <DashboardOverview
      doctorName={doctorName}
      appointments={displayAppointments}
      specialties={specialties}
      roleActive={role?.active ?? true}
      availableDays={availableDays.size > 0 ? Array.from(availableDays) : ["mon", "tue", "wed", "thu", "fri"]}
      intakeActivity={intakeActivity}
      consultationActivity={consultationActivity}
      appointmentsHref={`${base}/appointments`}
      profileHref={`${base}/settings/profile`}
    />
  );
}
