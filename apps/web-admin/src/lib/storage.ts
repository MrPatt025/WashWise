/**
 * Comprehensive storage utilities for WashWise
 * Provides type-safe localStorage/sessionStorage access with serialization
 */

/**
 * Storage types
 */
export type StorageType = "local" | "session";

/**
 * Storage options
 */
interface StorageOptions<T> {
  /** Storage type (localStorage or sessionStorage) */
  storage?: StorageType;
  /** Serializer function */
  serializer?: (value: T) => string;
  /** Deserializer function */
  deserializer?: (value: string) => T;
  /** Time-to-live in milliseconds */
  ttl?: number;
}

/**
 * Storage item with metadata
 */
interface StorageItem<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Get the storage object
 */
function getStorage(type: StorageType): Storage | null {
  if (!isBrowser()) return null;
  return type === "local" ? localStorage : sessionStorage;
}

/**
 * Default JSON deserializer
 */
const defaultDeserializer = <T>(value: string): T => JSON.parse(value);

/**
 * Get an item from storage
 */
export function getItem<T>(key: string, options: StorageOptions<T> = {}): T | null {
  const { storage = "local", deserializer = defaultDeserializer } = options;

  const storageObj = getStorage(storage);
  if (!storageObj) return null;

  try {
    const raw = storageObj.getItem(key);
    if (!raw) return null;

    const item: StorageItem<T> = JSON.parse(raw);

    // Check TTL
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      storageObj.removeItem(key);
      return null;
    }

    return item.value;
  } catch {
    // If parsing fails, try to return raw value
    try {
      const raw = storageObj.getItem(key);
      return raw ? deserializer(raw) : null;
    } catch {
      return null;
    }
  }
}

/**
 * Set an item in storage
 */
export function setItem<T>(key: string, value: T, options: StorageOptions<T> = {}): boolean {
  const { storage = "local", ttl } = options;

  const storageObj = getStorage(storage);
  if (!storageObj) return false;

  try {
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    storageObj.setItem(key, JSON.stringify(item));
    return true;
  } catch (error) {
    console.error(`Failed to set storage item "${key}":`, error);
    return false;
  }
}

/**
 * Remove an item from storage
 */
export function removeItem(key: string, storage: StorageType = "local"): boolean {
  const storageObj = getStorage(storage);
  if (!storageObj) return false;

  try {
    storageObj.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all items from storage
 */
export function clearStorage(storage: StorageType = "local"): boolean {
  const storageObj = getStorage(storage);
  if (!storageObj) return false;

  try {
    storageObj.clear();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a key exists in storage
 */
export function hasItem(key: string, storage: StorageType = "local"): boolean {
  const storageObj = getStorage(storage);
  if (!storageObj) return false;

  return storageObj.getItem(key) !== null;
}

/**
 * Get all keys from storage
 */
export function getKeys(storage: StorageType = "local"): string[] {
  const storageObj = getStorage(storage);
  if (!storageObj) return [];

  const keys: string[] = [];
  for (let i = 0; i < storageObj.length; i++) {
    const key = storageObj.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

/**
 * Get all items matching a prefix
 */
export function getItemsByPrefix<T>(
  prefix: string,
  options: StorageOptions<T> = {}
): Record<string, T | null> {
  const { storage = "local" } = options;
  const keys = getKeys(storage).filter((key) => key.startsWith(prefix));

  const items: Record<string, T | null> = {};
  for (const key of keys) {
    items[key] = getItem<T>(key, options);
  }
  return items;
}

/**
 * Remove all items matching a prefix
 */
export function removeItemsByPrefix(prefix: string, storage: StorageType = "local"): number {
  const keys = getKeys(storage).filter((key) => key.startsWith(prefix));
  let removed = 0;

  for (const key of keys) {
    if (removeItem(key, storage)) {
      removed++;
    }
  }
  return removed;
}

/**
 * Get storage size info
 */
export function getStorageInfo(storage: StorageType = "local"): {
  used: number;
  total: number;
  available: number;
  itemCount: number;
} {
  const storageObj = getStorage(storage);
  if (!storageObj) {
    return { used: 0, total: 0, available: 0, itemCount: 0 };
  }

  // Estimate total storage (usually 5MB for localStorage)
  const total = 5 * 1024 * 1024;

  // Calculate used space
  let used = 0;
  for (let i = 0; i < storageObj.length; i++) {
    const key = storageObj.key(i);
    if (key) {
      const value = storageObj.getItem(key);
      if (value) {
        // Each character is 2 bytes in UTF-16
        used += (key.length + value.length) * 2;
      }
    }
  }

  return {
    used,
    total,
    available: total - used,
    itemCount: storageObj.length,
  };
}

/**
 * Storage keys for WashWise app
 */
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: "washwise:auth:token",
  AUTH_REFRESH_TOKEN: "washwise:auth:refresh_token",
  AUTH_USER: "washwise:auth:user",

  // Preferences
  THEME: "washwise:theme",
  LANGUAGE: "washwise:language",
  SIDEBAR_COLLAPSED: "washwise:sidebar:collapsed",

  // Dashboard
  DASHBOARD_FILTERS: "washwise:dashboard:filters",
  DASHBOARD_VIEW: "washwise:dashboard:view",

  // Machines
  MACHINES_FILTERS: "washwise:machines:filters",
  MACHINES_SORT: "washwise:machines:sort",
  MACHINES_VIEW: "washwise:machines:view",

  // Recent
  RECENT_SEARCHES: "washwise:recent:searches",
  RECENT_MACHINES: "washwise:recent:machines",

  // Feature flags
  FEATURE_FLAGS: "washwise:features",
} as const;

/**
 * Type-safe storage helpers for specific use cases
 */
export const storage = {
  // Generic
  get: getItem,
  set: setItem,
  remove: removeItem,
  clear: clearStorage,
  has: hasItem,
  keys: getKeys,
  info: getStorageInfo,

  // Auth-specific
  auth: {
    getToken: () => getItem<string>(STORAGE_KEYS.AUTH_TOKEN),
    setToken: (token: string) => setItem(STORAGE_KEYS.AUTH_TOKEN, token),
    getRefreshToken: () => getItem<string>(STORAGE_KEYS.AUTH_REFRESH_TOKEN),
    setRefreshToken: (token: string) => setItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN, token),
    clearTokens: () => {
      removeItem(STORAGE_KEYS.AUTH_TOKEN);
      removeItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
      removeItem(STORAGE_KEYS.AUTH_USER);
    },
  },

  // Preferences
  preferences: {
    getTheme: () => getItem<"light" | "dark" | "system">(STORAGE_KEYS.THEME),
    setTheme: (theme: "light" | "dark" | "system") => setItem(STORAGE_KEYS.THEME, theme),
    getLanguage: () => getItem<string>(STORAGE_KEYS.LANGUAGE),
    setLanguage: (lang: string) => setItem(STORAGE_KEYS.LANGUAGE, lang),
    getSidebarCollapsed: () => getItem<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED),
    setSidebarCollapsed: (collapsed: boolean) => setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed),
  },

  // Recent items
  recent: {
    getSearches: () => getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES) || [],
    addSearch: (search: string, maxItems = 10) => {
      const searches = storage.recent.getSearches();
      const filtered = searches.filter((s) => s !== search);
      const updated = [search, ...filtered].slice(0, maxItems);
      setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
    },
    clearSearches: () => removeItem(STORAGE_KEYS.RECENT_SEARCHES),

    getMachines: () => getItem<string[]>(STORAGE_KEYS.RECENT_MACHINES) || [],
    addMachine: (machineId: string, maxItems = 5) => {
      const machines = storage.recent.getMachines();
      const filtered = machines.filter((m) => m !== machineId);
      const updated = [machineId, ...filtered].slice(0, maxItems);
      setItem(STORAGE_KEYS.RECENT_MACHINES, updated);
    },
    clearMachines: () => removeItem(STORAGE_KEYS.RECENT_MACHINES),
  },
};

export default storage;
