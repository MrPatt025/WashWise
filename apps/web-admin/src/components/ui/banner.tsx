"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Bell, ChevronRight } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type BannerVariant = "info" | "success" | "warning" | "error" | "neutral";

export interface BannerAction {
  label: string;
  onClick: () => void;
  variant?: "link" | "button";
}

// ============================================================================
// Banner
// ============================================================================

interface BannerProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  variant?: BannerVariant;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: BannerAction;
  className?: string;
}

const variantIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  neutral: Bell,
};

const variantStyles = {
  info: {
    container: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-800 dark:text-blue-200",
    description: "text-blue-700 dark:text-blue-300",
    dismiss: "text-blue-400 hover:text-blue-600 dark:hover:text-blue-300",
  },
  success: {
    container: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    title: "text-green-800 dark:text-green-200",
    description: "text-green-700 dark:text-green-300",
    dismiss: "text-green-400 hover:text-green-600 dark:hover:text-green-300",
  },
  warning: {
    container: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-600 dark:text-yellow-500",
    title: "text-yellow-800 dark:text-yellow-200",
    description: "text-yellow-700 dark:text-yellow-300",
    dismiss: "text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300",
  },
  error: {
    container: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    title: "text-red-800 dark:text-red-200",
    description: "text-red-700 dark:text-red-300",
    dismiss: "text-red-400 hover:text-red-600 dark:hover:text-red-300",
  },
  neutral: {
    container: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    icon: "text-gray-600 dark:text-gray-400",
    title: "text-gray-800 dark:text-gray-200",
    description: "text-gray-600 dark:text-gray-300",
    dismiss: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
  },
};

export function Banner({
  children,
  title,
  description,
  variant = "info",
  icon,
  dismissible = true,
  onDismiss,
  action,
  className,
}: BannerProps) {
  const [visible, setVisible] = React.useState(true);
  const styles = variantStyles[variant];
  const IconComponent = variantIcons[variant];

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div
            role="alert"
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4",
              styles.container,
              className
            )}
          >
            <span className={cn("mt-0.5 flex-shrink-0", styles.icon)}>
              {icon || <IconComponent className="h-5 w-5" />}
            </span>

            <div className="min-w-0 flex-1">
              {title && <h4 className={cn("font-medium", styles.title)}>{title}</h4>}
              {description && (
                <p className={cn("mt-0.5 text-sm", styles.description)}>{description}</p>
              )}
              {children}

              {action && (
                <div className="mt-2">
                  {action.variant === "button" ? (
                    <button
                      onClick={action.onClick}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        variant === "info" && "bg-blue-600 text-white hover:bg-blue-700",
                        variant === "success" && "bg-green-600 text-white hover:bg-green-700",
                        variant === "warning" && "bg-yellow-600 text-white hover:bg-yellow-700",
                        variant === "error" && "bg-red-600 text-white hover:bg-red-700",
                        variant === "neutral" && "bg-gray-600 text-white hover:bg-gray-700"
                      )}
                    >
                      {action.label}
                    </button>
                  ) : (
                    <button
                      onClick={action.onClick}
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium hover:underline",
                        styles.title
                      )}
                    >
                      {action.label}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {dismissible && (
              <button
                onClick={handleDismiss}
                className={cn("flex-shrink-0 rounded p-1 transition-colors", styles.dismiss)}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Top Banner (Full width, sticky)
// ============================================================================

interface TopBannerProps {
  children?: React.ReactNode;
  variant?: BannerVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: BannerAction;
  sticky?: boolean;
  className?: string;
}

export function TopBanner({
  children,
  variant = "info",
  dismissible = true,
  onDismiss,
  action,
  sticky = true,
  className,
}: TopBannerProps) {
  const [visible, setVisible] = React.useState(true);
  const styles = variantStyles[variant];
  const IconComponent = variantIcons[variant];

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          role="alert"
          className={cn(
            "flex w-full items-center justify-center gap-3 px-4 py-2",
            styles.container.replace("rounded-lg", ""),
            sticky && "sticky top-0 z-40",
            className
          )}
        >
          <IconComponent className={cn("h-4 w-4 flex-shrink-0", styles.icon)} />

          <p className={cn("text-sm", styles.description)}>{children}</p>

          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-1 text-sm font-medium hover:underline",
                styles.title
              )}
            >
              {action.label}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {dismissible && (
            <button
              onClick={handleDismiss}
              className={cn("ml-2 rounded p-1 transition-colors", styles.dismiss)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Inline Alert
// ============================================================================

interface InlineAlertProps {
  children: React.ReactNode;
  variant?: BannerVariant;
  icon?: React.ReactNode;
  className?: string;
}

export function InlineAlert({ children, variant = "info", icon, className }: InlineAlertProps) {
  const styles = variantStyles[variant];
  const IconComponent = variantIcons[variant];

  return (
    <div
      role="alert"
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
        styles.container,
        className
      )}
    >
      <span className={cn("flex-shrink-0", styles.icon)}>
        {icon || <IconComponent className="h-4 w-4" />}
      </span>
      <span className={styles.description}>{children}</span>
    </div>
  );
}

// ============================================================================
// Callout
// ============================================================================

interface CalloutProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  variant?: "default" | "tip" | "warning" | "danger";
  className?: string;
}

export function Callout({ children, title, icon, variant = "default", className }: CalloutProps) {
  const variantConfig = {
    default: {
      border: "border-l-gray-400 dark:border-l-gray-500",
      bg: "bg-gray-50 dark:bg-gray-800/50",
      icon: "text-gray-500 dark:text-gray-400",
      title: "text-gray-900 dark:text-gray-100",
      content: "text-gray-600 dark:text-gray-300",
    },
    tip: {
      border: "border-l-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      icon: "text-blue-500",
      title: "text-blue-900 dark:text-blue-100",
      content: "text-blue-700 dark:text-blue-300",
    },
    warning: {
      border: "border-l-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      icon: "text-yellow-600 dark:text-yellow-500",
      title: "text-yellow-900 dark:text-yellow-100",
      content: "text-yellow-700 dark:text-yellow-300",
    },
    danger: {
      border: "border-l-red-500",
      bg: "bg-red-50 dark:bg-red-900/20",
      icon: "text-red-500",
      title: "text-red-900 dark:text-red-100",
      content: "text-red-700 dark:text-red-300",
    },
  };

  const config = variantConfig[variant];

  return (
    <div className={cn("rounded-r-lg border-l-4 p-4", config.border, config.bg, className)}>
      <div className="flex gap-3">
        {icon && <span className={cn("flex-shrink-0", config.icon)}>{icon}</span>}
        <div>
          {title && <h4 className={cn("mb-1 font-semibold", config.title)}>{title}</h4>}
          <div className={cn("text-sm", config.content)}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Announcement Banner
// ============================================================================

interface AnnouncementBannerProps {
  title: string;
  description?: string;
  badge?: string;
  action?: BannerAction;
  dismissible?: boolean;
  onDismiss?: () => void;
  gradient?: boolean;
  className?: string;
}

export function AnnouncementBanner({
  title,
  description,
  badge,
  action,
  dismissible = true,
  onDismiss,
  gradient = true,
  className,
}: AnnouncementBannerProps) {
  const [visible, setVisible] = React.useState(true);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative overflow-hidden px-4 py-3 sm:px-6",
            gradient ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-blue-600",
            className
          )}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-white">
            {badge && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                {badge}
              </span>
            )}

            <p className="text-center text-sm font-medium sm:text-base">
              <span className="font-semibold">{title}</span>
              {description && (
                <span className="ml-2 hidden font-normal opacity-90 sm:inline">{description}</span>
              )}
            </p>

            {action && (
              <button
                onClick={action.onClick}
                className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-medium transition-colors hover:bg-white/30"
              >
                {action.label}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {dismissible && (
              <button
                onClick={handleDismiss}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-white/20"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Cookie Banner
// ============================================================================

interface CookieBannerProps {
  onAccept: () => void;
  onDecline?: () => void;
  onSettings?: () => void;
  className?: string;
}

export function CookieBanner({ onAccept, onDecline, onSettings, className }: CookieBannerProps) {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-center sm:text-left">
          <h4 className="font-medium text-gray-900 dark:text-white">🍪 We use cookies</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            We use cookies to improve your experience on our site. By using our site, you consent to
            cookies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onSettings && (
            <button
              onClick={onSettings}
              className="px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Cookie Settings
            </button>
          )}
          {onDecline && (
            <button
              onClick={() => {
                onDecline();
                setVisible(false);
              }}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Decline
            </button>
          )}
          <button
            onClick={() => {
              onAccept();
              setVisible(false);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Accept All
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Maintenance Banner
// ============================================================================

interface MaintenanceBannerProps {
  title?: string;
  description?: string;
  scheduledTime?: string;
  className?: string;
}

export function MaintenanceBanner({
  title = "Scheduled Maintenance",
  description = "We will be performing scheduled maintenance.",
  scheduledTime,
  className,
}: MaintenanceBannerProps) {
  return (
    <TopBanner variant="warning" dismissible={true} className={className}>
      <span className="font-medium">{title}:</span> {description}
      {scheduledTime && <span className="ml-1 font-medium">{scheduledTime}</span>}
    </TopBanner>
  );
}
