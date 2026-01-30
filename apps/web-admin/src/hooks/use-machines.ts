import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type {
  Machine,
  CreateMachine,
  UpdateMachine,
  MachineQuery,
  PaginatedResponse,
  MachineUpdateEvent,
} from "@washwise/types";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Hook for fetching machines with real-time updates
 */
export function useMachines(query?: MachineQuery) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Main query for machines
  const machinesQuery = useQuery({
    queryKey: ["machines", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.page) params.set("page", query.page.toString());
      if (query?.limit) params.set("limit", query.limit.toString());
      if (query?.type) params.set("type", query.type);
      if (query?.status) params.set("status", query.status);
      if (query?.search) params.set("search", query.search);

      const response = await api.get<PaginatedResponse<Machine>>(
        `/machines?${params.toString()}`,
      );
      return response.data;
    },
    enabled: isAuthenticated,
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
                    updatedAt: new Date(event.updatedAt),
                  }
                : machine,
            ),
          };
        },
      );

      // Also update single machine query if it exists
      queryClient.setQueryData<Machine>(
        ["machines", event.machineId],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            status: event.status as Machine["status"],
            updatedAt: new Date(event.updatedAt),
          };
        },
      );
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
    queryKey: ["machines", id],
    queryFn: async () => {
      const response = await api.get<Machine>(`/machines/${id}`);
      return response.data;
    },
    enabled: isAuthenticated && !!id,
  });
}

/**
 * Hook for machine statistics
 */
export function useMachineStats() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["machines", "stats"],
    queryFn: async () => {
      const response = await api.get<{
        total: number;
        available: number;
        busy: number;
        offline: number;
        maintenance: number;
      }>("/machines/stats");
      return response.data;
    },
    enabled: isAuthenticated,
  });
}

/**
 * Hook for creating a machine
 */
export function useCreateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMachine) => {
      const response = await api.post<Machine>("/machines", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });
}

/**
 * Hook for updating a machine
 */
export function useUpdateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMachine }) => {
      const response = await api.patch<Machine>(`/machines/${id}`, data);
      return response.data;
    },
    onSuccess: (machine) => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      queryClient.setQueryData(["machines", machine.id], machine);
    },
  });
}

/**
 * Hook for deleting a machine
 */
export function useDeleteMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/machines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });
}

/**
 * Hook for simulating machine status change
 */
export function useSimulateStatus() {
  return useMutation({
    mutationFn: async ({
      machineId,
      status,
    }: {
      machineId: string;
      status: string;
    }) => {
      const response = await api.post("/simulation/event", {
        machineId,
        status,
      });
      return response.data;
    },
  });
}
