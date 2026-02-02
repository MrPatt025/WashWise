"use client";

import * as React from "react";
import { useForm, Controller, UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";

/**
 * Form Field Wrapper
 * Provides consistent styling for form fields with labels and errors
 */
export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  description,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {description && !error && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && (
        <p className="flex items-center gap-1 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Text Input with enhanced features
 */
export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      description,
      required,
      leftIcon,
      rightIcon,
      onRightIconClick,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <FormField
        label={label}
        htmlFor={inputId}
        error={error}
        description={description}
        required={required}
      >
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {rightIcon}
            </button>
          )}
        </div>
      </FormField>
    );
  }
);
TextInput.displayName = "TextInput";

/**
 * Password Input with toggle visibility
 */
export interface PasswordInputProps extends Omit<
  TextInputProps,
  "type" | "rightIcon" | "onRightIconClick"
> {
  showStrengthIndicator?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrengthIndicator, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    // Calculate password strength
    const strength = React.useMemo(() => {
      if (!value || typeof value !== "string") return 0;
      let score = 0;
      if (value.length >= 8) score++;
      if (value.length >= 12) score++;
      if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
      if (/\d/.test(value)) score++;
      if (/[^a-zA-Z0-9]/.test(value)) score++;
      return Math.min(score, 4);
    }, [value]);

    const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
    const strengthColors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
    ];

    return (
      <div className="space-y-2">
        <TextInput
          ref={ref}
          type={showPassword ? "text" : "password"}
          value={value}
          rightIcon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          onRightIconClick={() => setShowPassword(!showPassword)}
          {...props}
        />
        {showStrengthIndicator && value && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    index < strength ? strengthColors[strength] : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Password strength: {strengthLabels[strength]}
            </p>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

/**
 * Textarea with character count
 */
export interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  description?: string;
  showCharCount?: boolean;
}

export const TextareaInput = React.forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  (
    {
      label,
      error,
      description,
      required,
      showCharCount,
      maxLength,
      value,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <FormField
        label={label}
        htmlFor={inputId}
        error={error}
        description={description}
        required={required}
      >
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            value={value}
            maxLength={maxLength}
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              showCharCount && "pb-6",
              className
            )}
            aria-invalid={!!error}
            {...props}
          />
          {showCharCount && maxLength && (
            <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </FormField>
    );
  }
);
TextareaInput.displayName = "TextareaInput";

/**
 * Checkbox with label
 */
export interface CheckboxInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  description?: string;
  error?: string;
}

export const CheckboxInput = React.forwardRef<HTMLInputElement, CheckboxInputProps>(
  ({ label, description, error, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            {...props}
          />
          <div className="space-y-1">
            <Label htmlFor={inputId} className="cursor-pointer font-normal">
              {label}
            </Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {error && (
          <p className="ml-7 flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
CheckboxInput.displayName = "CheckboxInput";

/**
 * Radio Group
 */
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  orientation?: "horizontal" | "vertical";
  required?: boolean;
  className?: string;
}

export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  orientation = "vertical",
  required,
  className,
}: RadioGroupProps) {
  return (
    <FormField label={label} error={error} required={required} className={className}>
      <div
        className={cn("flex gap-4", orientation === "vertical" && "flex-col gap-3")}
        role="radiogroup"
        aria-label={label}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3",
              option.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={option.disabled}
              className="mt-0.5 h-4 w-4 border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium">{option.label}</span>
              {option.description && (
                <p className="text-sm text-muted-foreground">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
    </FormField>
  );
}

/**
 * Form Submit Button with loading state
 */
export interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

export function SubmitButton({
  children,
  isLoading,
  loadingText = "Submitting...",
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled || isLoading} className={className} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/**
 * Validation Status Indicator
 */
export function ValidationStatus({ isValid, message }: { isValid: boolean; message: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        isValid ? "text-green-600" : "text-muted-foreground"
      )}
    >
      {isValid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      {message}
    </div>
  );
}

/**
 * Password Requirements Checklist
 */
export interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
}

const defaultRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", validator: (p) => p.length >= 8 },
  { label: "Contains uppercase letter", validator: (p) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", validator: (p) => /[a-z]/.test(p) },
  { label: "Contains number", validator: (p) => /\d/.test(p) },
  {
    label: "Contains special character",
    validator: (p) => /[^a-zA-Z0-9]/.test(p),
  },
];

export function PasswordRequirements({
  password,
  requirements = defaultRequirements,
  className,
}: {
  password: string;
  requirements?: PasswordRequirement[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-muted-foreground">Password requirements:</p>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li key={index}>
            <ValidationStatus isValid={req.validator(password)} message={req.label} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Form validation schema helpers
 */
export const formSchemas = {
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  phone: z
    .string()
    .regex(/^[+]?[\d\s-()]+$/, "Please enter a valid phone number")
    .min(10, "Phone number must be at least 10 digits"),
  required: (fieldName: string) => z.string().min(1, `${fieldName} is required`),
  optional: z.string().optional(),
  url: z.string().url("Please enter a valid URL"),
  number: z.coerce.number(),
  positiveNumber: z.coerce.number().positive("Must be a positive number"),
  date: z.coerce.date(),
  futureDate: z.coerce.date().refine((date) => date > new Date(), "Date must be in the future"),
};

/**
 * Hook for form with Zod validation
 */
export function useZodForm<T extends z.ZodSchema>(
  schema: T,
  options?: Parameters<typeof useForm<z.infer<T>>>[0]
) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    ...options,
  });
}

/**
 * Controlled field wrapper for react-hook-form
 */
export interface ControlledFieldProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string;
  description?: string;
  required?: boolean;
  children: (field: {
    value: PathValue<TFieldValues, Path<TFieldValues>>;
    onChange: (...args: unknown[]) => void;
    onBlur: () => void;
    error?: string;
  }) => React.ReactNode;
}

export function ControlledField<TFieldValues extends FieldValues>({
  form,
  name,
  label,
  description,
  required,
  children,
}: ControlledFieldProps<TFieldValues>) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormField
          label={label}
          error={fieldState.error?.message}
          description={description}
          required={required}
        >
          {children({
            value: field.value,
            onChange: field.onChange,
            onBlur: field.onBlur,
            error: fieldState.error?.message,
          })}
        </FormField>
      )}
    />
  );
}

/**
 * Input with inline validation
 */
export interface ValidatedInputProps extends TextInputProps {
  validationRules?: Array<{
    test: (value: string) => boolean;
    message: string;
  }>;
  showValidation?: boolean;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ validationRules = [], showValidation = true, value, ...props }, ref) => {
    const stringValue = typeof value === "string" ? value : "";

    const validationResults = React.useMemo(() => {
      if (!stringValue || !showValidation) return [];
      return validationRules.map((rule) => ({
        ...rule,
        isValid: rule.test(stringValue),
      }));
    }, [stringValue, validationRules, showValidation]);

    const hasErrors = validationResults.some((r) => !r.isValid);

    return (
      <div className="space-y-2">
        <TextInput ref={ref} value={value} error={hasErrors ? " " : undefined} {...props} />
        {showValidation && stringValue && validationResults.length > 0 && (
          <ul className="space-y-1 text-sm">
            {validationResults.map((result, index) => (
              <li
                key={index}
                className={cn(
                  "flex items-center gap-2",
                  result.isValid ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {result.isValid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {result.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);
ValidatedInput.displayName = "ValidatedInput";
