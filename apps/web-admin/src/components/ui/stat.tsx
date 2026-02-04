"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Info,
  type LucideIcon,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Sparkline } from "./chart";

// ============================================================================
// Types
// ============================================================================

type TrendDirection = "up" | "down" | "neutral";

interface StatProps {
  label: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeLabel?: string;
  trend?: TrendDirection;
  trendType?: "positive" | "negative" | "neutral"; // Whether up is good or bad
  icon?: LucideIcon;
  iconColor?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  info?: string;
  className?: string;
}

// ============================================================================
// Simple Stat
// ============================================================================

export function Stat({
  label,
  value,
  change,
  changeLabel,
  trend,
  trendType = "positive",
  icon: Icon,
  iconColor,
  prefix,
  suffix,
  loading = false,
  info,
  className,
}: StatProps) {
  // Determine trend from change if not provided
  const actualTrend =
    trend || (change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral");

  // Determine if trend is good or bad
  const isPositiveTrend = trendType === "positive" ? actualTrend === "up" : actualTrend === "down";
  const isNegativeTrend = trendType === "positive" ? actualTrend === "down" : actualTrend === "up";

  const TrendIcon =
    actualTrend === "up" ? TrendingUp : actualTrend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
            {info && (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title={info}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {prefix}
                {typeof value === "number" ? value.toLocaleString() : value}
                {suffix}
              </span>
            )}
          </div>

          {(change !== undefined || changeLabel) && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "flex items-center gap-0.5 text-sm font-medium",
                  isPositiveTrend && "text-green-600 dark:text-green-400",
                  isNegativeTrend && "text-red-600 dark:text-red-400",
                  !isPositiveTrend && !isNegativeTrend && "text-gray-500 dark:text-gray-400"
                )}
              >
                <TrendIcon className="h-4 w-4" />
                {change !== undefined && <span>{Math.abs(change).toFixed(1)}%</span>}
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn("rounded-xl bg-gray-100 p-3 dark:bg-gray-800", iconColor)}>
            <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Stat Card with Sparkline
// ============================================================================

interface StatWithSparklineProps extends StatProps {
  sparklineData?: number[];
  sparklineColor?: string;
}

export function StatWithSparkline({
  label,
  value,
  change,
  changeLabel,
  trend,
  trendType = "positive",
  icon: Icon,
  sparklineData,
  sparklineColor,
  prefix,
  suffix,
  loading = false,
  className,
}: StatWithSparklineProps) {
  const actualTrend =
    trend || (change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral");

  const isPositiveTrend = trendType === "positive" ? actualTrend === "up" : actualTrend === "down";
  const isNegativeTrend = trendType === "positive" ? actualTrend === "down" : actualTrend === "up";

  const color =
    sparklineColor || (isPositiveTrend ? "#10B981" : isNegativeTrend ? "#EF4444" : "#6B7280");

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-gray-400" />}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
          </div>

          <div className="mt-2">
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {prefix}
                {typeof value === "number" ? value.toLocaleString() : value}
                {suffix}
              </span>
            )}
          </div>

          {(change !== undefined || changeLabel) && (
            <div className="mt-1 flex items-center gap-1">
              <span
                className={cn(
                  "flex items-center text-sm font-medium",
                  isPositiveTrend && "text-green-600 dark:text-green-400",
                  isNegativeTrend && "text-red-600 dark:text-red-400",
                  !isPositiveTrend && !isNegativeTrend && "text-gray-500 dark:text-gray-400"
                )}
              >
                {actualTrend === "up" && <ArrowUpRight className="h-3.5 w-3.5" />}
                {actualTrend === "down" && <ArrowDownRight className="h-3.5 w-3.5" />}
                {change !== undefined && <span>{Math.abs(change).toFixed(1)}%</span>}
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="flex-shrink-0">
            <Sparkline data={sparklineData} width={80} height={40} color={color} showArea />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Stat Grid
// ============================================================================

interface StatGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Comparison Stat
// ============================================================================

interface ComparisonStatProps {
  label: string;
  current: number;
  previous: number;
  currentLabel?: string;
  previousLabel?: string;
  format?: (value: number) => string;
  trendType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function ComparisonStat({
  label,
  current,
  previous,
  currentLabel = "This period",
  previousLabel = "Last period",
  format = (v) => v.toLocaleString(),
  trendType = "positive",
  className,
}: ComparisonStatProps) {
  const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
  const isUp = current > previous;
  const isDown = current < previous;

  const isPositiveTrend = trendType === "positive" ? isUp : isDown;
  const isNegativeTrend = trendType === "positive" ? isDown : isUp;

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {format(current)}
          </span>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{currentLabel}</p>
        </div>

        <div className="text-right">
          <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
            {format(previous)}
          </span>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{previousLabel}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Change</span>
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isPositiveTrend && "text-green-600 dark:text-green-400",
              isNegativeTrend && "text-red-600 dark:text-red-400",
              !isPositiveTrend && !isNegativeTrend && "text-gray-500 dark:text-gray-400"
            )}
          >
            {isUp && <TrendingUp className="h-4 w-4" />}
            {isDown && <TrendingDown className="h-4 w-4" />}
            {!isUp && !isDown && <Minus className="h-4 w-4" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Mini Stat
// ============================================================================

interface MiniStatProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: TrendDirection;
  trendType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function MiniStat({
  label,
  value,
  change,
  trend,
  trendType = "positive",
  className,
}: MiniStatProps) {
  const actualTrend =
    trend || (change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral");

  const isPositiveTrend = trendType === "positive" ? actualTrend === "up" : actualTrend === "down";
  const isNegativeTrend = trendType === "positive" ? actualTrend === "down" : actualTrend === "up";

  return (
    <div className={cn("flex items-center justify-between py-2", className)}>
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 dark:text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {change !== undefined && (
          <span
            className={cn(
              "text-xs font-medium",
              isPositiveTrend && "text-green-600 dark:text-green-400",
              isNegativeTrend && "text-red-600 dark:text-red-400",
              !isPositiveTrend && !isNegativeTrend && "text-gray-500 dark:text-gray-400"
            )}
          >
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Animated Counter
// ============================================================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const prevValue = React.useRef(0);

  React.useEffect(() => {
    const startValue = prevValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      {suffix}
    </span>
  );
}

// ============================================================================
// Goal Progress Stat
// ============================================================================

interface GoalStatProps {
  label: string;
  current: number;
  goal: number;
  format?: (value: number) => string;
  color?: string;
  className?: string;
}

export function GoalStat({
  label,
  current,
  goal,
  format = (v) => v.toLocaleString(),
  color = "#3B82F6",
  className,
}: GoalStatProps) {
  const percentage = Math.min(100, (current / goal) * 100);
  const isComplete = current >= goal;

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {format(current)}
            <span className="text-base font-normal text-gray-500 dark:text-gray-400">
              {" "}
              / {format(goal)}
            </span>
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            isComplete
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          )}
        >
          {percentage.toFixed(0)}%
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: isComplete ? "#10B981" : color }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Stat List
// ============================================================================

interface StatListItem {
  label: string;
  value: string | number;
  change?: number;
  color?: string;
}

interface StatListProps {
  title: string;
  items: StatListItem[];
  className?: string;
}

export function StatList({ title, items, className }: StatListProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>

      <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {item.color && (
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </span>
              {item.change !== undefined && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    item.change > 0 && "text-green-600 dark:text-green-400",
                    item.change < 0 && "text-red-600 dark:text-red-400",
                    item.change === 0 && "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {item.change > 0 ? "+" : ""}
                  {item.change}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
