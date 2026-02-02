import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, WashingMachine } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Spinner variants
 */
const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
    variant: {
      default: "text-primary",
      muted: "text-muted-foreground",
      white: "text-white",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
});

export interface SpinnerProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /** Use washing machine icon instead of default spinner */
  branded?: boolean;
}

/**
 * Spinner component for loading states
 */
const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, branded, ...props }, ref) => {
    const Icon = branded ? WashingMachine : Loader2;

    return (
      <div ref={ref} role="status" aria-label="Loading" {...props}>
        <Icon className={cn(spinnerVariants({ size, variant }), className)} />
        <span className="sr-only">Loading...</span>
      </div>
    );
  },
);
Spinner.displayName = "Spinner";

/**
 * Full page loading overlay
 */
interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isLoading?: boolean;
  /** Optional message to display */
  message?: string;
  /** Use branded spinner */
  branded?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading = true,
  message,
  branded,
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" branded={branded} />
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Inline loading indicator
 */
interface InlineLoaderProps extends VariantProps<typeof spinnerVariants> {
  /** Text to display alongside spinner */
  text?: string;
  className?: string;
}

const InlineLoader: React.FC<InlineLoaderProps> = ({
  text = "Loading...",
  size = "sm",
  variant,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Spinner size={size} variant={variant} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
};

/**
 * Button loading state helper
 */
interface ButtonLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  isLoading,
  children,
  loadingText,
}) => {
  if (isLoading) {
    return (
      <>
        <Spinner size="sm" variant="white" className="mr-2" />
        {loadingText || children}
      </>
    );
  }
  return <>{children}</>;
};

export { Spinner, LoadingOverlay, InlineLoader, ButtonLoader, spinnerVariants };
