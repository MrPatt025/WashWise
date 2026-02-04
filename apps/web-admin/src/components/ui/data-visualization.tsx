"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useSpring, useTransform } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

// ============================================================================
// Animated Progress Ring
// ============================================================================

interface ProgressRingProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg" | "xl";
  strokeWidth?: number;
  color?: "default" | "success" | "warning" | "danger" | "info" | "gradient";
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { dimension: 60, textSize: "text-sm", labelSize: "text-[8px]" },
  md: { dimension: 80, textSize: "text-lg", labelSize: "text-[10px]" },
  lg: { dimension: 120, textSize: "text-2xl", labelSize: "text-xs" },
  xl: { dimension: 160, textSize: "text-3xl", labelSize: "text-sm" },
};

const colorConfig = {
  default: { stroke: "#6366f1", bg: "#e0e7ff" },
  success: { stroke: "#10b981", bg: "#d1fae5" },
  warning: { stroke: "#f59e0b", bg: "#fef3c7" },
  danger: { stroke: "#ef4444", bg: "#fee2e2" },
  info: { stroke: "#3b82f6", bg: "#dbeafe" },
  gradient: { stroke: "url(#gradient)", bg: "#f3e8ff" },
};

export function ProgressRing({
  value,
  size = "md",
  strokeWidth = 8,
  color = "default",
  showValue = true,
  showLabel = false,
  label,
  animate = true,
  className,
}: ProgressRingProps) {
  const config = sizeConfig[size];
  const colorConf = colorConfig[color];
  const radius = (config.dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const progress = useTransform(spring, (val) => circumference - (val / 100) * circumference);
  const displayValue = useTransform(spring, (val) => Math.round(val));
  const [displayNum, setDisplayNum] = React.useState(0);

  React.useEffect(() => {
    if (animate) {
      spring.set(value);
    }
  }, [value, animate, spring]);

  React.useEffect(() => {
    return displayValue.on("change", (latest) => setDisplayNum(latest));
  }, [displayValue]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={config.dimension} height={config.dimension} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="none"
          stroke={colorConf.bg}
          strokeWidth={strokeWidth}
          className="dark:opacity-30"
        />

        {/* Progress circle */}
        <motion.circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="none"
          stroke={colorConf.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: animate ? progress : circumference - (value / 100) * circumference,
          }}
        />
      </svg>

      {/* Center content */}
      {(showValue || showLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <span className={cn("font-bold text-slate-900 dark:text-white", config.textSize)}>
              {animate ? displayNum : value}%
            </span>
          )}
          {showLabel && label && (
            <span className={cn("text-slate-500 dark:text-slate-400", config.labelSize)}>
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Donut Chart
// ============================================================================

interface DonutSegment {
  value: number;
  label: string;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  showCenter?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
  animate?: boolean;
  className?: string;
}

export function DonutChart({
  segments,
  size = 120,
  strokeWidth = 16,
  showLegend = true,
  showCenter = true,
  centerLabel,
  centerValue,
  animate = true,
  className,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div className="relative">
        <svg width={size} height={size} className="rotate-[-90deg]">
          {segments.map((segment, index) => {
            const segmentLength = (segment.value / total) * circumference;
            const offset = currentOffset;
            currentOffset += segmentLength;

            return (
              <motion.circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-offset}
                initial={animate ? { opacity: 0 } : undefined}
                animate={animate ? { opacity: 1 } : undefined}
                transition={{ delay: index * 0.1 }}
              />
            );
          })}
        </svg>

        {showCenter && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue !== undefined && (
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {centerValue}
              </span>
            )}
            {centerLabel && <span className="text-[10px] text-slate-500">{centerLabel}</span>}
          </div>
        )}
      </div>

      {showLegend && (
        <div className="space-y-2">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-sm text-slate-600 dark:text-slate-400">{segment.label}</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Stat Comparison
// ============================================================================

interface StatComparisonProps {
  current: number;
  previous: number;
  label: string;
  format?: (value: number) => string;
  invertColors?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatComparison({
  current,
  previous,
  label,
  format = (v) => v.toLocaleString(),
  invertColors = false,
  size = "md",
  className,
}: StatComparisonProps) {
  const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const colorClass = isNeutral
    ? "text-slate-500"
    : isPositive !== invertColors
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  const sizeClasses = {
    sm: { value: "text-lg", change: "text-xs" },
    md: { value: "text-2xl", change: "text-sm" },
    lg: { value: "text-3xl", change: "text-base" },
  };

  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <motion.p
        className={cn("font-bold text-slate-900 dark:text-white", sizeClasses[size].value)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {format(current)}
      </motion.p>
      <div className={cn("flex items-center gap-1", colorClass, sizeClasses[size].change)}>
        {isNeutral ? (
          <Minus className="h-3 w-3" />
        ) : isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span>{Math.abs(change).toFixed(1)}%</span>
        <span className="text-slate-400">vs previous</span>
      </div>
    </div>
  );
}

// ============================================================================
// Mini Bar Chart
// ============================================================================

interface MiniBarChartProps {
  data: number[];
  height?: number;
  barWidth?: number;
  gap?: number;
  color?: string;
  showLabels?: boolean;
  labels?: string[];
  animate?: boolean;
  className?: string;
}

export function MiniBarChart({
  data,
  height = 60,
  barWidth = 8,
  gap = 4,
  color = "#6366f1",
  showLabels = false,
  labels = [],
  animate = true,
  className,
}: MiniBarChartProps) {
  const maxValue = Math.max(...data);
  const width = data.length * (barWidth + gap) - gap;

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <svg width={width} height={height} className="overflow-visible">
        {data.map((value, index) => {
          const barHeight = maxValue > 0 ? (value / maxValue) * (height - 10) : 0;
          const x = index * (barWidth + gap);
          const y = height - barHeight;

          return (
            <motion.rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={barWidth / 2}
              fill={color}
              initial={animate ? { scaleY: 0 } : undefined}
              animate={animate ? { scaleY: 1 } : undefined}
              transition={{ delay: index * 0.05 }}
              style={{ transformOrigin: "bottom" }}
              className="cursor-pointer opacity-80 hover:opacity-100"
            />
          );
        })}
      </svg>

      {showLabels && labels.length > 0 && (
        <div className="mt-1 flex" style={{ width, gap }}>
          {labels.map((label, index) => (
            <span
              key={index}
              className="text-[8px] text-slate-400"
              style={{ width: barWidth, textAlign: "center" }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Gauge Chart
// ============================================================================

interface GaugeChartProps {
  value: number; // 0-100
  min?: number;
  max?: number;
  thresholds?: { value: number; color: string }[];
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  label?: string;
  suffix?: string;
  animate?: boolean;
  className?: string;
}

const gaugeSizes = {
  sm: { width: 100, height: 60, fontSize: "text-sm" },
  md: { width: 140, height: 84, fontSize: "text-xl" },
  lg: { width: 180, height: 108, fontSize: "text-2xl" },
};

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  thresholds = [
    { value: 30, color: "#ef4444" },
    { value: 70, color: "#f59e0b" },
    { value: 100, color: "#10b981" },
  ],
  size = "md",
  showValue = true,
  label,
  suffix = "%",
  animate = true,
  className,
}: GaugeChartProps) {
  const config = gaugeSizes[size];
  const normalizedValue = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const angle = (normalizedValue / 100) * 180 - 90; // -90 to 90 degrees

  const spring = useSpring(-90, { stiffness: 60, damping: 20 });
  const animatedAngle = useTransform(spring, (val) => val);

  React.useEffect(() => {
    if (animate) {
      spring.set(angle);
    }
  }, [angle, animate, spring]);

  const getCurrentColor = () => {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (normalizedValue <= thresholds[i].value) {
        if (i === 0) {
          return thresholds[0].color;
        }
        continue;
      }
      return thresholds[Math.min(i + 1, thresholds.length - 1)].color;
    }
    return thresholds[thresholds.length - 1].color;
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <svg width={config.width} height={config.height + 10} className="overflow-visible">
          {/* Background arc */}
          <path
            d={`M 10 ${config.height} A ${config.width / 2 - 10} ${config.height - 10} 0 0 1 ${config.width - 10} ${config.height}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={8}
            strokeLinecap="round"
            className="dark:stroke-slate-700"
          />

          {/* Threshold segments */}
          {thresholds.map((threshold, index) => {
            const prevThreshold = index > 0 ? thresholds[index - 1].value : 0;
            const startAngle = (prevThreshold / 100) * 180 - 90;
            const endAngle = (threshold.value / 100) * 180 - 90;

            const startX =
              config.width / 2 + (config.width / 2 - 10) * Math.cos((startAngle * Math.PI) / 180);
            const startY =
              config.height + (config.height - 10) * Math.sin((startAngle * Math.PI) / 180);
            const endX =
              config.width / 2 + (config.width / 2 - 10) * Math.cos((endAngle * Math.PI) / 180);
            const endY =
              config.height + (config.height - 10) * Math.sin((endAngle * Math.PI) / 180);

            const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

            return (
              <path
                key={threshold.value}
                d={`M ${startX} ${startY} A ${config.width / 2 - 10} ${config.height - 10} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
                fill="none"
                stroke={threshold.color}
                strokeWidth={8}
                strokeLinecap="round"
                opacity={0.3}
              />
            );
          })}

          {/* Needle */}
          <motion.g
            style={{
              transformOrigin: `${config.width / 2}px ${config.height}px`,
              rotate: animate ? animatedAngle : angle,
            }}
          >
            <line
              x1={config.width / 2}
              y1={config.height}
              x2={config.width / 2}
              y2={20}
              stroke={getCurrentColor()}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={config.width / 2} cy={config.height} r={6} fill={getCurrentColor()} />
          </motion.g>
        </svg>

        {/* Value display */}
        {showValue && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <span className={cn("font-bold text-slate-900 dark:text-white", config.fontSize)}>
              {value}
              {suffix}
            </span>
          </div>
        )}
      </div>

      {label && <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">{label}</span>}
    </div>
  );
}

// ============================================================================
// Heat Map Cell
// ============================================================================

interface HeatMapProps {
  data: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  colorScale?: string[];
  cellSize?: number;
  showValues?: boolean;
  className?: string;
}

export function HeatMap({
  data,
  rowLabels = [],
  colLabels = [],
  colorScale = ["#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c"],
  cellSize = 32,
  showValues = false,
  className,
}: HeatMapProps) {
  const maxValue = Math.max(...data.flat());
  const minValue = Math.min(...data.flat());

  const getColor = (value: number) => {
    const normalizedValue = maxValue !== minValue ? (value - minValue) / (maxValue - minValue) : 0;
    const index = Math.min(Math.floor(normalizedValue * colorScale.length), colorScale.length - 1);
    return colorScale[index];
  };

  return (
    <div className={cn("inline-block", className)}>
      {/* Column labels */}
      {colLabels.length > 0 && (
        <div className="flex" style={{ marginLeft: rowLabels.length > 0 ? 40 : 0 }}>
          {colLabels.map((label, index) => (
            <div
              key={index}
              className="text-center text-[10px] text-slate-500"
              style={{ width: cellSize }}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="flex flex-col">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center">
            {/* Row label */}
            {rowLabels.length > 0 && (
              <span className="w-10 pr-2 text-right text-[10px] text-slate-500">
                {rowLabels[rowIndex]}
              </span>
            )}

            {/* Cells */}
            {row.map((value, colIndex) => (
              <motion.div
                key={colIndex}
                className="flex items-center justify-center rounded-sm border border-white/50"
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: getColor(value),
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (rowIndex * row.length + colIndex) * 0.01 }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
              >
                {showValues && (
                  <span className="text-[8px] font-medium text-slate-700">{value}</span>
                )}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
