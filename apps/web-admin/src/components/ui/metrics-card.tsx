"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

// ============================================================================
// Types
// ============================================================================

export interface MetricData {
  value: number;
  previousValue?: number;
  label: string;
  unit?: string;
  format?: "number" | "currency" | "percentage" | "compact";
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  sparklineData?: number[];
  icon?: React.ReactNode;
  color?: "default" | "success" | "warning" | "danger" | "info";
}

interface MetricsCardProps {
  data: MetricData;
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  showSparkline?: boolean;
  animated?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatValue(value: number, format?: MetricData["format"], unit?: string): string {
  switch (format) {
    case "currency":
      return `฿${value.toLocaleString()}`;
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "compact":
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    default:
      return `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`;
  }
}

function calculateTrend(
  current: number,
  previous: number
): { trend: "up" | "down" | "neutral"; value: number } {
  if (!previous || previous === 0) {
    return { trend: "neutral", value: 0 };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
    value: Math.abs(change),
  };
}

// ============================================================================
// Mini Sparkline Component (internal use)
// ============================================================================

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  animated?: boolean;
}

function MiniSparkline({
  data,
  width = 80,
  height = 30,
  color = "currentColor",
  animated = true,
}: MiniSparklineProps) {
  if (!data || data.length < 2) {
    return null;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height,
  }));

  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${acc} L ${point.x} ${point.y}`;
  }, "");

  return (
    <svg width={width} height={height} className="overflow-visible">
      {animated ? (
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      ) : (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Gradient fill under the line */}
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${pathD} L ${width} ${height} L 0 ${height} Z`} fill="url(#sparkline-gradient)" />
    </svg>
  );
}

// ============================================================================
// Animated Counter
// ============================================================================

interface AnimatedCounterProps {
  value: number;
  format?: MetricData["format"];
  unit?: string;
  duration?: number;
}

function AnimatedCounter({ value, format, unit, duration = 1000 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
      }
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{formatValue(displayValue, format, unit)}</span>;
}

// ============================================================================
// Main Metrics Card Component
// ============================================================================

const colorVariants = {
  default: {
    bg: "bg-slate-50 dark:bg-slate-900",
    border: "border-slate-200 dark:border-slate-700",
    icon: "text-slate-600 dark:text-slate-400",
    trend: "text-slate-500",
  },
  success: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    trend: "text-green-600",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    trend: "text-amber-600",
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    trend: "text-red-600",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    trend: "text-blue-600",
  },
};

const sizeVariants = {
  sm: {
    padding: "p-3",
    value: "text-xl",
    label: "text-xs",
    icon: "h-4 w-4",
  },
  md: {
    padding: "p-4",
    value: "text-2xl",
    label: "text-sm",
    icon: "h-5 w-5",
  },
  lg: {
    padding: "p-6",
    value: "text-3xl",
    label: "text-base",
    icon: "h-6 w-6",
  },
};

export function MetricsCard({
  data,
  loading = false,
  onRefresh,
  className,
  size = "md",
  showSparkline = true,
  animated = true,
}: MetricsCardProps) {
  const colorStyle = colorVariants[data.color || "default"];
  const sizeStyle = sizeVariants[size];

  const calculatedTrend = React.useMemo(() => {
    if (data.trend && data.trendValue !== undefined) {
      return { trend: data.trend, value: data.trendValue };
    }
    if (data.previousValue !== undefined) {
      return calculateTrend(data.value, data.previousValue);
    }
    return { trend: "neutral" as const, value: 0 };
  }, [data]);

  const TrendIcon =
    calculatedTrend.trend === "up"
      ? TrendingUp
      : calculatedTrend.trend === "down"
        ? TrendingDown
        : null;

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-xl border",
        colorStyle.bg,
        colorStyle.border,
        sizeStyle.padding,
        "transition-all duration-200 hover:shadow-lg",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {data.icon && (
            <div className={cn("rounded-lg bg-white/50 p-2 dark:bg-black/20", colorStyle.icon)}>
              {data.icon}
            </div>
          )}
          <span className={cn("font-medium text-slate-600 dark:text-slate-400", sizeStyle.label)}>
            {data.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Export data</DropdownMenuItem>
              <DropdownMenuItem>Set alert</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Value */}
      <div className="mt-3">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700")}
            />
          ) : (
            <motion.div
              key="value"
              initial={animated ? { opacity: 0, scale: 0.9 } : false}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("font-bold text-slate-900 dark:text-white", sizeStyle.value)}
            >
              {animated ? (
                <AnimatedCounter value={data.value} format={data.format} unit={data.unit} />
              ) : (
                formatValue(data.value, data.format, data.unit)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trend & Sparkline */}
      <div className="mt-2 flex items-center justify-between">
        {calculatedTrend.trend !== "neutral" && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", colorStyle.trend)}>
            {TrendIcon && <TrendIcon className="h-3 w-3" />}
            <span>
              {calculatedTrend.trend === "up" ? "+" : "-"}
              {calculatedTrend.value.toFixed(1)}%
            </span>
            <span className="text-slate-400">vs last period</span>
          </div>
        )}

        {showSparkline && data.sparklineData && (
          <MiniSparkline
            data={data.sparklineData}
            color={
              calculatedTrend.trend === "up"
                ? "#22c55e"
                : calculatedTrend.trend === "down"
                  ? "#ef4444"
                  : "#64748b"
            }
            animated={animated}
          />
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Metrics Grid Component
// ============================================================================

interface MetricsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function MetricsGrid({ children, columns = 4, className }: MetricsGridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-2 lg:grid-cols-5",
    6: "md:grid-cols-3 lg:grid-cols-6",
  };

  return <div className={cn("grid gap-4", gridCols[columns], className)}>{children}</div>;
}

// ============================================================================
// Comparison Card Component
// ============================================================================

interface ComparisonCardProps {
  title: string;
  current: number;
  previous: number;
  format?: MetricData["format"];
  unit?: string;
  className?: string;
}

export function ComparisonCard({
  title,
  current,
  previous,
  format,
  unit,
  className,
}: ComparisonCardProps) {
  const change = previous ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900",
        className
      )}
    >
      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h4>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatValue(current, format, unit)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Previous: {formatValue(previous, format, unit)}
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
            isPositive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}
        >
          {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

export { AnimatedCounter, formatValue };
