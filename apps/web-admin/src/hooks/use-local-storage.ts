import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Serialize value to string for storage
 */
function serialize(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    console.warn("[useLocalStorage] Failed to serialize value:", value);
    return String(value);
  }
}

/**
 * Deserialize string from storage to value
 */
function deserialize<T>(value: string | null, fallback: T): T {
  if (value === null) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    // If it's not valid JSON, try returning as-is for string values
    return value as unknown as T;
  }
}

/**
 * Options for useLocalStorage hook
 */
export interface UseLocalStorageOptions<T> {
  /** Serializer function (default: JSON.stringify) */
  serializer?: (value: T) => string;
  /** Deserializer function (default: JSON.parse) */
  deserializer?: (value: string) => T;
  /** Sync across browser tabs */
  syncTabs?: boolean;
  /** Error handler */
  onError?: (error: Error) => void;
}

/**
 * Hook for persisting state in localStorage
 * Automatically syncs across tabs and handles SSR
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage("theme", "light");
 * const [settings, setSettings] = useLocalStorage("settings", { notifications: true });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = serialize,
    deserializer = (v: string) => deserialize(v, initialValue),
    syncTabs = true,
    onError,
  } = options;

  // Use ref to track if this is the first render (SSR)
  const isFirstRender = useRef(true);

  // Read from localStorage
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      console.warn(`[useLocalStorage] Error reading key "${key}":`, error);
      onError?.(error as Error);
      return initialValue;
    }
  }, [key, initialValue, deserializer, onError]);

  // State with lazy initialization
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Set initial value after mount (to avoid SSR hydration mismatch)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setStoredValue(readValue());
    }
  }, [readValue]);

  // Write to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (typeof window === "undefined") {
        console.warn("[useLocalStorage] localStorage is not available");
        return;
      }

      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, serializer(valueToStore));

        // Dispatch custom event for other hooks using the same key
        window.dispatchEvent(
          new CustomEvent("local-storage-change", {
            detail: { key, value: valueToStore },
          })
        );
      } catch (error) {
        console.warn(`[useLocalStorage] Error setting key "${key}":`, error);
        onError?.(error as Error);
      }
    },
    [key, serializer, storedValue, onError]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);

      window.dispatchEvent(
        new CustomEvent("local-storage-change", {
          detail: { key, value: null },
        })
      );
    } catch (error) {
      console.warn(`[useLocalStorage] Error removing key "${key}":`, error);
      onError?.(error as Error);
    }
  }, [key, initialValue, onError]);

  // Sync across tabs
  useEffect(() => {
    if (!syncTabs || typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key) {
        return;
      }

      const newValue = event.newValue ? deserializer(event.newValue) : initialValue;
      setStoredValue(newValue);
    };

    const handleCustomEvent = (event: CustomEvent<{ key: string; value: T | null }>) => {
      if (event.detail.key !== key) {
        return;
      }
      setStoredValue(event.detail.value ?? initialValue);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage-change", handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage-change", handleCustomEvent as EventListener);
    };
  }, [key, deserializer, initialValue, syncTabs]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for sessionStorage (similar to useLocalStorage but for session)
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: Omit<UseLocalStorageOptions<T>, "syncTabs"> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = serialize,
    deserializer = (v: string) => deserialize(v, initialValue),
    onError,
  } = options;

  const isFirstRender = useRef(true);

  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = sessionStorage.getItem(key);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      console.warn(`[useSessionStorage] Error reading key "${key}":`, error);
      onError?.(error as Error);
      return initialValue;
    }
  }, [key, initialValue, deserializer, onError]);

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setStoredValue(readValue());
    }
  }, [readValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        sessionStorage.setItem(key, serializer(valueToStore));
      } catch (error) {
        console.warn(`[useSessionStorage] Error setting key "${key}":`, error);
        onError?.(error as Error);
      }
    },
    [key, serializer, storedValue, onError]
  );

  const removeValue = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      sessionStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`[useSessionStorage] Error removing key "${key}":`, error);
      onError?.(error as Error);
    }
  }, [key, initialValue, onError]);

  return [storedValue, setValue, removeValue];
}

/**
 * Storage keys used throughout the app
 */
export const STORAGE_KEYS = {
  THEME: "washwise-theme",
  SIDEBAR_COLLAPSED: "washwise-sidebar-collapsed",
  TABLE_PAGE_SIZE: "washwise-table-page-size",
  RECENT_SEARCHES: "washwise-recent-searches",
  DASHBOARD_LAYOUT: "washwise-dashboard-layout",
  NOTIFICATION_PREFERENCES: "washwise-notification-preferences",
} as const;

/**
 * Typed storage hooks for common use cases
 */
export function useThemeStorage() {
  return useLocalStorage<"light" | "dark" | "system">(STORAGE_KEYS.THEME, "system");
}

export function useSidebarCollapsed() {
  return useLocalStorage<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
}

export function useTablePageSize() {
  return useLocalStorage<number>(STORAGE_KEYS.TABLE_PAGE_SIZE, 20);
}

export function useRecentSearches() {
  return useLocalStorage<string[]>(STORAGE_KEYS.RECENT_SEARCHES, []);
}
