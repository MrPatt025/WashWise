"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Advanced Select Context
// ============================================================================

interface SelectContextValue {
  value: string | string[];
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  multiple: boolean;
  searchable: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  disabled: boolean;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select");
  }
  return context;
}

// ============================================================================
// Advanced Select Root
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  group?: string;
}

interface AdvancedSelectProps {
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: React.ReactNode;
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AdvancedSelect({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
  multiple = false,
  searchable = false,
  disabled = false,
  className,
}: AdvancedSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<string | string[]>(defaultValue);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];
        const updatedValues = currentValues.includes(newValue)
          ? currentValues.filter((v) => v !== newValue)
          : [...currentValues, newValue];

        if (controlledValue === undefined) {
          setInternalValue(updatedValues);
        }
        onValueChange?.(updatedValues);
      } else {
        if (controlledValue === undefined) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
        setOpen(false);
      }
    },
    [value, multiple, controlledValue, onValueChange]
  );

  const contextValue = React.useMemo(
    () => ({
      value,
      onValueChange: handleValueChange,
      open,
      setOpen,
      multiple,
      searchable,
      searchQuery,
      setSearchQuery,
      highlightedIndex,
      setHighlightedIndex,
      disabled,
    }),
    [value, handleValueChange, open, multiple, searchable, searchQuery, highlightedIndex, disabled]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div className={cn("relative", className)}>{children}</div>
    </SelectContext.Provider>
  );
}

// ============================================================================
// Select Trigger
// ============================================================================

interface SelectTriggerProps {
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function SelectTrigger({
  children,
  placeholder = "Select an option...",
  className,
}: SelectTriggerProps) {
  const { value, open, setOpen, disabled, multiple } = useSelectContext();
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const displayValue = React.useMemo(() => {
    if (children) {
      return children;
    }
    if (multiple && Array.isArray(value) && value.length > 0) {
      return `${value.length} selected`;
    }
    if (!multiple && value) {
      return value;
    }
    return placeholder;
  }, [children, value, multiple, placeholder]);

  const hasValue = multiple ? Array.isArray(value) && value.length > 0 : Boolean(value);

  return (
    <motion.button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled}
      onClick={() => setOpen(!open)}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5",
        "text-left text-sm font-medium transition-all duration-200",
        "hover:border-slate-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20",
        "dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600",
        !hasValue && "text-slate-500 dark:text-slate-400",
        hasValue && "text-slate-900 dark:text-white",
        disabled && "cursor-not-allowed opacity-50",
        open && "border-violet-500 ring-2 ring-violet-500/20",
        className
      )}
    >
      <span className="truncate">{displayValue}</span>
      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </motion.span>
    </motion.button>
  );
}

// ============================================================================
// Select Content
// ============================================================================

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  position?: "popper" | "item-aligned";
}

export function SelectContent({ children, className, position = "popper" }: SelectContentProps) {
  const { open, setOpen, searchable, searchQuery, setSearchQuery } = useSelectContext();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input when opened
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen, searchable]);

  // Reset search query when closed
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open, setSearchQuery]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl",
            "dark:border-slate-700 dark:bg-slate-900",
            position === "popper" && "top-full",
            className
          )}
        >
          {/* Search Input */}
          {searchable && (
            <div className="border-b border-slate-100 p-2 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={cn(
                    "w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm",
                    "placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20",
                    "dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
                  )}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Select Item
// ============================================================================

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SelectItem({
  value: itemValue,
  children,
  description,
  icon,
  disabled = false,
  className,
}: SelectItemProps) {
  const { value, onValueChange, multiple, searchQuery } = useSelectContext();

  const isSelected = multiple
    ? Array.isArray(value) && value.includes(itemValue)
    : value === itemValue;

  // Filter based on search query
  const label = typeof children === "string" ? children : itemValue;
  if (searchQuery && !label.toLowerCase().includes(searchQuery.toLowerCase())) {
    return null;
  }

  return (
    <motion.button
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(itemValue)}
      whileHover={{ backgroundColor: "rgba(139, 92, 246, 0.05)" }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
        "text-sm text-slate-700 dark:text-slate-300",
        isSelected && "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {/* Checkbox for multiple */}
      {multiple && (
        <div
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            isSelected
              ? "border-violet-500 bg-violet-500 text-white"
              : "border-slate-300 dark:border-slate-600"
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </div>
      )}

      {/* Icon */}
      {icon && <span className="shrink-0 text-slate-500">{icon}</span>}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <span className="block truncate font-medium">{children}</span>
        {description && (
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
            {description}
          </span>
        )}
      </div>

      {/* Selected check for single */}
      {!multiple && isSelected && <Check className="h-4 w-4 shrink-0 text-violet-500" />}
    </motion.button>
  );
}

// ============================================================================
// Select Group
// ============================================================================

interface SelectGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectGroup({ label, children, className }: SelectGroupProps) {
  return (
    <div className={cn("py-1", className)}>
      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// Select Separator
// ============================================================================

export function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-slate-100 dark:bg-slate-800", className)} />;
}

// ============================================================================
// Multi-Select Tags Display
// ============================================================================

interface SelectTagsProps {
  options: SelectOption[];
  className?: string;
}

export function SelectTags({ options, className }: SelectTagsProps) {
  const { value, onValueChange, multiple } = useSelectContext();

  if (!multiple || !Array.isArray(value) || value.length === 0) {
    return null;
  }

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <div className={cn("mt-2 flex flex-wrap gap-1.5", className)}>
      {selectedOptions.map((option) => (
        <motion.span
          key={option.value}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700",
            "dark:bg-violet-950/30 dark:text-violet-300"
          )}
        >
          {option.icon && <span className="shrink-0">{option.icon}</span>}
          {option.label}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onValueChange(option.value);
            }}
            className="ml-0.5 rounded-full p-0.5 hover:bg-violet-200 dark:hover:bg-violet-900"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.span>
      ))}
    </div>
  );
}

// ============================================================================
// Searchable Select (Convenience Component)
// ============================================================================

interface SearchableSelectProps {
  options: SelectOption[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Search and select...",
  multiple = false,
  disabled = false,
  className,
}: SearchableSelectProps) {
  const selectedLabel = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) {
        return undefined;
      }
      if (value.length === 1) {
        return options.find((opt) => opt.value === value[0])?.label;
      }
      return `${value.length} selected`;
    }
    return options.find((opt) => opt.value === value)?.label;
  }, [value, options, multiple]);

  // Group options
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, SelectOption[]> = {};
    const ungrouped: SelectOption[] = [];

    options.forEach((opt) => {
      if (opt.group) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        groups[opt.group] ??= [];
        groups[opt.group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    });

    return { groups, ungrouped };
  }, [options]);

  return (
    <AdvancedSelect
      value={value}
      onValueChange={onValueChange}
      searchable
      multiple={multiple}
      disabled={disabled}
      className={className}
    >
      <SelectTrigger placeholder={placeholder}>{selectedLabel}</SelectTrigger>
      <SelectContent>
        {/* Ungrouped options */}
        {groupedOptions.ungrouped.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            description={option.description}
            icon={option.icon}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}

        {/* Grouped options */}
        {Object.entries(groupedOptions.groups).map(([group, opts]) => (
          <SelectGroup key={group} label={group}>
            {opts.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                description={option.description}
                icon={option.icon}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>

      {/* Show tags for multi-select */}
      {multiple && <SelectTags options={options} />}
    </AdvancedSelect>
  );
}
