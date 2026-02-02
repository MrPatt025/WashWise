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

/**
 * Dangerous action confirmation (requires typing to confirm)
 */
interface DangerousActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Text user must type to confirm */
  confirmationText: string;
  confirmText?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DangerousActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmationText,
  confirmText = "I understand, proceed",
  isLoading = false,
  onConfirm,
}: DangerousActionDialogProps) {
  const [inputValue, setInputValue] = React.useState("");
  const isConfirmEnabled = inputValue === confirmationText;

  React.useEffect(() => {
    if (!open) setInputValue("");
  }, [open]);

  const handleConfirm = async () => {
    if (!isConfirmEnabled) return;
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Type <strong className="text-foreground">{confirmationText}</strong> to confirm:
          </p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive"
            placeholder={confirmationText}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isLoading}
          >
            {isLoading && <Spinner size="sm" variant="white" className="mr-2" />}
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Prompt dialog for getting user input
 */
interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  validate?: (value: string) => string | undefined;
  onConfirm: (value: string) => void | Promise<void>;
}

export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  defaultValue = "",
  confirmText = "Submit",
  cancelText = "Cancel",
  isLoading = false,
  validate,
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = React.useState(defaultValue);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setError(undefined);
    }
  }, [open, defaultValue]);

  const handleConfirm = async () => {
    if (validate) {
      const validationError = validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    await onConfirm(value);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">{label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(undefined);
            }}
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              error && "border-destructive focus:ring-destructive"
            )}
            placeholder={placeholder}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Spinner size="sm" className="mr-2" />}
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
