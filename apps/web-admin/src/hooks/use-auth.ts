import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "@washwise/types";
import { disconnectSocket } from "@/lib/socket";

/**
 * Hook for login mutation
 */
export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<AuthResponse>("/auth/login", data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data);
      router.push("/dashboard");
    },
  });
}

/**
 * Hook for registration mutation
 */
export function useRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.post<AuthResponse>("/auth/register", data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data);
      router.push("/dashboard");
    },
  });
}

/**
 * Hook for logout mutation
 */
export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      // Always clear auth on logout attempt
      clearAuth();
      disconnectSocket();
      queryClient.clear();
      router.push("/login");
    },
  });
}

/**
 * Hook to check auth status on app load
 * Attempts to refresh token from httpOnly cookie
 * Uses a ref-based check to avoid stale closure issues
 */
export function useCheckAuth() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["auth", "check"],
    queryFn: async () => {
      // Use direct store access to get current state (not stale closure)
      const currentState = useAuthStore.getState();

      // CRITICAL: If already authenticated with a valid token, skip refresh
      if (currentState.isAuthenticated && currentState.accessToken) {
        setLoading(false);
        return { authenticated: true, skipped: true };
      }

      try {
        // Try to refresh token (cookie is sent automatically)
        const refreshResponse = await api.post<{ accessToken: string }>(
          "/auth/refresh",
        );
        const newAccessToken = refreshResponse.data.accessToken;

        // Get user info with new token
        const meResponse = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${newAccessToken}` },
        });

        const user = meResponse.data.user ?? meResponse.data;
        setAuth({ accessToken: newAccessToken, user });

        return { authenticated: true, skipped: false };
      } catch {
        clearAuth();
        return { authenticated: false, skipped: false };
      } finally {
        setLoading(false);
      }
    },
    retry: false,
    staleTime: Infinity,
    gcTime: 0, // Don't cache - always fresh check
    // Don't run if already authenticated
    enabled: !isAuthenticated,
  });
}
