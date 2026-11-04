/**
 * Admin Organizations page loading skeleton.
 *
 * Route: /[locale]/(apps)/bezs/telemedicine/admin/(resources)/organizations/loading.tsx
 *
 * Reuses the existing DataTableSkeleton component with 6 columns and 8 rows to match
 * OrganizationsTable layout.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/modules/client/shared/components/tables";

export default function OrganizationsLoading() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* ── Page header skeleton ── */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* ── Data table skeleton (6 columns: select, name, type, telecom, status, actions) ── */}
      <DataTableSkeleton columnCount={6} rowCount={8} />
    </div>
  );
}
