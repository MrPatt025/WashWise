"use client";

import * as React from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * Search input props
 */
export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "onSubmit"
> {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Debounce delay in ms (0 for no debounce) */
  debounce?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Show clear button */
  showClear?: boolean;
  /** Callback when search is submitted (Enter key) */
  onSearchSubmit?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Container class name */
  containerClassName?: string;
}

/**
 * Enhanced search input with debounce, loading state, and clear button
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 *
 * return (
 *   <SearchInput
 *     value={search}
 *     onChange={setSearch}
 *     debounce={300}
 *     placeholder="Search machines..."
 *   />
 * );
 * ```
 */
export function SearchInput({
  value,
  onChange,
  debounce = 0,
  isLoading = false,
  showClear = true,
  onSearchSubmit,
  placeholder = "Search...",
  containerClassName,
  className,
  ...props
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const debouncedValue = useDebounce(localValue, debounce);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync local value when external value changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Emit debounced value
  React.useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    // If no debounce, emit immediately
    if (debounce === 0) {
      onChange(e.target.value);
    }
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearchSubmit) {
      e.preventDefault();
      onSearchSubmit(localValue);
    }
    if (e.key === "Escape" && localValue) {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className={cn("relative", containerClassName)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("pl-9 pr-9", className)}
        aria-label={placeholder}
        {...props}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {showClear && localValue && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0 hover:bg-transparent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Search input with suggestions dropdown
 */
export interface SearchWithSuggestionsProps extends Omit<
  SearchInputProps,
  "onSearchSubmit" | "onSelect"
> {
  /** Suggestions to show */
  suggestions: string[];
  /** Callback when suggestion is selected */
  onSuggestionSelect: (value: string) => void;
  /** Max suggestions to show */
  maxSuggestions?: number;
  /** Show recent searches */
  recentSearches?: string[];
  /** Callback when search is submitted */
  onSearchSubmit?: (value: string) => void;
}

export function SearchWithSuggestions({
  value,
  onChange,
  suggestions,
  onSuggestionSelect,
  maxSuggestions = 5,
  recentSearches = [],
  onSearchSubmit,
  ...props
}: SearchWithSuggestionsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Filter suggestions based on current value
  const filteredSuggestions = React.useMemo(() => {
    if (!value) {
      return recentSearches.slice(0, maxSuggestions);
    }

    const lowerValue = value.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(lowerValue)).slice(0, maxSuggestions);
  }, [value, suggestions, recentSearches, maxSuggestions]);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    onSuggestionSelect(suggestion);
    setIsOpen(false);
  };

  const handleSubmit = (submitValue: string) => {
    setIsOpen(false);
    onSearchSubmit?.(submitValue);
  };

  return (
    <div ref={containerRef} className="relative">
      <SearchInput
        value={value}
        onChange={onChange}
        onFocus={() => setIsOpen(true)}
        onSearchSubmit={handleSubmit}
        {...props}
      />

      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover shadow-lg">
          {!value && recentSearches.length > 0 && (
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
              Recent searches
            </div>
          )}
          <ul role="listbox" className="py-1">
            {filteredSuggestions.map((suggestion) => (
              <li
                key={suggestion}
                role="option"
                aria-selected={false}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                onClick={() => handleSelect(suggestion)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSelect(suggestion);
                  }
                }}
                tabIndex={0}
              >
                <span className="flex items-center gap-2">
                  <Search className="h-3 w-3 text-muted-foreground" />
                  {suggestion}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Compact search button that expands on click (for mobile/navbar)
 */
export interface ExpandableSearchProps extends Omit<SearchInputProps, "containerClassName"> {
  /** Whether search is expanded */
  expanded?: boolean;
  /** Callback when expansion state changes */
  onExpandChange?: (expanded: boolean) => void;
}

export function ExpandableSearch({
  expanded: controlledExpanded,
  onExpandChange,
  value,
  onChange,
  ...props
}: ExpandableSearchProps) {
  const [internalExpanded, setInternalExpanded] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const expanded = controlledExpanded ?? internalExpanded;
  const setExpanded = onExpandChange ?? setInternalExpanded;

  React.useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  const handleBlur = () => {
    if (!value) {
      setExpanded(false);
    }
  };

  if (!expanded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setExpanded(true)}
        aria-label="Open search"
      >
        <Search className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 animate-in slide-in-from-right-5">
      <SearchInput
        value={value}
        onChange={onChange}
        className="w-48 sm:w-64"
        onBlur={handleBlur}
        {...props}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          onChange("");
          setExpanded(false);
        }}
        aria-label="Close search"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
