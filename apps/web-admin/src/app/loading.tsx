import { Sparkles, WashingMachine } from "lucide-react";

/**
 * Root loading component
 * Shows during initial app load and auth check
 * Note: This is a Server Component - using Tailwind animations only
 */
export default function Loading() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-violet-950/20 dark:to-indigo-950/30">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-violet-500/10 to-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 blur-3xl" />
      </div>

      {/* Animated loader */}
      <div className="relative">
        {/* Outer glow rings */}
        <div className="absolute -inset-8 animate-pulse rounded-full bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-cyan-500/20 blur-xl" />
        <div className="absolute -inset-4 animate-ping rounded-full bg-gradient-to-r from-violet-500/30 to-indigo-500/30" />

        {/* Main icon container */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30">
          <WashingMachine className="h-10 w-10 animate-[spin_2s_linear_infinite] text-white" />
        </div>

        {/* Sparkle decorations */}
        <div className="absolute -right-2 -top-2 animate-pulse">
          <Sparkles className="h-5 w-5 text-violet-500" />
        </div>
      </div>

      {/* Brand */}
      <h1 className="mt-8 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent">
        WashWise
      </h1>
      <p className="mt-2 text-sm font-medium text-muted-foreground">Preparing your dashboard...</p>

      {/* Loading bar */}
      <div className="mt-8 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
        <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500" />
      </div>

      {/* Loading dots */}
      <div className="mt-4 flex gap-1.5">
        <div className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-500" />
      </div>
    </div>
  );
}
