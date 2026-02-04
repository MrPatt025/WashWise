"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Power,
  PowerOff,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

// ============================================================================
// Status Indicator Base
// ============================================================================

const statusIndicatorVariants = cva("inline-flex items-center justify-center rounded-full", {
  variants: {
    size: {
      xs: "h-2 w-2",
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
      xl: "h-6 w-6",
    },
    status: {
      online: "bg-emerald-500",
      offline: "bg-slate-400",
      busy: "bg-amber-500",
      error: "bg-red-500",
      warning: "bg-orange-500",
      pending: "bg-blue-500",
      maintenance: "bg-purple-500",
    },
    pulse: {
      true: "",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    status: "online",
    pulse: false,
  },
});

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statusIndicatorVariants> {
  showRing?: boolean;
  tooltip?: string;
}

export function StatusIndicator({
  size,
  status,
  pulse,
  showRing = false,
  tooltip,
  className,
  ...props
}: StatusIndicatorProps) {
  const indicator = (
    <div
      className={cn(
        "relative",
        showRing && "rounded-full ring-2 ring-white dark:ring-slate-900",
        className
      )}
      {...props}
    >
      <div className={cn(statusIndicatorVariants({ size, status }))}>
        {pulse && (
          <motion.span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75",
              status === "online" && "bg-emerald-400",
              status === "busy" && "bg-amber-400",
              status === "error" && "bg-red-400",
              status === "warning" && "bg-orange-400",
              status === "pending" && "bg-blue-400",
              status === "maintenance" && "bg-purple-400"
            )}
            animate={{ scale: [1, 1.5, 1.5], opacity: [0.75, 0, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{indicator}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return indicator;
}

// ============================================================================
// Machine Status Badge (with text)
// ============================================================================

const machineStatusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        online: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        offline: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
        busy: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        warning: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        maintenance: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "online",
      size: "md",
    },
  }
);

export interface MachineStatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof machineStatusBadgeVariants> {
  label?: string;
  showIcon?: boolean;
  pulse?: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
  online: <CheckCircle2 className="h-3 w-3" />,
  offline: <PowerOff className="h-3 w-3" />,
  busy: <Activity className="h-3 w-3" />,
  error: <XCircle className="h-3 w-3" />,
  warning: <AlertTriangle className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3" />,
  maintenance: <Loader2 className="h-3 w-3 animate-spin" />,
};

const statusLabels: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  busy: "Busy",
  error: "Error",
  warning: "Warning",
  pending: "Pending",
  maintenance: "Maintenance",
};

export function MachineStatusBadge({
  variant,
  size,
  label,
  showIcon = true,
  pulse = false,
  className,
  ...props
}: MachineStatusBadgeProps) {
  const statusKey = variant || "online";

  return (
    <div className={cn(machineStatusBadgeVariants({ variant, size }), className)} {...props}>
      {showIcon && (
        <span className="relative">
          {statusIcons[statusKey]}
          {pulse && (
            <motion.span
              className={cn(
                "absolute inset-0 rounded-full",
                variant === "online" && "bg-emerald-400",
                variant === "busy" && "bg-amber-400",
                variant === "error" && "bg-red-400",
                variant === "warning" && "bg-orange-400",
                variant === "pending" && "bg-blue-400"
              )}
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </span>
      )}
      <span>{label || statusLabels[statusKey]}</span>
    </div>
  );
}

// ============================================================================
// Connection Status
// ============================================================================

interface ConnectionStatusProps {
  connected: boolean;
  reconnecting?: boolean;
  latency?: number;
  showLabel?: boolean;
  className?: string;
}

export function ConnectionStatus({
  connected,
  reconnecting = false,
  latency,
  showLabel = true,
  className,
}: ConnectionStatusProps) {
  const getLatencyColor = (ms: number) => {
    if (ms < 100) {
      return "text-emerald-500";
    }
    if (ms < 300) {
      return "text-amber-500";
    }
    return "text-red-500";
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="relative">
        {reconnecting ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
        ) : connected ? (
          <Wifi className="h-4 w-4 text-emerald-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-slate-400" />
        )}
        {connected && !reconnecting && (
          <motion.span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span
            className={cn(
              "text-xs font-medium",
              connected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"
            )}
          >
            {reconnecting ? "Reconnecting..." : connected ? "Connected" : "Disconnected"}
          </span>
          {latency !== undefined && connected && (
            <span className={cn("text-[10px]", getLatencyColor(latency))}>{latency}ms</span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Machine Status Card
// ============================================================================

type MachineState = "available" | "in_use" | "finishing" | "maintenance" | "error" | "offline";

interface MachineStatusCardProps {
  machineId: string;
  machineName: string;
  status: MachineState;
  progress?: number;
  remainingTime?: number; // in minutes
  currentUser?: string;
  lastActivity?: Date;
  onClick?: () => void;
  className?: string;
}

const machineStatusConfig: Record<
  MachineState,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
  }
> = {
  available: {
    label: "Available",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  },
  in_use: {
    label: "In Use",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
    icon: <Activity className="h-5 w-5 text-blue-500" />,
  },
  finishing: {
    label: "Finishing",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
    icon: <Clock className="h-5 w-5 text-amber-500" />,
  },
  maintenance: {
    label: "Maintenance",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
    icon: <Loader2 className="h-5 w-5 animate-spin text-purple-500" />,
  },
  error: {
    label: "Error",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  },
  offline: {
    label: "Offline",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700",
    icon: <PowerOff className="h-5 w-5 text-slate-400" />,
  },
};

export function MachineStatusCard({
  machineId,
  machineName,
  status,
  progress,
  remainingTime,
  currentUser,
  onClick,
  className,
}: MachineStatusCardProps) {
  const config = machineStatusConfig[status];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 p-4 transition-all",
        config.bgColor,
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Progress bar for in-use machines */}
      {status === "in_use" && progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-200 dark:bg-blue-800">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{config.icon}</div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">{machineName}</h4>
            <p className={cn("text-sm font-medium", config.color)}>{config.label}</p>
          </div>
        </div>
        <span className="text-xs text-slate-500">#{machineId}</span>
      </div>

      {/* Additional info */}
      {(remainingTime !== undefined || currentUser) && (
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          {remainingTime !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{remainingTime} min left</span>
            </div>
          )}
          {currentUser && (
            <div className="flex items-center gap-1">
              <Power className="h-3 w-3" />
              <span>{currentUser}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Status Overview Grid
// ============================================================================

interface StatusOverviewProps {
  stats: {
    available: number;
    inUse: number;
    maintenance: number;
    error: number;
  };
  className?: string;
}

export function StatusOverview({ stats, className }: StatusOverviewProps) {
  const total = stats.available + stats.inUse + stats.maintenance + stats.error;

  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {[
        { label: "Available", value: stats.available, color: "emerald" },
        { label: "In Use", value: stats.inUse, color: "blue" },
        { label: "Maintenance", value: stats.maintenance, color: "purple" },
        { label: "Error", value: stats.error, color: "red" },
      ].map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-lg p-3 text-center",
            `bg-${item.color}-50 dark:bg-${item.color}-900/20`
          )}
        >
          <motion.p
            className={cn(
              "text-2xl font-bold",
              `text-${item.color}-600 dark:text-${item.color}-400`
            )}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {item.value}
          </motion.p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{item.label}</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
            <motion.div
              className={cn("h-full rounded-full", `bg-${item.color}-500`)}
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
