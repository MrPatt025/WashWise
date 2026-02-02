"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// Types
// ============================================================================

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  content?: React.ReactNode;
}

// ============================================================================
// Tab Context
// ============================================================================

interface TabContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: TabVariant;
  orientation: "horizontal" | "vertical";
}

const TabContext = React.createContext<TabContextValue | null>(null);

function useTabContext() {
  const context = React.useContext(TabContext);
  if (!context) {
    throw new Error("Tab components must be used within a Tabs component");
  }
  return context;
}

// ============================================================================
// Tabs Container
// ============================================================================

type TabVariant = "line" | "enclosed" | "soft" | "pills" | "underline";

interface TabsProps {
  children: React.ReactNode;
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: TabVariant;
  orientation?: "horizontal" | "vertical";
  fullWidth?: boolean;
  className?: string;
}

export function Tabs({
  children,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  variant = "line",
  orientation = "horizontal",
  fullWidth = false,
  className,
}: TabsProps) {
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = React.useState(
    defaultTab || "",
  );

  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : uncontrolledActiveTab;

  const setActiveTab = React.useCallback(
    (id: string) => {
      if (!isControlled) {
        setUncontrolledActiveTab(id);
      }
      onTabChange?.(id);
    },
    [isControlled, onTabChange],
  );

  return (
    <TabContext.Provider
      value={{ activeTab, setActiveTab, variant, orientation }}
    >
      <div
        className={cn(
          orientation === "vertical" && "flex gap-4",
          fullWidth && "w-full",
          className,
        )}
      >
        {children}
      </div>
    </TabContext.Provider>
  );
}

// ============================================================================
// Tab List
// ============================================================================

interface TabListProps {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

const variantListClasses: Record<TabVariant, string> = {
  line: "border-b border-gray-200 dark:border-gray-700",
  enclosed: "border-b border-gray-200 dark:border-gray-700",
  soft: "bg-gray-100 dark:bg-gray-800 p-1 rounded-lg",
  pills: "gap-2",
  underline: "",
};

export function TabList({
  children,
  className,
  "aria-label": ariaLabel,
}: TabListProps) {
  const { variant, orientation } = useTabContext();
  const listRef = React.useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const tabs = listRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]:not([disabled])',
    );
    if (!tabs?.length) return;

    const currentIndex = Array.from(tabs).findIndex(
      (tab) => tab === document.activeElement,
    );

    let nextIndex = currentIndex;
    const isHorizontal = orientation === "horizontal";

    switch (e.key) {
      case isHorizontal ? "ArrowLeft" : "ArrowUp":
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        e.preventDefault();
        break;
      case isHorizontal ? "ArrowRight" : "ArrowDown":
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        e.preventDefault();
        break;
      case "Home":
        nextIndex = 0;
        e.preventDefault();
        break;
      case "End":
        nextIndex = tabs.length - 1;
        e.preventDefault();
        break;
    }

    if (nextIndex !== currentIndex) {
      tabs[nextIndex]?.focus();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex",
        orientation === "vertical" ? "flex-col" : "flex-row",
        variantListClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Tab Trigger
// ============================================================================

interface TabTriggerProps {
  id: string;
  children?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
  className?: string;
}

const variantTriggerClasses: Record<
  TabVariant,
  { base: string; active: string; inactive: string }
> = {
  line: {
    base: "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
    active: "border-blue-500 text-blue-600 dark:text-blue-400",
    inactive:
      "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600",
  },
  enclosed: {
    base: "px-4 py-2.5 text-sm font-medium border border-transparent rounded-t-lg -mb-px transition-colors",
    active:
      "border-gray-200 dark:border-gray-700 border-b-white dark:border-b-gray-900 bg-white dark:bg-gray-900 text-gray-900 dark:text-white",
    inactive:
      "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
  },
  soft: {
    base: "px-4 py-2 text-sm font-medium rounded-md transition-colors",
    active: "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm",
    inactive:
      "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
  },
  pills: {
    base: "px-4 py-2 text-sm font-medium rounded-full transition-colors",
    active: "bg-blue-600 text-white",
    inactive:
      "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
  },
  underline: {
    base: "px-4 py-2 text-sm font-medium relative transition-colors",
    active: "text-blue-600 dark:text-blue-400",
    inactive:
      "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
  },
};

export function TabTrigger({
  id,
  children,
  disabled,
  icon,
  badge,
  className,
}: TabTriggerProps) {
  const { activeTab, setActiveTab, variant } = useTabContext();
  const isActive = activeTab === id;
  const classes = variantTriggerClasses[variant];

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${id}`}
      id={`tab-${id}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(id)}
      className={cn(
        classes.base,
        isActive ? classes.active : classes.inactive,
        disabled && "opacity-50 cursor-not-allowed",
        "flex items-center gap-2",
        className,
      )}
    >
      {icon}
      {children}
      {badge !== undefined && (
        <span
          className={cn(
            "ml-1.5 px-1.5 py-0.5 text-xs font-medium rounded-full",
            isActive
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
          )}
        >
          {badge}
        </span>
      )}
      {variant === "underline" && isActive && (
        <motion.div
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
}

// ============================================================================
// Tab Panel
// ============================================================================

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  keepMounted?: boolean;
}

export function TabPanel({
  id,
  children,
  className,
  keepMounted = false,
}: TabPanelProps) {
  const { activeTab } = useTabContext();
  const isActive = activeTab === id;

  if (!isActive && !keepMounted) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      className={cn("mt-4", !isActive && "hidden", className)}
    >
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Tabs Panels Container
// ============================================================================

interface TabPanelsProps {
  children: React.ReactNode;
  className?: string;
}

export function TabPanels({ children, className }: TabPanelsProps) {
  return <div className={cn("flex-1", className)}>{children}</div>;
}

// ============================================================================
// Simple Tabs (all-in-one component)
// ============================================================================

interface SimpleTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: TabVariant;
  orientation?: "horizontal" | "vertical";
  fullWidth?: boolean;
  className?: string;
  tabListClassName?: string;
  tabPanelClassName?: string;
}

export function SimpleTabs({
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  variant = "line",
  orientation = "horizontal",
  fullWidth = false,
  className,
  tabListClassName,
  tabPanelClassName,
}: SimpleTabsProps) {
  const firstEnabledTab = tabs.find((tab) => !tab.disabled)?.id || tabs[0]?.id;
  const initialTab = defaultTab || activeTab || firstEnabledTab;

  return (
    <Tabs
      defaultTab={initialTab}
      activeTab={activeTab}
      onTabChange={onTabChange}
      variant={variant}
      orientation={orientation}
      fullWidth={fullWidth}
      className={className}
    >
      <TabList className={tabListClassName}>
        {tabs.map((tab) => (
          <TabTrigger
            key={tab.id}
            id={tab.id}
            icon={tab.icon}
            badge={tab.badge}
            disabled={tab.disabled}
          >
            {tab.label}
          </TabTrigger>
        ))}
      </TabList>
      <TabPanels>
        {tabs.map((tab) => (
          <TabPanel key={tab.id} id={tab.id} className={tabPanelClassName}>
            {tab.content}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}

// ============================================================================
// Scrollable Tabs (for many tabs)
// ============================================================================

interface ScrollableTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: TabVariant;
  className?: string;
}

export function ScrollableTabs({
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  variant = "line",
  className,
}: ScrollableTabsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const amount = direction === "left" ? -200 : 200;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-white dark:from-gray-900 to-transparent"
          aria-label="Scroll left"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="overflow-x-auto scrollbar-hide"
      >
        <SimpleTabs
          tabs={tabs}
          defaultTab={defaultTab}
          activeTab={activeTab}
          onTabChange={onTabChange}
          variant={variant}
        />
      </div>

      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-white dark:from-gray-900 to-transparent"
          aria-label="Scroll right"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Icon Tabs
// ============================================================================

interface IconTabsProps {
  tabs: Array<{
    id: string;
    icon: React.ReactNode;
    label: string;
    content?: React.ReactNode;
  }>;
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  showLabels?: boolean;
  className?: string;
}

export function IconTabs({
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  showLabels = false,
  className,
}: IconTabsProps) {
  const firstTab = tabs[0]?.id;
  const [currentTab, setCurrentTab] = React.useState(
    defaultTab || activeTab || firstTab,
  );

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    onTabChange?.(tabId);
  };

  const active = activeTab || currentTab;

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-all",
                isActive
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
              )}
              title={tab.label}
              aria-label={tab.label}
            >
              <span className="w-5 h-5">{tab.icon}</span>
              {showLabels && (
                <span className="text-sm font-medium">{tab.label}</span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tabs.map(
          (tab) =>
            active === tab.id &&
            tab.content && (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-4"
              >
                {tab.content}
              </motion.div>
            ),
        )}
      </AnimatePresence>
    </div>
  );
}
