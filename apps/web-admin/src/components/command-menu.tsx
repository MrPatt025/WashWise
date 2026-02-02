"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandProvider,
  CommandDialog,
  type CommandGroup,
  type CommandItem,
} from "@/components/ui/command";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/use-auth";
import { hasPermission } from "@/components/auth-guard";
import {
  LayoutDashboard,
  WashingMachine,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Plus,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

/**
 * Global command menu for WashWise
 * Provides keyboard-driven navigation and quick actions
 *
 * Features:
 * - ⌘K to open
 * - Navigation commands
 * - Quick actions (add machine, etc.)
 * - Theme toggle
 * - User actions
 * - Recent items with localStorage persistence
 */
export function CommandMenu() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const { setTheme, resolvedTheme } = useTheme();

  // Build command groups based on user role
  const commandGroups = React.useMemo<CommandGroup[]>(() => {
    const groups: CommandGroup[] = [];

    // Navigation group
    const navigationItems: CommandItem[] = [
      {
        id: "nav-dashboard",
        label: "Go to Dashboard",
        description: "View your laundromat overview",
        icon: <LayoutDashboard className="h-4 w-4" />,
        shortcut: ["G", "D"],
        keywords: ["home", "overview", "stats"],
        onSelect: () => router.push("/dashboard"),
      },
      {
        id: "nav-machines",
        label: "Go to Machines",
        description: "Manage your washing machines",
        icon: <WashingMachine className="h-4 w-4" />,
        shortcut: ["G", "M"],
        keywords: ["washer", "dryer", "equipment"],
        onSelect: () => router.push("/dashboard/machines"),
      },
    ];

    // Add settings if user has permission
    if (hasPermission(user?.role, "OWNER")) {
      navigationItems.push({
        id: "nav-settings",
        label: "Go to Settings",
        description: "Configure your account and preferences",
        icon: <Settings className="h-4 w-4" />,
        shortcut: ["G", "S"],
        keywords: ["preferences", "config", "account"],
        onSelect: () => router.push("/dashboard/settings"),
      });
    }

    groups.push({
      id: "navigation",
      label: "Navigation",
      items: navigationItems,
    });

    // Quick actions group
    const quickActions: CommandItem[] = [
      {
        id: "action-add-machine",
        label: "Add New Machine",
        description: "Register a new washing machine",
        icon: <Plus className="h-4 w-4" />,
        shortcut: ["N", "M"],
        keywords: ["create", "new", "register"],
        onSelect: () => router.push("/dashboard/machines?action=new"),
      },
      {
        id: "action-refresh",
        label: "Refresh Data",
        description: "Reload the current page data",
        icon: <RefreshCw className="h-4 w-4" />,
        shortcut: ["mod", "R"],
        keywords: ["reload", "update"],
        onSelect: () => window.location.reload(),
      },
    ];

    groups.push({
      id: "actions",
      label: "Quick Actions",
      items: quickActions,
    });

    // Theme group
    const themeItems: CommandItem[] = [
      {
        id: "theme-light",
        label: "Light Mode",
        description: "Switch to light theme",
        icon: <Sun className="h-4 w-4" />,
        keywords: ["bright", "day"],
        onSelect: () => setTheme("light"),
        disabled: resolvedTheme === "light",
      },
      {
        id: "theme-dark",
        label: "Dark Mode",
        description: "Switch to dark theme",
        icon: <Moon className="h-4 w-4" />,
        keywords: ["night", "dim"],
        onSelect: () => setTheme("dark"),
        disabled: resolvedTheme === "dark",
      },
      {
        id: "theme-system",
        label: "System Theme",
        description: "Follow system preference",
        icon: <Settings className="h-4 w-4" />,
        keywords: ["auto", "default"],
        onSelect: () => setTheme("system"),
      },
    ];

    groups.push({
      id: "theme",
      label: "Theme",
      items: themeItems,
    });

    // User actions group
    const userActions: CommandItem[] = [
      {
        id: "user-profile",
        label: "View Profile",
        description: `Signed in as ${user?.email}`,
        icon: <User className="h-4 w-4" />,
        keywords: ["account", "me"],
        onSelect: () => router.push("/dashboard/settings"),
      },
      {
        id: "user-logout",
        label: "Sign Out",
        description: "Log out of your account",
        icon: <LogOut className="h-4 w-4" />,
        shortcut: ["mod", "shift", "Q"],
        keywords: ["logout", "exit"],
        onSelect: () => logoutMutation.mutate(),
      },
    ];

    groups.push({
      id: "user",
      label: "Account",
      items: userActions,
    });

    // Help group
    groups.push({
      id: "help",
      label: "Help",
      items: [
        {
          id: "help-docs",
          label: "Documentation",
          description: "View the user guide",
          icon: <HelpCircle className="h-4 w-4" />,
          keywords: ["manual", "guide", "tutorial"],
          onSelect: () => window.open("https://docs.washwise.io", "_blank"),
        },
        {
          id: "help-shortcuts",
          label: "Keyboard Shortcuts",
          description: "View all keyboard shortcuts",
          icon: <Settings className="h-4 w-4" />,
          shortcut: ["mod", "/"],
          keywords: ["hotkeys", "keys"],
          onSelect: () => {
            // Could open a shortcuts modal
            console.log("Show shortcuts");
          },
        },
      ],
    });

    return groups;
  }, [user, router, setTheme, resolvedTheme, logoutMutation]);

  return (
    <CommandProvider groups={commandGroups} shortcut="k">
      <CommandDialog />
    </CommandProvider>
  );
}

export default CommandMenu;
