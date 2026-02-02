"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";

/**
 * Checkbox component props
 */
interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "checked"
> {
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Whether the checkbox is in indeterminate state */
  indeterminate?: boolean;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Label for the checkbox */
  label?: string;
  /** Description text */
  description?: string;
}

/**
 * Accessible checkbox component
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked = false,
      indeterminate = false,
      onCheckedChange,
      label,
      description,
      className,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const resolvedRef =
      (ref as React.RefObject<HTMLInputElement>) || internalRef;
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    // Handle indeterminate state
    React.useEffect(() => {
      if (resolvedRef.current) {
        resolvedRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, resolvedRef]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    const checkbox = (
      <div className="relative inline-flex items-center">
        <input
          ref={resolvedRef}
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded border border-primary ring-offset-background",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            checked || indeterminate
              ? "bg-primary text-primary-foreground"
              : "bg-background",
            className,
          )}
        >
          {checked && !indeterminate && (
            <Check className="h-3 w-3 text-current absolute top-0.5 left-0.5" />
          )}
          {indeterminate && (
            <Minus className="h-3 w-3 text-current absolute top-0.5 left-0.5" />
          )}
        </div>
      </div>
    );

    if (!label && !description) {
      return checkbox;
    }

    return (
      <div className="flex items-start space-x-3">
        {checkbox}
        <div className="space-y-1 leading-none">
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                "text-sm font-medium leading-none",
                "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                disabled && "cursor-not-allowed opacity-70",
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

/**
 * Checkbox group component
 */
interface CheckboxGroupProps {
  /** Array of selected values */
  value?: string[];
  /** Callback when values change */
  onValueChange?: (value: string[]) => void;
  /** Checkbox options */
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  /** Orientation */
  orientation?: "horizontal" | "vertical";
  /** Additional className */
  className?: string;
  /** Disable all checkboxes */
  disabled?: boolean;
}

export function CheckboxGroup({
  value = [],
  onValueChange,
  options,
  orientation = "vertical",
  className,
  disabled,
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (!onValueChange) return;

    if (checked) {
      onValueChange([...value, optionValue]);
    } else {
      onValueChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <div
      className={cn(
        "flex",
        orientation === "vertical"
          ? "flex-col space-y-3"
          : "flex-row space-x-6",
        className,
      )}
      role="group"
    >
      {options.map((option) => (
        <Checkbox
          key={option.value}
          checked={value.includes(option.value)}
          onCheckedChange={(checked) => handleChange(option.value, checked)}
          label={option.label}
          description={option.description}
          disabled={disabled || option.disabled}
        />
      ))}
    </div>
  );
}
