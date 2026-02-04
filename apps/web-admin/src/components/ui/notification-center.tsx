"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
  Settings,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// ============================================================================
// Types
// ============================================================================

export type NotificationType = "success" | "error" | "warning" | "info" | "loading";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
  read?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const notificationConfig: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bgColor: string; borderColor: string }
> = {
  success: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  error: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
  warning: {
    icon: AlertCircle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  info: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  loading: {
    icon: Loader2,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
};

// ============================================================================
// Notification Context
// ============================================================================

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationContext = React.createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

// ============================================================================
// Notification Provider
// ============================================================================

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

export function NotificationProvider({
  children,
  maxNotifications = 50,
  defaultDuration = 5000,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const addNotification = React.useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: new Date(),
        dismissible: notification.dismissible ?? true,
        read: false,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        return updated.slice(0, maxNotifications);
      });

      // Auto-dismiss if duration is set
      const duration = notification.duration ?? defaultDuration;
      if (duration > 0 && notification.type !== "loading") {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);
      }

      return id;
    },
    [maxNotifications, defaultDuration]
  );

  const removeNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = React.useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = React.useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = React.useMemo(
    () => ({
      notifications,
      addNotification,
      removeNotification,
      clearAll,
      markAsRead,
      markAllAsRead,
      unreadCount,
    }),
    [
      notifications,
      addNotification,
      removeNotification,
      clearAll,
      markAsRead,
      markAllAsRead,
      unreadCount,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// ============================================================================
// Notification Toast (floating)
// ============================================================================

interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
  index: number;
}

export function NotificationToast({ notification, onDismiss, index }: NotificationToastProps) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay: index * 0.05,
      }}
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm",
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              config.bgColor
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                config.color,
                notification.type === "loading" && "animate-spin"
              )}
            />
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {notification.title}
            </p>
            {notification.message && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {notification.message}
              </p>
            )}
            {notification.action && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={notification.action.onClick}
                  className="h-7 text-xs"
                >
                  {notification.action.label}
                </Button>
              </div>
            )}
          </div>
          {notification.dismissible && notification.type !== "loading" && (
            <button
              onClick={onDismiss}
              className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for timed notifications */}
      {notification.duration && notification.duration > 0 && notification.type !== "loading" && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: notification.duration / 1000, ease: "linear" }}
          className={cn("h-1 origin-left", config.color.replace("text-", "bg-"))}
          style={{ opacity: 0.3 }}
        />
      )}
    </motion.div>
  );
}

// ============================================================================
// Notification Container (toast position)
// ============================================================================

interface NotificationContainerProps {
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  maxVisible?: number;
}

export function NotificationContainer({
  position = "top-right",
  maxVisible = 5,
}: NotificationContainerProps) {
  const { notifications, removeNotification } = useNotifications();

  const positionClasses: Record<typeof position, string> = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50 flex flex-col gap-2",
        positionClasses[position]
      )}
    >
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification, index) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Notification Bell (dropdown)
// ============================================================================

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = React.useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotifications();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return "Just now";
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return `${diffDays}d ago`;
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="rounded-md p-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                      <Bell className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                      No notifications
                    </p>
                    <p className="text-xs text-slate-500">You&apos;re all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.slice(0, 10).map((notification) => {
                      const config = notificationConfig[notification.type];
                      const Icon = config.icon;

                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={cn(
                            "group flex gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                          )}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                              config.bgColor
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4",
                                config.color,
                                notification.type === "loading" && "animate-spin"
                              )}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                {notification.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            {notification.message && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                {notification.message}
                              </p>
                            )}
                            <p className="mt-1 text-[10px] text-slate-400">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="shrink-0 pt-1.5">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 10 && (
                <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-800">
                  <button className="w-full text-center text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">
                    View all {notifications.length} notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Helper Hooks for common patterns
// ============================================================================

export function useNotificationHelpers() {
  const { addNotification } = useNotifications();

  return React.useMemo(
    () => ({
      success: (title: string, message?: string) =>
        addNotification({ type: "success", title, message }),
      error: (title: string, message?: string) =>
        addNotification({ type: "error", title, message, duration: 8000 }),
      warning: (title: string, message?: string) =>
        addNotification({ type: "warning", title, message }),
      info: (title: string, message?: string) => addNotification({ type: "info", title, message }),
      loading: (title: string, message?: string) =>
        addNotification({ type: "loading", title, message, duration: 0, dismissible: false }),
      promise: async <T,>(
        promise: Promise<T>,
        {
          loading,
          success,
          error,
        }: {
          loading: string;
          success: string | ((data: T) => string);
          error: string | ((err: unknown) => string);
        }
      ): Promise<T> => {
        const id = addNotification({
          type: "loading",
          title: loading,
          duration: 0,
          dismissible: false,
        });

        try {
          const result = await promise;
          addNotification({
            type: "success",
            title: typeof success === "function" ? success(result) : success,
          });
          return result;
        } catch (err) {
          addNotification({
            type: "error",
            title: typeof error === "function" ? error(err) : error,
            duration: 8000,
          });
          throw err;
        } finally {
          // Remove loading notification
          setTimeout(() => {
            const { removeNotification } = useNotifications();
            removeNotification(id);
          }, 0);
        }
      },
    }),
    [addNotification]
  );
}
