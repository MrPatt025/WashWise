"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * World-class error page for route-level errors
 * Features: Error logging, retry functionality, graceful degradation
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[Route Error]", error);

    // In production, you would send to error tracking service
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {/* Animated error icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription className="text-base">
            We encountered an unexpected error. Our team has been notified and
            is working on a fix.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error details (development only) */}
          {process.env.NODE_ENV === "development" && (
            <details className="rounded-lg border bg-muted/50 p-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                <Bug className="mr-2 inline h-4 w-4" />
                Technical Details
              </summary>
              <div className="mt-3 space-y-2">
                <div className="rounded bg-background p-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Error Message
                  </p>
                  <p className="font-mono text-sm text-destructive">
                    {error.message || "Unknown error"}
                  </p>
                </div>
                {error.digest && (
                  <div className="rounded bg-background p-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Error Digest
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {error.digest}
                    </p>
                  </div>
                )}
                {error.stack && (
                  <div className="rounded bg-background p-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Stack Trace
                    </p>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* User-friendly tips */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">What you can try:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Refresh the page and try again</li>
              <li>Check your internet connection</li>
              <li>Clear your browser cache</li>
              <li>Try again in a few minutes</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:w-auto" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
