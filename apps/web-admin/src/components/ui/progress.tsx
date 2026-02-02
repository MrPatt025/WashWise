"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// Progress Bar Component
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error" | "info";
  showValue?: boolean;
  valuePosition?: "inside" | "outside" | "top";
  animated?: boolean;
  striped?: boolean;
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantClasses = {
  default: "bg-blue-600 dark:bg-blue-500",
  success: "bg-green-600 dark:bg-green-500",
  warning: "bg-yellow-500 dark:bg-yellow-400",
  error: "bg-red-600 dark:bg-red-500",
  info: "bg-cyan-600 dark:bg-cyan-500",
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showValue = false,
  valuePosition = "outside",
  animated = false,
  striped = false,
  label,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {/* Label and value on top */}
      {(label || (showValue && valuePosition === "top")) && (
        <div className="mb-1 flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          )}
          {showValue && valuePosition === "top" && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
            sizeClasses[size]
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              variantClasses[variant],
              striped && "bg-stripes",
              animated && striped && "animate-stripes",
              size === "lg" &&
                showValue &&
                valuePosition === "inside" &&
                "flex items-center justify-center"
            )}
            style={{ width: `${percentage}%` }}
          >
            {size === "lg" && showValue && valuePosition === "inside" && (
              <span className="px-2 text-xs font-medium text-white">{Math.round(percentage)}%</span>
            )}
          </div>
        </div>

        {/* Value outside */}
        {showValue && valuePosition === "outside" && (
          <span className="min-w-[3rem] text-right text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Multi-segment Progress
// ============================================================================

interface ProgressSegment {
  value: number;
  color?: string;
  label?: string;
}

interface MultiProgressProps {
  segments: ProgressSegment[];
  max?: number;
  size?: "sm" | "md" | "lg";
  showLegend?: boolean;
  className?: string;
}

const defaultColors = [
  "bg-blue-600",
  "bg-green-600",
  "bg-yellow-500",
  "bg-red-600",
  "bg-purple-600",
  "bg-cyan-600",
];

export function MultiProgress({
  segments,
  max,
  size = "md",
  showLegend = false,
  className,
}: MultiProgressProps) {
  const total = max || segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
          sizeClasses[size]
        )}
      >
        {segments.map((segment, index) => {
          const width = (segment.value / total) * 100;
          return (
            <div
              key={index}
              className={cn(
                "h-full transition-all duration-500",
                segment.color || defaultColors[index % defaultColors.length],
                index === 0 && "rounded-l-full",
                index === segments.length - 1 && "rounded-r-full"
              )}
              style={{ width: `${width}%` }}
              title={segment.label ? `${segment.label}: ${segment.value}` : String(segment.value)}
            />
          );
        })}
      </div>

      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-4">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "h-3 w-3 rounded-full",
                  segment.color || defaultColors[index % defaultColors.length]
                )}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {segment.label || `Segment ${index + 1}`}: {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Circular Progress / Ring
// ============================================================================

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "error";
  showValue?: boolean;
  label?: string;
  className?: string;
}

const circularVariantColors = {
  default: "stroke-blue-600",
  success: "stroke-green-600",
  warning: "stroke-yellow-500",
  error: "stroke-red-600",
};

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  variant = "default",
  showValue = true,
  label,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn("inline-flex flex-col items-center", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90 transform" width={size} height={size}>
          {/* Background circle */}
          <circle
            className="stroke-gray-200 dark:stroke-gray-700"
            fill="none"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <circle
            className={cn("transition-all duration-500 ease-out", circularVariantColors[variant])}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>

        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>

      {label && <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">{label}</span>}
    </div>
  );
}

// ============================================================================
// Step Progress
// ============================================================================

interface Step {
  label: string;
  description?: string;
  status?: "completed" | "current" | "upcoming";
}

interface StepProgressProps {
  steps: Step[];
  currentStep?: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function StepProgress({
  steps,
  currentStep = 0,
  orientation = "horizontal",
  className,
}: StepProgressProps) {
  return (
    <div
      className={cn(
        orientation === "horizontal"
          ? "flex items-start justify-between"
          : "flex flex-col space-y-4",
        className
      )}
    >
      {steps.map((step, index) => {
        const status =
          step.status ||
          (index < currentStep ? "completed" : index === currentStep ? "current" : "upcoming");

        return (
          <div
            key={index}
            className={cn(
              "flex",
              orientation === "horizontal" ? "flex-1 flex-col items-center" : "items-start gap-3"
            )}
          >
            {/* Step indicator and connector */}
            <div
              className={cn(
                "flex items-center",
                orientation === "horizontal" ? "w-full" : "flex-col"
              )}
            >
              {/* Connector before */}
              {index > 0 && (
                <div
                  className={cn(
                    orientation === "horizontal" ? "h-0.5 flex-1" : "mb-2 h-6 w-0.5",
                    status === "upcoming" ? "bg-gray-200 dark:bg-gray-700" : "bg-blue-600"
                  )}
                />
              )}

              {/* Step circle */}
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  status === "completed"
                    ? "bg-blue-600 text-white"
                    : status === "current"
                      ? "border-2 border-blue-600 text-blue-600"
                      : "border-2 border-gray-300 text-gray-400 dark:border-gray-600"
                )}
              >
                {status === "completed" ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Connector after */}
              {index < steps.length - 1 && orientation === "horizontal" && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    status === "completed" ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </div>

            {/* Step label */}
            <div className={cn(orientation === "horizontal" ? "mt-2 text-center" : "")}>
              <p
                className={cn(
                  "text-sm font-medium",
                  status === "current"
                    ? "text-blue-600"
                    : status === "completed"
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Countdown Progress
// ============================================================================

interface CountdownProgressProps {
  remainingTime: number; // in seconds
  totalTime: number; // in seconds
  size?: "sm" | "md" | "lg";
  variant?: "default" | "warning" | "error";
  showTime?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function CountdownProgress({
  remainingTime,
  totalTime,
  size = "md",
  variant = "default",
  showTime = true,
  onComplete,
  className,
}: CountdownProgressProps) {
  const percentage = (remainingTime / totalTime) * 100;
  const isLow = percentage <= 25;
  const isCritical = percentage <= 10;

  const actualVariant = isCritical ? "error" : isLow ? "warning" : variant;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  React.useEffect(() => {
    if (remainingTime === 0) {
      onComplete?.();
    }
  }, [remainingTime, onComplete]);

  return (
    <div className={cn("w-full", className)}>
      {showTime && (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Time remaining</span>
          <span
            className={cn(
              "font-mono text-sm font-medium",
              isCritical
                ? "text-red-600"
                : isLow
                  ? "text-yellow-600"
                  : "text-gray-900 dark:text-white"
            )}
          >
            {formatTime(remainingTime)}
          </span>
        </div>
      )}
      <ProgressBar
        value={remainingTime}
        max={totalTime}
        size={size}
        variant={actualVariant}
        animated={isLow}
        striped={isLow}
      />
    </div>
  );
}

// ============================================================================
// CSS for striped animation (add to globals.css)
// ============================================================================
/*
.bg-stripes {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}

@keyframes stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}

.animate-stripes {
  animation: stripes 1s linear infinite;
}
*/
