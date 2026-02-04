"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle, Info, Loader2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toast notification types
 */
export type ToastType = "success" | "error" | "warning" | "info" | "loading";

/**
 * Toast item interface
 */
export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * Toast context value
 */
interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<ToastItem>) => void;
  clearToasts: () => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

/**
 * Default durations for toast types (in milliseconds)
 */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
  loading: 0, // Doesn't auto-dismiss
};

/**
 * Generate unique ID
 */
const generateId = () => Math.random().toString(36).substring(2, 11);

/**
 * Toast provider props
 */
interface ToastProviderProps {
  children: React.ReactNode;
  /** Maximum number of toasts visible at once */
  maxToasts?: number;
  /** Position on screen */
  position?:
    | "top-right"
    | "top-left"
    | "top-center"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center";
}

/**
 * Toast Provider component
 */
export function ToastProvider({
  children,
  maxToasts = 5,
  position = "bottom-right",
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const timers = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timers on unmount
  React.useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const removeToast = React.useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = generateId();
      const duration = toast.duration ?? DEFAULT_DURATIONS[toast.type];

      setToasts((prev) => {
        // Remove oldest if at max
        const newToasts = prev.length >= maxToasts ? prev.slice(1) : prev;
        return [...newToasts, { ...toast, id, dismissible: toast.dismissible ?? true }];
      });

      // Auto-dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [maxToasts, removeToast]
  );

  const updateToast = React.useCallback(
    (id: string, updates: Partial<ToastItem>) => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));

      // If type changed and has new duration, reset timer
      if (updates.type) {
        const timer = timers.current.get(id);
        if (timer) {
          clearTimeout(timer);
          timers.current.delete(id);
        }

        const duration = updates.duration ?? DEFAULT_DURATIONS[updates.type];
        if (duration > 0) {
          const newTimer = setTimeout(() => {
            removeToast(id);
          }, duration);
          timers.current.set(id, newTimer);
        }
      }
    },
    [removeToast]
  );

  const clearToasts = React.useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast, clearToasts }}>
      {children}
      <ToastContainer position={position} />
    </ToastContext.Provider>
  );
}

/**
 * Toast container component
 */
function ToastContainer({
  position,
}: {
  position:
    | "top-right"
    | "top-left"
    | "top-center"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center";
}) {
  const context = React.useContext(ToastContext);
  if (!context) {
    return null;
  }

  const { toasts, removeToast } = context;

  const positionClasses = {
    "top-right": "top-4 right-4 items-end",
    "top-left": "top-4 left-4 items-start",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-left": "bottom-4 left-4 items-start",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  };

  const isTop = position.startsWith("top");

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50 flex flex-col gap-2",
        positionClasses[position]
      )}
      style={{ maxHeight: "calc(100vh - 2rem)" }}
    >
      {(isTop ? toasts : [...toasts].reverse()).map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

/**
 * Individual toast component
 */
function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
      toast.onDismiss?.();
    }, 200);
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    loading: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
  };

  const borderColors: Record<ToastType, string> = {
    success: "border-l-green-500",
    error: "border-l-red-500",
    warning: "border-l-amber-500",
    info: "border-l-blue-500",
    loading: "border-l-primary",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-80 rounded-lg border border-l-4 bg-background p-4 shadow-lg transition-all duration-200",
        borderColors[toast.type],
        isExiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100 animate-in slide-in-from-right-full"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{icons[toast.type]}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                handleDismiss();
              }}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        {toast.dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to use toast notifications
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { addToast, removeToast, updateToast, clearToasts, toasts } = context;

  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
    update: updateToast,
    clear: clearToasts,

    // Convenience methods
    success: (title: string, options?: Partial<Omit<ToastItem, "id" | "type" | "title">>) =>
      addToast({ type: "success", title, ...options }),

    error: (title: string, options?: Partial<Omit<ToastItem, "id" | "type" | "title">>) =>
      addToast({ type: "error", title, ...options }),

    warning: (title: string, options?: Partial<Omit<ToastItem, "id" | "type" | "title">>) =>
      addToast({ type: "warning", title, ...options }),

    info: (title: string, options?: Partial<Omit<ToastItem, "id" | "type" | "title">>) =>
      addToast({ type: "info", title, ...options }),

    loading: (title: string, options?: Partial<Omit<ToastItem, "id" | "type" | "title">>) =>
      addToast({ type: "loading", title, dismissible: false, ...options }),

    promise: async <T,>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: unknown) => string);
      }
    ): Promise<T> => {
      const id = addToast({
        type: "loading",
        title: options.loading,
        dismissible: false,
      });

      try {
        const result = await promise;
        updateToast(id, {
          type: "success",
          title: typeof options.success === "function" ? options.success(result) : options.success,
          dismissible: true,
        });
        return result;
      } catch (error) {
        updateToast(id, {
          type: "error",
          title: typeof options.error === "function" ? options.error(error) : options.error,
          dismissible: true,
        });
        throw error;
      }
    },
  };
}

/**
 * Simple toast function for use outside of React components
 * Must be initialized with the toast function from useToast
 */
let globalToast: ReturnType<typeof useToast> | null = null;

export function setGlobalToast(toast: ReturnType<typeof useToast>) {
  globalToast = toast;
}

export function getGlobalToast() {
  return globalToast;
}
