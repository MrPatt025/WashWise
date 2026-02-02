"use client";

import Link from "next/link";
import { Home, ArrowLeft, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * World-class 404 Not Found page
 * Features: Modern design, clear navigation, helpful suggestions
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      {/* Animated washing machine icon */}
      <div className="relative mb-8">
        <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/10" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/5">
          <WashingMachine
            className="h-12 w-12 animate-spin text-primary"
            style={{ animationDuration: "3s" }}
          />
        </div>
      </div>

      {/* Error code */}
      <h1 className="text-8xl font-bold tracking-tighter text-foreground/10">404</h1>

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
        <Button asChild size="lg">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
        <Button variant="outline" size="lg" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>

      {/* Helpful links */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">Looking for something specific?</p>
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/dashboard/machines" className="text-primary hover:underline">
            Machines
          </Link>
          <Link href="/dashboard/settings" className="text-primary hover:underline">
            Settings
          </Link>
          <Link href="/login" className="text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
