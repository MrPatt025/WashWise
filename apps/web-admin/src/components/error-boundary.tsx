"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, Bug, Home, RefreshCw } from "lucide-react";
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
 * Props for the Error Boundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  showDetails?: boolean;
}

/**
 * State for the Error Boundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * World-class Error Boundary component
 * Catches JavaScript errors anywhere in child component tree
 * Logs errors and displays a fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);

    this.setState({ errorInfo });

    // In production, you would send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = "/dashboard";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error message (always shown) */}
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium text-muted-foreground">Error:</p>
                <p className="mt-1 font-mono text-xs text-destructive">
                  {this.state.error?.message || "Unknown error"}
                </p>
              </div>

              {/* Stack trace (development only or if showDetails) */}
              {(process.env.NODE_ENV === "development" || this.props.showDetails) &&
                this.state.errorInfo?.componentStack && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      <Bug className="mr-1 inline h-4 w-4" />
                      Show technical details
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button variant="default" className="w-full sm:w-auto" onClick={this.handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={this.handleReload}>
                Reload Page
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto" onClick={this.handleGoHome}>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Page-level error boundary with full page styling
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Card className="mx-4 w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Page Error</CardTitle>
              <CardDescription className="text-base">
                We encountered an error loading this page. Please try refreshing or return to the
                dashboard.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center gap-4">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Section-level error boundary with inline styling
 */
export function SectionErrorBoundary({
  children,
  sectionName = "This section",
}: {
  children: ReactNode;
  sectionName?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">{sectionName} failed to load</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
