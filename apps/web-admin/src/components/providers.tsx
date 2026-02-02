"use client";

import { useState } from "react";
import { QueryClientProvider, isServer } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { createQueryClient } from "@/lib/query";

// Singleton pattern for browser query client
let browserQueryClient: ReturnType<typeof createQueryClient> | undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) {
      browserQueryClient = createQueryClient();
    }
    return browserQueryClient;
  }
}

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers component
 * Includes: TanStack Query, Error Boundary, Toast notifications, DevTools
 */
export function Providers({ children }: ProvidersProps) {
  // Create query client in state to prevent re-creation on re-renders
  const [queryClient] = useState(getQueryClient);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" richColors closeButton />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
