import { WashingMachine } from "lucide-react";

/**
 * Root loading component
 * Shows during initial app load and auth check
 * Note: This is a Server Component - using Tailwind animations only
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20">
      {/* Animated loader */}
      <div className="relative">
        <div className="absolute -inset-4 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <WashingMachine className="h-8 w-8 text-primary animate-[spin_2s_linear_infinite]" />
        </div>
      </div>

      {/* Brand */}
      <h1 className="mt-8 text-2xl font-bold text-foreground">WashWise</h1>
      <p className="mt-2 text-sm text-muted-foreground">Loading...</p>

      {/* Loading bar */}
      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 rounded-full bg-primary animate-[shimmer_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
