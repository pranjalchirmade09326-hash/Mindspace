/**
 * Patient portal loading skeleton.
 *
 * Route: /[locale]/(apps)/bezs/telemedicine/patient/loading.tsx
 *
 * Mirrors the exact 12-column grid and card layout of PatientDashboard.tsx (StatCards, SummaryChart,
 * TrendChart, RecentAppointments, VitalsInsights) to achieve zero layout shift (CLS).
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function PatientLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* ── Welcome heading skeleton ── */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* ── 12-column Grid Layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Stat Cards (xl:col-span-9, 4 cards in 2x2 grid) */}
        <div className="order-1 xl:order-1 xl:col-span-9 grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Summary Radial Chart (xl:col-span-3, h-[280px] xl:h-auto) */}
        <div className="order-4 xl:order-2 xl:col-span-3 h-[280px] xl:h-auto">
          <div className="rounded-xl border bg-card p-4 h-full flex flex-col justify-between items-center">
            <Skeleton className="h-5 w-32 self-start" />
            <Skeleton className="size-36 rounded-full my-auto" />
            <div className="w-full flex justify-around pt-2 border-t">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        {/* Monthly Trend Bar Chart (xl:col-span-6, h-80) */}
        <div className="order-3 xl:order-3 xl:col-span-6 h-80">
          <div className="rounded-xl border bg-card p-4 h-full flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="h-52 flex items-end justify-between gap-3 px-3 pb-2 pt-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 flex items-end justify-center gap-1.5 h-full">
                  <Skeleton className="w-3.5 rounded-t" style={{ height: `${25 + (i * 12) % 60}%` }} />
                  <Skeleton className="w-3.5 rounded-t opacity-70" style={{ height: `${15 + (i * 10) % 50}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between px-3 pt-2 border-t">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-7" />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Appointments Table (xl:col-span-6) */}
        <div className="order-2 xl:order-4 xl:col-span-6">
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── VitalsInsights Skeleton Card ── */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-6 w-12 rounded" />
            <Skeleton className="h-6 w-12 rounded" />
            <Skeleton className="h-6 w-12 rounded" />
          </div>
        </div>
        <Skeleton className="h-52 w-full rounded-md" />
      </div>
    </div>
  );
}
