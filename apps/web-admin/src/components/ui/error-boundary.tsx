"use client";

import * as React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";
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

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
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
      const hasChanged = resetKeys?.some(
        (key, index) => key !== prevProps.resetKeys?.[index],
      );

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
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
        />
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
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-red-200 dark:border-red-900/50 overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
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
          <div className="p-6 space-y-4">
            {/* Error Message */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                {error.message || "Unknown error"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={resetError}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors focus:outline-none"
              >
                <Bug className="w-4 h-4" />
                Details
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    showDetails && "rotate-180",
                  )}
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
                    className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto text-xs text-gray-300 max-h-64">
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error?.message || message}
        </p>

        <div className="flex justify-center gap-3">
          {showRetryButton && (
            <button
              onClick={onRetry || (() => window.location.reload())}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}

          {showHomeButton && (
            <button
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <Home className="w-4 h-4" />
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-gray-200 dark:text-gray-800 mb-4">
          404
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

        <button
          onClick={() => (window.location.href = "/")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
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
        "flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
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

export function ErrorToastContent({
  title = "Error",
  message,
  details,
}: ErrorToastContentProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
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
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-24">
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

export function useErrorRecovery(
  options: UseErrorRecoveryOptions = {},
): UseErrorRecoveryReturn {
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

export function AsyncBoundary({
  children,
  fallback,
  errorFallback,
  onError,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      <React.Suspense fallback={fallback}>{children}</React.Suspense>
    </ErrorBoundary>
  );
}
