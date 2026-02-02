"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "success" | "warning" | "error";
  disabled?: boolean;
  children?: NavItem[];
  onClick?: () => void;
}

export interface NavUser {
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}

// ============================================================================
// Sidebar Context
// ============================================================================

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// ============================================================================
// Sidebar Provider
// ============================================================================

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsedWidth?: number;
  expandedWidth?: number;
}

export function SidebarProvider({ children, defaultCollapsed = false }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobile, setMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu on route change
  const pathname = usePathname();
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobile, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

// ============================================================================
// Sidebar
// ============================================================================

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Sidebar({ children, className, header, footer }: SidebarProps) {
  const { collapsed, setCollapsed, mobile, mobileOpen, setMobileOpen } = useSidebar();

  // Desktop sidebar
  if (!mobile) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        {header && (
          <div
            className={cn(
              "flex h-16 items-center border-b border-gray-200 dark:border-gray-800",
              collapsed ? "justify-center px-2" : "px-4"
            )}
          >
            {header}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4">{children}</div>

        <div className="border-t border-gray-200 dark:border-gray-800">
          {footer}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center py-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </aside>
    );
  }

  // Mobile sidebar
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:hidden",
              className
            )}
          >
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
              {header}
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">{children}</div>

            {footer && (
              <div className="border-t border-gray-200 dark:border-gray-800">{footer}</div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// Sidebar Nav
// ============================================================================

interface SidebarNavProps {
  items: NavItem[];
  className?: string;
}

export function SidebarNav({ items, className }: SidebarNavProps) {
  return (
    <nav className={cn("space-y-1 px-3", className)}>
      {items.map((item) => (
        <SidebarNavItem key={item.id} item={item} />
      ))}
    </nav>
  );
}

// ============================================================================
// Sidebar Nav Item
// ============================================================================

interface SidebarNavItemProps {
  item: NavItem;
  depth?: number;
}

function SidebarNavItem({ item, depth = 0 }: SidebarNavItemProps) {
  const pathname = usePathname();
  const { collapsed, mobile } = useSidebar();
  const [expanded, setExpanded] = React.useState(false);

  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href ? pathname === item.href : false;
  const isChildActive = item.children?.some((child) => child.href && pathname === child.href);

  // Auto-expand if a child is active
  React.useEffect(() => {
    if (isChildActive) {
      setExpanded(true);
    }
  }, [isChildActive]);

  const showLabel = !collapsed || mobile;

  const badgeColors = {
    default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    success: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    error: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  const content = (
    <>
      {item.icon && (
        <span
          className={cn(
            "flex-shrink-0",
            isActive || isChildActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
          )}
        >
          {item.icon}
        </span>
      )}
      {showLabel && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-medium",
                badgeColors[item.badgeVariant || "default"]
              )}
            >
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronDown
              className={cn("h-4 w-4 text-gray-400 transition-transform", expanded && "rotate-180")}
            />
          )}
        </>
      )}
    </>
  );

  const baseClasses = cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive || isChildActive
      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
    item.disabled && "cursor-not-allowed opacity-50",
    depth > 0 && "ml-4"
  );

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => !item.disabled && setExpanded(!expanded)}
          className={baseClasses}
          disabled={item.disabled}
        >
          {content}
        </button>
        <AnimatePresence initial={false}>
          {expanded && showLabel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children!.map((child) => (
                  <SidebarNavItem key={child.id} item={child} depth={depth + 1} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (item.href) {
    return (
      <Link href={item.href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={() => !item.disabled && item.onClick?.()}
      className={baseClasses}
      disabled={item.disabled}
    >
      {content}
    </button>
  );
}

// ============================================================================
// Sidebar Section
// ============================================================================

interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SidebarSection({ title, children, className }: SidebarSectionProps) {
  const { collapsed, mobile } = useSidebar();
  const showLabel = !collapsed || mobile;

  return (
    <div className={cn("mt-6 first:mt-0", className)}>
      {title && showLabel && (
        <h3 className="mb-2 px-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

// ============================================================================
// Sidebar User
// ============================================================================

interface SidebarUserProps {
  user: NavUser;
  onSignOut?: () => void;
  className?: string;
}

export function SidebarUser({ user, onSignOut, className }: SidebarUserProps) {
  const { collapsed, mobile } = useSidebar();
  const showLabel = !collapsed || mobile;

  return (
    <div className={cn("flex items-center gap-3 p-4", !showLabel && "justify-center", className)}>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </span>
        )}
      </div>

      {showLabel && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {user.name}
            </p>
            {user.email && (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            )}
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Top Navigation Bar
// ============================================================================

interface TopNavProps {
  children?: React.ReactNode;
  logo?: React.ReactNode;
  search?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  notifications?: number;
  onNotificationsClick?: () => void;
  user?: NavUser;
  onSignOut?: () => void;
  className?: string;
}

export function TopNav({
  children,
  logo,
  search,
  searchPlaceholder = "Search...",
  onSearch,
  notifications,
  onNotificationsClick,
  user,
  onSignOut,
  className,
}: TopNavProps) {
  const { mobile, setMobileOpen } = useSidebar();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-16 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="flex h-full items-center gap-4 px-4">
        {mobile && (
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {logo && <div className="flex-shrink-0">{logo}</div>}

        {search && (
          <form onSubmit={handleSearch} className="max-w-md flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border-none bg-gray-100 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>
          </form>
        )}

        <div className="flex-1">{children}</div>

        <div className="flex items-center gap-2">
          {notifications !== undefined && (
            <button
              onClick={onNotificationsClick}
              className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label={`${notifications} notifications`}
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  {notifications > 99 ? "99+" : notifications}
                </span>
              )}
            </button>
          )}

          {user && (
            <div className="flex items-center gap-3 border-l border-gray-200 pl-2 dark:border-gray-700">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                {user.role && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
                )}
              </div>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// Main Layout
// ============================================================================

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  const { collapsed, mobile } = useSidebar();

  return (
    <main
      className={cn(
        "min-h-screen transition-all duration-300",
        !mobile && (collapsed ? "ml-16" : "ml-64"),
        className
      )}
    >
      {children}
    </main>
  );
}

// ============================================================================
// Bottom Navigation (Mobile)
// ============================================================================

interface BottomNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

export function BottomNav({ items, className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:hidden",
        className
      )}
    >
      <div className="flex h-16 items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
              )}
            >
              <span className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
