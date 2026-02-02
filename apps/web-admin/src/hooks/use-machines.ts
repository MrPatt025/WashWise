import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { validateResponse, createPaginatedSchema } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { queryKeys, staleTimes } from "@/lib/query";
import { showSuccessToast, showErrorToast } from "@/lib/errors";
import {
  MachineSchema,
  MachineStatsSchema,
  type Machine,
  type CreateMachine,
  type UpdateMachine,
  type MachineQuery,
  type PaginatedResponse,
  type MachineUpdateEvent,
  type MachineStats,
} from "@washwise/types";
import { useAuthStore } from "@/stores/auth.store";

// Create paginated machine schema for validation
const PaginatedMachineSchema = createPaginatedSchema(MachineSchema);

/**
 * Hook for fetching machines with real-time updates
 * Features: Pagination, filtering, Socket.io real-time updates, API contract validation
 */
export function useMachines(query?: MachineQuery) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Main query for machines
  const machinesQuery = useQuery({
    queryKey: queryKeys.machines.list(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.page) params.set("page", query.page.toString());
      if (query?.limit) params.set("limit", query.limit.toString());
      if (query?.type) params.set("type", query.type);
      if (query?.status) params.set("status", query.status);
      if (query?.search) params.set("search", query.search);

      const url = `/machines?${params.toString()}`;
      const response = await api.get<PaginatedResponse<Machine>>(url);

      // Validate response against contract
      return validateResponse(PaginatedMachineSchema, response.data, url);
    },
    enabled: isAuthenticated,
    staleTime: staleTimes.realtime,
  });

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    const handleMachineUpdate = (event: MachineUpdateEvent) => {
      // Optimistic update - directly patch the cache
      queryClient.setQueriesData<PaginatedResponse<Machine>>(
        { queryKey: ["machines"] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            items: oldData.items.map((machine) =>
              machine.id === event.machineId
                ? {
                    ...machine,
                    status: event.status as Machine["status"],
                    updatedAt: event.updatedAt,
                  }
                : machine
            ),
          };
        }
      );

      // Also update single machine query if it exists
      queryClient.setQueryData<Machine>(["machines", event.machineId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          status: event.status as Machine["status"],
          updatedAt: event.updatedAt,
        };
      });
    };

    socket.on("machine:update", handleMachineUpdate);

    return () => {
      socket.off("machine:update", handleMachineUpdate);
    };
  }, [isAuthenticated, queryClient]);

  return machinesQuery;
}

/**
 * Hook for fetching a single machine
 */
export function useMachine(id: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.machines.detail(id),
    queryFn: async () => {
      const url = `/machines/${id}`;
      const response = await api.get<Machine>(url);
      return validateResponse(MachineSchema, response.data, url);
    },
    enabled: isAuthenticated && !!id,
    staleTime: staleTimes.realtime,
  });
}

/**
 * Hook for machine statistics
 * Backend returns: { total, idle, inUse, error, maintenance }
 */
export function useMachineStats() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.machines.stats(),
    queryFn: async () => {
      const url = "/machines/stats";
      const response = await api.get<MachineStats>(url);
      return validateResponse(MachineStatsSchema, response.data, url);
    },
    enabled: isAuthenticated,
    staleTime: staleTimes.stats,
    // Refetch stats every 30 seconds for dashboard freshness
    refetchInterval: 30000,
  });
}

/**
 * Hook for creating a machine with optimistic updates
 */
export function useCreateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMachine) => {
      const url = "/machines";
      const response = await api.post<Machine>(url, data);
      return validateResponse(MachineSchema, response.data, url);
    },
    onSuccess: (newMachine) => {
      // Invalidate and refetch machines list
      queryClient.invalidateQueries({ queryKey: queryKeys.machines.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.machines.stats() });
      // Show success toast
      showSuccessToast("Machine created", `${newMachine.name} has been added successfully.`);
    },
    onError: (error) => {
      showErrorToast(error, "Failed to create machine");
    },
  });
}

/**
 * Hook for updating a machine with optimistic updates
 */
export function useUpdateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMachine }) => {
      const url = `/machines/${id}`;
      const response = await api.patch<Machine>(url, data);
      return validateResponse(MachineSchema, response.data, url);
    },
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.machines.detail(id) });

      // Snapshot previous value
      const previousMachine = queryClient.getQueryData<Machine>(queryKeys.machines.detail(id));

      // Optimistically update
      if (previousMachine) {
        queryClient.setQueryData(queryKeys.machines.detail(id), {
          ...previousMachine,
          ...data,
        });
      }

      return { previousMachine };
    },
    onSuccess: (machine) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.machines.lists() });
      queryClient.setQueryData(queryKeys.machines.detail(machine.id), machine);
      showSuccessToast("Machine updated", `${machine.name} has been updated.`);
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousMachine) {
        queryClient.setQueryData(queryKeys.machines.detail(id), context.previousMachine);
      }
      showErrorToast(error, "Failed to update machine");
    },
  });
}

/**
 * Hook for deleting a machine with optimistic updates
 */
export function useDeleteMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/machines/${id}`);
      return id;
    },
    // Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.machines.lists() });

      // Snapshot all list queries
      const previousLists = queryClient.getQueriesData<PaginatedResponse<Machine>>({
        queryKey: queryKeys.machines.lists(),
      });

      // Optimistically remove from all lists
      queryClient.setQueriesData<PaginatedResponse<Machine>>(
        { queryKey: queryKeys.machines.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((m) => m.id !== id),
            total: old.total - 1,
          };
        }
      );

      return { previousLists };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.machines.stats() });
      showSuccessToast("Machine deleted", "The machine has been removed.");
    },
    onError: (error, _id, context) => {
      // Rollback on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      showErrorToast(error, "Failed to delete machine");
    },
  });
}

/**
 * Hook for simulating machine status change
 * Used for testing real-time updates
 */
export function useSimulateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ machineId, status }: { machineId: string; status: string }) => {
      const response = await api.post("/simulation/event", {
        machineId,
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate to pick up the status change
      queryClient.invalidateQueries({ queryKey: queryKeys.machines.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.machines.stats() });
    },
  });
}
