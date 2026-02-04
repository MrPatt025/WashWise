"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  MoreHorizontal,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Column definition for data table
 */
export interface DataTableColumn<T> {
  /** Unique identifier for the column */
  id: string;
  /** Header label */
  header: string | React.ReactNode | ((props: { column: DataTableColumn<T> }) => React.ReactNode);
  /** Cell renderer */
  cell: (row: T, index: number) => React.ReactNode;
  /** Accessor key for sorting/filtering */
  accessorKey?: keyof T;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether column is filterable */
  filterable?: boolean;
  /** Whether column can be hidden */
  hideable?: boolean;
  /** Default visibility */
  defaultVisible?: boolean;
  /** Column width */
  width?: number | string;
  /** Min width */
  minWidth?: number;
  /** Max width */
  maxWidth?: number;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** Sticky position */
  sticky?: "left" | "right";
  /** Custom sort function */
  sortFn?: (a: T, b: T, direction: "asc" | "desc") => number;
  /** Custom filter function */
  filterFn?: (row: T, filterValue: string) => boolean;
  /** Footer content */
  footer?: React.ReactNode | ((rows: T[]) => React.ReactNode);
}

/**
 * Sort state
 */
export interface SortState {
  column: string;
  direction: "asc" | "desc";
}

/**
 * Data table props
 */
export interface DataTableProps<T> {
  /** Data to display */
  data: T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Loading state */
  isLoading?: boolean;
  /** Row key accessor */
  getRowKey: (row: T, index: number) => string | number;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: Set<string | number>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string | number>) => void;
  /** Enable sorting */
  sortable?: boolean;
  /** Current sort state */
  sort?: SortState;
  /** Sort change handler */
  onSortChange?: (sort: SortState | undefined) => void;
  /** Enable global search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Enable column visibility toggle */
  columnToggle?: boolean;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Custom class names */
  className?: string;
  /** Table class name */
  tableClassName?: string;
  /** Header class name */
  headerClassName?: string;
  /** Body class name */
  bodyClassName?: string;
  /** Row class name */
  rowClassName?: string | ((row: T, index: number) => string);
  /** Cell class name */
  cellClassName?: string;
  /** Striped rows */
  striped?: boolean;
  /** Hover effect on rows */
  hoverable?: boolean;
  /** Bordered table */
  bordered?: boolean;
  /** Compact density */
  compact?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Max height for scrolling */
  maxHeight?: number | string;
  /** Row actions renderer */
  rowActions?: (row: T, index: number) => React.ReactNode;
  /** Bulk actions for selected rows */
  bulkActions?: React.ReactNode;
  /** Table caption */
  caption?: string;
  /** Show footer */
  showFooter?: boolean;
}

/**
 * World-class Data Table component
 * Feature-rich table with sorting, filtering, selection, and more
 */
export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  getRowKey,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  sortable = true,
  sort,
  onSortChange,
  searchable = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  columnToggle = false,
  onRowClick,
  emptyState,
  className,
  tableClassName,
  headerClassName,
  bodyClassName,
  rowClassName,
  cellClassName,
  striped = false,
  hoverable = true,
  bordered = false,
  compact = false,
  stickyHeader = false,
  maxHeight,
  rowActions,
  bulkActions,
  caption,
  showFooter = false,
}: DataTableProps<T>) {
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(() => {
    const visible = new Set<string>();
    columns.forEach((col) => {
      if (col.defaultVisible !== false) {
        visible.add(col.id);
      }
    });
    return visible;
  });

  // Filter visible columns
  const displayColumns = React.useMemo(
    () => columns.filter((col) => visibleColumns.has(col.id)),
    [columns, visibleColumns]
  );

  // Handle sort
  const handleSort = (columnId: string) => {
    if (!onSortChange) {
      return;
    }

    if (sort?.column === columnId) {
      if (sort.direction === "asc") {
        onSortChange({ column: columnId, direction: "desc" });
      } else {
        onSortChange(undefined);
      }
    } else {
      onSortChange({ column: columnId, direction: "asc" });
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!onSelectionChange) {
      return;
    }

    if (selectedKeys.size === data.length) {
      onSelectionChange(new Set());
    } else {
      const allKeys = new Set(data.map((row, i) => getRowKey(row, i)));
      onSelectionChange(allKeys);
    }
  };

  // Handle row select
  const handleRowSelect = (key: string | number) => {
    if (!onSelectionChange) {
      return;
    }

    const newSelected = new Set(selectedKeys);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    onSelectionChange(newSelected);
  };

  // Toggle column visibility
  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  // Render sort indicator
  const renderSortIndicator = (column: DataTableColumn<T>) => {
    if (!sortable || !column.sortable) {
      return null;
    }

    const isSorted = sort?.column === column.id;
    const direction = sort?.direction;

    return (
      <span className="ml-2 inline-flex">
        {isSorted ? (
          direction === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
        )}
      </span>
    );
  };

  // Cell padding class
  const cellPadding = compact ? "px-3 py-2" : "px-4 py-3";

  // All selected check
  const allSelected = data.length > 0 && selectedKeys.size === data.length;
  const someSelected = selectedKeys.size > 0 && selectedKeys.size < data.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      {(searchable || columnToggle || (selectable && selectedKeys.size > 0)) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Search */}
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-64 pl-9"
                />
                {searchValue && (
                  <button
                    onClick={() => onSearchChange?.("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Bulk actions when rows selected */}
            {selectable && selectedKeys.size > 0 && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
                <span className="text-sm font-medium">{selectedKeys.size} selected</span>
                {bulkActions}
                <Button variant="ghost" size="sm" onClick={() => onSelectionChange?.(new Set())}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Column toggle */}
          {columnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns
                  .filter((col) => col.hideable !== false)
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={visibleColumns.has(column.id)}
                      onCheckedChange={() => toggleColumn(column.id)}
                    >
                      {typeof column.header === "string" ? column.header : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Table container */}
      <div
        className={cn("relative overflow-auto rounded-lg border", bordered && "border-2")}
        style={{ maxHeight }}
      >
        <table className={cn("w-full caption-bottom text-sm", tableClassName)}>
          {caption && <caption className="mt-4 text-sm text-muted-foreground">{caption}</caption>}

          {/* Header */}
          <thead
            className={cn(
              "border-b bg-muted/50",
              stickyHeader && "sticky top-0 z-10",
              headerClassName
            )}
          >
            <tr>
              {/* Selection checkbox column */}
              {selectable && (
                <th className={cn("w-12", cellPadding)}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </th>
              )}

              {/* Data columns */}
              {displayColumns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "text-left font-medium text-muted-foreground",
                    cellPadding,
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sticky === "left" && "sticky left-0 bg-muted/50",
                    column.sticky === "right" && "sticky right-0 bg-muted/50",
                    sortable &&
                      column.sortable &&
                      "cursor-pointer select-none hover:text-foreground"
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  onClick={() => sortable && column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center">
                    {typeof column.header === "function"
                      ? column.header({ column })
                      : column.header}
                    {renderSortIndicator(column)}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              {rowActions && (
                <th className={cn("w-12", cellPadding)}>
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className={bodyClassName}>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {selectable && (
                    <td className={cellPadding}>
                      <Skeleton className="h-4 w-4" />
                    </td>
                  )}
                  {displayColumns.map((col) => (
                    <td key={col.id} className={cellPadding}>
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                  {rowActions && (
                    <td className={cellPadding}>
                      <Skeleton className="h-8 w-8" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={displayColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="h-32 text-center"
                >
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Search className="mb-2 h-8 w-8" />
                      <p>No results found</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row, index) => {
                const key = getRowKey(row, index);
                const isSelected = selectedKeys.has(key);

                return (
                  <tr
                    key={key}
                    className={cn(
                      "border-b transition-colors",
                      striped && index % 2 === 1 && "bg-muted/30",
                      hoverable && "hover:bg-muted/50",
                      isSelected && "bg-primary/5",
                      onRowClick && "cursor-pointer",
                      typeof rowClassName === "function" ? rowClassName(row, index) : rowClassName
                    )}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {/* Selection checkbox */}
                    {selectable && (
                      <td className={cellPadding} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(key)}
                          aria-label={`Select row ${index + 1}`}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {displayColumns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          cellPadding,
                          cellClassName,
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                          column.sticky === "left" && "sticky left-0 bg-background",
                          column.sticky === "right" && "sticky right-0 bg-background"
                        )}
                        style={{
                          width: column.width,
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth,
                        }}
                      >
                        {column.cell(row, index)}
                      </td>
                    ))}

                    {/* Row actions */}
                    {rowActions && (
                      <td className={cellPadding} onClick={(e) => e.stopPropagation()}>
                        {rowActions(row, index)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer */}
          {showFooter && (
            <tfoot className="border-t bg-muted/30">
              <tr>
                {selectable && <td className={cellPadding} />}
                {displayColumns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      cellPadding,
                      "font-medium",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right"
                    )}
                  >
                    {typeof column.footer === "function" ? column.footer(data) : column.footer}
                  </td>
                ))}
                {rowActions && <td className={cellPadding} />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/**
 * Simple row actions dropdown
 */
export interface RowActionsProps {
  children: React.ReactNode;
}

export function RowActions({ children }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Table cell helpers
 */
export const TableCell = {
  /** Text cell with truncation */
  Text: ({
    children,
    className,
    maxWidth = 200,
  }: {
    children: React.ReactNode;
    className?: string;
    maxWidth?: number;
  }) => (
    <span
      className={cn("block truncate", className)}
      style={{ maxWidth }}
      title={typeof children === "string" ? children : undefined}
    >
      {children}
    </span>
  ),

  /** Badge cell */
  Badge: ({
    children,
    variant = "default",
  }: {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "danger" | "info";
  }) => {
    const variantClasses = {
      default: "bg-secondary text-secondary-foreground",
      success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      warning: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          variantClasses[variant]
        )}
      >
        {children}
      </span>
    );
  },

  /** Date cell */
  Date: ({
    value,
    format = "short",
  }: {
    value: Date | string | number | null | undefined;
    format?: "short" | "long" | "relative";
  }) => {
    if (!value) {
      return <span className="text-muted-foreground">—</span>;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return <span className="text-muted-foreground">—</span>;
    }

    let formatted: string;
    if (format === "relative") {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        formatted = "Today";
      } else if (days === 1) {
        formatted = "Yesterday";
      } else if (days < 7) {
        formatted = `${days} days ago`;
      } else {
        formatted = date.toLocaleDateString();
      }
    } else if (format === "long") {
      formatted = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      formatted = date.toLocaleDateString();
    }

    return <span title={date.toLocaleString()}>{formatted}</span>;
  },

  /** Currency cell */
  Currency: ({
    value,
    currency = "THB",
    locale = "th-TH",
  }: {
    value: number | null | undefined;
    currency?: string;
    locale?: string;
  }) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }

    return (
      <span className="font-mono">
        {new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
        }).format(value)}
      </span>
    );
  },

  /** Boolean cell */
  Boolean: ({
    value,
    trueLabel = "Yes",
    falseLabel = "No",
  }: {
    value: boolean | null | undefined;
    trueLabel?: string;
    falseLabel?: string;
  }) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }

    return value ? (
      <span className="inline-flex items-center text-green-600">
        <Check className="mr-1 h-4 w-4" />
        {trueLabel}
      </span>
    ) : (
      <span className="inline-flex items-center text-muted-foreground">
        <X className="mr-1 h-4 w-4" />
        {falseLabel}
      </span>
    );
  },

  /** Avatar cell */
  Avatar: ({
    src,
    name,
    size = "sm",
  }: {
    src?: string | null;
    name: string;
    size?: "sm" | "md" | "lg";
  }) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
    };

    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-full bg-primary/10 font-medium text-primary",
            sizeClasses[size]
          )}
        >
          {src ? (
            <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span>{name}</span>
      </div>
    );
  },
};

export { DropdownMenuItem as RowActionItem };
