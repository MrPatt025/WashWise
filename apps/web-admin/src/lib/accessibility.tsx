"use client";

import * as React from "react";

/**
 * Screen reader only content
 * Visually hidden but accessible to screen readers
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
    return (
        <span
      style= {{
        position: "absolute",
            width: "1px",
                height: "1px",
                    padding: "0",
                        margin: "-1px",
                            overflow: "hidden",
                                clip: "rect(0, 0, 0, 0)",
                                    whiteSpace: "nowrap",
                                        border: "0",
      }
}
    >
    { children }
    </span>
  );
}

/**
 * Live region for screen reader announcements
 */
export interface LiveRegionProps {
    message: string;
    priority?: "polite" | "assertive";
    atomic?: boolean;
    children?: React.ReactNode;
}

export function LiveRegion({
    message,
    priority = "polite",
    atomic = true,
    children,
}: LiveRegionProps) {
    return (
        <div
      aria - live= { priority }
    aria - atomic={ atomic }
    aria - relevant="additions text"
    className = "sr-only"
        >
        { message || children
}
</div>
  );
}

/**
 * Hook for announcing content to screen readers
 */
export function useAnnouncement() {
    const [announcement, setAnnouncement] = React.useState("");
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const announce = React.useCallback(
        (message: string, clearAfter = 1000) => {
            setAnnouncement(message);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                setAnnouncement("");
            }, clearAfter);
        },
        []
    );

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { announcement, announce };
}

/**
 * Skip to main content link
 * Allows keyboard users to skip navigation
 */
export function SkipToMain({
    href = "#main-content",
    children = "Skip to main content",
}: {
    href?: string;
    children?: React.ReactNode;
}) {
    return (
        <a
      href= { href }
    className = "
    sr - only focus: not - sr - only
    focus:absolute focus: top - 4 focus: left - 4 focus: z - [100]
    focus: bg - background focus: px - 4 focus: py - 2
    focus: ring - 2 focus: ring - ring focus: rounded - md
    focus: text - foreground focus: font - medium
    "
        >
        { children }
        </a>
  );
}

/**
 * Focus trap container props
 */
export interface FocusContainerProps {
    children: React.ReactNode;
    /** Whether focus trap is active */
    active?: boolean;
    /** Return focus on unmount */
    returnFocus?: boolean;
    /** Element to focus on mount */
    initialFocus?: React.RefObject<HTMLElement>;
}

/**
 * Focus container for modals and dialogs
 */
export function FocusContainer({
    children,
    active = true,
    returnFocus = true,
    initialFocus,
}: FocusContainerProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const previousFocusRef = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
        if (!active) return;

        // Store current focus
        previousFocusRef.current = document.activeElement as HTMLElement;

        // Focus initial element or first focusable
        if (initialFocus?.current) {
            initialFocus.current.focus();
        } else if (containerRef.current) {
            const firstFocusable = containerRef.current.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            firstFocusable?.focus();
        }

        // Return focus on unmount
        return () => {
            if (returnFocus && previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        };
    }, [active, returnFocus, initialFocus]);

    return (
        <div ref= { containerRef } role = "group" >
            { children }
            </div>
  );
}

/**
 * ARIA label helpers
 */
export const ariaLabels = {
    /** Required field */
    required: { "aria-required": true } as const,
    /** Invalid field */
    invalid: { "aria-invalid": true } as const,
    /** Disabled */
    disabled: { "aria-disabled": true } as const,
    /** Expanded/collapsed */
    expanded: (isExpanded: boolean) => ({ "aria-expanded": isExpanded } as const),
    /** Selected */
    selected: (isSelected: boolean) => ({ "aria-selected": isSelected } as const),
    /** Pressed (toggle button) */
    pressed: (isPressed: boolean) => ({ "aria-pressed": isPressed } as const),
    /** Checked (checkbox/radio) */
    checked: (isChecked: boolean | "mixed") => ({ "aria-checked": isChecked } as const),
    /** Current (navigation) */
    current: (value: "page" | "step" | "location" | "date" | "time" | true) => ({
        "aria-current": value,
    } as const),
    /** Busy state */
    busy: (isBusy: boolean) => ({ "aria-busy": isBusy } as const),
    /** Has popup */
    hasPopup: (type: "menu" | "listbox" | "tree" | "grid" | "dialog" | true) => ({
        "aria-haspopup": type,
    } as const),
    /** Controls another element */
    controls: (id: string) => ({ "aria-controls": id } as const),
    /** Described by */
    describedBy: (id: string) => ({ "aria-describedby": id } as const),
    /** Labelled by */
    labelledBy: (id: string) => ({ "aria-labelledby": id } as const),
    /** Hidden from accessibility tree */
    hidden: { "aria-hidden": true } as const,
    /** Live region politeness */
    live: (politeness: "polite" | "assertive" | "off") => ({ "aria-live": politeness } as const),
};

/**
 * Role helpers
 */
export const roles = {
    alert: { role: "alert" } as const,
    alertDialog: { role: "alertdialog" } as const,
    button: { role: "button" } as const,
    checkbox: { role: "checkbox" } as const,
    dialog: { role: "dialog" } as const,
    grid: { role: "grid" } as const,
    gridCell: { role: "gridcell" } as const,
    group: { role: "group" } as const,
    img: { role: "img" } as const,
    link: { role: "link" } as const,
    list: { role: "list" } as const,
    listbox: { role: "listbox" } as const,
    listitem: { role: "listitem" } as const,
    menu: { role: "menu" } as const,
    menubar: { role: "menubar" } as const,
    menuitem: { role: "menuitem" } as const,
    navigation: { role: "navigation" } as const,
    option: { role: "option" } as const,
    progressbar: { role: "progressbar" } as const,
    radio: { role: "radio" } as const,
    radiogroup: { role: "radiogroup" } as const,
    region: { role: "region" } as const,
    search: { role: "search" } as const,
    separator: { role: "separator" } as const,
    slider: { role: "slider" } as const,
    spinbutton: { role: "spinbutton" } as const,
    status: { role: "status" } as const,
    switch: { role: "switch" } as const,
    tab: { role: "tab" } as const,
    tablist: { role: "tablist" } as const,
    tabpanel: { role: "tabpanel" } as const,
    textbox: { role: "textbox" } as const,
    timer: { role: "timer" } as const,
    toolbar: { role: "toolbar" } as const,
    tooltip: { role: "tooltip" } as const,
    tree: { role: "tree" } as const,
    treeitem: { role: "treeitem" } as const,
};

/**
 * Keyboard key constants
 */
export const Keys = {
    Enter: "Enter",
    Space: " ",
    Escape: "Escape",
    Tab: "Tab",
    ArrowUp: "ArrowUp",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
    Home: "Home",
    End: "End",
    PageUp: "PageUp",
    PageDown: "PageDown",
    Backspace: "Backspace",
    Delete: "Delete",
} as const;

/**
 * Keyboard event helpers
 */
export const keyboardHelpers = {
    isEnter: (e: React.KeyboardEvent) => e.key === Keys.Enter,
    isSpace: (e: React.KeyboardEvent) => e.key === Keys.Space,
    isEscape: (e: React.KeyboardEvent) => e.key === Keys.Escape,
    isTab: (e: React.KeyboardEvent) => e.key === Keys.Tab,
    isArrowUp: (e: React.KeyboardEvent) => e.key === Keys.ArrowUp,
    isArrowDown: (e: React.KeyboardEvent) => e.key === Keys.ArrowDown,
    isArrowLeft: (e: React.KeyboardEvent) => e.key === Keys.ArrowLeft,
    isArrowRight: (e: React.KeyboardEvent) => e.key === Keys.ArrowRight,
    isHome: (e: React.KeyboardEvent) => e.key === Keys.Home,
    isEnd: (e: React.KeyboardEvent) => e.key === Keys.End,
    isActivation: (e: React.KeyboardEvent) =>
        e.key === Keys.Enter || e.key === Keys.Space,
    isNavigation: (e: React.KeyboardEvent) =>
        [Keys.ArrowUp, Keys.ArrowDown, Keys.ArrowLeft, Keys.ArrowRight].includes(
            e.key as typeof Keys[keyof typeof Keys]
        ),
};

/**
 * Create keyboard handler for common patterns
 */
export function createKeyboardHandler(handlers: {
    onEnter?: (e: React.KeyboardEvent) => void;
    onSpace?: (e: React.KeyboardEvent) => void;
    onEscape?: (e: React.KeyboardEvent) => void;
    onTab?: (e: React.KeyboardEvent) => void;
    onArrowUp?: (e: React.KeyboardEvent) => void;
    onArrowDown?: (e: React.KeyboardEvent) => void;
    onArrowLeft?: (e: React.KeyboardEvent) => void;
    onArrowRight?: (e: React.KeyboardEvent) => void;
    onHome?: (e: React.KeyboardEvent) => void;
    onEnd?: (e: React.KeyboardEvent) => void;
}) {
    return (e: React.KeyboardEvent) => {
        switch (e.key) {
            case Keys.Enter:
                handlers.onEnter?.(e);
                break;
            case Keys.Space:
                handlers.onSpace?.(e);
                break;
            case Keys.Escape:
                handlers.onEscape?.(e);
                break;
            case Keys.Tab:
                handlers.onTab?.(e);
                break;
            case Keys.ArrowUp:
                handlers.onArrowUp?.(e);
                break;
            case Keys.ArrowDown:
                handlers.onArrowDown?.(e);
                break;
            case Keys.ArrowLeft:
                handlers.onArrowLeft?.(e);
                break;
            case Keys.ArrowRight:
                handlers.onArrowRight?.(e);
                break;
            case Keys.Home:
                handlers.onHome?.(e);
                break;
            case Keys.End:
                handlers.onEnd?.(e);
                break;
        }
    };
}

/**
 * Progress bar accessibility props
 */
export function getProgressProps(
    value: number,
    max: number,
    label?: string
): Record<string, string | number> {
    return {
        role: "progressbar",
        "aria-valuenow": value,
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-label": label || `Progress: ${Math.round((value / max) * 100)}%`,
    };
}

/**
 * Tab panel accessibility props
 */
export function getTabProps(
    index: number,
    selectedIndex: number,
    tabId: string,
    panelId: string
) {
    return {
        tabProps: {
            role: "tab",
            id: tabId,
            "aria-controls": panelId,
            "aria-selected": index === selectedIndex,
            tabIndex: index === selectedIndex ? 0 : -1,
        },
        panelProps: {
            role: "tabpanel",
            id: panelId,
            "aria-labelledby": tabId,
            tabIndex: 0,
            hidden: index !== selectedIndex,
        },
    };
}

/**
 * Combobox/Autocomplete accessibility props
 */
export function getComboboxProps(
    inputId: string,
    listboxId: string,
    isOpen: boolean,
    activeIndex?: number,
    activeOptionId?: string
) {
    return {
        inputProps: {
            role: "combobox",
            id: inputId,
            "aria-controls": listboxId,
            "aria-expanded": isOpen,
            "aria-haspopup": "listbox" as const,
            "aria-activedescendant": activeOptionId,
            "aria-autocomplete": "list" as const,
        },
        listboxProps: {
            role: "listbox",
            id: listboxId,
            "aria-labelledby": inputId,
        },
        getOptionProps: (index: number, optionId: string) => ({
            role: "option",
            id: optionId,
            "aria-selected": index === activeIndex,
        }),
    };
}

/**
 * Generate unique IDs for accessibility
 */
let idCounter = 0;
export function generateId(prefix = "a11y"): string {
    idCounter++;
    return `${prefix}-${idCounter}`;
}

/**
 * Hook for generating consistent IDs
 */
export function useId(prefix?: string): string {
    const [id] = React.useState(() => generateId(prefix));
    return id;
}

/**
 * Hook for linked IDs (e.g., input + label + error)
 */
export function useLinkedIds(base?: string) {
    const baseId = useId(base);

    return {
        inputId: baseId,
        labelId: `${baseId}-label`,
        errorId: `${baseId}-error`,
        descriptionId: `${baseId}-description`,
    };
}
