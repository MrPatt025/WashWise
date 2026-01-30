import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
  className?: string;
  children: React.ReactNode;
}

const variantStyles = {
  default: "bg-primary text-primary-foreground",
  success: "bg-green-500 text-white",
  warning: "bg-yellow-500 text-white",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "border border-input bg-background",
};

export function Badge({
  variant = "default",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
