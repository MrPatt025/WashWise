"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ============================================================================
// Types
// ============================================================================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartDataPoint {
  x: number | string;
  y: number;
}

export interface LineChartSeries {
  name: string;
  data: LineChartDataPoint[];
  color?: string;
}

// ============================================================================
// Simple Bar Chart
// ============================================================================

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  showValues?: boolean;
  showLabels?: boolean;
  orientation?: "vertical" | "horizontal";
  animate?: boolean;
  className?: string;
}

export function BarChart({
  data,
  height = 200,
  showValues = true,
  showLabels = true,
  orientation = "vertical",
  animate = true,
  className,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  const defaultColors = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // yellow
    "#EF4444", // red
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#F97316", // orange
  ];

  if (orientation === "horizontal") {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const color = item.color || defaultColors[index % defaultColors.length];

          return (
            <div key={index}>
              {showLabels && (
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                  {showValues && (
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.value.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
              <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <motion.div
                  initial={animate ? { width: 0 } : undefined}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-end justify-around gap-2" style={{ height }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const color = item.color || defaultColors[index % defaultColors.length];

          return (
            <div key={index} className="flex h-full flex-1 flex-col items-center">
              <div className="flex w-full flex-1 items-end">
                <motion.div
                  initial={animate ? { height: 0 } : undefined}
                  animate={{ height: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="min-h-[4px] w-full rounded-t-md"
                  style={{ backgroundColor: color }}
                />
              </div>
              {showValues && (
                <span className="mt-1 text-xs font-medium text-gray-900 dark:text-white">
                  {item.value.toLocaleString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div className="mt-2 flex justify-around gap-2">
          {data.map((item, index) => (
            <span
              key={index}
              className="flex-1 truncate text-center text-xs text-gray-500 dark:text-gray-400"
            >
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Donut Chart
// ============================================================================

interface DonutChartProps {
  data: ChartDataPoint[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
  centerLabel?: string | React.ReactNode;
  animate?: boolean;
  className?: string;
}

export function DonutChart({
  data,
  size = 200,
  thickness = 40,
  showLegend = true,
  showPercentage = true,
  centerLabel,
  animate = true,
  className,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const defaultColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#F97316",
  ];

  let cumulativePercentage = 0;

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const offset = circumference * (1 - cumulativePercentage / 100);
    const length = circumference * (percentage / 100);
    cumulativePercentage += percentage;

    return {
      ...item,
      percentage,
      offset,
      length,
      color: item.color || defaultColors[index % defaultColors.length],
    };
  });

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transform"
          style={{ width: size, height: size }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-gray-100 dark:text-gray-800"
          />

          {/* Segments */}
          {segments.map((segment, index) => (
            <motion.circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={`${segment.length} ${circumference}`}
              strokeDashoffset={segment.offset}
              strokeLinecap="round"
              initial={animate ? { strokeDasharray: `0 ${circumference}` } : undefined}
              animate={{
                strokeDasharray: `${segment.length} ${circumference}`,
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          ))}
        </svg>

        {/* Center label */}
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {typeof centerLabel === "string" ? (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {centerLabel}
                </span>
              ) : (
                centerLabel
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {segment.label}
                {showPercentage && (
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {segment.percentage.toFixed(1)}%
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Pie Chart
// ============================================================================

interface PieChartProps {
  data: ChartDataPoint[];
  size?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
  animate?: boolean;
  className?: string;
}

export function PieChart({
  data,
  size = 200,
  showLegend = true,
  showPercentage = true,
  animate = true,
  className,
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 10;

  const defaultColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  let cumulativeAngle = 0;

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;

    cumulativeAngle = endAngle;

    // Calculate path for pie slice
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    return {
      ...item,
      percentage,
      pathData,
      color: item.color || defaultColors[index % defaultColors.length],
    };
  });

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        {slices.map((slice, index) => (
          <motion.path
            key={index}
            d={slice.pathData}
            fill={slice.color}
            initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="transition-opacity hover:opacity-80"
          />
        ))}
      </svg>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {slice.label}
                {showPercentage && (
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {slice.percentage.toFixed(1)}%
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Simple Line Chart (SVG-based)
// ============================================================================

interface SimpleLineChartProps {
  data: LineChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showPoints?: boolean;
  showArea?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  className?: string;
}

export function SimpleLineChart({
  data,
  width = 400,
  height = 200,
  color = "#3B82F6",
  showPoints = true,
  showArea = false,
  showGrid = true,
  animate = true,
  className,
}: SimpleLineChartProps) {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const yValues = data.map((d) => d.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY || 1;

  const points = data.map((d, i) => {
    const px = padding + (i / (data.length - 1)) * chartWidth;
    const py = padding + chartHeight - ((d.y - minY) / yRange) * chartHeight;
    return {
      x: px,
      y: py,
      originalX: d.x,
      originalY: d.y,
    };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("h-auto w-full", className)}>
      {/* Grid */}
      {showGrid && (
        <g className="text-gray-200 dark:text-gray-700">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding}
              y1={padding + chartHeight * ratio}
              x2={padding + chartWidth}
              y2={padding + chartHeight * ratio}
              stroke="currentColor"
              strokeDasharray="4"
            />
          ))}
        </g>
      )}

      {/* Area */}
      {showArea && (
        <motion.path
          d={areaPath}
          fill={color}
          fillOpacity={0.1}
          initial={animate ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Points */}
      {showPoints &&
        points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="white"
            stroke={color}
            strokeWidth={2}
            initial={animate ? { scale: 0 } : undefined}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="hover:r-6 cursor-pointer"
          />
        ))}

      {/* Y-axis labels */}
      <text
        x={padding - 5}
        y={padding}
        textAnchor="end"
        className="fill-gray-500 text-xs dark:fill-gray-400"
      >
        {maxY.toLocaleString()}
      </text>
      <text
        x={padding - 5}
        y={padding + chartHeight}
        textAnchor="end"
        className="fill-gray-500 text-xs dark:fill-gray-400"
      >
        {minY.toLocaleString()}
      </text>

      {/* X-axis labels */}
      {data.length <= 10 &&
        points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={padding + chartHeight + 15}
            textAnchor="middle"
            className="fill-gray-500 text-xs dark:fill-gray-400"
          >
            {String(data[i].x)}
          </text>
        ))}
    </svg>
  );
}

// ============================================================================
// Sparkline
// ============================================================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = "#3B82F6",
  showArea = false,
  className,
}: SparklineProps) {
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minY = Math.min(...data);
  const maxY = Math.max(...data);
  const yRange = maxY - minY || 1;

  const points = data.map((value, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: padding + chartHeight - ((value - minY) / yRange) * chartHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} style={{ width, height }}>
      {showArea && <path d={areaPath} fill={color} fillOpacity={0.1} />}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// Progress Ring
// ============================================================================

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  showValue?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 100,
  thickness = 8,
  color = "#3B82F6",
  trackColor,
  showValue = true,
  label,
  animate = true,
  className,
}: ProgressRingProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
        style={{ width: size, height: size }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor || "currentColor"}
          strokeWidth={thickness}
          className={!trackColor ? "text-gray-200 dark:text-gray-700" : ""}
        />

        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : undefined}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
          {label && <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Chart Card (wrapper)
// ============================================================================

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, actions, className }: ChartCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
