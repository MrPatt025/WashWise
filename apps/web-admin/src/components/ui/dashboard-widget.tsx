"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ExternalLink,
  GripVertical,
  Maximize2,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./menu";

// ============================================================================
// Types
// ============================================================================

interface WidgetAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

// ============================================================================
// Dashboard Widget
// ============================================================================

interface DashboardWidgetProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: WidgetAction[];
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onExpand?: () => void;
  href?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  draggable?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function DashboardWidget({
  title,
  subtitle,
  icon,
  children,
  actions = [],
  isLoading = false,
  error,
  onRefresh,
  onExpand,
  href,
  collapsible = false,
  defaultCollapsed = false,
  draggable = false,
  className,
  headerClassName,
  bodyClassName,
}: DashboardWidgetProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) {
      return;
    }
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const allActions: WidgetAction[] = [
    ...(onRefresh
      ? [
          {
            label: "Refresh",
            icon: <RefreshCw className="h-4 w-4" />,
            onClick: handleRefresh,
          },
        ]
      : []),
    ...(onExpand
      ? [
          {
            label: "Expand",
            icon: <Maximize2 className="h-4 w-4" />,
            onClick: onExpand,
          },
        ]
      : []),
    ...(href
      ? [
          {
            label: "Open",
            icon: <ExternalLink className="h-4 w-4" />,
            onClick: () => window.open(href, "_blank"),
          },
        ]
      : []),
    ...actions,
  ];

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
        "shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800",
          headerClassName
        )}
      >
        <div className="flex items-center gap-3">
          {draggable && (
            <button
              type="button"
              className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}

          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {(isLoading || isRefreshing) && (
            <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
          )}

          {collapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-500 transition-transform",
                  isCollapsed && "-rotate-90"
                )}
              />
            </button>
          )}

          {allActions.length > 0 && (
            <Menu placement="bottom-end">
              <MenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
              </MenuTrigger>
              <MenuContent>
                {allActions.map((action, index) => (
                  <MenuItem key={index} onClick={action.onClick} danger={action.danger}>
                    <span className="flex items-center gap-2">
                      {action.icon}
                      {action.label}
                    </span>
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
          )}
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn("p-4", bodyClassName)}
        >
          {error ? (
            <div className="py-8 text-center">
              <p className="mb-2 text-red-600 dark:text-red-400">{error}</p>
              {onRefresh && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Try again
                </button>
              )}
            </div>
          ) : (
            children
          )}
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// Widget Grid
// ============================================================================

interface WidgetGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function WidgetGrid({ children, columns = 2, className }: WidgetGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 lg:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Quick Actions Widget
// ============================================================================

interface QuickAction {
  label: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface QuickActionsWidgetProps {
  title?: string;
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function QuickActionsWidget({
  title = "Quick Actions",
  actions,
  columns = 4,
  className,
}: QuickActionsWidgetProps) {
  return (
    <DashboardWidget title={title} className={className}>
      <div
        className={cn(
          "grid gap-3",
          columns === 2 && "grid-cols-2",
          columns === 3 && "grid-cols-3",
          columns === 4 && "grid-cols-2 sm:grid-cols-4"
        )}
      >
        {actions.map((action, index) => (
          <button
            key={index}
            type="button"
            onClick={action.onClick}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg p-4",
              "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700",
              "group transition-colors"
            )}
          >
            <span
              className={cn(
                "rounded-lg p-2 transition-transform group-hover:scale-110",
                action.color || "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              )}
            >
              {action.icon}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {action.label}
            </span>
            {action.description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{action.description}</span>
            )}
          </button>
        ))}
      </div>
    </DashboardWidget>
  );
}

// ============================================================================
// Activity Feed Widget
// ============================================================================

interface Activity {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  description?: string;
  timestamp: Date | string;
  icon?: React.ReactNode;
  actor?: {
    name: string;
    avatar?: string;
  };
}

interface ActivityFeedWidgetProps {
  activities: Activity[];
  title?: string;
  maxItems?: number;
  onViewAll?: () => void;
  className?: string;
}

export function ActivityFeedWidget({
  activities,
  title = "Recent Activity",
  maxItems = 5,
  onViewAll,
  className,
}: ActivityFeedWidgetProps) {
  const displayedActivities = activities.slice(0, maxItems);

  const typeStyles = {
    info: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    success: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    error: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  const formatTime = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return "Just now";
    }
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    if (days < 7) {
      return `${days}d ago`;
    }
    return date.toLocaleDateString();
  };

  return (
    <DashboardWidget
      title={title}
      actions={onViewAll ? [{ label: "View All", onClick: onViewAll }] : []}
      className={className}
    >
      <div className="space-y-4">
        {displayedActivities.length === 0 ? (
          <p className="py-4 text-center text-gray-500 dark:text-gray-400">No recent activity</p>
        ) : (
          displayedActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                  typeStyles[activity.type]
                )}
              >
                {activity.icon || <span className="h-2 w-2 rounded-full bg-current" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {activity.description}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardWidget>
  );
}

// ============================================================================
// Status Overview Widget
// ============================================================================

interface StatusItem {
  label: string;
  value: number;
  total: number;
  color: string;
}

interface StatusOverviewWidgetProps {
  title?: string;
  items: StatusItem[];
  className?: string;
}

export function StatusOverviewWidget({
  title = "Status Overview",
  items,
  className,
}: StatusOverviewWidgetProps) {
  return (
    <DashboardWidget title={title} className={className}>
      <div className="space-y-4">
        {items.map((item, index) => {
          const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0;

          return (
            <div key={index}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.value} / {item.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardWidget>
  );
}

// ============================================================================
// Notification Widget
// ============================================================================

interface Notification {
  id: string;
  type: "info" | "warning" | "error";
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface NotificationWidgetProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
  className?: string;
}

export function NotificationWidget({
  notifications,
  onDismiss,
  className,
}: NotificationWidgetProps) {
  const typeStyles = {
    info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
    warning: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
    error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
  };

  const typeTextStyles = {
    info: "text-blue-800 dark:text-blue-200",
    warning: "text-amber-800 dark:text-amber-200",
    error: "text-red-800 dark:text-red-200",
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {notifications.map((notification) => (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4",
            typeStyles[notification.type]
          )}
        >
          <div className="flex-1">
            <p className={cn("text-sm font-medium", typeTextStyles[notification.type])}>
              {notification.title}
            </p>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              {notification.message}
            </p>
            {notification.action && (
              <button
                type="button"
                onClick={notification.action.onClick}
                className={cn(
                  "mt-2 text-sm font-medium",
                  notification.type === "info" && "text-blue-600 dark:text-blue-400",
                  notification.type === "warning" && "text-amber-600 dark:text-amber-400",
                  notification.type === "error" && "text-red-600 dark:text-red-400"
                )}
              >
                {notification.action.label}
              </button>
            )}
          </div>
          {notification.dismissible && onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}
