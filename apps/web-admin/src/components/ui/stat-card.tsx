"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Info, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Stat Card Props
 */
export interface StatCardProps {
  /** Title of the stat */
  title: string;
  /** Current value */
  value: string | number;
  /** Previous value for comparison */
  previousValue?: number;
  /** Format type for value display */
  format?: "number" | "currency" | "percent";
  /** Icon component */
  icon?: React.ReactNode;
  /** Color theme */
  variant?: "default" | "success" | "warning" | "danger" | "info";
  /** Loading state */
  isLoading?: boolean;
  /** Trend indicator */
  trend?: "up" | "down" | "neutral";
  /** Trend value (percentage) */
  trendValue?: number;
  /** Trend description */
  trendLabel?: string;
  /** Help tooltip */
  helpText?: string;
  /** On click handler */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

const variantStyles = {
  default: {
    icon: "bg-primary/10 text-primary",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-muted-foreground",
    },
  },
  success: {
    icon: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-muted-foreground",
    },
  },
  warning: {
    icon: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-muted-foreground",
    },
  },
  danger: {
    icon: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    trend: {
      up: "text-red-600",
      down: "text-green-600",
      neutral: "text-muted-foreground",
    },
  },
  info: {
    icon: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-muted-foreground",
    },
  },
};

/**
 * Format a number for display
 */
function formatValue(value: string | number, format: StatCardProps["format"] = "number"): string {
  if (typeof value === "string") {
    return value;
  }

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "number":
    default:
      return new Intl.NumberFormat("en-US").format(value);
  }
}

/**
 * World-class Stat Card component
 * Displays key metrics with trends and visual indicators
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Machines"
 *   value={42}
 *   trend="up"
 *   trendValue={12.5}
 *   icon={<WashingMachine />}
 *   variant="success"
 * />
 * ```
 */
export function StatCard({
  title,
  value,
  previousValue,
  format = "number",
  icon,
  variant = "default",
  isLoading = false,
  trend,
  trendValue,
  trendLabel,
  helpText,
  onClick,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  // Calculate trend if not provided but previousValue is
  const calculatedTrend = React.useMemo(() => {
    if (trend) {
      return trend;
    }
    if (previousValue === undefined || typeof value !== "number") {
      return undefined;
    }

    if (value > previousValue) {
      return "up";
    }
    if (value < previousValue) {
      return "down";
    }
    return "neutral";
  }, [trend, value, previousValue]);

  const calculatedTrendValue = React.useMemo(() => {
    if (trendValue !== undefined) {
      return trendValue;
    }
    if (previousValue === undefined || typeof value !== "number" || previousValue === 0) {
      return undefined;
    }

    return ((value - previousValue) / previousValue) * 100;
  }, [trendValue, value, previousValue]);

  const TrendIcon =
    calculatedTrend === "up" ? TrendingUp : calculatedTrend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-6 transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/50 hover:shadow-md",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {helpText && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="rounded-full p-0.5 hover:bg-muted">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {helpText}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {icon && <div className={cn("rounded-lg p-2.5", styles.icon)}>{icon}</div>}
      </div>

      {/* Value */}
      <div className="mt-3">
        {isLoading ? (
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <span className="text-3xl font-bold tracking-tight">{formatValue(value, format)}</span>
        )}
      </div>

      {/* Trend */}
      {calculatedTrend && calculatedTrendValue !== undefined && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-sm font-medium",
              styles.trend[calculatedTrend]
            )}
          >
            <TrendIcon className="h-4 w-4" />
            {Math.abs(calculatedTrendValue).toFixed(1)}%
          </span>
          {trendLabel && <span className="text-sm text-muted-foreground">{trendLabel}</span>}
        </div>
      )}

      {/* Click indicator */}
      {onClick && (
        <div className="absolute right-3 top-3">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}

/**
 * Mini Stat for compact displays
 */
export interface MiniStatProps {
  label: string;
  value: string | number;
  trend?: "up" | "down";
  trendValue?: number;
  className?: string;
}

export function MiniStat({ label, value, trend, trendValue, className }: MiniStatProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{value}</span>
        {trend && trendValue !== undefined && (
          <span
            className={cn(
              "inline-flex items-center text-xs font-medium",
              trend === "up" ? "text-green-600" : "text-red-600"
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trendValue}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Progress Bar with label
 */
export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const progressVariants = {
  default: "bg-primary",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const progressSizes = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  variant = "default",
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && (
            <span className="font-medium">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-muted", progressSizes[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            progressVariants[variant]
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        />
      </div>
    </div>
  );
}

/**
 * Circular Progress / Donut Chart
 */
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const circularVariants = {
  default: "stroke-primary",
  success: "stroke-green-500",
  warning: "stroke-amber-500",
  danger: "stroke-red-500",
};

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  label,
  showValue = true,
  variant = "default",
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-500 ease-out", circularVariants[variant])}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && <span className="text-2xl font-bold">{Math.round(percentage)}%</span>}
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

/**
 * Stats Grid Container
 */
export interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

const gridColumns = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
};

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  return <div className={cn("grid gap-4", gridColumns[columns], className)}>{children}</div>;
}

/**
 * Simple bar chart for inline data visualization
 */
export interface SimpleBarChartProps {
  data: {
    label: string;
    value: number;
    color?: string;
  }[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
  className?: string;
}

export function SimpleBarChart({
  data,
  height = 120,
  showLabels = true,
  showValues = true,
  className,
}: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-1">
              {showValues && <span className="text-xs font-medium">{item.value}</span>}
              <div
                className="w-full rounded-t transition-all duration-500 ease-out"
                style={{
                  height: `${barHeight}%`,
                  minHeight: item.value > 0 ? "4px" : "0",
                  backgroundColor: item.color || "hsl(var(--primary))",
                }}
              />
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex gap-2">
          {data.map((item, index) => (
            <span key={index} className="flex-1 truncate text-center text-xs text-muted-foreground">
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Legend for charts
 */
export interface LegendProps {
  items: {
    label: string;
    color: string;
    value?: string | number;
  }[];
  direction?: "horizontal" | "vertical";
  className?: string;
}

export function Legend({ items, direction = "horizontal", className }: LegendProps) {
  return (
    <div className={cn("flex gap-4", direction === "vertical" && "flex-col gap-2", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-sm text-muted-foreground">{item.label}</span>
          {item.value !== undefined && <span className="text-sm font-medium">{item.value}</span>}
        </div>
      ))}
    </div>
  );
}
