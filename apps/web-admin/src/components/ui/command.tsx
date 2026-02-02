"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Command,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  X,
  Clock,
  ChevronRight,
} from "lucide-react";
import { createPortal } from "react-dom";

// ============================================================================
// Types
// ============================================================================

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  keywords?: string[];
  group?: string;
  disabled?: boolean;
  onSelect?: () => void;
  href?: string;
}

export interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

// ============================================================================
// Command Context
// ============================================================================

interface CommandContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  filteredGroups: CommandGroup[];
  executeItem: (item: CommandItem) => void;
  recentItems: CommandItem[];
  addToRecent: (item: CommandItem) => void;
}

const CommandContext = React.createContext<CommandContextValue | null>(null);

function useCommandContext() {
  const context = React.useContext(CommandContext);
  if (!context) {
    throw new Error("Command components must be used within CommandProvider");
  }
  return context;
}

// ============================================================================
// Command Provider
// ============================================================================

interface CommandProviderProps {
  children: React.ReactNode;
  groups: CommandGroup[];
  onOpenChange?: (open: boolean) => void;
  shortcut?: string;
}

export function CommandProvider({
  children,
  groups,
  onOpenChange,
  shortcut = "k",
}: CommandProviderProps) {
  const [open, setOpenState] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recentItems, setRecentItems] = React.useState<CommandItem[]>([]);

  // Load recent items from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("command-recent");
      if (stored) {
        setRecentItems(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
  }, []);

  const setOpen = React.useCallback(
    (value: boolean) => {
      setOpenState(value);
      onOpenChange?.(value);
      if (!value) {
        setQuery("");
        setSelectedIndex(0);
      }
    },
    [onOpenChange]
  );

  // Global keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === shortcut) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen, shortcut]);

  // Filter groups based on query
  const filteredGroups = React.useMemo(() => {
    if (!query.trim()) {
      return groups;
    }

    const lowerQuery = query.toLowerCase();

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const matchLabel = item.label.toLowerCase().includes(lowerQuery);
          const matchDescription = item.description?.toLowerCase().includes(lowerQuery);
          const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery));
          return matchLabel || matchDescription || matchKeywords;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  // Get flat list of items for keyboard navigation
  const flatItems = React.useMemo(() => filteredGroups.flatMap((g) => g.items), [filteredGroups]);

  // Reset selected index when filtered items change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const addToRecent = React.useCallback((item: CommandItem) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("command-recent", JSON.stringify(updated));
      } catch {
        // Ignore errors
      }
      return updated;
    });
  }, []);

  const executeItem = React.useCallback(
    (item: CommandItem) => {
      if (item.disabled) return;

      addToRecent(item);
      item.onSelect?.();

      if (item.href) {
        window.location.href = item.href;
      }

      setOpen(false);
    },
    [addToRecent, setOpen]
  );

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          const selectedItem = flatItems[selectedIndex];
          if (selectedItem && !selectedItem.disabled) {
            executeItem(selectedItem);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, flatItems, selectedIndex, executeItem]);

  return (
    <CommandContext.Provider
      value={{
        open,
        setOpen,
        query,
        setQuery,
        selectedIndex,
        setSelectedIndex,
        filteredGroups,
        executeItem,
        recentItems,
        addToRecent,
      }}
    >
      {children}
    </CommandContext.Provider>
  );
}

// ============================================================================
// Command Dialog
// ============================================================================

interface CommandDialogProps {
  className?: string;
}

export function CommandDialog({ className }: CommandDialogProps) {
  const { open, setOpen, query, setQuery, filteredGroups, recentItems } = useCommandContext();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2",
              className
            )}
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              {/* Search Input */}
              <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 border-none bg-transparent py-4 text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {/* Recent items */}
                {!query && recentItems.length > 0 && (
                  <CommandGroupComponent
                    label="Recent"
                    icon={<Clock className="h-4 w-4" />}
                    items={recentItems}
                  />
                )}

                {/* Filtered groups */}
                {filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <CommandGroupComponent key={group.id} label={group.label} items={group.items} />
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    <p>No results found.</p>
                    <p className="mt-1 text-sm">Try a different search term.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    <ArrowDown className="h-3 w-3" />
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <CornerDownLeft className="h-3 w-3" />
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="rounded bg-gray-200 px-1 py-0.5 text-[10px] dark:bg-gray-700">
                      ESC
                    </span>
                    Close
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ============================================================================
// Command Group
// ============================================================================

interface CommandGroupComponentProps {
  label: string;
  items: CommandItem[];
  icon?: React.ReactNode;
}

function CommandGroupComponent({ label, items, icon }: CommandGroupComponentProps) {
  const { selectedIndex, filteredGroups, setSelectedIndex, executeItem } = useCommandContext();

  // Calculate the starting index for this group
  const flatItems = filteredGroups.flatMap((g) => g.items);
  const startIndex = flatItems.findIndex((item) => item.id === items[0]?.id);

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 px-4 py-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {icon}
        {label}
      </div>
      {items.map((item, index) => {
        const globalIndex = startIndex + index;
        const isSelected = selectedIndex === globalIndex;

        return (
          <CommandItemComponent
            key={item.id}
            item={item}
            selected={isSelected}
            onSelect={() => executeItem(item)}
            onMouseEnter={() => setSelectedIndex(globalIndex)}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Command Item
// ============================================================================

interface CommandItemComponentProps {
  item: CommandItem;
  selected?: boolean;
  onSelect?: () => void;
  onMouseEnter?: () => void;
}

function CommandItemComponent({
  item,
  selected,
  onSelect,
  onMouseEnter,
}: CommandItemComponentProps) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      disabled={item.disabled}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
        selected
          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          : "text-gray-700 dark:text-gray-300",
        item.disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {item.icon && <span className="h-5 w-5 flex-shrink-0">{item.icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{item.label}</div>
        {item.description && (
          <div className="truncate text-xs text-gray-500 dark:text-gray-400">
            {item.description}
          </div>
        )}
      </div>
      {item.shortcut && (
        <div className="flex items-center gap-1">
          {item.shortcut.map((key, i) => (
            <kbd
              key={i}
              className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
            >
              {key}
            </kbd>
          ))}
        </div>
      )}
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
    </button>
  );
}

// ============================================================================
// Command Trigger
// ============================================================================

interface CommandTriggerProps {
  className?: string;
}

export function CommandTrigger({ className }: CommandTriggerProps) {
  const { setOpen } = useCommandContext();

  return (
    <button
      onClick={() => setOpen(true)}
      className={cn(
        "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
        className
      )}
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 sm:inline-flex">
        <Command className="h-3 w-3" />K
      </kbd>
    </button>
  );
}

// ============================================================================
// Use Command Hook
// ============================================================================

export function useCommand() {
  const context = React.useContext(CommandContext);
  if (!context) {
    return {
      open: () => {},
      close: () => {},
      toggle: () => {},
    };
  }

  return {
    open: () => context.setOpen(true),
    close: () => context.setOpen(false),
    toggle: () => context.setOpen(!context.open),
  };
}

// ============================================================================
// Spotlight Search (Simplified version)
// ============================================================================

interface SpotlightSearchProps {
  items: CommandItem[];
  onSelect: (item: CommandItem) => void;
  placeholder?: string;
  shortcut?: string;
  className?: string;
}

export function SpotlightSearch({
  items,
  onSelect,
  placeholder = "Search...",
  shortcut = "k",
  className,
}: SpotlightSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Global keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === shortcut) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, shortcut]);

  // Filter items
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();
    return items.filter((item) => {
      const matchLabel = item.label.toLowerCase().includes(lowerQuery);
      const matchDescription = item.description?.toLowerCase().includes(lowerQuery);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery));
      return matchLabel || matchDescription || matchKeywords;
    });
  }, [items, query]);

  // Reset selection on filter change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          const selectedItem = filteredItems[selectedIndex];
          if (selectedItem && !selectedItem.disabled) {
            onSelect(selectedItem);
            setOpen(false);
            setQuery("");
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredItems, selectedIndex, onSelect]);

  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2",
              className
            )}
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 border-none bg-transparent py-4 text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (!item.disabled) {
                          onSelect(item);
                          setOpen(false);
                          setQuery("");
                        }
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      disabled={item.disabled}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                        selectedIndex === index ? "bg-blue-50 dark:bg-blue-900/20" : "",
                        item.disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {item.icon && <span className="h-5 w-5">{item.icon}</span>}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </div>
                        {item.description && (
                          <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No results found.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
