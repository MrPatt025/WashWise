import { cn } from "@/lib/utils";
import { STATUS_DISPLAY_MAP } from "@washwise/types";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "destructive" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
  className?: string;
  children: React.ReactNode;
}

const variantStyles = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  destructive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  outline: "border border-input bg-background text-foreground",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[10px]",
  default: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

export function Badge({ variant = "default", size = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Machine status badge - automatically maps backend status to UI display
 */
interface StatusBadgeProps {
  status: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function StatusBadge({ status, size = "default", className }: StatusBadgeProps) {
  const display = STATUS_DISPLAY_MAP[status] || { label: status, variant: "default" as const };

  return (
    <Badge variant={display.variant} size={size} className={className}>
      {display.label}
    </Badge>
  );
}

/**
 * Machine type badge
 */
interface TypeBadgeProps {
  type: "WASHER" | "DRYER";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function TypeBadge({ type, size = "default", className }: TypeBadgeProps) {
  return (
    <Badge variant={type === "WASHER" ? "default" : "secondary"} size={size} className={className}>
      {type === "WASHER" ? "Washer" : "Dryer"}
    </Badge>
  );
}
