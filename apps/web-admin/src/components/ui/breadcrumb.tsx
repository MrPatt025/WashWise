"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

// ============================================================================
// Breadcrumb Container
// ============================================================================

interface BreadcrumbProps {
  children: React.ReactNode;
  separator?: React.ReactNode;
  maxItems?: number;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
  className?: string;
  "aria-label"?: string;
}

export function Breadcrumb({
  children,
  separator,
  className,
  "aria-label": ariaLabel = "Breadcrumb",
}: BreadcrumbProps) {
  const childArray = React.Children.toArray(children);

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol className="flex items-center flex-wrap gap-1">
        {childArray.map((child, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-gray-400 dark:text-gray-500">
                {separator || <ChevronRight className="w-4 h-4" />}
              </span>
            )}
            {child}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ============================================================================
// Breadcrumb Item
// ============================================================================

interface BreadcrumbItemProps {
  href?: string;
  current?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function BreadcrumbItem({
  href,
  current,
  icon,
  children,
  className,
}: BreadcrumbItemProps) {
  const content = (
    <>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </>
  );

  if (current || !href) {
    return (
      <span
        aria-current={current ? "page" : undefined}
        className={cn(
          "flex items-center gap-1.5 text-sm",
          current
            ? "font-medium text-gray-900 dark:text-white"
            : "text-gray-500 dark:text-gray-400",
          className,
        )}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors",
        className,
      )}
    >
      {content}
    </Link>
  );
}

// ============================================================================
// Breadcrumb Ellipsis
// ============================================================================

interface BreadcrumbEllipsisProps {
  className?: string;
  onClick?: () => void;
}

export function BreadcrumbEllipsis({
  className,
  onClick,
}: BreadcrumbEllipsisProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        className,
      )}
      aria-label="Show more breadcrumbs"
    >
      <MoreHorizontal className="w-4 h-4 text-gray-400" />
    </button>
  );
}

// ============================================================================
// Simple Breadcrumb (all-in-one component)
// ============================================================================

interface SimpleBreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
  homeHref?: string;
  homeIcon?: React.ReactNode;
  maxItems?: number;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
  className?: string;
}

export function SimpleBreadcrumb({
  items,
  separator,
  showHome = true,
  homeHref = "/",
  homeIcon = <Home className="w-4 h-4" />,
  maxItems,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 2,
  className,
}: SimpleBreadcrumbProps) {
  const [showAll, setShowAll] = React.useState(false);

  const allItems = showHome
    ? [{ label: "Home", href: homeHref, icon: homeIcon }, ...items]
    : items;

  // Determine if we need to collapse
  const shouldCollapse = maxItems && allItems.length > maxItems && !showAll;

  let displayItems = allItems;
  if (shouldCollapse) {
    const beforeItems = allItems.slice(0, itemsBeforeCollapse);
    const afterItems = allItems.slice(-itemsAfterCollapse);
    displayItems = [
      ...beforeItems,
      { label: "...", isEllipsis: true } as BreadcrumbItem & {
        isEllipsis?: boolean;
      },
      ...afterItems,
    ];
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center flex-wrap gap-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const typedItem = item as BreadcrumbItem & { isEllipsis?: boolean };

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-gray-400 dark:text-gray-500 mx-1">
                  {separator || <ChevronRight className="w-4 h-4" />}
                </span>
              )}

              {typedItem.isEllipsis ? (
                <BreadcrumbEllipsis onClick={() => setShowAll(true)} />
              ) : (
                <BreadcrumbItem
                  href={isLast ? undefined : item.href}
                  current={isLast}
                  icon={item.icon}
                >
                  {item.label}
                </BreadcrumbItem>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================================================
// Breadcrumb with Dropdown
// ============================================================================

interface BreadcrumbDropdownProps {
  items: BreadcrumbItem[];
  trigger: React.ReactNode;
  className?: string;
}

export function BreadcrumbDropdown({
  items,
  trigger,
  className,
}: BreadcrumbDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {trigger}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href || "#"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Styled Breadcrumbs Variants
// ============================================================================

interface StyledBreadcrumbProps extends SimpleBreadcrumbProps {
  variant?: "default" | "contained" | "pills";
}

export function StyledBreadcrumb({
  items,
  variant = "default",
  showHome = true,
  homeHref = "/",
  homeIcon = <Home className="w-4 h-4" />,
  separator,
  className,
}: StyledBreadcrumbProps) {
  const allItems = showHome
    ? [{ label: "Home", href: homeHref, icon: homeIcon }, ...items]
    : items;

  if (variant === "contained") {
    return (
      <nav
        aria-label="Breadcrumb"
        className={cn(
          "bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2",
          className,
        )}
      >
        <ol className="flex items-center flex-wrap gap-1">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;

            return (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <span className="text-gray-400 dark:text-gray-500 mx-1">
                    {separator || "/"}
                  </span>
                )}
                <BreadcrumbItem
                  href={isLast ? undefined : item.href}
                  current={isLast}
                  icon={item.icon}
                >
                  {item.label}
                </BreadcrumbItem>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  if (variant === "pills") {
    return (
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex items-center flex-wrap gap-2">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;

            const content = (
              <>
                {item.icon && (
                  <span className="flex-shrink-0">{item.icon}</span>
                )}
                <span>{item.label}</span>
              </>
            );

            if (isLast || !item.href) {
              return (
                <li key={index}>
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full",
                      isLast
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                    )}
                  >
                    {content}
                  </span>
                </li>
              );
            }

            return (
              <li key={index}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {content}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  // Default variant
  return (
    <SimpleBreadcrumb
      items={items}
      separator={separator}
      showHome={showHome}
      homeHref={homeHref}
      homeIcon={homeIcon}
      className={className}
    />
  );
}

// ============================================================================
// Page Header with Breadcrumb
// ============================================================================

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <SimpleBreadcrumb items={breadcrumbs} />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// Dynamic Breadcrumb from Path
// ============================================================================

interface DynamicBreadcrumbProps {
  path: string;
  labels?: Record<string, string>;
  separator?: React.ReactNode;
  showHome?: boolean;
  homeHref?: string;
  className?: string;
}

export function DynamicBreadcrumb({
  path,
  labels = {},
  separator,
  showHome = true,
  homeHref = "/",
  className,
}: DynamicBreadcrumbProps) {
  const segments = path.split("/").filter(Boolean);

  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label =
      labels[segment] ||
      segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

    return {
      label,
      href,
    };
  });

  // Mark last item as current
  if (items.length > 0) {
    items[items.length - 1].current = true;
  }

  return (
    <SimpleBreadcrumb
      items={items}
      separator={separator}
      showHome={showHome}
      homeHref={homeHref}
      className={className}
    />
  );
}
