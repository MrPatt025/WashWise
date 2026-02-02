"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// ============================================================================
// Loading Spinner
// ============================================================================

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const spinnerSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export function LoadingSpinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-blue-600 dark:text-blue-400", spinnerSizes[size], className)}
    />
  );
}

// ============================================================================
// Loading Dots
// ============================================================================

interface LoadingDotsProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export function LoadingDots({ size = "md", color, className }: LoadingDotsProps) {
  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const dotSize = dotSizes[size];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn("rounded-full", color || "bg-blue-600 dark:bg-blue-400", dotSize)}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Loading Pulse
// ============================================================================

interface LoadingPulseProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingPulse({ size = "md", className }: LoadingPulseProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-600/20 dark:bg-blue-400/20"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-600/40 dark:bg-blue-400/40"
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-1/2 w-1/2 rounded-full bg-blue-600 dark:bg-blue-400" />
      </div>
    </div>
  );
}

// ============================================================================
// Loading Bar
// ============================================================================

interface LoadingBarProps {
  className?: string;
}

export function LoadingBar({ className }: LoadingBarProps) {
  return (
    <div
      className={cn(
        "h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
        className
      )}
    >
      <motion.div
        className="h-full rounded-full bg-blue-600 dark:bg-blue-400"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: "50%" }}
      />
    </div>
  );
}

// ============================================================================
// Page Loading
// ============================================================================

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({ message = "Loading...", className }: PageLoadingProps) {
  return (
    <div className={cn("flex min-h-[400px] flex-col items-center justify-center gap-4", className)}>
      <LoadingPulse size="lg" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

// ============================================================================
// Full Screen Loading
// ============================================================================

interface FullScreenLoadingProps {
  message?: string;
  logo?: React.ReactNode;
  className?: string;
}

export function FullScreenLoading({ message, logo, className }: FullScreenLoadingProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "bg-white dark:bg-gray-900",
        className
      )}
    >
      {logo || (
        <div className="mb-8">
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl font-bold text-white shadow-lg"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            W
          </motion.div>
        </div>
      )}
      <LoadingDots size="lg" />
      {message && <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{message}</p>}
    </div>
  );
}

// ============================================================================
// Inline Loading
// ============================================================================

interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({ text, className }: InlineLoadingProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LoadingSpinner size="xs" />
      {text && <span className="text-sm text-gray-500 dark:text-gray-400">{text}</span>}
    </span>
  );
}

// ============================================================================
// Button Loading State
// ============================================================================

interface ButtonLoadingProps {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function ButtonLoading({
  loading = false,
  children,
  loadingText,
  className,
}: ButtonLoadingProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {loading ? (
        <>
          <LoadingSpinner size="xs" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </span>
  );
}

// ============================================================================
// Card Loading Skeleton
// ============================================================================

interface CardSkeletonProps {
  rows?: number;
  showAvatar?: boolean;
  showImage?: boolean;
  className?: string;
}

export function CardSkeleton({
  rows = 3,
  showAvatar = false,
  showImage = false,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {showImage && <div className="h-48 animate-pulse bg-gray-200 dark:bg-gray-800" />}
      <div className="space-y-4 p-6">
        {showAvatar && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        )}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-800",
              i === rows - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Table Loading Skeleton
// ============================================================================

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({ columns = 4, rows = 5, className }: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700",
              i === 0 ? "w-1/4" : "flex-1"
            )}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 border-b border-gray-100 px-6 py-4 last:border-b-0 dark:border-gray-800"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={cn(
                "h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800",
                colIndex === 0 ? "w-1/4" : "flex-1"
              )}
              style={{
                animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// List Loading Skeleton
// ============================================================================

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

export function ListSkeleton({ items = 5, showAvatar = true, className }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          {showAvatar && (
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
          </div>
          <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Stats Loading Skeleton
// ============================================================================

interface StatsSkeletonProps {
  count?: number;
  className?: string;
}

export function StatsSkeleton({ count = 4, className }: StatsSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            </div>
            <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Chart Loading Skeleton
// ============================================================================

interface ChartSkeletonProps {
  type?: "bar" | "line" | "pie";
  className?: string;
}

export function ChartSkeleton({ type = "bar", className }: ChartSkeletonProps) {
  if (type === "pie") {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="h-48 w-48 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className={cn("p-6", className)}>
      <div className="flex h-64 items-end justify-around gap-2">
        {Array.from({ length: type === "bar" ? 7 : 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t bg-gray-200 dark:bg-gray-800"
            style={{
              height: `${Math.random() * 60 + 20}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-around">
        {Array.from({ length: type === "bar" ? 7 : 12 }).map((_, i) => (
          <div key={i} className="h-3 w-6 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Loading Overlay
// ============================================================================

interface LoadingOverlayProps {
  loading?: boolean;
  blur?: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({
  loading = false,
  blur = false,
  message,
  children,
  className,
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {loading && (
        <div
          className={cn(
            "absolute inset-0 z-10 flex flex-col items-center justify-center",
            "bg-white/80 dark:bg-gray-900/80",
            blur && "backdrop-blur-sm"
          )}
        >
          <LoadingSpinner size="lg" />
          {message && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>}
        </div>
      )}
    </div>
  );
}
