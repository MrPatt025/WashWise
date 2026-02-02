import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Debounce a value - delays updating until after delay ms of no changes
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 *
 * @example
 * ```tsx
 * const handleSearch = useDebouncedCallback(
 *   (query: string) => fetchResults(query),
 *   300
 * );
 * ```
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  callbackRef.current = callback;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Throttle a callback function - limits execution to at most once per delay ms
 *
 * @example
 * ```tsx
 * const handleScroll = useThrottledCallback(
 *   () => updateScrollPosition(),
 *   100
 * );
 * ```
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = true } = options;

  const lastRunRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastRunRef.current;
      lastArgsRef.current = args;

      const runCallback = () => {
        lastRunRef.current = Date.now();
        if (lastArgsRef.current) {
          callbackRef.current(...(lastArgsRef.current as Parameters<T>));
        }
      };

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (elapsed >= delay) {
        // Enough time has passed, execute immediately
        if (leading) {
          runCallback();
        } else if (trailing) {
          // Schedule for later
          timeoutRef.current = setTimeout(runCallback, delay);
        }
      } else if (trailing) {
        // Schedule for remaining time
        timeoutRef.current = setTimeout(runCallback, delay - elapsed);
      }
    },
    [delay, leading, trailing]
  );
}

/**
 * Throttle a value - updates at most once per delay ms
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRunRef = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastRunRef.current;

    if (elapsed >= delay) {
      lastRunRef.current = now;
      setThrottledValue(value);
      return undefined;
    }
    
    const timer = setTimeout(() => {
      lastRunRef.current = Date.now();
      setThrottledValue(value);
    }, delay - elapsed);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return throttledValue;
}

/**
 * Hook for tracking previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook for detecting value changes
 */
export function useValueChanged<T>(
  value: T,
  callback: (current: T, previous: T | undefined) => void
): void {
  const previousValue = usePrevious(value);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (value !== previousValue) {
      callbackRef.current(value, previousValue);
    }
  }, [value, previousValue]);
}

/**
 * Hook for debounced state
 * Returns both immediate and debounced values with setter
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return [value, debouncedValue, setValue];
}

/**
 * Hook for handling async operations with debounce
 */
export function useAsyncDebounce<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  delay: number
): {
  execute: (...args: Args) => void;
  isLoading: boolean;
  error: Error | null;
  data: T | undefined;
  cancel: () => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | undefined>();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  const execute = useCallback(
    (...args: Args) => {
      cancel();

      timeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        setError(null);

        abortControllerRef.current = new AbortController();

        try {
          const result = await asyncFnRef.current(...args);
          setData(result);
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") {
            setError(err);
          }
        } finally {
          setIsLoading(false);
        }
      }, delay);
    },
    [delay, cancel]
  );

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return { execute, isLoading, error, data, cancel };
}
