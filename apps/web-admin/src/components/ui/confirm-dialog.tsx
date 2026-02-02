"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle, Trash2, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Confirmation dialog variants
 */
type ConfirmVariant = "default" | "destructive" | "warning" | "success";

/**
 * Props for the ConfirmDialog component
 */
interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Callback when confirmed */
  onConfirm: () => void | Promise<void>;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Visual variant */
  variant?: ConfirmVariant;
  /** Whether confirm action is loading */
  isLoading?: boolean;
  /** Whether to close dialog on confirm */
  closeOnConfirm?: boolean;
}

/**
 * Icon mapping for variants
 */
const variantIcons: Record<ConfirmVariant, React.ElementType> = {
  default: Info,
  destructive: Trash2,
  warning: AlertTriangle,
  success: CheckCircle,
};

/**
 * Color mapping for variants
 */
const variantStyles: Record<ConfirmVariant, { icon: string; button: string }> =
  {
    default: {
      icon: "bg-primary/10 text-primary",
      button: "bg-primary hover:bg-primary/90",
    },
    destructive: {
      icon: "bg-destructive/10 text-destructive",
      button:
        "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
    },
    warning: {
      icon: "bg-yellow-100 text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700 text-white",
    },
    success: {
      icon: "bg-green-100 text-green-600",
      button: "bg-green-600 hover:bg-green-700 text-white",
    },
  };

/**
 * World-class confirmation dialog
 * Features: Multiple variants, loading state, async confirm
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
  closeOnConfirm = true,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const loading = isLoading || internalLoading;

  const Icon = variantIcons[variant];
  const styles = variantStyles[variant];

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      if (closeOnConfirm) {
        onOpenChange(false);
      }
    } catch (error) {
      // Error handling should be done in onConfirm
      console.error("Confirm action failed:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                styles.icon,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              className={cn(styles.button)}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading && (
                <Spinner size="sm" variant="white" className="mr-2" />
              )}
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for managing confirm dialog state
 */
export function useConfirmDialog() {
  const [state, setState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: ConfirmVariant;
    onConfirm?: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const confirm = React.useCallback(
    (options: {
      title: string;
      description: string;
      confirmText?: string;
      variant?: ConfirmVariant;
      onConfirm: () => void | Promise<void>;
    }) => {
      setState({
        open: true,
        ...options,
      });
    },
    [],
  );

  const close = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const dialogProps = {
    open: state.open,
    onOpenChange: (open: boolean) => setState((prev) => ({ ...prev, open })),
    title: state.title,
    description: state.description,
    confirmText: state.confirmText,
    variant: state.variant,
    onConfirm: state.onConfirm || (() => {}),
  };

  return { confirm, close, dialogProps };
}

/**
 * Pre-configured delete confirmation
 */
export function useDeleteConfirm() {
  const { confirm, dialogProps, close } = useConfirmDialog();

  const confirmDelete = (
    itemName: string,
    onConfirm: () => void | Promise<void>,
  ) => {
    confirm({
      title: `Delete ${itemName}?`,
      description: `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm,
    });
  };

  return { confirmDelete, dialogProps, close };
}
