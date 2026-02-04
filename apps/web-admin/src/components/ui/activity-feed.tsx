"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Info,
  Loader2,
  Settings,
  User,
  WashingMachine,
  XCircle,
} from "lucide-react";
import { Avatar } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";

// ============================================================================
// Helper to format time ago
// ============================================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${days}d ago`;
}

// ============================================================================
// Types
// ============================================================================

export type ActivityType =
  | "machine_status"
  | "transaction"
  | "user_action"
  | "system_alert"
  | "maintenance"
  | "error"
  | "success";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
    email?: string;
  };
  metadata?: Record<string, unknown>;
  priority?: "low" | "medium" | "high" | "critical";
  read?: boolean;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  onActivityClick?: (activity: ActivityItem) => void;
  onMarkAsRead?: (id: string) => void;
  realtime?: boolean;
  className?: string;
}

// ============================================================================
// Activity Icons
// ============================================================================

const activityIcons: Record<ActivityType, React.ReactNode> = {
  machine_status: <WashingMachine className="h-4 w-4" />,
  transaction: <DollarSign className="h-4 w-4" />,
  user_action: <User className="h-4 w-4" />,
  system_alert: <Info className="h-4 w-4" />,
  maintenance: <Settings className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
};

const activityColors: Record<ActivityType, string> = {
  machine_status: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  transaction: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  user_action: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  system_alert: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  maintenance: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  error: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

// ============================================================================
// Single Activity Item
// ============================================================================

interface ActivityItemCardProps {
  activity: ActivityItem;
  onClick?: () => void;
  onMarkAsRead?: () => void;
  isNew?: boolean;
}

function ActivityItemCard({ activity, onClick, onMarkAsRead, isNew }: ActivityItemCardProps) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -20, scale: 0.95 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex gap-3 rounded-lg border p-3 transition-all duration-200",
        "hover:bg-slate-50 hover:shadow-sm dark:hover:bg-slate-800/50",
        activity.read
          ? "border-transparent bg-transparent"
          : "border-violet-200 bg-violet-50/50 dark:border-violet-800/50 dark:bg-violet-900/10",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {!activity.read && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500"
        />
      )}

      {/* Icon */}
      <div className={cn("flex-shrink-0 rounded-lg p-2", activityColors[activity.type])}>
        {activityIcons[activity.type]}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
            {activity.priority && (
              <Badge
                variant="secondary"
                className={cn("px-1.5 py-0 text-[10px]", priorityColors[activity.priority])}
              >
                {activity.priority}
              </Badge>
            )}
          </div>
          <span className="flex-shrink-0 text-xs text-slate-500">
            {formatTimeAgo(activity.timestamp)}
          </span>
        </div>

        {activity.description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
            {activity.description}
          </p>
        )}

        {/* User info */}
        {activity.user && (
          <div className="mt-2 flex items-center gap-2">
            <Avatar src={activity.user.avatar} name={activity.user.name} size="xs" />
            <span className="text-xs text-slate-500">{activity.user.name}</span>
          </div>
        )}
      </div>

      {/* Mark as read button */}
      {!activity.read && onMarkAsRead && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead();
          }}
        >
          <CheckCircle2 className="h-3 w-3" />
        </Button>
      )}
    </motion.div>
  );
}

// ============================================================================
// Main Activity Feed Component
// ============================================================================

export function ActivityFeed({
  activities,
  loading = false,
  maxItems,
  showLoadMore = true,
  onLoadMore,
  onActivityClick,
  onMarkAsRead,
  realtime = false,
  className,
}: ActivityFeedProps) {
  const [previousIds, setPreviousIds] = React.useState<Set<string>>(new Set());
  const [newIds, setNewIds] = React.useState<Set<string>>(new Set());

  // Track new activities for animation
  React.useEffect(() => {
    if (realtime) {
      const currentIds = new Set(activities.map((a) => a.id));
      const newActivityIds = new Set(
        activities.filter((a) => !previousIds.has(a.id)).map((a) => a.id)
      );

      if (newActivityIds.size > 0) {
        setNewIds(newActivityIds);
        // Clear new status after animation
        setTimeout(() => setNewIds(new Set()), 1000);
      }

      setPreviousIds(currentIds);
    }
  }, [activities, realtime, previousIds]);

  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;

  const unreadCount = activities.filter((a) => !a.read).length;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Activity Feed</h3>
          {realtime && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Live
            </div>
          )}
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
            >
              {unreadCount} new
            </Badge>
          )}
        </div>
        {onMarkAsRead && unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs">
            Mark all read
          </Button>
        )}
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto pt-3">
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
              <Clock className="h-6 w-6 text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              No recent activity
            </p>
            <p className="mt-1 text-xs text-slate-500">Activity will appear here as it happens</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {displayedActivities.map((activity) => (
                <ActivityItemCard
                  key={activity.id}
                  activity={activity}
                  onClick={onActivityClick ? () => onActivityClick(activity) : undefined}
                  onMarkAsRead={onMarkAsRead ? () => onMarkAsRead(activity.id) : undefined}
                  isNew={newIds.has(activity.id)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Load More */}
        {showLoadMore && maxItems && activities.length > maxItems && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compact Activity List (for sidebars)
// ============================================================================

interface CompactActivityListProps {
  activities: ActivityItem[];
  maxItems?: number;
  className?: string;
}

export function CompactActivityList({
  activities,
  maxItems = 5,
  className,
}: CompactActivityListProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className={cn("space-y-2", className)}>
      {displayedActivities.map((activity) => (
        <div key={activity.id} className="flex items-center gap-2 text-sm">
          <div className={cn("rounded p-1", activityColors[activity.type])}>
            {activityIcons[activity.type]}
          </div>
          <span className="flex-1 truncate text-slate-600 dark:text-slate-400">
            {activity.title}
          </span>
          <span className="text-xs text-slate-400">{formatTimeAgo(activity.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}

export { ActivityItemCard };
