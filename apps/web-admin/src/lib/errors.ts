import { AxiosError } from "axios";
import { toast } from "sonner";

/**
 * Standard API error response from backend
 */
export interface ApiErrorResponse {
  status?: number;
  error?: string;
  message?: string;
  code?: string;
  details?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
}

/**
 * Parsed error with user-friendly message
 */
export interface ParsedError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string[]>;
  isNetworkError: boolean;
  isAuthError: boolean;
  isValidationError: boolean;
  isServerError: boolean;
  raw: unknown;
}

/**
 * Error codes that map to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  UNAUTHORIZED: "Your session has expired. Please log in again.",
  FORBIDDEN: "You don't have permission to perform this action.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  USER_NOT_FOUND: "No account found with this email.",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  TENANT_NOT_FOUND: "Laundromat not found. Please check the slug.",
  TOKEN_EXPIRED: "Your session has expired. Please log in again.",
  TOKEN_INVALID: "Invalid authentication token.",

  // Validation errors
  VALIDATION_ERROR: "Please check your input and try again.",
  INVALID_INPUT: "The provided data is invalid.",

  // Resource errors
  NOT_FOUND: "The requested resource was not found.",
  CONFLICT: "This action conflicts with existing data.",
  DUPLICATE_ENTRY: "This item already exists.",

  // Machine errors
  MACHINE_NOT_FOUND: "Machine not found.",
  MACHINE_IN_USE: "This machine is currently in use.",
  MACHINE_OFFLINE: "This machine is offline.",

  // Server errors
  INTERNAL_ERROR: "Something went wrong. Please try again later.",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable.",

  // Network errors
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  TIMEOUT: "Request timed out. Please try again.",
};

/**
 * Parse any error into a standardized format
 */
export function parseError(error: unknown): ParsedError {
  // Default parsed error
  const parsed: ParsedError = {
    message: "An unexpected error occurred.",
    code: "UNKNOWN_ERROR",
    status: 500,
    isNetworkError: false,
    isAuthError: false,
    isValidationError: false,
    isServerError: false,
    raw: error,
  };

  // Handle Axios errors
  if (error instanceof AxiosError) {
    const response = error.response?.data as ApiErrorResponse | undefined;

    // Network error (no response)
    if (!error.response) {
      parsed.isNetworkError = true;
      parsed.code = error.code === "ECONNABORTED" ? "TIMEOUT" : "NETWORK_ERROR";
      parsed.message = ERROR_MESSAGES[parsed.code];
      parsed.status = 0;
      return parsed;
    }

    parsed.status = error.response.status;

    // Extract error code and message from response
    if (response) {
      parsed.code = response.code || response.error || `HTTP_${parsed.status}`;
      parsed.message = response.message || ERROR_MESSAGES[parsed.code] || error.message;
      parsed.details = response.details;
    }

    // Categorize error type
    if (parsed.status === 401 || parsed.status === 403) {
      parsed.isAuthError = true;
      parsed.message = ERROR_MESSAGES[parsed.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN"];
    } else if (parsed.status === 400 || parsed.status === 422) {
      parsed.isValidationError = true;
    } else if (parsed.status >= 500) {
      parsed.isServerError = true;
      parsed.message = ERROR_MESSAGES.INTERNAL_ERROR;
    }

    return parsed;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    parsed.message = error.message;
    parsed.code = error.name;
    return parsed;
  }

  // Handle string errors
  if (typeof error === "string") {
    parsed.message = error;
    return parsed;
  }

  return parsed;
}

/**
 * Get user-friendly message for an error code
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || "An unexpected error occurred.";
}

/**
 * Show error toast with parsed error
 */
export function showErrorToast(error: unknown, customMessage?: string): void {
  const parsed = parseError(error);

  toast.error(customMessage || parsed.message, {
    description: parsed.details ? Object.values(parsed.details).flat().join(", ") : undefined,
    duration: 5000,
  });
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 3000,
  });
}

/**
 * Show info toast
 */
export function showInfoToast(message: string, description?: string): void {
  toast.info(message, {
    description,
    duration: 4000,
  });
}

/**
 * Show warning toast
 */
export function showWarningToast(message: string, description?: string): void {
  toast.warning(message, {
    description,
    duration: 4000,
  });
}

/**
 * Show loading toast that can be updated
 */
export function showLoadingToast(message: string): string | number {
  return toast.loading(message);
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string | number): void {
  toast.dismiss(toastId);
}

/**
 * Show promise toast for async operations
 */
export function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
): Promise<T> {
  toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: (err: unknown) => {
      const parsed = parseError(err);
      return typeof messages.error === "function" ? messages.error(err) : parsed.message;
    },
  });
  return promise;
}

/**
 * Error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Extract validation errors for form fields
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const parsed = parseError(error);
  const fieldErrors: Record<string, string> = {};

  if (parsed.details) {
    Object.entries(parsed.details).forEach(([field, messages]) => {
      fieldErrors[field] = messages[0] || "Invalid value";
    });
  }

  return fieldErrors;
}
