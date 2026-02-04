"use client";

import * as React from "react";
import { AlertCircle, Calendar, Check, Clock, Eye, EyeOff, Search, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Base Input Component
// ============================================================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftIcon, rightIcon, containerClassName, className, id, ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500",
              "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500",
              "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 dark:disabled:bg-gray-800",
              "transition-colors duration-200",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500 focus:ring-red-500 dark:border-red-500",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ============================================================================
// Password Input
// ============================================================================

interface PasswordInputProps extends Omit<InputProps, "type"> {
  showStrengthIndicator?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrengthIndicator, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [strength, setStrength] = React.useState(0);

    const calculateStrength = (password: string): number => {
      let score = 0;
      if (password.length >= 8) {
        score += 25;
      }
      if (/[a-z]/.test(password)) {
        score += 15;
      }
      if (/[A-Z]/.test(password)) {
        score += 20;
      }
      if (/\d/.test(password)) {
        score += 20;
      }
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 20;
      }
      return Math.min(100, score);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showStrengthIndicator) {
        setStrength(calculateStrength(e.target.value));
      }
      props.onChange?.(e);
    };

    const getStrengthColor = () => {
      if (strength < 30) {
        return "bg-red-500";
      }
      if (strength < 60) {
        return "bg-yellow-500";
      }
      if (strength < 80) {
        return "bg-blue-500";
      }
      return "bg-green-500";
    };

    const getStrengthLabel = () => {
      if (strength < 30) {
        return "Weak";
      }
      if (strength < 60) {
        return "Fair";
      }
      if (strength < 80) {
        return "Good";
      }
      return "Strong";
    };

    return (
      <div className="space-y-2">
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...props}
          onChange={handleChange}
        />

        {showStrengthIndicator && props.value && (
          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={cn("h-full transition-all duration-300", getStrengthColor())}
                style={{ width: `${strength}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Password strength: {getStrengthLabel()}
            </p>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

// ============================================================================
// Search Input
// ============================================================================

interface SearchInputProps extends Omit<InputProps, "leftIcon"> {
  onClear?: () => void;
  loading?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, loading, value, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        leftIcon={
          loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          ) : (
            <Search className="h-4 w-4" />
          )
        }
        rightIcon={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="hover:text-gray-600 focus:outline-none dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  }
);
SearchInput.displayName = "SearchInput";

// ============================================================================
// Textarea
// ============================================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      showCount,
      maxLength,
      containerClassName,
      className,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500",
            "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 dark:disabled:bg-gray-800",
            "min-h-[80px] resize-y transition-colors duration-200",
            error && "border-red-500 focus:ring-red-500 dark:border-red-500",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />

        <div className="flex items-center justify-between">
          <div>
            {error && (
              <p
                id={`${textareaId}-error`}
                className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}

            {hint && !error && (
              <p id={`${textareaId}-hint`} className="text-sm text-gray-500 dark:text-gray-400">
                {hint}
              </p>
            )}
          </div>

          {showCount && maxLength && (
            <p
              className={cn(
                "text-xs",
                charCount >= maxLength ? "text-red-500" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ============================================================================
// Select
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, options, placeholder, containerClassName, className, id, ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white",
            "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 dark:disabled:bg-gray-800",
            "transition-colors duration-200",
            error && "border-red-500 focus:ring-red-500 dark:border-red-500",
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {hint && !error && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ============================================================================
// Date Input
// ============================================================================

interface DateInputProps extends Omit<InputProps, "type"> {
  min?: string;
  max?: string;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>((props, ref) => {
  return <Input ref={ref} type="date" leftIcon={<Calendar className="h-4 w-4" />} {...props} />;
});
DateInput.displayName = "DateInput";

// ============================================================================
// Time Input
// ============================================================================

interface TimeInputProps extends Omit<InputProps, "type"> {
  min?: string;
  max?: string;
}

export const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>((props, ref) => {
  return <Input ref={ref} type="time" leftIcon={<Clock className="h-4 w-4" />} {...props} />;
});
TimeInput.displayName = "TimeInput";

// ============================================================================
// Number Input
// ============================================================================

interface NumberInputProps extends Omit<InputProps, "type"> {
  min?: number;
  max?: number;
  step?: number;
  showControls?: boolean;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ showControls, min, max, step = 1, value, onChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleIncrement = () => {
      if (inputRef.current) {
        const currentValue = parseFloat(inputRef.current.value) || 0;
        const newValue = currentValue + step;
        if (max === undefined || newValue <= max) {
          inputRef.current.value = String(newValue);
          inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    };

    const handleDecrement = () => {
      if (inputRef.current) {
        const currentValue = parseFloat(inputRef.current.value) || 0;
        const newValue = currentValue - step;
        if (min === undefined || newValue >= min) {
          inputRef.current.value = String(newValue);
          inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    };

    if (showControls) {
      return (
        <div className="space-y-1.5">
          {props.label && (
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {props.label}
              {props.required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
          )}
          <div className="flex">
            <button
              type="button"
              onClick={handleDecrement}
              className="rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Decrease"
            >
              -
            </button>
            <input
              ref={inputRef}
              type="number"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={onChange}
              className={cn(
                "flex-1 border-y border-gray-300 bg-white px-3 py-2 text-center text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white",
                "focus:z-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500",
                props.error && "border-red-500"
              )}
              {...props}
            />
            <button
              type="button"
              onClick={handleIncrement}
              className="rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Increase"
            >
              +
            </button>
          </div>
          {props.error && (
            <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {props.error}
            </p>
          )}
        </div>
      );
    }

    return (
      <Input
        ref={inputRef}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        {...props}
      />
    );
  }
);
NumberInput.displayName = "NumberInput";

// ============================================================================
// File Input
// ============================================================================

interface FileInputProps extends Omit<InputProps, "type" | "value" | "onChange"> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFilesChange?: (files: File[]) => void;
  value?: File[];
}

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      label,
      error,
      hint,
      accept,
      multiple,
      maxSize,
      onFilesChange,
      value,
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = React.useState(false);
    const [localError, setLocalError] = React.useState<string | null>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleFiles = (files: FileList | null) => {
      if (!files) {
        return;
      }

      const fileArray = Array.from(files);

      // Validate file size
      if (maxSize) {
        const oversizedFiles = fileArray.filter((file) => file.size > maxSize);
        if (oversizedFiles.length > 0) {
          setLocalError(`Some files exceed the maximum size of ${formatFileSize(maxSize)}`);
          return;
        }
      }

      setLocalError(null);
      onFilesChange?.(fileArray);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    };

    const handleDragLeave = () => {
      setDragOver(false);
    };

    const removeFile = (index: number) => {
      if (value) {
        const newFiles = [...value];
        newFiles.splice(index, 1);
        onFilesChange?.(newFiles);
      }
    };

    const displayError = error || localError;

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}

        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors",
            dragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600",
            displayError && "border-red-500",
            className
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFiles(e.target.files)}
            className="sr-only"
            {...props}
          />

          <div className="flex flex-col items-center text-center">
            <Upload className="mb-2 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-blue-600 dark:text-blue-400">Click to upload</span>{" "}
              or drag and drop
            </p>
            {accept && <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{accept}</p>}
            {maxSize && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Max size: {formatFileSize(maxSize)}
              </p>
            )}
          </div>
        </div>

        {/* File List */}
        {value && value.length > 0 && (
          <ul className="space-y-2">
            {value.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-2 dark:bg-gray-800"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                  <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 text-gray-400 transition-colors hover:text-red-500"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {displayError && (
          <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {displayError}
          </p>
        )}

        {hint && !displayError && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);
FileInput.displayName = "FileInput";

// ============================================================================
// Switch / Toggle
// ============================================================================

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const switchSizes = {
  sm: { track: "w-8 h-4", thumb: "w-3 h-3", translate: "translate-x-4" },
  md: { track: "w-11 h-6", thumb: "w-5 h-5", translate: "translate-x-5" },
  lg: { track: "w-14 h-7", thumb: "w-6 h-6", translate: "translate-x-7" },
};

export function Switch({
  checked = false,
  onChange,
  disabled,
  label,
  description,
  size = "md",
  className,
}: SwitchProps) {
  const id = React.useId();
  const sizeClasses = switchSizes[size];

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
          sizeClasses.track,
          checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            sizeClasses.thumb,
            checked ? sizeClasses.translate : "translate-x-0.5",
            "mt-0.5"
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              htmlFor={id}
              className={cn(
                "cursor-pointer text-sm font-medium text-gray-900 dark:text-white",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {label}
            </label>
          )}
          {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Radio Group
// ============================================================================

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  label?: string;
  error?: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  label,
  error,
  orientation = "vertical",
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={cn("space-y-2", className)}>
      {label && (
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</legend>
      )}

      <div
        className={cn(
          "space-y-2",
          orientation === "horizontal" && "flex flex-wrap gap-4 space-y-0"
        )}
        role="radiogroup"
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
              onChange={() => onChange?.(option.value)}
              disabled={option.disabled}
              className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {option.label}
              </span>
              {option.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

// ============================================================================
// Form Group (for grouping related fields)
// ============================================================================

interface FormGroupProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  className?: string;
}

export function FormGroup({ children, label, description, className }: FormGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(label || description) && (
        <div>
          {label && (
            <h3 className="text-base font-medium text-gray-900 dark:text-white">{label}</h3>
          )}
          {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
