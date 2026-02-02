import { Skeleton } from "@/components/ui/skeleton";

/**
 * Login page loading component
 */
export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="mt-4 h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>

        {/* Card */}
        <div className="rounded-lg border bg-card p-8 shadow-lg">
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-56" />
          </div>

          <div className="mt-6 space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Tenant field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Button */}
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Skeleton className="mx-auto h-4 w-48" />
        </div>
      </div>
    </div>
  );
}
