"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Circle, Clock, AlertCircle } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface TimelineItem {
  id: string;
  title: string;
  description?: string | React.ReactNode;
  date?: string | Date;
  time?: string;
  icon?: React.ReactNode;
  status?: "completed" | "current" | "upcoming" | "error";
  variant?: "default" | "success" | "warning" | "error" | "info";
  content?: React.ReactNode;
}

// ============================================================================
// Timeline Container
// ============================================================================

interface TimelineProps {
  children: React.ReactNode;
  orientation?: "vertical" | "horizontal";
  linePosition?: "left" | "center" | "right";
  animated?: boolean;
  className?: string;
}

export function Timeline({
  children,
  orientation = "vertical",
  linePosition = "left",
  animated = true,
  className,
}: TimelineProps) {
  return (
    <div
      className={cn(
        orientation === "horizontal" ? "flex items-start overflow-x-auto" : "space-y-0",
        className
      )}
      data-orientation={orientation}
      data-line-position={linePosition}
      data-animated={animated}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Timeline Item
// ============================================================================

interface TimelineItemComponentProps {
  children?: React.ReactNode;
  title?: string;
  description?: string | React.ReactNode;
  date?: string | Date;
  time?: string;
  icon?: React.ReactNode;
  status?: "completed" | "current" | "upcoming" | "error";
  variant?: "default" | "success" | "warning" | "error" | "info";
  isLast?: boolean;
  className?: string;
}

export function TimelineItemComponent({
  children,
  title,
  description,
  date,
  time,
  icon,
  status = "upcoming",
  variant = "default",
  isLast = false,
  className,
}: TimelineItemComponentProps) {
  const statusIcons = {
    completed: <Check className="h-4 w-4" />,
    current: <Circle className="h-3 w-3 fill-current" />,
    upcoming: <Circle className="h-3 w-3" />,
    error: <AlertCircle className="h-4 w-4" />,
  };

  const variantColors = {
    default: {
      dot: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
      line: "bg-gray-200 dark:bg-gray-700",
    },
    success: {
      dot: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      line: "bg-green-200 dark:bg-green-800",
    },
    warning: {
      dot: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500",
      line: "bg-yellow-200 dark:bg-yellow-800",
    },
    error: {
      dot: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
      line: "bg-red-200 dark:bg-red-800",
    },
    info: {
      dot: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      line: "bg-blue-200 dark:bg-blue-800",
    },
  };

  const statusColors = {
    completed: variantColors.success,
    current: variantColors.info,
    upcoming: variantColors.default,
    error: variantColors.error,
  };

  const colors = variant !== "default" ? variantColors[variant] : statusColors[status];

  const formattedDate = date ? (typeof date === "string" ? date : date.toLocaleDateString()) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative flex gap-4", className)}
    >
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
            colors.dot
          )}
        >
          {icon || statusIcons[status]}
        </div>
        {!isLast && <div className={cn("mt-2 w-0.5 flex-1", colors.line)} />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>}
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          {(formattedDate || time) && (
            <div className="flex flex-shrink-0 items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              {formattedDate && <span>{formattedDate}</span>}
              {time && <span>{time}</span>}
            </div>
          )}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Simple Timeline (all-in-one)
// ============================================================================

interface SimpleTimelineProps {
  items: TimelineItem[];
  animated?: boolean;
  className?: string;
}

export function SimpleTimeline({ items, animated = true, className }: SimpleTimelineProps) {
  return (
    <Timeline animated={animated} className={className}>
      {items.map((item, index) => (
        <TimelineItemComponent
          key={item.id}
          title={item.title}
          description={item.description}
          date={item.date}
          time={item.time}
          icon={item.icon}
          status={item.status}
          variant={item.variant}
          isLast={index === items.length - 1}
        >
          {item.content}
        </TimelineItemComponent>
      ))}
    </Timeline>
  );
}

// ============================================================================
// Activity Timeline
// ============================================================================

interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  target?: string;
  timestamp: string | Date;
  content?: React.ReactNode;
}

interface ActivityTimelineProps {
  items: ActivityItem[];
  className?: string;
}

export function ActivityTimeline({ items, className }: ActivityTimelineProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item) => {
        const formattedTime =
          typeof item.timestamp === "string" ? item.timestamp : formatRelativeTime(item.timestamp);

        return (
          <div key={item.id} className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                {item.user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.user.avatar}
                    alt={item.user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {item.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-white">{item.user.name}</span>{" "}
                {item.action}
                {item.target && (
                  <>
                    {" "}
                    <span className="font-medium text-gray-900 dark:text-white">{item.target}</span>
                  </>
                )}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{formattedTime}</p>
              {item.content && <div className="mt-2">{item.content}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Horizontal Timeline
// ============================================================================

interface HorizontalTimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function HorizontalTimeline({ items, className }: HorizontalTimelineProps) {
  return (
    <div className={cn("overflow-x-auto pb-4", className)}>
      <div className="flex min-w-max items-start">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          const statusColors = {
            completed: "bg-green-500",
            current: "bg-blue-500",
            upcoming: "bg-gray-300 dark:bg-gray-600",
            error: "bg-red-500",
          };

          return (
            <div key={item.id} className="flex items-start">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-4 w-4 flex-shrink-0 rounded-full",
                    statusColors[item.status || "upcoming"]
                  )}
                />
                <div className="mt-2 w-32 text-center">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {item.title}
                  </p>
                  {item.date && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {typeof item.date === "string" ? item.date : item.date.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mt-2 h-0.5 w-16",
                    item.status === "completed" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Order Tracking Timeline
// ============================================================================

interface OrderStep {
  id: string;
  label: string;
  description?: string;
  timestamp?: string | Date;
  status: "completed" | "current" | "upcoming";
}

interface OrderTrackingTimelineProps {
  steps: OrderStep[];
  className?: string;
}

export function OrderTrackingTimeline({ steps, className }: OrderTrackingTimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        const statusConfig = {
          completed: {
            dot: "bg-green-500 text-white",
            line: "bg-green-500",
            text: "text-gray-900 dark:text-white",
          },
          current: {
            dot: "bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900/30",
            line: "bg-gray-200 dark:bg-gray-700",
            text: "text-gray-900 dark:text-white font-medium",
          },
          upcoming: {
            dot: "bg-gray-200 dark:bg-gray-700 text-gray-400",
            line: "bg-gray-200 dark:bg-gray-700",
            text: "text-gray-400 dark:text-gray-500",
          },
        };

        const config = statusConfig[step.status];

        return (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all",
                  config.dot
                )}
              >
                {step.status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : step.status === "current" ? (
                  <Circle className="h-3 w-3 animate-pulse fill-current" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>
              {!isLast && <div className={cn("h-12 w-0.5", config.line)} />}
            </div>

            <div className="flex-1 pb-8">
              <p className={cn("text-sm", config.text)}>{step.label}</p>
              {step.description && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              )}
              {step.timestamp && step.status !== "upcoming" && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {typeof step.timestamp === "string"
                    ? step.timestamp
                    : step.timestamp.toLocaleString()}
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
// Change Log Timeline
// ============================================================================

interface ChangeLogEntry {
  version: string;
  date: string | Date;
  changes: Array<{
    type: "added" | "changed" | "fixed" | "removed" | "security";
    description: string;
  }>;
}

interface ChangeLogTimelineProps {
  entries: ChangeLogEntry[];
  className?: string;
}

export function ChangeLogTimeline({ entries, className }: ChangeLogTimelineProps) {
  const typeConfig = {
    added: {
      label: "Added",
      color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    },
    changed: {
      label: "Changed",
      color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    },
    fixed: {
      label: "Fixed",
      color: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30",
    },
    removed: {
      label: "Removed",
      color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
    },
    security: {
      label: "Security",
      color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
    },
  };

  return (
    <div className={cn("space-y-8", className)}>
      {entries.map((entry, index) => (
        <div key={index}>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{entry.version}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {typeof entry.date === "string" ? entry.date : entry.date.toLocaleDateString()}
            </span>
          </div>

          <ul className="space-y-2">
            {entry.changes.map((change, changeIndex) => (
              <li key={changeIndex} className="flex items-start gap-3">
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs font-medium",
                    typeConfig[change.type].color
                  )}
                >
                  {typeConfig[change.type].label}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {change.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}
