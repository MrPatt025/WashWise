import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api, { validateResponse } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { queryKeys, staleTimes } from "@/lib/query";
import { showSuccessToast, showErrorToast } from "@/lib/errors";
import {
  AuthResponseSchema,
  RefreshResponseSchema,
  type LoginRequest,
  type RegisterRequest,
  type AuthResponse,
} from "@washwise/types";
import { disconnectSocket, reconnectSocket } from "@/lib/socket";

/**
 * Hook for login mutation
 * Handles authentication and redirects to dashboard on success
 */
export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const url = "/auth/login";
      const response = await api.post<AuthResponse>(url, data);
      return validateResponse(AuthResponseSchema, response.data, url);
    },
    onSuccess: (data) => {
      setAuth(data);
      // Clear any stale queries from previous sessions
      queryClient.clear();
      // Establish socket connection with new token
      reconnectSocket();
      showSuccessToast("Welcome back!", `Signed in as ${data.user.email}`);
      router.push("/dashboard");
    },
    onError: (error) => {
      showErrorToast(error, "Login failed");
    },
  });
}

/**
 * Hook for registration mutation
 * Creates new tenant and owner account
 */
export function useRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const url = "/auth/register";
      const response = await api.post<AuthResponse>(url, data);
      return validateResponse(AuthResponseSchema, response.data, url);
    },
    onSuccess: (data) => {
      setAuth(data);
      queryClient.clear();
      reconnectSocket();
      showSuccessToast("Account created!", `Welcome to WashWise, ${data.user.firstName}!`);
      router.push("/dashboard");
    },
    onError: (error) => {
      showErrorToast(error, "Registration failed");
    },
  });
}

/**
 * Hook for logout mutation
 * Cleans up session and redirects to login
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
      // Always clear auth on logout attempt (even if request fails)
      clearAuth();
      disconnectSocket();
      queryClient.clear();
      showSuccessToast("Signed out", "You have been logged out successfully.");
      router.push("/login");
    },
  });
}

/**
 * Hook to check auth status on app load
 * Attempts to refresh token from httpOnly cookie
 * Uses direct store access to avoid stale closure issues
 */
export function useCheckAuth() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.check(),
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
        const refreshResponse = await api.post<{ accessToken: string }>("/auth/refresh");
        const refreshData = validateResponse(
          RefreshResponseSchema,
          refreshResponse.data,
          "/auth/refresh"
        );
        const newAccessToken = refreshData.accessToken;

        // Get user info with new token
        const meResponse = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${newAccessToken}` },
        });

        const user = meResponse.data.user ?? meResponse.data;
        setAuth({ accessToken: newAccessToken, user });

        // Establish socket connection
        reconnectSocket();

        return { authenticated: true, skipped: false };
      } catch {
        clearAuth();
        return { authenticated: false, skipped: false };
      } finally {
        setLoading(false);
      }
    },
    retry: false,
    staleTime: staleTimes.never,
    gcTime: 0, // Don't cache - always fresh check
    // Don't run if already authenticated
    enabled: !isAuthenticated,
  });
}

/**
 * Hook to get current user profile
 */
export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const response = await api.get("/auth/me");
      return response.data.user ?? response.data;
    },
    enabled: isAuthenticated,
    staleTime: staleTimes.user,
    // Use cached user data as initial data
    initialData: user ?? undefined,
  });
}
