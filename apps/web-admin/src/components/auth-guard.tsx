"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useCheckAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * User roles for role-based access control
 */
export type UserRole = "SUPER_ADMIN" | "OWNER" | "STAFF" | "CUSTOMER";

/**
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  OWNER: 3,
  STAFF: 2,
  CUSTOMER: 1,
};

/**
 * Check if a user role has sufficient permissions
 */
export function hasPermission(userRole: string | undefined, requiredRole: UserRole): boolean {
  if (!userRole) {
    return false;
  }
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

interface AuthGuardProps {
  children: React.ReactNode;
  /** Minimum role required to access this content */
  requiredRole?: UserRole;
  /** Custom redirect path when unauthorized */
  redirectTo?: string;
  /** Custom fallback component when access denied */
  fallback?: React.ReactNode;
}

/**
 * Professional loading screen with branding
 */
function LoadingScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          <div className="relative rounded-xl bg-primary p-4">
            <WashingMachine className="h-8 w-8 animate-pulse text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading WashWise...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Access denied screen
 */
function AccessDeniedScreen({
  requiredRole,
  userRole,
}: {
  requiredRole: UserRole;
  userRole?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center gap-6 px-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You don&apos;t have permission to access this page.
            {requiredRole && (
              <span className="mt-1 block">
                Required role: <strong>{requiredRole}</strong>
                {userRole && (
                  <>
                    , your role: <strong>{userRole}</strong>
                  </>
                )}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * AuthGuard - Protects routes with authentication and role-based access control
 *
 * Features:
 * - Automatic auth check on mount
 * - Role-based access control
 * - Professional loading state with branding
 * - Access denied screen with navigation options
 * - Redirect preservation for post-login navigation
 */
export function AuthGuard({
  children,
  requiredRole,
  redirectTo = "/login",
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const { isLoading: isChecking } = useCheckAuth();

  // Memoize permission check
  const hasRequiredPermission = useMemo(() => {
    if (!requiredRole) {
      return true;
    }
    return hasPermission(user?.role, requiredRole);
  }, [requiredRole, user?.role]);

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (!isLoading && !isChecking && !isAuthenticated) {
      // Preserve the intended destination for redirect after login
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, isChecking, router, redirectTo, pathname]);

  // Show loading screen while checking auth
  if (isLoading || isChecking) {
    return <LoadingScreen />;
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  // Check role-based access
  if (requiredRole && !hasRequiredPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AccessDeniedScreen requiredRole={requiredRole} userRole={user?.role} />;
  }

  return <>{children}</>;
}

/**
 * HOC for role-based component rendering
 */
export function withRoleCheck<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole: UserRole
) {
  return function WithRoleCheck(props: P) {
    const user = useAuthStore((state) => state.user);

    if (!hasPermission(user?.role, requiredRole)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Hook for conditional rendering based on role
 */
export function useHasPermission(requiredRole: UserRole): boolean {
  const user = useAuthStore((state) => state.user);
  return hasPermission(user?.role, requiredRole);
}
