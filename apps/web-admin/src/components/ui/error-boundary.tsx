"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Error Boundary Class Component
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((props: FallbackProps) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
}

export interface FallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by ErrorBoundary:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      const hasChanged = resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index]);

      if (hasChanged) {
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (typeof fallback === "function") {
        return fallback({ error, errorInfo, resetError: this.resetError });
      }

      if (fallback) {
        return fallback;
      }

      return (
        <DefaultErrorFallback error={error} errorInfo={errorInfo} resetError={this.resetError} />
      );
    }

    return children;
  }
}

// ============================================================================
// Default Error Fallback Component
// ============================================================================

function DefaultErrorFallback({ error, errorInfo, resetError }: FallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const errorDetails = React.useMemo(() => {
    const details = [
      `Error: ${error.message}`,
      `\nStack Trace:`,
      error.stack || "No stack trace available",
    ];

    if (errorInfo?.componentStack) {
      details.push(`\nComponent Stack:`, errorInfo.componentStack);
    }

    return details.join("\n");
  }, [error, errorInfo]);

  const copyErrorDetails = async () => {
    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      console.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-lg dark:border-red-900/50 dark:bg-gray-900">
          {/* Header */}
          <div className="border-b border-red-200 bg-red-50 px-6 py-4 dark:border-red-900/50 dark:bg-red-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">
                  Something went wrong
                </h2>
                <p className="text-sm text-red-700 dark:text-red-400">
                  An error occurred in this component
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 p-6">
            {/* Error Message */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p className="break-all font-mono text-sm text-gray-800 dark:text-gray-200">
                {error.message || "Unknown error"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={resetError}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 transition-colors hover:text-gray-900 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Bug className="h-4 w-4" />
                Details
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", showDetails && "rotate-180")}
                />
              </button>
            </div>

            {/* Error Details (Collapsible) */}
            {showDetails && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Error Details
                  </span>
                  <button
                    onClick={copyErrorDetails}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="max-h-64 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-300 dark:bg-gray-950">
                  {errorDetails}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Page-Level Error Component
// ============================================================================

interface PageErrorProps {
  error?: Error;
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

export function PageError({
  error,
  title = "Page Error",
  message = "Something went wrong while loading this page.",
  showHomeButton = true,
  showRetryButton = true,
  onRetry,
}: PageErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>

        <p className="mb-6 text-gray-600 dark:text-gray-400">{error?.message || message}</p>

        <div className="flex justify-center gap-3">
          {showRetryButton && (
            <button
              onClick={onRetry || (() => window.location.reload())}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}

          {showHomeButton && (
            <button
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 404 Not Found Component
// ============================================================================

interface NotFoundProps {
  title?: string;
  message?: string;
}

export function NotFound({
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist or has been moved.",
}: NotFoundProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
      <div className="max-w-md text-center">
        <div className="mb-4 text-8xl font-bold text-gray-200 dark:text-gray-800">404</div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>

        <p className="mb-6 text-gray-600 dark:text-gray-400">{message}</p>

        <button
          onClick={() => (window.location.href = "/")}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Inline Error Display
// ============================================================================

interface InlineErrorProps {
  error: Error | string | null;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ error, onRetry, className }: InlineErrorProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
        <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-sm text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Error Toast (for API errors)
// ============================================================================

interface ErrorToastContentProps {
  title?: string;
  message: string;
  details?: string;
}

export function ErrorToastContent({ title = "Error", message, details }: ErrorToastContentProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </div>

      {details && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>

          {showDetails && (
            <pre className="mt-2 max-h-24 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
              {details}
            </pre>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Error Recovery Hook
// ============================================================================

interface UseErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onMaxRetriesReached?: () => void;
}

interface UseErrorRecoveryReturn {
  error: Error | null;
  retryCount: number;
  isMaxRetriesReached: boolean;
  setError: (error: Error | null) => void;
  retry: () => void;
  reset: () => void;
}

export function useErrorRecovery(options: UseErrorRecoveryOptions = {}): UseErrorRecoveryReturn {
  const { maxRetries = 3, retryDelay = 1000, onMaxRetriesReached } = options;

  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const isMaxRetriesReached = retryCount >= maxRetries;

  const retry = React.useCallback(() => {
    if (isMaxRetriesReached) {
      onMaxRetriesReached?.();
      return;
    }

    setTimeout(() => {
      setError(null);
      setRetryCount((prev) => prev + 1);
    }, retryDelay);
  }, [isMaxRetriesReached, retryDelay, onMaxRetriesReached]);

  const reset = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    error,
    retryCount,
    isMaxRetriesReached,
    setError,
    retry,
    reset,
  };
}

// ============================================================================
// Async Boundary (Suspense + Error Boundary)
// ============================================================================

interface AsyncBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode | ((props: FallbackProps) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function AsyncBoundary({ children, fallback, errorFallback, onError }: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      <React.Suspense fallback={fallback}>{children}</React.Suspense>
    </ErrorBoundary>
  );
}
