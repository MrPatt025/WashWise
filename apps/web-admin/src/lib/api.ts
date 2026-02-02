import { getAuthState, setAuthState } from "@/stores/auth.store";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Axios instance with interceptors for authentication
 * Implements "Silent Refresh" pattern
 */
export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// ===========================================
// API Contract Validation
// ===========================================

/**
 * Validate API response data against Zod schema
 * Throws detailed error if validation fails
 */
export function validateResponse<T>(schema: z.ZodType<T>, data: unknown, endpoint: string): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(
      `[API Contract Violation] Endpoint: ${endpoint}`,
      `\nExpected schema: ${schema.description || "unknown"}`,
      `\nReceived data:`,
      data,
      `\nValidation errors:`,
      result.error.format()
    );

    // In development, throw to catch issues early
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        `API contract violation at ${endpoint}: ${result.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }

    // In production, log and return partial data (graceful degradation)
    console.warn(`[API] Returning unvalidated data for ${endpoint}`);
    return data as T;
  }

  return result.data;
}

/**
 * Create a validated API request wrapper
 */
export function createValidatedRequest<TRequest, TResponse>(
  requestSchema: z.ZodType<TRequest>,
  responseSchema: z.ZodType<TResponse>
) {
  return async (
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    data?: TRequest
  ): Promise<TResponse> => {
    // Validate request data
    if (data && requestSchema) {
      const requestResult = requestSchema.safeParse(data);
      if (!requestResult.success) {
        throw new Error(
          `Invalid request data: ${requestResult.error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", ")}`
        );
      }
    }

    const response = await api.request({
      method,
      url,
      data,
    });

    // Validate response data
    return validateResponse(responseSchema, response.data, url);
  };
}

/**
 * Paginated response schema factory
 */
export function createPaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
}

// Type helper for paginated responses
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add access token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 and silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const requestUrl = originalRequest?.url || "";
    const isRefreshRequest = requestUrl.includes("/auth/refresh");

    // CRITICAL: If refresh endpoint itself returns 401, do NOT retry
    // This prevents infinite loops
    if (error.response?.status === 401 && isRefreshRequest) {
      // Clear auth state and redirect to login
      setAuthState({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Only redirect if not already on login page
      if (
        globalThis.window !== undefined &&
        !globalThis.window.location.pathname.includes("/login")
      ) {
        globalThis.window.location.href = "/login";
      }

      throw error;
    }

    // If not 401 or already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      throw error;
    }

    // Skip refresh for auth endpoints (login, register)
    if (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register")) {
      throw error;
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject: (err: Error) => reject(err),
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Attempt to refresh the token
      const response = await axios.post(
        `${API_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { accessToken } = response.data;
      setAuthState({ accessToken });

      // Process queued requests
      processQueue(null, accessToken);

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed - clear auth and redirect to login
      processQueue(refreshError as Error, null);
      setAuthState({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Redirect to login page (client-side only)
      if (globalThis.window !== undefined) {
        globalThis.window.location.href = "/login";
      }

      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
