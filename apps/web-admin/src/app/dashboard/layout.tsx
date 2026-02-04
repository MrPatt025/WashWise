"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { AuthGuard, type UserRole } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  WashingMachine,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  requiredRole?: UserRole;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Machines", href: "/dashboard/machines", icon: WashingMachine },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, requiredRole: "OWNER" },
];

/**
 * Generate breadcrumbs from pathname
 */
function useBreadcrumbs() {
  const pathname = usePathname();

  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];

    let currentPath = "";
    for (const segment of segments) {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, href: currentPath });
    }

    return breadcrumbs;
  }, [pathname]);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const breadcrumbs = useBreadcrumbs();

  return (
    <AuthGuard requiredRole="STAFF">
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-900 lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          aria-label="Main navigation"
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b px-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-2">
                  <WashingMachine className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">WashWise</span>
              </Link>
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4" aria-label="Sidebar navigation">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Tooltip key={item.name} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="lg:hidden">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>

            {/* User info */}
            <div className="border-t p-4">
              <div className="mb-3 flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user?.tenant?.name}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <WashingMachine className="h-5 w-5 text-primary" />
              <span className="font-bold">WashWise</span>
            </div>
            <ThemeToggle />
          </header>

          {/* Desktop breadcrumb header */}
          <header className="hidden h-14 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900 lg:flex">
            <nav className="flex items-center space-x-1 text-sm" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-gray-900 dark:text-white">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-500">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Help & Support</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-gray-500">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 lg:p-8" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
