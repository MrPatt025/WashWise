"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  X,
  Download,
  Settings2,
  Filter,
  MoreVertical,
  Check,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface TableColumn<T> {
  id: string;
  header: string | React.ReactNode;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: "left" | "center" | "right";
  sticky?: "left" | "right";
  hidden?: boolean;
  cell?: (
    value: T[keyof T] | React.ReactNode,
    row: T,
    index: number,
  ) => React.ReactNode;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

export interface FilterState {
  [key: string]: string;
}

// ============================================================================
// Table Context
// ============================================================================

interface TableContextValue<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortState: SortState;
  setSortState: (state: SortState) => void;
  filterState: FilterState;
  setFilterState: (state: FilterState) => void;
  selectedRows: Set<number>;
  setSelectedRows: (rows: Set<number>) => void;
  expandedRows: Set<number>;
  setExpandedRows: (rows: Set<number>) => void;
  visibleColumns: Set<string>;
  setVisibleColumns: (columns: Set<string>) => void;
}

const TableContext = React.createContext<TableContextValue<unknown> | null>(
  null,
);

function useTableContext<T>() {
  const context = React.useContext(TableContext);
  if (!context) {
    throw new Error("Table components must be used within a Table component");
  }
  return context as TableContextValue<T>;
}

// ============================================================================
// Table Root
// ============================================================================

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  children?: React.ReactNode;
  className?: string;
  onSort?: (column: string, direction: SortDirection) => void;
  onFilter?: (filters: FilterState) => void;
  onSelect?: (selectedIndexes: number[]) => void;
  defaultSort?: SortState;
  defaultFilters?: FilterState;
  stickyHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

export function Table<T>({
  data,
  columns,
  children,
  className,
  onSort,
  onFilter,
  onSelect,
  defaultSort = { column: null, direction: null },
  defaultFilters = {},
  stickyHeader = false,
  striped = false,
  bordered = false,
  hoverable = true,
  compact = false,
}: TableProps<T>) {
  const [sortState, setSortStateInternal] =
    React.useState<SortState>(defaultSort);
  const [filterState, setFilterStateInternal] =
    React.useState<FilterState>(defaultFilters);
  const [selectedRows, setSelectedRowsInternal] = React.useState<Set<number>>(
    new Set(),
  );
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(
    new Set(),
  );
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(
    new Set(columns.filter((c) => !c.hidden).map((c) => c.id)),
  );

  const setSortState = (state: SortState) => {
    setSortStateInternal(state);
    if (state.column && state.direction) {
      onSort?.(state.column, state.direction);
    }
  };

  const setFilterState = (state: FilterState) => {
    setFilterStateInternal(state);
    onFilter?.(state);
  };

  const setSelectedRows = (rows: Set<number>) => {
    setSelectedRowsInternal(rows);
    onSelect?.(Array.from(rows));
  };

  const contextValue = {
    data,
    columns,
    sortState,
    setSortState,
    filterState,
    setFilterState,
    selectedRows,
    setSelectedRows,
    expandedRows,
    setExpandedRows,
    visibleColumns,
    setVisibleColumns,
  } as TableContextValue<unknown>;

  return (
    <TableContext.Provider value={contextValue}>
      <div
        className={cn(
          "w-full overflow-auto",
          bordered && "border border-gray-200 dark:border-gray-700 rounded-lg",
          className,
        )}
      >
        <table
          className={cn(
            "w-full border-collapse text-left",
            compact ? "text-sm" : "text-sm",
            striped &&
              "[&_tbody_tr:nth-child(even)]:bg-gray-50 dark:[&_tbody_tr:nth-child(even)]:bg-gray-800/50",
            hoverable &&
              "[&_tbody_tr]:hover:bg-gray-50 dark:[&_tbody_tr]:hover:bg-gray-800/50",
          )}
          data-sticky-header={stickyHeader || undefined}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

// ============================================================================
// Table Header
// ============================================================================

interface TableHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  const stickyParent = React.useRef<HTMLTableSectionElement>(null);
  const isSticky = stickyParent.current?.closest("table")?.dataset.stickyHeader;

  return (
    <thead
      ref={stickyParent}
      className={cn(
        "bg-gray-50 dark:bg-gray-800",
        isSticky && "sticky top-0 z-10",
        className,
      )}
    >
      {children}
    </thead>
  );
}

// ============================================================================
// Table Header Row
// ============================================================================

interface TableHeaderRowProps {
  children?: React.ReactNode;
  selectable?: boolean;
  className?: string;
}

export function TableHeaderRow({
  children,
  selectable,
  className,
}: TableHeaderRowProps) {
  const { data, selectedRows, setSelectedRows } = useTableContext();

  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, i) => i)));
    }
  };

  return (
    <tr
      className={cn("border-b border-gray-200 dark:border-gray-700", className)}
    >
      {selectable && (
        <th className="w-12 px-4 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            aria-label={allSelected ? "Deselect all" : "Select all"}
          />
        </th>
      )}
      {children}
    </tr>
  );
}

// ============================================================================
// Table Header Cell
// ============================================================================

interface TableHeaderCellProps {
  column: string;
  children?: React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
}

export function TableHeaderCell({
  column,
  children,
  sortable = false,
  align = "left",
  className,
}: TableHeaderCellProps) {
  const { sortState, setSortState } = useTableContext();

  const isCurrentSort = sortState.column === column;
  const currentDirection = isCurrentSort ? sortState.direction : null;

  const handleSort = () => {
    if (!sortable) return;

    let newDirection: SortDirection = "asc";
    if (currentDirection === "asc") {
      newDirection = "desc";
    } else if (currentDirection === "desc") {
      newDirection = null;
    }

    setSortState({
      column: newDirection ? column : null,
      direction: newDirection,
    });
  };

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold text-gray-900 dark:text-gray-100",
        alignClasses[align],
        sortable &&
          "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/50",
        className,
      )}
      onClick={handleSort}
      aria-sort={
        currentDirection === "asc"
          ? "ascending"
          : currentDirection === "desc"
            ? "descending"
            : undefined
      }
    >
      <div
        className={cn(
          "flex items-center gap-2",
          align === "center" && "justify-center",
          align === "right" && "justify-end",
        )}
      >
        {children}
        {sortable && (
          <span className="flex-shrink-0">
            {currentDirection === "asc" ? (
              <ChevronUp className="w-4 h-4" />
            ) : currentDirection === "desc" ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronsUpDown className="w-4 h-4 text-gray-400" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

// ============================================================================
// Table Body
// ============================================================================

interface TableBodyProps {
  children?: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return <tbody className={className}>{children}</tbody>;
}

// ============================================================================
// Table Row
// ============================================================================

interface TableRowProps {
  children?: React.ReactNode;
  index?: number;
  selectable?: boolean;
  expandable?: boolean;
  expandedContent?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({
  children,
  index,
  selectable,
  expandable,
  expandedContent,
  onClick,
  className,
}: TableRowProps) {
  const { selectedRows, setSelectedRows, expandedRows, setExpandedRows } =
    useTableContext();

  const isSelected = index !== undefined && selectedRows.has(index);
  const isExpanded = index !== undefined && expandedRows.has(index);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (index === undefined) return;

    const newSelected = new Set(selectedRows);
    if (e.target.checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);
  };

  const handleExpand = () => {
    if (index === undefined) return;

    const newExpanded = new Set(expandedRows);
    if (isExpanded) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <>
      <tr
        className={cn(
          "border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors",
          isSelected && "bg-blue-50 dark:bg-blue-900/20",
          onClick && "cursor-pointer",
          className,
        )}
        onClick={onClick}
        aria-selected={isSelected || undefined}
      >
        {selectable && (
          <td className="w-12 px-4 py-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelect}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
          </td>
        )}
        {expandable && (
          <td className="w-12 px-4 py-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExpand();
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-expanded={isExpanded}
            >
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-400 transition-transform",
                  isExpanded && "rotate-180",
                )}
              />
            </button>
          </td>
        )}
        {children}
      </tr>

      {expandable && expandedContent && (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <tr>
              <td
                colSpan={100}
                className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700"
              >
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4">{expandedContent}</div>
                </motion.div>
              </td>
            </tr>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

// ============================================================================
// Table Cell
// ============================================================================

interface TableCellProps {
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export function TableCell({
  children,
  align = "left",
  className,
}: TableCellProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <td
      className={cn(
        "px-4 py-3 text-gray-700 dark:text-gray-300",
        alignClasses[align],
        className,
      )}
    >
      {children}
    </td>
  );
}

// ============================================================================
// Table Footer
// ============================================================================

interface TableFooterProps {
  children?: React.ReactNode;
  className?: string;
}

export function TableFooter({ children, className }: TableFooterProps) {
  return (
    <tfoot
      className={cn(
        "bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      {children}
    </tfoot>
  );
}

// ============================================================================
// Table Toolbar
// ============================================================================

interface TableToolbarProps {
  children?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actions?: React.ReactNode;
  className?: string;
}

export function TableToolbar({
  children,
  searchable,
  searchPlaceholder = "Search...",
  onSearch,
  actions,
  className,
}: TableToolbarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        {searchable && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ============================================================================
// Column Visibility Toggle
// ============================================================================

interface ColumnVisibilityToggleProps {
  className?: string;
}

export function ColumnVisibilityToggle({
  className,
}: ColumnVisibilityToggleProps) {
  const { columns, visibleColumns, setVisibleColumns } = useTableContext();
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

  const toggleColumn = (columnId: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    setVisibleColumns(newVisible);
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Settings2 className="w-4 h-4" />
        Columns
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
          {columns.map((column) => (
            <button
              key={column.id}
              onClick={() => toggleColumn(column.id)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center",
                  visibleColumns.has(column.id)
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 dark:border-gray-600",
                )}
              >
                {visibleColumns.has(column.id) && <Check className="w-3 h-3" />}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {typeof column.header === "string" ? column.header : column.id}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Export Button
// ============================================================================

interface ExportButtonProps {
  onExport: (format: "csv" | "json" | "xlsx") => void;
  formats?: ("csv" | "json" | "xlsx")[];
  className?: string;
}

export function ExportButton({
  onExport,
  formats = ["csv", "json"],
  className,
}: ExportButtonProps) {
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

  const formatLabels = {
    csv: "Export as CSV",
    json: "Export as JSON",
    xlsx: "Export as Excel",
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
          {formats.map((format) => (
            <button
              key={format}
              onClick={() => {
                onExport(format);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {formatLabels[format]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Filter Panel
// ============================================================================

interface FilterPanelProps {
  filters: Array<{
    id: string;
    label: string;
    type: "text" | "select" | "date" | "number";
    options?: Array<{ value: string; label: string }>;
  }>;
  onFilter: (filters: FilterState) => void;
  className?: string;
}

export function FilterPanel({
  filters,
  onFilter,
  className,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [values, setValues] = React.useState<FilterState>({});
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

  const handleApply = () => {
    onFilter(values);
    setIsOpen(false);
  };

  const handleClear = () => {
    setValues({});
    onFilter({});
    setIsOpen(false);
  };

  const activeCount = Object.values(values).filter(Boolean).length;

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeCount > 0 && (
          <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-white bg-blue-600 rounded-full">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
          <div className="p-4 space-y-4">
            {filters.map((filter) => (
              <div key={filter.id}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {filter.label}
                </label>
                {filter.type === "select" ? (
                  <select
                    value={values[filter.id] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [filter.id]: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={filter.type}
                    value={values[filter.id] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [filter.id]: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Clear all
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Row Actions Menu
// ============================================================================

interface RowActionsProps {
  actions: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    destructive?: boolean;
    disabled?: boolean;
  }>;
  className?: string;
}

export function RowActions({ actions, className }: RowActionsProps) {
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
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Row actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                if (!action.disabled) {
                  action.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={action.disabled}
              className={cn(
                "w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors",
                action.destructive
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                action.disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Empty Table State
// ============================================================================

interface EmptyTableProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyTable({
  icon,
  title = "No data",
  description = "There are no records to display.",
  action,
  className,
}: EmptyTableProps) {
  return (
    <tr>
      <td colSpan={100}>
        <div
          className={cn(
            "flex flex-col items-center justify-center py-12 text-center",
            className,
          )}
        >
          {icon && (
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {description}
          </p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
