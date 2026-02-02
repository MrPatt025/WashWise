"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Pagination props
 */
export interface PaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems?: number;
  /** Items per page */
  pageSize?: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Number of page buttons to show */
  siblingCount?: number;
  /** Show page size selector */
  showPageSize?: boolean;
  /** Available page sizes */
  pageSizes?: number[];
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void;
  /** Additional class name */
  className?: string;
  /** Show first/last page buttons */
  showFirstLast?: boolean;
}

/**
 * Generate page numbers to display
 */
function generatePagination(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | "ellipsis")[] {
  const totalPageNumbers = siblingCount * 2 + 5; // siblings + current + first + last + 2 ellipsis

  // If total pages is less than the page numbers we want to show, show all
  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    // Show first N pages + ellipsis + last page
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis", totalPages];
  }

  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    // Show first page + ellipsis + last N pages
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, "ellipsis", ...rightRange];
  }

  // Show first + ellipsis + middle + ellipsis + last
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
}

/**
 * Pagination component
 */
export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize = 20,
  onPageChange,
  siblingCount = 1,
  showPageSize = false,
  pageSizes = [10, 20, 50, 100],
  onPageSizeChange,
  className,
  showFirstLast = false,
}: PaginationProps) {
  const pages = generatePagination(page, totalPages, siblingCount);

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  // Calculate item range
  const startItem = totalItems ? (page - 1) * pageSize + 1 : 0;
  const endItem = totalItems ? Math.min(page * pageSize, totalItems) : 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      role="navigation"
      aria-label="Pagination"
    >
      {/* Item count */}
      {totalItems !== undefined && (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{startItem}</span> to{" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalItems}</span> results
        </p>
      )}

      {/* Page size selector */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-muted-foreground">
            Per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* First page button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            aria-label="Go to first page"
          >
            <ChevronLeft className="h-4 w-4" />
            <ChevronLeft className="-ml-2 h-4 w-4" />
          </Button>
        )}

        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page numbers */}
        <div className="hidden items-center gap-1 md:flex">
          {pages.map((pageNum, index) =>
            pageNum === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center"
                aria-hidden
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                aria-label={`Page ${pageNum}`}
                aria-current={page === pageNum ? "page" : undefined}
                className="h-9 w-9"
              >
                {pageNum}
              </Button>
            )
          )}
        </div>

        {/* Mobile page indicator */}
        <span className="flex items-center gap-1 px-2 text-sm text-muted-foreground md:hidden">
          Page {page} of {totalPages}
        </span>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            aria-label="Go to last page"
          >
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="-ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Simple pagination for minimal UIs
 */
export interface SimplePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SimplePagination({
  page,
  totalPages,
  onPageChange,
  className,
}: SimplePaginationProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Hook for pagination state management
 */
export function usePagination(options: {
  initialPage?: number;
  initialPageSize?: number;
  total?: number;
}) {
  const { initialPage = 1, initialPageSize = 20, total = 0 } = options;

  const [page, setPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset to page 1 when total changes significantly
  React.useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [totalPages, page]);

  const goToPage = React.useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(newPage, totalPages)));
    },
    [totalPages]
  );

  const nextPage = React.useCallback(() => {
    goToPage(page + 1);
  }, [goToPage, page]);

  const previousPage = React.useCallback(() => {
    goToPage(page - 1);
  }, [goToPage, page]);

  const changePageSize = React.useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  return {
    page,
    pageSize,
    totalPages,
    setPage: goToPage,
    setPageSize: changePageSize,
    nextPage,
    previousPage,
    canGoNext: page < totalPages,
    canGoPrevious: page > 1,
  };
}
