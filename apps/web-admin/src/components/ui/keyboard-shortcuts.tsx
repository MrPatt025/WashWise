"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface Shortcut {
  keys: string[];
  description: string;
  action?: () => void;
  category?: string;
}

interface ShortcutGroup {
  name: string;
  shortcuts: Shortcut[];
}

// ============================================================================
// Keyboard Key Display
// ============================================================================

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center px-1.5",
        "font-mono text-xs font-medium",
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
        "rounded border border-gray-300 dark:border-gray-600",
        "shadow-[0_1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.3)]",
        className
      )}
    >
      {children}
    </kbd>
  );
}

// ============================================================================
// Shortcut Display
// ============================================================================

interface ShortcutKeyProps {
  keys: string[];
  separator?: "+" | "then";
  className?: string;
}

export function ShortcutKey({ keys, separator = "+", className }: ShortcutKeyProps) {
  // Convert key names to symbols
  const formatKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      mod: navigator?.platform?.includes("Mac") ? "⌘" : "Ctrl",
      ctrl: "Ctrl",
      alt: navigator?.platform?.includes("Mac") ? "⌥" : "Alt",
      shift: "⇧",
      enter: "↵",
      escape: "Esc",
      backspace: "⌫",
      delete: "Del",
      tab: "⇥",
      arrowup: "↑",
      arrowdown: "↓",
      arrowleft: "←",
      arrowright: "→",
      space: "Space",
    };

    const lowerKey = key.toLowerCase();
    return keyMap[lowerKey] || key.toUpperCase();
  };

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="mx-0.5 text-xs text-gray-400">{separator === "+" ? "+" : "then"}</span>
          )}
          <Kbd>{formatKey(key)}</Kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

// ============================================================================
// Keyboard Shortcuts Dialog
// ============================================================================

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutGroup[];
  title?: string;
  className?: string;
}

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
  shortcuts,
  title = "Keyboard Shortcuts",
  className,
}: KeyboardShortcutsDialogProps) {
  // Close on escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
              "max-h-[80vh] w-full max-w-2xl overflow-hidden",
              "rounded-xl bg-white shadow-2xl dark:bg-gray-900",
              "border border-gray-200 dark:border-gray-800",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Keyboard className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[calc(80vh-80px)] overflow-y-auto p-6">
              <div className="grid gap-8 md:grid-cols-2">
                {shortcuts.map((group) => (
                  <div key={group.name}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {group.name}
                    </h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {shortcut.description}
                          </span>
                          <ShortcutKey keys={shortcut.keys} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-center dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Press <Kbd>?</Kbd> anytime to show this dialog
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Use Keyboard Shortcut Hook
// ============================================================================

interface UseKeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  target?: HTMLElement | Window | null;
}

export function useKeyboardShortcut(
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  options: UseKeyboardShortcutOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    target = typeof window !== "undefined" ? window : null,
  } = options;
  const callbackRef = React.useRef(callback);

  // Keep callback ref up to date
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (!enabled || !target) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Parse the keys
      const requiredKeys = keys.map((k) => k.toLowerCase());
      const pressedKeys: string[] = [];

      // Check modifier keys
      if (event.ctrlKey || event.metaKey) {
        pressedKeys.push(event.metaKey && navigator.platform.includes("Mac") ? "mod" : "ctrl");
      }
      if (event.altKey) pressedKeys.push("alt");
      if (event.shiftKey) pressedKeys.push("shift");

      // Add the main key
      const mainKey = event.key.toLowerCase();
      if (!["control", "alt", "shift", "meta"].includes(mainKey)) {
        pressedKeys.push(mainKey);
      }

      // Check if all required keys are pressed
      const allKeysPressed = requiredKeys.every((key) => {
        if (key === "mod") {
          return navigator.platform.includes("Mac") ? event.metaKey : event.ctrlKey;
        }
        return pressedKeys.includes(key);
      });

      if (allKeysPressed && pressedKeys.length === requiredKeys.length) {
        if (preventDefault) {
          event.preventDefault();
        }
        callbackRef.current(event);
      }
    };

    target.addEventListener("keydown", handleKeyDown as EventListener);

    return () => {
      target.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [keys, enabled, preventDefault, target]);
}

// ============================================================================
// Keyboard Shortcuts Provider
// ============================================================================

interface KeyboardShortcutsContextValue {
  shortcuts: ShortcutGroup[];
  registerShortcut: (group: string, shortcut: Shortcut) => void;
  unregisterShortcut: (group: string, keys: string[]) => void;
  showShortcuts: () => void;
  hideShortcuts: () => void;
  isShortcutsVisible: boolean;
}

const KeyboardShortcutsContext = React.createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcuts() {
  const context = React.useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsProvider");
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  defaultShortcuts?: ShortcutGroup[];
}

export function KeyboardShortcutsProvider({
  children,
  defaultShortcuts = [],
}: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = React.useState<ShortcutGroup[]>(defaultShortcuts);
  const [isShortcutsVisible, setIsShortcutsVisible] = React.useState(false);

  const registerShortcut = React.useCallback((groupName: string, shortcut: Shortcut) => {
    setShortcuts((prev) => {
      const groupIndex = prev.findIndex((g) => g.name === groupName);

      if (groupIndex === -1) {
        return [...prev, { name: groupName, shortcuts: [shortcut] }];
      }

      const newGroups = [...prev];
      const existingIndex = newGroups[groupIndex].shortcuts.findIndex(
        (s) => JSON.stringify(s.keys) === JSON.stringify(shortcut.keys)
      );

      if (existingIndex === -1) {
        newGroups[groupIndex] = {
          ...newGroups[groupIndex],
          shortcuts: [...newGroups[groupIndex].shortcuts, shortcut],
        };
      }

      return newGroups;
    });
  }, []);

  const unregisterShortcut = React.useCallback((groupName: string, keys: string[]) => {
    setShortcuts((prev) => {
      const groupIndex = prev.findIndex((g) => g.name === groupName);
      if (groupIndex === -1) return prev;

      const newGroups = [...prev];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        shortcuts: newGroups[groupIndex].shortcuts.filter(
          (s) => JSON.stringify(s.keys) !== JSON.stringify(keys)
        ),
      };

      // Remove empty groups
      if (newGroups[groupIndex].shortcuts.length === 0) {
        newGroups.splice(groupIndex, 1);
      }

      return newGroups;
    });
  }, []);

  const showShortcuts = React.useCallback(() => {
    setIsShortcutsVisible(true);
  }, []);

  const hideShortcuts = React.useCallback(() => {
    setIsShortcutsVisible(false);
  }, []);

  // Listen for ? key to show shortcuts
  useKeyboardShortcut(["?"], showShortcuts);

  const value = React.useMemo(
    () => ({
      shortcuts,
      registerShortcut,
      unregisterShortcut,
      showShortcuts,
      hideShortcuts,
      isShortcutsVisible,
    }),
    [
      shortcuts,
      registerShortcut,
      unregisterShortcut,
      showShortcuts,
      hideShortcuts,
      isShortcutsVisible,
    ]
  );

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      <KeyboardShortcutsDialog
        isOpen={isShortcutsVisible}
        onClose={hideShortcuts}
        shortcuts={shortcuts}
      />
    </KeyboardShortcutsContext.Provider>
  );
}

// ============================================================================
// Shortcut Badge (for displaying in UI)
// ============================================================================

interface ShortcutBadgeProps {
  keys: string[];
  className?: string;
}

export function ShortcutBadge({ keys, className }: ShortcutBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs",
        "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
        "rounded border border-gray-200 dark:border-gray-700",
        className
      )}
    >
      <ShortcutKey keys={keys} />
    </span>
  );
}

// ============================================================================
// Shortcut List Item
// ============================================================================

interface ShortcutListItemProps {
  keys: string[];
  description: string;
  onClick?: () => void;
  className?: string;
}

export function ShortcutListItem({ keys, description, onClick, className }: ShortcutListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between px-3 py-2 text-sm",
        "rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
    >
      <span className="text-gray-700 dark:text-gray-300">{description}</span>
      <ShortcutKey keys={keys} />
    </button>
  );
}

// ============================================================================
// Default App Shortcuts
// ============================================================================

export const defaultAppShortcuts: ShortcutGroup[] = [
  {
    name: "General",
    shortcuts: [
      { keys: ["mod", "k"], description: "Open command palette" },
      { keys: ["mod", "b"], description: "Toggle sidebar" },
      { keys: ["mod", "/"], description: "Toggle help" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    name: "Navigation",
    shortcuts: [
      { keys: ["g", "h"], description: "Go to home" },
      { keys: ["g", "m"], description: "Go to machines" },
      { keys: ["g", "s"], description: "Go to settings" },
      { keys: ["mod", "["], description: "Go back" },
      { keys: ["mod", "]"], description: "Go forward" },
    ],
  },
  {
    name: "Actions",
    shortcuts: [
      { keys: ["mod", "n"], description: "Create new item" },
      { keys: ["mod", "s"], description: "Save changes" },
      { keys: ["mod", "shift", "s"], description: "Save all" },
      { keys: ["mod", "d"], description: "Duplicate" },
      { keys: ["mod", "backspace"], description: "Delete" },
    ],
  },
  {
    name: "Selection",
    shortcuts: [
      { keys: ["mod", "a"], description: "Select all" },
      { keys: ["escape"], description: "Clear selection" },
      { keys: ["shift", "arrowup"], description: "Extend selection up" },
      { keys: ["shift", "arrowdown"], description: "Extend selection down" },
    ],
  },
];
