"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AlertTriangle, CheckCircle, Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { configureSocketCallbacks, getSocketState, isSocketConnected } from "@/lib/socket";

/**
 * Network status
 */
export type NetworkStatus = "online" | "offline" | "connecting" | "error";

/**
 * Get browser online status
 */
function getOnlineStatus(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Subscribe to browser online/offline events
 */
function subscribeOnline(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/**
 * Hook for browser online status
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    getOnlineStatus,
    () => true // Server-side default
  );
}

/**
 * Hook for comprehensive network status including socket connection
 */
export function useNetworkStatus(): {
  isOnline: boolean;
  isSocketConnected: boolean;
  status: NetworkStatus;
  socketError: Error | null;
} {
  const isOnline = useOnlineStatus();
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState<Error | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Configure socket callbacks
    configureSocketCallbacks({
      onConnect: () => {
        setSocketConnected(true);
        setSocketError(null);
        setIsConnecting(false);
      },
      onDisconnect: () => {
        setSocketConnected(false);
        setIsConnecting(false);
      },
      onError: (error) => {
        setSocketError(error);
        setIsConnecting(false);
      },
    });

    // Initial state
    setSocketConnected(isSocketConnected());
    const state = getSocketState();
    setIsConnecting(state.isConnecting);
    setSocketError(state.lastError);
  }, []);

  // Determine overall status
  let status: NetworkStatus = "online";
  if (!isOnline) {
    status = "offline";
  } else if (isConnecting) {
    status = "connecting";
  } else if (socketError) {
    status = "error";
  }

  return {
    isOnline,
    isSocketConnected: socketConnected,
    status,
    socketError,
  };
}

/**
 * Props for NetworkStatusIndicator
 */
interface NetworkStatusIndicatorProps {
  /** Show only when offline/error */
  showOnlyWhenOffline?: boolean;
  /** Position on screen */
  position?: "top" | "bottom" | "top-right" | "bottom-right";
  /** Additional class name */
  className?: string;
  /** Compact mode - just an icon */
  compact?: boolean;
}

/**
 * Network status indicator component
 * Shows current network and WebSocket connection status
 */
export function NetworkStatusIndicator({
  showOnlyWhenOffline = true,
  position = "bottom-right",
  className,
  compact = false,
}: NetworkStatusIndicatorProps) {
  const { isOnline, isSocketConnected, status } = useNetworkStatus();
  const [visible, setVisible] = useState(!showOnlyWhenOffline);

  // Auto-hide when online (with delay for visual feedback)
  useEffect(() => {
    if (showOnlyWhenOffline) {
      if (status === "online" && isSocketConnected) {
        // Show briefly when reconnecting, then hide
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 2000);
        return () => clearTimeout(timer);
      } else {
        setVisible(true);
        return;
      }
    }
    return;
  }, [status, isSocketConnected, showOnlyWhenOffline]);

  if (!visible && showOnlyWhenOffline) {
    return null;
  }

  // Position classes
  const positionClasses = {
    top: "fixed top-4 left-1/2 -translate-x-1/2",
    bottom: "fixed bottom-4 left-1/2 -translate-x-1/2",
    "top-right": "fixed top-4 right-4",
    "bottom-right": "fixed bottom-4 right-4",
  };

  // Status config
  const statusConfig = {
    online: {
      icon: CheckCircle,
      label: "Connected",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
      borderColor: "border-green-200 dark:border-green-800",
    },
    offline: {
      icon: WifiOff,
      label: "Offline",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
      borderColor: "border-red-200 dark:border-red-800",
    },
    connecting: {
      icon: Loader2,
      label: "Connecting...",
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
    error: {
      icon: AlertTriangle,
      label: "Connection Error",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
      borderColor: "border-red-200 dark:border-red-800",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={cn(
          "z-50 rounded-full border p-2 shadow-lg",
          config.bgColor,
          config.borderColor,
          positionClasses[position],
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={config.label}
      >
        <Icon className={cn("h-4 w-4", config.color, status === "connecting" && "animate-spin")} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "z-50 flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg",
        config.bgColor,
        config.borderColor,
        positionClasses[position],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn("h-4 w-4", config.color, status === "connecting" && "animate-spin")} />
      <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
      {!isSocketConnected && isOnline && (
        <span className="text-xs text-muted-foreground">(Real-time updates unavailable)</span>
      )}
    </div>
  );
}

/**
 * Offline banner for critical offline situations
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 bg-red-500 px-4 py-2 text-center text-white"
      role="alert"
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          You&apos;re offline. Some features may not work properly.
        </span>
      </div>
    </div>
  );
}

/**
 * Hook for detecting slow network
 */
export function useSlowNetwork(): boolean {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    // Use Network Information API if available
    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType: string;
          addEventListener: (event: string, callback: () => void) => void;
          removeEventListener: (event: string, callback: () => void) => void;
        };
      }
    ).connection;

    if (!connection) {
      return;
    }

    const checkConnection = () => {
      // 2g or slow-2g are considered slow
      setIsSlow(connection.effectiveType === "2g" || connection.effectiveType === "slow-2g");
    };

    checkConnection();
    connection.addEventListener("change", checkConnection);

    return () => {
      connection.removeEventListener("change", checkConnection);
    };
  }, []);

  return isSlow;
}
