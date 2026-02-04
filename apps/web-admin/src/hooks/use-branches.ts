import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import api, { validateResponse } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

// Branch response schema
const BranchSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

const BranchListSchema = z.array(BranchSchema);

export type Branch = z.infer<typeof BranchSchema>;

/**
 * Hook for fetching branches for the current tenant
 * Used in machine creation to select which branch the machine belongs to
 */
export function useBranches() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const url = "/branches";
      const response = await api.get<Branch[]>(url);
      return validateResponse(BranchListSchema, response.data, url);
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes - branches don't change often
  });
}
