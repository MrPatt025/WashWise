import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { parseError, showErrorToast } from "./errors";

/**
 * Query keys factory for type-safe and consistent query keys
 * Following TanStack Query best practices
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    check: () => [...queryKeys.auth.all, "check"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },

  // Machines
  machines: {
    all: ["machines"] as const,
    lists: () => [...queryKeys.machines.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.machines.lists(), filters] as const,
    details: () => [...queryKeys.machines.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.machines.details(), id] as const,
    stats: () => [...queryKeys.machines.all, "stats"] as const,
  },

  // Tenants
  tenants: {
    all: ["tenants"] as const,
    current: () => [...queryKeys.tenants.all, "current"] as const,
    settings: () => [...queryKeys.tenants.all, "settings"] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.users.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
  },

  // Transactions
  transactions: {
    all: ["transactions"] as const,
    lists: () => [...queryKeys.transactions.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.transactions.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.transactions.all, "detail", id] as const,
    stats: () => [...queryKeys.transactions.all, "stats"] as const,
  },
} as const;

/**
 * Default stale times for different data types
 */
export const staleTimes = {
  /** Static data that rarely changes (e.g., machine types) */
  static: 1000 * 60 * 60, // 1 hour

  /** User data, settings */
  user: 1000 * 60 * 5, // 5 minutes

  /** Dashboard stats, summaries */
  stats: 1000 * 60 * 1, // 1 minute

  /** List data that may change frequently */
  list: 1000 * 30, // 30 seconds

  /** Real-time data (machines status) */
  realtime: 1000 * 10, // 10 seconds

  /** Never stale (auth check) */
  never: Infinity,
} as const;

/**
 * Create a production-ready QueryClient with optimal settings
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only show toast for user-initiated queries (not background refetches)
        if (query.state.data !== undefined) {
          const parsed = parseError(error);
          // Don't show toast for auth errors (handled by interceptor)
          if (!parsed.isAuthError) {
            showErrorToast(error);
          }
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        const parsed = parseError(error);
        // Don't show toast for auth errors (handled by interceptor)
        if (!parsed.isAuthError) {
          showErrorToast(error);
        }
      },
    }),
    defaultOptions: {
      queries: {
        // Don't refetch on window focus by default
        refetchOnWindowFocus: false,
        // Retry failed requests once
        retry: 1,
        // Consider data stale after 1 minute by default
        staleTime: staleTimes.list,
        // Keep unused data in cache for 5 minutes
        gcTime: 1000 * 60 * 5,
        // Don't refetch on mount if data exists
        refetchOnMount: false,
        // Use error boundary for render errors
        throwOnError: false,
      },
      mutations: {
        // Don't retry mutations by default
        retry: false,
        // Use error boundary for render errors
        throwOnError: false,
      },
    },
  });
}

/**
 * Prefetch helpers for route transitions
 */
export const prefetch = {
  machines: async (queryClient: QueryClient) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.machines.lists(),
      staleTime: staleTimes.list,
    });
  },

  machineStats: async (queryClient: QueryClient) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.machines.stats(),
      staleTime: staleTimes.stats,
    });
  },

  dashboard: async (queryClient: QueryClient) => {
    await Promise.all([prefetch.machines(queryClient), prefetch.machineStats(queryClient)]);
  },
};

/**
 * Invalidation helpers for cache management
 */
export const invalidate = {
  machines: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.machines.all });
  },

  machineStats: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.machines.stats() });
  },

  auth: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
  },

  all: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries();
  },
};
