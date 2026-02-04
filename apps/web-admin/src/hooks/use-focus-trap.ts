import { useCallback, useEffect, useRef } from "react";

/**
 * Focus trap options
 */
export interface FocusTrapOptions {
  /** Whether the focus trap is active */
  enabled?: boolean;
  /** Return focus to previous element on deactivate */
  returnFocus?: boolean;
  /** Initial element to focus (selector or ref) */
  initialFocus?: string | React.RefObject<HTMLElement>;
  /** Element to focus when trap is deactivated */
  fallbackFocus?: string | React.RefObject<HTMLElement>;
  /** Allow focus to leave the trap with Tab at boundaries */
  allowOutsideClick?: boolean;
  /** Escape key deactivates trap */
  escapeDeactivates?: boolean;
  /** Callback when escape is pressed */
  onEscape?: () => void;
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    "a[href]",
    "area[href]",
    'input:not([disabled]):not([type="hidden"])',
    "select:not([disabled])",
    "textarea:not([disabled])",
    "button:not([disabled])",
    "iframe",
    "[tabindex]",
    "[contenteditable]",
  ].join(", ");

  const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

  return elements.filter((el) => {
    // Filter out elements with tabindex="-1"
    const tabindex = el.getAttribute("tabindex");
    if (tabindex === "-1") {
      return false;
    }

    // Filter out hidden elements
    if (el.offsetParent === null && el.tagName !== "BODY") {
      return false;
    }

    return true;
  });
}

/**
 * Hook for creating a focus trap within a container
 * Essential for accessible modals, dialogs, and dropdowns
 *
 * @example
 * ```tsx
 * function Dialog({ open, onClose }) {
 *   const dialogRef = useFocusTrap<HTMLDivElement>({
 *     enabled: open,
 *     onEscape: onClose,
 *   });
 *
 *   return (
 *     <div ref={dialogRef} role="dialog" aria-modal="true">
 *       <button>Close</button>
 *       <input placeholder="Name" />
 *       <button>Save</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  options: FocusTrapOptions = {}
): React.RefObject<T | null> {
  const {
    enabled = true,
    returnFocus = true,
    initialFocus,
    escapeDeactivates = true,
    onEscape,
    allowOutsideClick = false,
  } = options;

  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (enabled) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
    }
  }, [enabled]);

  // Handle initial focus
  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    let elementToFocus: HTMLElement | null = null;

    // Try to focus initial element
    if (initialFocus) {
      if (typeof initialFocus === "string") {
        elementToFocus = container.querySelector<HTMLElement>(initialFocus);
      } else if (initialFocus.current) {
        elementToFocus = initialFocus.current;
      }
    }

    // Fall back to first focusable element
    if (!elementToFocus) {
      const focusableElements = getFocusableElements(container);
      elementToFocus = focusableElements[0] || container;
    }

    // Focus with a small delay to ensure DOM is ready
    requestAnimationFrame(() => {
      elementToFocus?.focus();
    });
  }, [enabled, initialFocus]);

  // Handle keyboard navigation (Tab trapping)
  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === "Escape" && escapeDeactivates) {
        event.preventDefault();
        onEscape?.();
        return;
      }

      // Handle Tab key
      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Shift + Tab at first element -> go to last
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // Tab at last element -> go to first
      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, escapeDeactivates, onEscape]);

  // Handle clicks outside the container
  useEffect(() => {
    if (!enabled || allowOutsideClick || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    const handleFocusIn = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) {
        event.preventDefault();
        event.stopPropagation();

        // Return focus to the container
        const focusableElements = getFocusableElements(container);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          container.focus();
        }
      }
    };

    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [enabled, allowOutsideClick]);

  // Return focus when deactivating
  useEffect(() => {
    if (!enabled) {
      if (returnFocus && previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
        previouslyFocusedRef.current = null;
      }
    }
  }, [enabled, returnFocus]);

  return containerRef;
}

/**
 * Hook for managing focus within a list (roving tabindex)
 * Used for accessible menus, listboxes, and toolbars
 *
 * @example
 * ```tsx
 * function Menu({ items }) {
 *   const { focusedIndex, setFocusedIndex, getItemProps } = useRovingFocus({
 *     itemCount: items.length,
 *     orientation: 'vertical',
 *   });
 *
 *   return (
 *     <ul role="menu">
 *       {items.map((item, index) => (
 *         <li key={item.id} {...getItemProps(index)} role="menuitem">
 *           {item.label}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useRovingFocus(options: {
  itemCount: number;
  orientation?: "horizontal" | "vertical" | "both";
  loop?: boolean;
  initialIndex?: number;
}) {
  const { itemCount, orientation = "vertical", loop = true, initialIndex = 0 } = options;

  const focusedIndexRef = useRef(initialIndex);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Reset refs when item count changes
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, itemCount);
  }, [itemCount]);

  const focusItem = useCallback(
    (index: number) => {
      const clampedIndex = loop
        ? ((index % itemCount) + itemCount) % itemCount
        : Math.max(0, Math.min(index, itemCount - 1));

      focusedIndexRef.current = clampedIndex;
      itemRefs.current[clampedIndex]?.focus();
    },
    [itemCount, loop]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
      tabIndex: index === focusedIndexRef.current ? 0 : -1,
      onKeyDown: (event: React.KeyboardEvent) => {
        const isVertical = orientation === "vertical" || orientation === "both";
        const isHorizontal = orientation === "horizontal" || orientation === "both";

        switch (event.key) {
          case "ArrowDown":
            if (isVertical) {
              event.preventDefault();
              focusItem(index + 1);
            }
            break;
          case "ArrowUp":
            if (isVertical) {
              event.preventDefault();
              focusItem(index - 1);
            }
            break;
          case "ArrowRight":
            if (isHorizontal) {
              event.preventDefault();
              focusItem(index + 1);
            }
            break;
          case "ArrowLeft":
            if (isHorizontal) {
              event.preventDefault();
              focusItem(index - 1);
            }
            break;
          case "Home":
            event.preventDefault();
            focusItem(0);
            break;
          case "End":
            event.preventDefault();
            focusItem(itemCount - 1);
            break;
        }
      },
      onFocus: () => {
        focusedIndexRef.current = index;
      },
    }),
    [focusItem, itemCount, orientation]
  );

  return {
    focusedIndex: focusedIndexRef.current,
    setFocusedIndex: (index: number) => focusItem(index),
    getItemProps,
  };
}

/**
 * Hook for announcing content to screen readers
 */
export function useAnnounce() {
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.setAttribute(
      "style",
      "position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;"
    );

    document.body.appendChild(announcer);

    // Delay to ensure the live region is registered
    requestAnimationFrame(() => {
      announcer.textContent = message;
    });

    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  return announce;
}
