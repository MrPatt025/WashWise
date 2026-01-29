import { create } from "zustand";
import type { AuthResponse } from "@washwise/types";

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    tenantName: string;
}

interface AuthState {
    // Access token stored in memory only (security)
    accessToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setAuth: (data: AuthResponse) => void;
    setAccessToken: (token: string) => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
}

/**
 * Auth store using Zustand
 * SECURITY: Access token is stored ONLY in memory (not localStorage)
 * This protects against XSS attacks
 */
export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start loading until we check refresh token

    setAuth: (data: AuthResponse) =>
        set({
            accessToken: data.accessToken,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
        }),

    setAccessToken: (token: string) =>
        set((state) => ({
            ...state,
            accessToken: token,
        })),

    clearAuth: () =>
        set({
            accessToken: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
        }),

    setLoading: (loading: boolean) =>
        set((state) => ({
            ...state,
            isLoading: loading,
        })),
}));
