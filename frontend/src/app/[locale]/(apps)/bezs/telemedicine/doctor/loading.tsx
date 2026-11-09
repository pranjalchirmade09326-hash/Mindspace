/**
 * Doctor dashboard loading skeleton.
 *
 * Route: /[locale]/(apps)/bezs/telemedicine/doctor/loading.tsx
 *
 * Enables sub-second Next.js streaming for doctor dashboard routes,
 * rendering instant skeleton layout while server actions settle.
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* ── Welcome heading skeleton ── */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* ── Stat cards grid (5 cards: Today, This Week, Pending, Completed, Cancelled) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* ── Two-column layout (Trend Chart + Recent Appointments | Status Chart + Practice Profile + Org Activity) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Appointment Volume Trend Chart skeleton */}
          <div className="rounded-xl border bg-card p-4 h-80 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-20" />
            </div>
            {/* Shimmering chart bars placeholder */}
            <div className="h-52 flex items-end justify-between gap-4 px-4 pb-2 pt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 flex items-end justify-center gap-1.5 h-full">
                  <Skeleton className="w-4 rounded-t" style={{ height: `${30 + (i * 11) % 55}%` }} />
                  <Skeleton className="w-4 rounded-t opacity-70" style={{ height: `${20 + (i * 13) % 45}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between px-4 pt-2 border-t">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8" />
              ))}
            </div>
          </div>

          {/* Recent Appointments Table skeleton */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
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

        {/* Right column */}
        <div className="space-y-6">
          {/* Status Donut Chart skeleton */}
          <div className="rounded-xl border bg-card p-4 h-80 flex flex-col justify-between">
            <Skeleton className="h-5 w-36 mb-2" />
            <div className="flex-1 flex items-center justify-center">
              <Skeleton className="size-40 rounded-full" />
            </div>
            <div className="flex justify-center gap-4 pt-2 border-t">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          {/* Practice Profile Card skeleton */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t">
              <Skeleton className="h-4 w-28" />
              <div className="flex gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="size-8 rounded-md" />
                ))}
              </div>
            </div>
          </div>

          {/* Org Activity Panel skeleton */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <Skeleton className="h-5 w-44" />
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
