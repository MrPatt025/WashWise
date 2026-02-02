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

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
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
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, mobile, mobileOpen, setMobileOpen }}
    >
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
  const { collapsed, setCollapsed, mobile, mobileOpen, setMobileOpen } =
    useSidebar();

  // Desktop sidebar
  if (!mobile) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64",
          className,
        )}
      >
        {header && (
          <div
            className={cn(
              "h-16 flex items-center border-b border-gray-200 dark:border-gray-800",
              collapsed ? "justify-center px-2" : "px-4",
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
            className="w-full flex items-center justify-center py-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
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
              "fixed left-0 top-0 z-50 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col lg:hidden",
              className,
            )}
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
              {header}
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">{children}</div>

            {footer && (
              <div className="border-t border-gray-200 dark:border-gray-800">
                {footer}
              </div>
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
    <nav className={cn("px-3 space-y-1", className)}>
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
  const isChildActive = item.children?.some(
    (child) => child.href && pathname === child.href,
  );

  // Auto-expand if a child is active
  React.useEffect(() => {
    if (isChildActive) {
      setExpanded(true);
    }
  }, [isChildActive]);

  const showLabel = !collapsed || mobile;

  const badgeColors = {
    default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    success:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    warning:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    error: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  const content = (
    <>
      {item.icon && (
        <span
          className={cn(
            "flex-shrink-0",
            isActive || isChildActive
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-400",
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
                "px-1.5 py-0.5 text-xs font-medium rounded",
                badgeColors[item.badgeVariant || "default"],
              )}
            >
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronDown
              className={cn(
                "w-4 h-4 text-gray-400 transition-transform",
                expanded && "rotate-180",
              )}
            />
          )}
        </>
      )}
    </>
  );

  const baseClasses = cn(
    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
    isActive || isChildActive
      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
    item.disabled && "opacity-50 cursor-not-allowed",
    depth > 0 && "ml-4",
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
                  <SidebarNavItem
                    key={child.id}
                    item={child}
                    depth={depth + 1}
                  />
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

export function SidebarSection({
  title,
  children,
  className,
}: SidebarSectionProps) {
  const { collapsed, mobile } = useSidebar();
  const showLabel = !collapsed || mobile;

  return (
    <div className={cn("mt-6 first:mt-0", className)}>
      {title && showLabel && (
        <h3 className="px-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
    <div
      className={cn(
        "flex items-center gap-3 p-4",
        !showLabel && "justify-center",
        className,
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
          />
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
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.name}
            </p>
            {user.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            )}
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
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
        "sticky top-0 z-30 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800",
        className,
      )}
    >
      <div className="h-full px-4 flex items-center gap-4">
        {mobile && (
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {logo && <div className="flex-shrink-0">{logo}</div>}

        {search && (
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </form>
        )}

        <div className="flex-1">{children}</div>

        <div className="flex items-center gap-2">
          {notifications !== undefined && (
            <button
              onClick={onNotificationsClick}
              className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={`${notifications} notifications`}
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-xs font-medium text-white bg-red-500 rounded-full">
                  {notifications > 99 ? "99+" : notifications}
                </span>
              )}
            </button>
          )}

          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
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
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.name}
                </p>
                {user.role && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.role}
                  </p>
                )}
              </div>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
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
        className,
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
        "fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden",
        className,
      )}
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 relative",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400",
              )}
            >
              <span className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-medium text-white bg-red-500 rounded-full">
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
