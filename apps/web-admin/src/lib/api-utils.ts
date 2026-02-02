/**
 * Advanced API utilities for WashWise
 * Provides fetch wrappers, retry logic, caching, and error handling
 */

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T> {
    data: T;
    status: number;
    headers: Headers;
}

export interface ApiError extends Error {
    status: number;
    statusText: string;
    data?: unknown;
    isApiError: true;
}

export interface RequestConfig {
    method?: string;
    headers?: Record<string, string>;
    body?: BodyInit | null;
    params?: Record<string, string | number | boolean | undefined>;
    timeout?: number;
    retry?: RetryConfig;
    cacheConfig?: CacheConfig;
    onProgress?: (progress: ProgressEvent) => void;
    signal?: AbortSignal;
}

export interface RetryConfig {
    maxRetries?: number;
    retryDelay?: number;
    retryOn?: number[] | ((status: number, attempt: number) => boolean);
    exponentialBackoff?: boolean;
}

export interface CacheConfig {
    key?: string;
    ttl?: number;
    staleWhileRevalidate?: boolean;
}

export interface ProgressEvent {
    loaded: number;
    total: number;
    percent: number;
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private requestInterceptors: RequestInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];
    private pendingRequests: Map<string, Promise<unknown>> = new Map();

    constructor(config: ApiClientConfig = {}) {
        this.baseUrl = config.baseUrl || "";
        this.defaultHeaders = config.headers || {};
    }

    // ---------------------------------------------------------------------------
    // Interceptors
    // ---------------------------------------------------------------------------

    addRequestInterceptor(interceptor: RequestInterceptor): () => void {
        this.requestInterceptors.push(interceptor);
        return () => {
            const index = this.requestInterceptors.indexOf(interceptor);
            if (index !== -1) {
                this.requestInterceptors.splice(index, 1);
            }
        };
    }

    addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
        this.responseInterceptors.push(interceptor);
        return () => {
            const index = this.responseInterceptors.indexOf(interceptor);
            if (index !== -1) {
                this.responseInterceptors.splice(index, 1);
            }
        };
    }

    // ---------------------------------------------------------------------------
    // HTTP Methods
    // ---------------------------------------------------------------------------

    async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...config, method: "GET" });
    }

    async post<T>(
        url: string,
        data?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            ...config,
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(
        url: string,
        data?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            ...config,
            method: "PUT",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(
        url: string,
        data?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            ...config,
            method: "PATCH",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...config, method: "DELETE" });
    }

    // ---------------------------------------------------------------------------
    // Core Request Method
    // ---------------------------------------------------------------------------

    async request<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
        const fullUrl = this.buildUrl(url, config.params);
        const cacheKey = config.cacheConfig?.key || `${config.method || "GET"}:${fullUrl}`;

        // Check cache first (only for GET requests)
        if (config.method === "GET" || !config.method) {
            const cached = this.getFromCache<T>(cacheKey, config.cacheConfig);
            if (cached) {
                // Stale-while-revalidate
                if (config.cacheConfig?.staleWhileRevalidate && this.isCacheStale(cacheKey)) {
                    this.revalidateCache(cacheKey, url, config);
                }
                return cached;
            }
        }

        // Deduplicate concurrent identical requests
        const pendingKey = cacheKey;
        const pending = this.pendingRequests.get(pendingKey);
        if (pending && (config.method === "GET" || !config.method)) {
            return pending as Promise<ApiResponse<T>>;
        }

        // Build request
        const requestInit: RequestInit = {
            method: config.method || "GET",
            headers: {
                "Content-Type": "application/json",
                ...this.defaultHeaders,
                ...config.headers,
            },
            body: config.body,
            signal: config.signal,
        };

        // Apply request interceptors
        let requestConfig = requestInit;
        for (const interceptor of this.requestInterceptors) {
            requestConfig = await interceptor(requestConfig);
        }

        // Execute with retry
        const requestPromise = this.executeWithRetry<T>(
            fullUrl,
            requestConfig,
            config.retry,
            config.timeout
        );

        // Track pending request
        if (config.method === "GET" || !config.method) {
            this.pendingRequests.set(pendingKey, requestPromise);
        }

        try {
            let response = await requestPromise;

            // Apply response interceptors
            for (const interceptor of this.responseInterceptors) {
                response = await interceptor(response);
            }

            // Cache response (only for GET requests)
            if ((config.method === "GET" || !config.method) && config.cacheConfig?.ttl) {
                this.setCache(cacheKey, response, config.cacheConfig.ttl);
            }

            return response;
        } finally {
            this.pendingRequests.delete(pendingKey);
        }
    }

    // ---------------------------------------------------------------------------
    // Retry Logic
    // ---------------------------------------------------------------------------

    private async executeWithRetry<T>(
        url: string,
        config: RequestInit,
        retryConfig?: RetryConfig,
        timeout?: number
    ): Promise<ApiResponse<T>> {
        const maxRetries = retryConfig?.maxRetries ?? 0;
        const baseDelay = retryConfig?.retryDelay ?? 1000;
        const exponentialBackoff = retryConfig?.exponentialBackoff ?? true;
        const retryOn = retryConfig?.retryOn ?? [408, 429, 500, 502, 503, 504];

        let lastError: ApiError | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.fetchWithTimeout(url, config, timeout);

                if (!response.ok) {
                    const shouldRetry =
                        typeof retryOn === "function"
                            ? retryOn(response.status, attempt)
                            : retryOn.includes(response.status);

                    if (shouldRetry && attempt < maxRetries) {
                        const delay = exponentialBackoff
                            ? baseDelay * Math.pow(2, attempt)
                            : baseDelay;
                        await this.sleep(delay);
                        continue;
                    }

                    throw await this.createApiError(response);
                }

                const data = await this.parseResponse<T>(response);
                return {
                    data,
                    status: response.status,
                    headers: response.headers,
                };
            } catch (error) {
                lastError = error as ApiError;

                if (
                    attempt < maxRetries &&
                    error instanceof Error &&
                    error.name === "AbortError"
                ) {
                    const delay = exponentialBackoff
                        ? baseDelay * Math.pow(2, attempt)
                        : baseDelay;
                    await this.sleep(delay);
                    continue;
                }

                throw error;
            }
        }

        throw lastError;
    }

    private async fetchWithTimeout(
        url: string,
        config: RequestInit,
        timeout?: number
    ): Promise<Response> {
        if (!timeout) {
            return fetch(url, config);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    // ---------------------------------------------------------------------------
    // Cache Management
    // ---------------------------------------------------------------------------

    private getFromCache<T>(key: string, config?: CacheConfig): ApiResponse<T> | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now > entry.expiresAt) {
            if (!config?.staleWhileRevalidate) {
                this.cache.delete(key);
                return null;
            }
        }

        return entry.data as ApiResponse<T>;
    }

    private setCache<T>(key: string, data: ApiResponse<T>, ttl: number): void {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttl,
            createdAt: Date.now(),
        });
    }

    private isCacheStale(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return true;
        return Date.now() > entry.expiresAt;
    }

    private async revalidateCache(
        key: string,
        url: string,
        config: RequestConfig
    ): Promise<void> {
        try {
            const newConfig = { ...config, cacheConfig: undefined };
            const response = await this.request(url, newConfig);
            this.setCache(key, response, config.cacheConfig?.ttl || 60000);
        } catch {
            // Silently fail, keep stale data
        }
    }

    clearCache(pattern?: string | RegExp): void {
        if (!pattern) {
            this.cache.clear();
            return;
        }

        for (const key of this.cache.keys()) {
            if (typeof pattern === "string" ? key.includes(pattern) : pattern.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private buildUrl(url: string, params?: Record<string, string | number | boolean | undefined>): string {
        const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`;

        if (!params) return fullUrl;

        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        }

        const queryString = searchParams.toString();
        return queryString ? `${fullUrl}?${queryString}` : fullUrl;
    }

    private async parseResponse<T>(response: Response): Promise<T> {
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
            return response.json();
        }

        if (contentType?.includes("text/")) {
            return response.text() as Promise<T>;
        }

        return response.blob() as Promise<T>;
    }

    private async createApiError(response: Response): Promise<ApiError> {
        let data: unknown;
        try {
            data = await response.json();
        } catch {
            data = await response.text();
        }

        const error = new Error(
            (data as { message?: string })?.message || response.statusText
        ) as ApiError;
        error.status = response.status;
        error.statusText = response.statusText;
        error.data = data;
        error.isApiError = true;

        return error;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // ---------------------------------------------------------------------------
    // Token Management
    // ---------------------------------------------------------------------------

    setAuthToken(token: string): void {
        this.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    clearAuthToken(): void {
        delete this.defaultHeaders["Authorization"];
    }
}

// ============================================================================
// Types for Client
// ============================================================================

interface ApiClientConfig {
    baseUrl?: string;
    headers?: Record<string, string>;
}

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
    createdAt: number;
}

type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
    return (
        error !== null &&
        typeof error === "object" &&
        "isApiError" in error &&
        (error as ApiError).isApiError === true
    );
}

/**
 * Get error message from API error
 */
export function getApiErrorMessage(error: unknown): string {
    if (isApiError(error)) {
        return (
            (error.data as { message?: string })?.message ||
            error.message ||
            error.statusText ||
            "An error occurred"
        );
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "An unknown error occurred";
}

/**
 * Create default API client instance
 */
export function createApiClient(baseUrl: string): ApiClient {
    const client = new ApiClient({ baseUrl });

    // Add default request interceptor for auth
    client.addRequestInterceptor((config) => {
        const token =
            typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

        if (token) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`,
            };
        }

        return config;
    });

    // Add default response interceptor for error handling
    client.addResponseInterceptor((response) => {
        // You can add global response handling here
        return response;
    });

    return client;
}

/**
 * Batch multiple requests
 */
export async function batchRequests<T>(
    requests: Array<() => Promise<T>>,
    options: {
        maxConcurrent?: number;
        onProgress?: (completed: number, total: number) => void;
    } = {}
): Promise<PromiseSettledResult<T>[]> {
    const { maxConcurrent = 5, onProgress } = options;
    const results: PromiseSettledResult<T>[] = [];
    let completed = 0;

    for (let i = 0; i < requests.length; i += maxConcurrent) {
        const batch = requests.slice(i, i + maxConcurrent);
        const batchResults = await Promise.allSettled(batch.map((fn) => fn()));
        results.push(...batchResults);

        completed += batch.length;
        onProgress?.(completed, requests.length);
    }

    return results;
}

/**
 * Poll API endpoint until condition is met
 */
export async function pollUntil<T>(
    fetcher: () => Promise<T>,
    condition: (data: T) => boolean,
    options: {
        interval?: number;
        maxAttempts?: number;
        onAttempt?: (attempt: number, data: T) => void;
    } = {}
): Promise<T> {
    const { interval = 2000, maxAttempts = 30, onAttempt } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const data = await fetcher();
        onAttempt?.(attempt, data);

        if (condition(data)) {
            return data;
        }

        if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
    }

    throw new Error(`Polling timed out after ${maxAttempts} attempts`);
}

/**
 * Create upload request with progress tracking
 */
export async function uploadFile(
    url: string,
    file: File,
    options: {
        onProgress?: (event: ProgressEvent) => void;
        headers?: Record<string, string>;
        fieldName?: string;
    } = {}
): Promise<Response> {
    const { onProgress, headers = {}, fieldName = "file" } = options;

    const formData = new FormData();
    formData.append(fieldName, file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        if (onProgress) {
            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    onProgress({
                        loaded: e.loaded,
                        total: e.total,
                        percent: (e.loaded / e.total) * 100,
                    });
                }
            });
        }

        xhr.addEventListener("load", () => {
            const response = new Response(xhr.response, {
                status: xhr.status,
                statusText: xhr.statusText,
            });
            resolve(response);
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Upload failed"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload aborted"));
        });

        xhr.open("POST", url);

        for (const [key, value] of Object.entries(headers)) {
            xhr.setRequestHeader(key, value);
        }

        const token =
            typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.send(formData);
    });
}

/**
 * Download file from URL
 */
export async function downloadFile(
    url: string,
    filename: string,
    options: {
        headers?: Record<string, string>;
        onProgress?: (event: ProgressEvent) => void;
    } = {}
): Promise<void> {
    const { headers = {}, onProgress } = options;

    const response = await fetch(url, {
        headers: {
            ...headers,
            Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
    }

    const contentLength = response.headers.get("content-length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let loaded = 0;

    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];

    if (reader) {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            loaded += value.length;

            if (onProgress && total) {
                onProgress({
                    loaded,
                    total,
                    percent: (loaded / total) * 100,
                });
            }
        }
    }

    // Combine chunks and create blob
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
    }

    const blob = new Blob([combined]);
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(objectUrl);
}
