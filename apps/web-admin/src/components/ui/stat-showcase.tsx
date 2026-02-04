"use client";

import * as React from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Animated Number Counter
// ============================================================================

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  });

  const display = useTransform(
    spring,
    (latest) =>
      `${prefix}${latest.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${suffix}`
  );

  React.useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}

// ============================================================================
// Stat Showcase Card
// ============================================================================

export interface StatShowcaseProps {
  label: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  description?: string;
  color?: "default" | "emerald" | "violet" | "amber" | "rose" | "blue";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const colorVariants = {
  default: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-300",
    accent: "text-slate-900 dark:text-white",
    glow: "",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-600 dark:text-emerald-400",
    accent: "text-emerald-700 dark:text-emerald-300",
    glow: "shadow-emerald-500/20",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-600 dark:text-violet-400",
    accent: "text-violet-700 dark:text-violet-300",
    glow: "shadow-violet-500/20",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
    accent: "text-amber-700 dark:text-amber-300",
    glow: "shadow-amber-500/20",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-600 dark:text-rose-400",
    accent: "text-rose-700 dark:text-rose-300",
    glow: "shadow-rose-500/20",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
    accent: "text-blue-700 dark:text-blue-300",
    glow: "shadow-blue-500/20",
  },
};

const sizeVariants = {
  sm: {
    card: "p-4",
    icon: "h-8 w-8",
    iconInner: "h-4 w-4",
    value: "text-2xl",
    label: "text-xs",
    trend: "text-xs",
  },
  md: {
    card: "p-5",
    icon: "h-10 w-10",
    iconInner: "h-5 w-5",
    value: "text-3xl",
    label: "text-sm",
    trend: "text-sm",
  },
  lg: {
    card: "p-6",
    icon: "h-12 w-12",
    iconInner: "h-6 w-6",
    value: "text-4xl",
    label: "text-base",
    trend: "text-base",
  },
};

export function StatShowcase({
  label,
  value,
  previousValue,
  prefix = "",
  suffix = "",
  decimals = 0,
  icon,
  trend: trendProp,
  description,
  color = "default",
  size = "md",
  className,
}: StatShowcaseProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const colors = colorVariants[color];
  const sizes = sizeVariants[size];

  // Calculate trend from previous value if not provided
  const calculatedTrend = React.useMemo(() => {
    if (trendProp) {
      return trendProp;
    }
    if (previousValue === undefined) {
      return "neutral";
    }
    if (value > previousValue) {
      return "up";
    }
    if (value < previousValue) {
      return "down";
    }
    return "neutral";
  }, [trendProp, value, previousValue]);

  const percentChange = React.useMemo(() => {
    if (previousValue === undefined || previousValue === 0) {
      return null;
    }
    return ((value - previousValue) / previousValue) * 100;
  }, [value, previousValue]);

  const TrendIcon =
    calculatedTrend === "up" ? TrendingUp : calculatedTrend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900",
        colors.glow && `hover:shadow-xl hover:${colors.glow}`,
        sizes.card,
        className
      )}
    >
      {/* Background Gradient */}
      <div
        className={cn("absolute inset-0 opacity-50 dark:opacity-30", colors.bg)}
        style={{
          background: `radial-gradient(circle at 100% 0%, ${
            color === "default" ? "rgb(148 163 184 / 0.1)" : "currentColor"
          } 0%, transparent 50%)`,
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={cn("flex items-center justify-center rounded-xl", colors.bg, sizes.icon)}>
            {icon ? (
              <span className={cn(colors.text, sizes.iconInner)}>{icon}</span>
            ) : (
              <TrendIcon className={cn(colors.text, sizes.iconInner)} />
            )}
          </div>

          {percentChange !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1",
                calculatedTrend === "up" &&
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                calculatedTrend === "down" &&
                  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                calculatedTrend === "neutral" &&
                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                sizes.trend
              )}
            >
              {calculatedTrend === "up" && <ArrowUp className="h-3 w-3" />}
              {calculatedTrend === "down" && <ArrowDown className="h-3 w-3" />}
              <span className="font-medium">{Math.abs(percentChange).toFixed(1)}%</span>
            </motion.div>
          )}
        </div>

        {/* Value */}
        <div className="mt-4">
          <AnimatedNumber
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            duration={1.5}
            className={cn("font-bold tracking-tight", colors.accent, sizes.value)}
          />
        </div>

        {/* Label */}
        <p className={cn("mt-1 font-medium text-slate-500 dark:text-slate-400", sizes.label)}>
          {label}
        </p>

        {/* Description */}
        {description && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{description}</p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Stat Showcase Grid
// ============================================================================

interface StatShowcaseGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatShowcaseGrid({ children, columns = 4, className }: StatShowcaseGridProps) {
  const columnClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return <div className={cn("grid gap-4", columnClasses[columns], className)}>{children}</div>;
}

// ============================================================================
// Hero Stat (for landing pages)
// ============================================================================

interface HeroStatProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function HeroStat({
  value,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: HeroStatProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn("text-center", className)}
    >
      <AnimatedNumber
        value={value}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        duration={2}
        className="block text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
      />
      <p className="mt-2 text-lg font-medium text-slate-600 dark:text-slate-400">{label}</p>
    </motion.div>
  );
}

// ============================================================================
// Live Counter (real-time updates)
// ============================================================================

interface LiveCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  pulseOnChange?: boolean;
  className?: string;
}

export function LiveCounter({
  value,
  label,
  prefix = "",
  suffix = "",
  pulseOnChange = true,
  className,
}: LiveCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(value);
  const [isPulsing, setIsPulsing] = React.useState(false);
  const prevValue = React.useRef(value);

  React.useEffect(() => {
    if (value !== prevValue.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 500);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [value]);

  React.useEffect(() => {
    const diff = value - displayValue;
    if (Math.abs(diff) < 1) {
      setDisplayValue(value);
      return;
    }

    const step = diff > 0 ? Math.ceil(diff / 10) : Math.floor(diff / 10);
    const timer = setTimeout(() => {
      setDisplayValue((prev) => prev + step);
    }, 50);

    return () => clearTimeout(timer);
  }, [value, displayValue]);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        animate={pulseOnChange && isPulsing ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <span className="block text-4xl font-bold tabular-nums text-slate-900 dark:text-white">
          {prefix}
          {displayValue.toLocaleString()}
          {suffix}
        </span>
        <span className="mt-1 block text-sm font-medium text-slate-500">{label}</span>
      </motion.div>

      {/* Pulse ring effect */}
      {pulseOnChange && isPulsing && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-full border-2 border-violet-500"
        />
      )}
    </div>
  );
}

// ============================================================================
// Comparison Stat
// ============================================================================

interface ComparisonStatShowcaseProps {
  currentValue: number;
  previousValue: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  periodLabel?: string;
  className?: string;
}

export function ComparisonStatShowcase({
  currentValue,
  previousValue,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
  periodLabel = "vs last period",
  className,
}: ComparisonStatShowcaseProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  const percentChange =
    previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
  const isPositive = percentChange > 0;
  const isNegative = percentChange < 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>

      <div className="mt-3 flex items-baseline gap-3">
        <AnimatedNumber
          value={currentValue}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          duration={1.5}
          className="text-3xl font-bold text-slate-900 dark:text-white"
        />

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
          transition={{ delay: 0.5 }}
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive && "text-emerald-600 dark:text-emerald-400",
            isNegative && "text-rose-600 dark:text-rose-400",
            !isPositive && !isNegative && "text-slate-500"
          )}
        >
          {isPositive && <ArrowUp className="h-4 w-4" />}
          {isNegative && <ArrowDown className="h-4 w-4" />}
          <span>{Math.abs(percentChange).toFixed(1)}%</span>
        </motion.div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={
              isInView
                ? { width: `${Math.min(100, (currentValue / (previousValue || 1)) * 50)}%` }
                : { width: 0 }
            }
            transition={{ duration: 1, delay: 0.3 }}
            className={cn(
              "h-full rounded-full",
              isPositive && "bg-emerald-500",
              isNegative && "bg-rose-500",
              !isPositive && !isNegative && "bg-slate-400"
            )}
          />
        </div>
        <span className="text-xs text-slate-400">
          {periodLabel}: {prefix}
          {previousValue.toLocaleString()}
          {suffix}
        </span>
      </div>
    </motion.div>
  );
}
