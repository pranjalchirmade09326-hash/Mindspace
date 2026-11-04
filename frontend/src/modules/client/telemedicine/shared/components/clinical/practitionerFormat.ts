/**
 * practitionerFormat — practitioner display-name formatting shared by the
 * doctor portal's dashboard screens.
 *
 * Layer: client / telemedicine / shared / components / clinical
 *
 * Formatting only, no data access, so this is safe to import anywhere — see
 * clinicalFormat.ts, its sibling in this file.
 */

import type { TPractitionerNameResponse } from "@/modules/entities/schemas/practitioner";

/**
 * Derives a practitioner's display name from their FHIR Practitioner.name
 * entries.
 *
 * @param name - TPractitionerResponse.name array, or null/undefined.
 * @returns Display name string, or "Doctor" as fallback.
 */
export function getPractitionerDisplayName(
  name?: TPractitionerNameResponse[] | null,
): string {
  if (!name || name.length === 0) return "Doctor";
  const first = name[0];
  if (first.text && first.text.trim()) return first.text.trim();
  const parts = [...(first.given ?? []), first.family ?? ""].filter(Boolean);
  if (parts.length === 0) return "Doctor";
  const prefix = Array.isArray(first.prefix)
    ? first.prefix[0]
    : typeof first.prefix === "string"
    ? first.prefix
    : "Dr.";
  return `${prefix} ${parts.join(" ")}`.trim();
}
