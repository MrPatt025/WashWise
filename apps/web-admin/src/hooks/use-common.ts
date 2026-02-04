"use client";

import * as React from "react";

/**
 * Hook to detect clicks outside of a specified element
 * Useful for closing dropdowns, modals, etc.
 */
export function useClickOutside<T extends HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled = true
): React.RefObject<T | null> {
  const ref = React.useRef<T>(null);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;

      // Do nothing if clicking ref's element or descendent elements
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler, enabled]);

  return ref;
}

/**
 * Hook to track scroll position
 */
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = React.useState({
    x: 0,
    y: 0,
  });

  React.useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    // Set initial position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return scrollPosition;
}

/**
 * Hook to track if scroll has passed a threshold
 */
export function useScrollPast(threshold = 100) {
  const [isPast, setIsPast] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsPast(window.scrollY > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return isPast;
}

/**
 * Hook to detect if element is in viewport
 */
export function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit = {}
): [React.RefObject<T | null>, boolean] {
  const ref = React.useRef<T>(null);
  const [isInView, setIsInView] = React.useState(false);

  const { threshold, root, rootMargin } = options;

  React.useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin]);

  return [ref, isInView];
}

/**
 * Hook to get and track window dimensions
 */
export function useWindowSize() {
  const [size, setSize] = React.useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return size;
}

/**
 * Hook to track previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined);

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook to copy text to clipboard
 */
export function useClipboard() {
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const copy = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(null);

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to copy"));
      setCopied(false);
    }
  }, []);

  return { copy, copied, error };
}

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to toggle boolean state
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = React.useState(initialValue);

  const toggle = React.useCallback(() => {
    setValue((v) => !v);
  }, []);

  const setTrue = React.useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = React.useCallback(() => {
    setValue(false);
  }, []);

  return { value, toggle, setTrue, setFalse, setValue };
}

/**
 * Hook for async state management
 */
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true) {
  const [state, setState] = React.useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = React.useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, loading: false, error: err });
      throw err;
    }
  }, [asyncFunction]);

  React.useEffect(() => {
    if (immediate) {
      void execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}

/**
 * Hook for managing counters
 */
export function useCounter(initialValue = 0, { min, max }: { min?: number; max?: number } = {}) {
  const [count, setCount] = React.useState(initialValue);

  const increment = React.useCallback(() => {
    setCount((c) => {
      const next = c + 1;
      return max !== undefined ? Math.min(next, max) : next;
    });
  }, [max]);

  const decrement = React.useCallback(() => {
    setCount((c) => {
      const next = c - 1;
      return min !== undefined ? Math.max(next, min) : next;
    });
  }, [min]);

  const reset = React.useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset, setCount };
}

/**
 * Hook for document title
 */
export function useDocumentTitle(title: string, restoreOnUnmount = true) {
  React.useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      if (restoreOnUnmount) {
        document.title = previousTitle;
      }
    };
  }, [title, restoreOnUnmount]);
}

/**
 * Hook for hover state
 */
export function useHover<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const [isHovered, setIsHovered] = React.useState(false);
  const ref = React.useRef<T>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return [ref, isHovered];
}

/**
 * Hook for interval
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = React.useRef(callback);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setInterval(() => savedCallback.current(), delay);

    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook for timeout
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = React.useRef(callback);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setTimeout(() => savedCallback.current(), delay);

    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * Hook for mounting state
 */
export function useIsMounted() {
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return React.useCallback(() => isMounted.current, []);
}
