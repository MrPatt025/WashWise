"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * Props for the FormField component
 */
export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label */
  label?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Error message to display */
  error?: string;
  /** Success message to display */
  success?: string;
  /** Whether the field is loading */
  isLoading?: boolean;
  /** Show password toggle for password fields */
  showPasswordToggle?: boolean;
  /** Optional icon to show at the start */
  startIcon?: React.ReactNode;
  /** Optional icon to show at the end */
  endIcon?: React.ReactNode;
  /** Container className */
  containerClassName?: string;
}

/**
 * World-class form field component
 * Features: Labels, error/success states, password toggle, icons, loading state
 */
const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      isLoading,
      showPasswordToggle,
      startIcon,
      endIcon,
      containerClassName,
      className,
      type,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const [showPassword, setShowPassword] = React.useState(false);
    const fieldId = id || generatedId;

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const isDisabled = disabled || isLoading;

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {/* Label */}
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              "text-sm font-medium",
              hasError && "text-destructive",
              hasSuccess && "text-green-600"
            )}
          >
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Start icon */}
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {startIcon}
            </div>
          )}

          {/* Input */}
          <Input
            ref={ref}
            id={fieldId}
            type={inputType}
            disabled={isDisabled}
            className={cn(
              "transition-all duration-200",
              startIcon && "pl-10",
              (endIcon || (isPassword && showPasswordToggle) || isLoading) && "pr-10",
              hasError && "border-destructive focus-visible:ring-destructive/30",
              hasSuccess && "border-green-500 focus-visible:ring-green-500/30",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined
            }
            {...props}
          />

          {/* End icons */}
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {/* Loading indicator */}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

            {/* Password toggle */}
            {isPassword && showPasswordToggle && !isLoading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}

            {/* Custom end icon */}
            {endIcon && !isLoading && !showPasswordToggle && endIcon}

            {/* Status indicator */}
            {!isLoading && !endIcon && !showPasswordToggle && (
              <>
                {hasError && <AlertCircle className="h-4 w-4 text-destructive" />}
                {hasSuccess && <CheckCircle className="h-4 w-4 text-green-500" />}
              </>
            )}
          </div>
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Success message */}
        {hasSuccess && (
          <p className="text-sm text-green-600 animate-in fade-in-0 slide-in-from-top-1">
            {success}
          </p>
        )}

        {/* Helper text */}
        {helperText && !hasError && !hasSuccess && (
          <p id={`${fieldId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

/**
 * Textarea variant
 */
export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  containerClassName?: string;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, helperText, error, success, containerClassName, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id || generatedId;
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn("text-sm font-medium", hasError && "text-destructive")}
          >
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}

        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            hasError && "border-destructive focus-visible:ring-destructive/30",
            hasSuccess && "border-green-500 focus-visible:ring-green-500/30",
            className
          )}
          aria-invalid={hasError}
          {...props}
        />

        {hasError && (
          <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1">
            {error}
          </p>
        )}
        {hasSuccess && <p className="text-sm text-green-600">{success}</p>}
        {helperText && !hasError && !hasSuccess && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);
FormTextarea.displayName = "FormTextarea";

export { FormField, FormTextarea };
