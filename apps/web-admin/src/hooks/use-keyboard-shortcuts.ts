import { useEffect, useCallback, useRef } from "react";

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
    /** Unique identifier for the shortcut */
    id: string;
    /** Key combination (e.g., "ctrl+k", "cmd+shift+p") */
    keys: string;
    /** Callback when shortcut is triggered */
    handler: (event: KeyboardEvent) => void;
    /** Description for help menu */
    description?: string;
    /** Scope - only active in specific contexts */
    scope?: "global" | "dashboard" | "machines" | "dialog";
    /** Prevent default browser behavior */
    preventDefault?: boolean;
    /** Whether to stop propagation */
    stopPropagation?: boolean;
    /** Disabled state */
    disabled?: boolean;
}

/**
 * Parse key combination string into modifier flags and key
 */
function parseKeys(keys: string): {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
    key: string;
} {
    const parts = keys.toLowerCase().split("+");
    return {
        ctrl: parts.includes("ctrl") || parts.includes("control"),
        shift: parts.includes("shift"),
        alt: parts.includes("alt") || parts.includes("option"),
        meta: parts.includes("meta") || parts.includes("cmd") || parts.includes("command"),
        key: parts.filter(
            (p) => !["ctrl", "control", "shift", "alt", "option", "meta", "cmd", "command"].includes(p)
        )[0] || "",
    };
}

/**
 * Check if keyboard event matches shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const parsed = parseKeys(shortcut.keys);

    // Handle special keys
    const eventKey = event.key.toLowerCase();
    const matchesKey =
        eventKey === parsed.key ||
        event.code.toLowerCase() === `key${parsed.key}` ||
        (parsed.key === "escape" && eventKey === "escape") ||
        (parsed.key === "enter" && eventKey === "enter") ||
        (parsed.key === "space" && eventKey === " ");

    return (
        matchesKey &&
        event.ctrlKey === parsed.ctrl &&
        event.shiftKey === parsed.shift &&
        event.altKey === parsed.alt &&
        event.metaKey === parsed.meta
    );
}

/**
 * Hook for registering keyboard shortcuts
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { id: "search", keys: "ctrl+k", handler: () => openSearch() },
 *   { id: "save", keys: "ctrl+s", handler: () => save(), preventDefault: true },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
    shortcuts: KeyboardShortcut[],
    options: {
        enabled?: boolean;
        scope?: string;
    } = {}
): void {
    const { enabled = true, scope = "global" } = options;
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Ignore if user is typing in an input
            const target = event.target as HTMLElement;
            const isInput =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.contentEditable === "true";

            for (const shortcut of shortcutsRef.current) {
                if (shortcut.disabled) continue;

                // Check scope
                if (shortcut.scope && shortcut.scope !== "global" && shortcut.scope !== scope) {
                    continue;
                }

                // Skip shortcuts that require modifier keys when typing in inputs
                // Allow escape key even in inputs
                if (isInput && shortcut.keys !== "escape" && !shortcut.keys.includes("+")) {
                    continue;
                }

                if (matchesShortcut(event, shortcut)) {
                    if (shortcut.preventDefault !== false) {
                        event.preventDefault();
                    }
                    if (shortcut.stopPropagation) {
                        event.stopPropagation();
                    }
                    shortcut.handler(event);
                    break;
                }
            }
        },
        [enabled, scope]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Predefined shortcuts for common actions
 */
export const COMMON_SHORTCUTS = {
    /** Open search (Cmd/Ctrl + K) */
    SEARCH: { keys: "ctrl+k", description: "Open search" },
    /** Save (Cmd/Ctrl + S) */
    SAVE: { keys: "ctrl+s", description: "Save changes" },
    /** Close/Cancel (Escape) */
    CLOSE: { keys: "escape", description: "Close dialog" },
    /** New item (Cmd/Ctrl + N) */
    NEW: { keys: "ctrl+n", description: "Create new" },
    /** Delete (Delete/Backspace) */
    DELETE: { keys: "delete", description: "Delete selected" },
    /** Refresh (Cmd/Ctrl + R) */
    REFRESH: { keys: "ctrl+r", description: "Refresh data" },
    /** Help (?) */
    HELP: { keys: "shift+/", description: "Show help" },
} as const;

/**
 * Hook for a single keyboard shortcut
 */
export function useKeyboardShortcut(
    keys: string,
    handler: (event: KeyboardEvent) => void,
    options: {
        enabled?: boolean;
        preventDefault?: boolean;
        description?: string;
    } = {}
): void {
    useKeyboardShortcuts([
        {
            id: keys,
            keys,
            handler,
            preventDefault: options.preventDefault ?? true,
            disabled: options.enabled === false,
            description: options.description,
        },
    ]);
}

/**
 * Hook for escape key handler
 */
export function useEscapeKey(handler: () => void, enabled = true): void {
    useKeyboardShortcut("escape", handler, { enabled });
}

/**
 * Registry to display all available shortcuts in a help menu
 */
const shortcutRegistry: Map<string, KeyboardShortcut> = new Map();

export function registerShortcut(shortcut: KeyboardShortcut): void {
    shortcutRegistry.set(shortcut.id, shortcut);
}

export function unregisterShortcut(id: string): void {
    shortcutRegistry.delete(id);
}

export function getRegisteredShortcuts(): KeyboardShortcut[] {
    return Array.from(shortcutRegistry.values());
}
