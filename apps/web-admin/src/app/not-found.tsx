"use client";

import Link from "next/link";
import { ArrowLeft, Home, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * World-class 404 Not Found page
 * Features: Modern design, clear navigation, helpful suggestions
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white px-4 dark:from-slate-950 dark:to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      {/* Animated washing machine icon */}
      <div className="relative mb-8">
        <div className="absolute -inset-6 animate-pulse rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 blur-xl" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl">
          <WashingMachine
            className="h-14 w-14 animate-spin text-white"
            style={{ animationDuration: "3s" }}
          />
        </div>
      </div>

      {/* Error code */}
      <h1 className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-9xl font-bold tracking-tighter text-transparent">
        404
      </h1>

      {/* Message */}
      <div className="mt-4 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Oops! The page you&apos;re looking for seems to have gone through the spin cycle and
          disappeared. Let&apos;s get you back on track.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        >
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => window.history.back()}
          className="hover:border-violet-300 hover:bg-violet-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>

      {/* Helpful links */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">Looking for something specific?</p>
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm">
          <Link
            href="/dashboard/machines"
            className="text-violet-600 hover:text-violet-700 hover:underline"
          >
            Machines
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-violet-600 hover:text-violet-700 hover:underline"
          >
            Settings
          </Link>
          <Link href="/login" className="text-violet-600 hover:text-violet-700 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
