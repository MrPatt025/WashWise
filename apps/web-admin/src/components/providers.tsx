"use client";

import { useState } from "react";
import { isServer, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NetworkStatusIndicator } from "@/components/network-status";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SkipToMain } from "@/lib/accessibility";
import { createQueryClient } from "@/lib/query";

// Singleton pattern for browser query client
let browserQueryClient: ReturnType<typeof createQueryClient> | undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // Using nullish coalescing assignment for cleaner code
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers component
 * Includes: TanStack Query, Error Boundary, Tooltip, Toast notifications,
 * Network Status, Accessibility features, DevTools
 */
export function Providers({ children }: ProvidersProps) {
  // Create query client in state to prevent re-creation on re-renders
  const [queryClient] = useState(getQueryClient);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" enableSystem>
          <TooltipProvider delayDuration={300}>
            {/* Skip to main content for keyboard accessibility */}
            <SkipToMain href="#main-content" />
            {children}
            <Toaster position="top-right" richColors closeButton />
            <NetworkStatusIndicator showOnlyWhenOffline position="bottom-right" />
            {process.env.NODE_ENV === "development" && (
              <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
            )}
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
