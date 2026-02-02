"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Comprehensive loading state components for WashWise
 */

/**
 * Shimmer/Skeleton loader
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width (can be number for px or string for any unit) */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Shape variant */
  variant?: "text" | "circular" | "rectangular" | "rounded";
  /** Animation variant */
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  width,
  height,
  variant = "text",
  animation = "pulse",
  className,
  style,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "",
    rounded: "rounded-md",
  };

  const animationStyles = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]",
    none: "",
  };

  return (
    <div
      className={cn("bg-muted", variantStyles[variant], animationStyles[animation], className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * Text skeleton that matches line height
 */
interface TextSkeletonProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export function TextSkeleton({ lines = 3, className, lastLineWidth = "60%" }: TextSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={16} width={i === lines - 1 ? lastLineWidth : "100%"} />
      ))}
    </div>
  );
}

/**
 * Card skeleton
 */
interface CardSkeletonProps {
  /** Show image placeholder */
  hasImage?: boolean;
  /** Number of content lines */
  lines?: number;
  className?: string;
}

export function CardSkeleton({ hasImage = false, lines = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      {hasImage && <Skeleton variant="rounded" height={200} width="100%" className="mb-4" />}
      <Skeleton height={20} width="70%" className="mb-2" />
      <TextSkeleton lines={lines} />
      <div className="mt-4 flex gap-2">
        <Skeleton variant="rounded" height={32} width={80} />
        <Skeleton variant="rounded" height={32} width={80} />
      </div>
    </div>
  );
}

/**
 * Table skeleton
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasCheckbox?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  hasCheckbox = false,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("rounded-lg border", className)}>
      <table className="w-full">
        <thead className="border-b bg-muted/50">
          <tr>
            {hasCheckbox && (
              <th className="w-12 p-3">
                <Skeleton variant="rectangular" height={16} width={16} />
              </th>
            )}
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-3 text-left">
                <Skeleton height={16} width={`${60 + Math.random() * 40}%`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b last:border-0">
              {hasCheckbox && (
                <td className="p-3">
                  <Skeleton variant="rectangular" height={16} width={16} />
                </td>
              )}
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="p-3">
                  <Skeleton height={16} width={`${50 + Math.random() * 50}%`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Stat card skeleton
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="flex items-center justify-between">
        <Skeleton height={14} width={100} />
        <Skeleton variant="circular" height={40} width={40} />
      </div>
      <Skeleton height={32} width={80} className="mt-2" />
      <Skeleton height={12} width={120} className="mt-2" />
    </div>
  );
}

/**
 * List item skeleton
 */
interface ListSkeletonProps {
  items?: number;
  hasAvatar?: boolean;
  hasAction?: boolean;
  className?: string;
}

export function ListSkeleton({
  items = 5,
  hasAvatar = true,
  hasAction = false,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          {hasAvatar && <Skeleton variant="circular" height={40} width={40} />}
          <div className="flex-1">
            <Skeleton height={16} width={`${40 + Math.random() * 40}%`} />
            <Skeleton height={12} width={`${30 + Math.random() * 30}%`} className="mt-1" />
          </div>
          {hasAction && <Skeleton variant="rounded" height={32} width={32} />}
        </div>
      ))}
    </div>
  );
}

/**
 * Form skeleton
 */
interface FormSkeletonProps {
  fields?: number;
  hasSubmit?: boolean;
  className?: string;
}

export function FormSkeleton({ fields = 4, hasSubmit = true, className }: FormSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height={14} width={80} />
          <Skeleton variant="rounded" height={40} width="100%" />
        </div>
      ))}
      {hasSubmit && (
        <div className="flex justify-end gap-2 pt-4">
          <Skeleton variant="rounded" height={40} width={80} />
          <Skeleton variant="rounded" height={40} width={100} />
        </div>
      )}
    </div>
  );
}

/**
 * Dashboard skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton height={20} width={150} className="mb-4" />
          <Skeleton variant="rounded" height={300} width="100%" />
        </div>
        <div className="rounded-lg border bg-card p-6">
          <Skeleton height={20} width={150} className="mb-4" />
          <Skeleton variant="rounded" height={300} width="100%" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton height={20} width={200} className="mb-4" />
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}

/**
 * Page loading skeleton
 */
interface PageSkeletonProps {
  /** Show breadcrumb */
  hasBreadcrumb?: boolean;
  /** Show page title */
  hasTitle?: boolean;
  /** Show action buttons */
  hasActions?: boolean;
  children?: React.ReactNode;
}

export function PageSkeleton({
  hasBreadcrumb = true,
  hasTitle = true,
  hasActions = true,
  children,
}: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {hasBreadcrumb && (
        <div className="flex items-center gap-2">
          <Skeleton height={14} width={60} />
          <span className="text-muted-foreground">/</span>
          <Skeleton height={14} width={80} />
        </div>
      )}

      {(hasTitle || hasActions) && (
        <div className="flex items-center justify-between">
          {hasTitle && (
            <div>
              <Skeleton height={28} width={200} />
              <Skeleton height={14} width={300} className="mt-2" />
            </div>
          )}
          {hasActions && (
            <div className="flex gap-2">
              <Skeleton variant="rounded" height={40} width={100} />
              <Skeleton variant="rounded" height={40} width={120} />
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Loading spinner with optional text
 */
interface SpinnerLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function SpinnerLoader({ size = "md", text, className }: SpinnerLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizeClasses[size]
        )}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

/**
 * Full page loading overlay
 */
interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  blur?: boolean;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  text = "Loading...",
  blur = true,
  children,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 z-50 flex items-center justify-center bg-background/80",
            blur && "backdrop-blur-sm"
          )}
        >
          <SpinnerLoader size="lg" text={text} />
        </div>
      )}
    </div>
  );
}

/**
 * Progress loading bar
 */
interface ProgressLoaderProps {
  progress?: number;
  indeterminate?: boolean;
  text?: string;
  className?: string;
}

export function ProgressLoader({
  progress = 0,
  indeterminate = false,
  text,
  className,
}: ProgressLoaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {text && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{text}</span>
          {!indeterminate && <span className="font-medium">{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full bg-primary transition-all",
            indeterminate && "animate-indeterminate-progress w-1/3"
          )}
          style={!indeterminate ? { width: `${progress}%` } : undefined}
        />
      </div>
    </div>
  );
}

/**
 * Button loading state component
 */
interface LoadingButtonProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingContent({ isLoading, loadingText, children }: LoadingButtonProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <>
      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {loadingText || children}
    </>
  );
}

/**
 * Empty state component
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Error state component
 */
interface ErrorStateProps {
  title?: string;
  description?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this content.",
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-4 rounded-full bg-destructive/10 p-3">
        <svg
          className="h-6 w-6 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      )}
    </div>
  );
}
