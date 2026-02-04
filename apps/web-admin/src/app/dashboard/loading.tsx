import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard loading component
 * Shows skeleton UI during dashboard data fetching
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8 p-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border-0 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:bg-slate-900/80"
          >
            {/* Gradient accent line */}
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30" />
            </div>
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Content grid skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent machines */}
        <div className="relative overflow-hidden rounded-xl border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
          {/* Gradient accent line */}
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />
          <div className="border-b border-slate-100 p-6 dark:border-slate-800">
            <Skeleton className="h-6 w-40 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30" />
            <Skeleton className="mt-2 h-4 w-56" />
          </div>
          <div className="space-y-4 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <Skeleton className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="relative overflow-hidden rounded-xl border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
          {/* Gradient accent line */}
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />
          <div className="border-b border-slate-100 p-6 dark:border-slate-800">
            <Skeleton className="h-6 w-32 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <div className="space-y-4 p-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <Skeleton className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
