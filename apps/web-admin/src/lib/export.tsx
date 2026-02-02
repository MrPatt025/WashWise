"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileJson, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Export format types
 */
export type ExportFormat = "csv" | "json" | "xlsx";

/**
 * Column definition for export
 */
export interface ExportColumn<T> {
  /** Key of the data field */
  key: keyof T | string;
  /** Header label for the column */
  header: string;
  /** Format function for the value */
  format?: (value: unknown, row: T) => string | number;
  /** Width for XLSX export */
  width?: number;
}

/**
 * Export options
 */
export interface ExportOptions<T> {
  /** Filename (without extension) */
  filename: string;
  /** Column definitions */
  columns: ExportColumn<T>[];
  /** Data to export */
  data: T[];
  /** Export format */
  format: ExportFormat;
  /** Include header row */
  includeHeader?: boolean;
  /** Sheet name for XLSX */
  sheetName?: string;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Format value for CSV (escape quotes and commas)
 */
function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  
  const stringValue = String(value);
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T>(options: Omit<ExportOptions<T>, "format">): void {
  const { filename, columns, data, includeHeader = true } = options;

  const rows: string[] = [];

  // Add header row
  if (includeHeader) {
    rows.push(columns.map((col) => formatCSVValue(col.header)).join(","));
  }

  // Add data rows
  data.forEach((row) => {
    const rowValues = columns.map((col) => {
      const rawValue = getNestedValue(row, String(col.key));
      const value = col.format ? col.format(rawValue, row) : rawValue;
      return formatCSVValue(value);
    });
    rows.push(rowValues.join(","));
  });

  const csvContent = rows.join("\n");
  downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
}

/**
 * Export data to JSON format
 */
export function exportToJSON<T>(options: Omit<ExportOptions<T>, "format">): void {
  const { filename, columns, data } = options;

  // Transform data using column definitions
  const transformedData = data.map((row) => {
    const transformed: Record<string, unknown> = {};
    columns.forEach((col) => {
      const rawValue = getNestedValue(row, String(col.key));
      const value = col.format ? col.format(rawValue, row) : rawValue;
      transformed[col.header] = value;
    });
    return transformed;
  });

  const jsonContent = JSON.stringify(transformedData, null, 2);
  downloadFile(jsonContent, `${filename}.json`, "application/json");
}

/**
 * Export data to XLSX format (requires xlsx library to be installed)
 * Falls back to CSV if xlsx is not available
 */
export async function exportToXLSX<T>(options: Omit<ExportOptions<T>, "format">): Promise<void> {
  const { filename, columns, data, sheetName = "Sheet1" } = options;

  try {
    // Dynamic import for xlsx library (optional dependency)
    const XLSX = await import("xlsx");

    // Prepare worksheet data
    const wsData: (string | number)[][] = [];

    // Add header row
    wsData.push(columns.map((col) => col.header));

    // Add data rows
    data.forEach((row) => {
      const rowValues = columns.map((col) => {
        const rawValue = getNestedValue(row, String(col.key));
        const value = col.format ? col.format(rawValue, row) : rawValue;
        return value as string | number;
      });
      wsData.push(rowValues);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = columns.map((col) => ({ wch: col.width || 15 }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate file
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch {
    // Fallback to CSV if xlsx library is not available
    console.warn("xlsx library not available, falling back to CSV export");
    exportToCSV(options);
  }
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export data based on format
 */
export async function exportData<T>(options: ExportOptions<T>): Promise<void> {
  const { format, ...rest } = options;

  switch (format) {
    case "csv":
      exportToCSV(rest);
      break;
    case "json":
      exportToJSON(rest);
      break;
    case "xlsx":
      await exportToXLSX(rest);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export Button Component
 */
export interface ExportButtonProps<T> {
  /** Data to export */
  data: T[];
  /** Column definitions */
  columns: ExportColumn<T>[];
  /** Base filename (without extension) */
  filename: string;
  /** Available formats */
  formats?: ExportFormat[];
  /** Disabled state */
  disabled?: boolean;
  /** Button variant */
  variant?: "default" | "outline" | "ghost";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Custom class name */
  className?: string;
  /** Callback when export starts */
  onExportStart?: (format: ExportFormat) => void;
  /** Callback when export completes */
  onExportComplete?: (format: ExportFormat) => void;
  /** Callback on export error */
  onExportError?: (error: Error, format: ExportFormat) => void;
}

export function ExportButton<T>({
  data,
  columns,
  filename,
  formats = ["csv", "json", "xlsx"],
  disabled,
  variant = "outline",
  size = "default",
  className,
  onExportStart,
  onExportComplete,
  onExportError,
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportingFormat, setExportingFormat] = React.useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportingFormat(format);
    onExportStart?.(format);

    try {
      await exportData({
        data,
        columns,
        filename,
        format,
      });
      onExportComplete?.(format);
    } catch (error) {
      console.error("Export error:", error);
      onExportError?.(error as Error, format);
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const formatIcons: Record<ExportFormat, React.ReactNode> = {
    csv: <FileText className="mr-2 h-4 w-4" />,
    json: <FileJson className="mr-2 h-4 w-4" />,
    xlsx: <FileSpreadsheet className="mr-2 h-4 w-4" />,
  };

  const formatLabels: Record<ExportFormat, string> = {
    csv: "CSV",
    json: "JSON",
    xlsx: "Excel",
  };

  // Single format - simple button
  if (formats.length === 1) {
    const format = formats[0];
    return (
      <Button
        variant={variant}
        size={size}
        disabled={disabled || isExporting || data.length === 0}
        className={className}
        onClick={() => handleExport(format)}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Export {formatLabels[format]}
      </Button>
    );
  }

  // Multiple formats - dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting || data.length === 0}
          className={className}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            disabled={exportingFormat === format}
          >
            {exportingFormat === format ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              formatIcons[format]
            )}
            Export as {formatLabels[format]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Hook for export functionality
 */
export function useExport<T>() {
  const [isExporting, setIsExporting] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const exportDataAsync = React.useCallback(
    async (options: ExportOptions<T>) => {
      setIsExporting(true);
      setError(null);

      try {
        await exportData(options);
      } catch (err) {
        const exportError = err instanceof Error ? err : new Error(String(err));
        setError(exportError);
        throw exportError;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return {
    exportData: exportDataAsync,
    isExporting,
    error,
  };
}

/**
 * Pre-built column formatters
 */
export const columnFormatters = {
  /** Format date value */
  date: (format: "short" | "long" | "iso" = "short") => {
    return (value: unknown) => {
      if (!value) return "";
      const date = new Date(value as string | number | Date);
      if (isNaN(date.getTime())) return "";

      switch (format) {
        case "iso":
          return date.toISOString();
        case "long":
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        case "short":
        default:
          return date.toLocaleDateString();
      }
    };
  },

  /** Format datetime value */
  datetime: (value: unknown) => {
    if (!value) return "";
    const date = new Date(value as string | number | Date);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString();
  },

  /** Format currency value */
  currency: (currency = "THB", locale = "th-TH") => {
    return (value: unknown) => {
      if (value === null || value === undefined) return "";
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).format(Number(value));
    };
  },

  /** Format number with locale */
  number: (decimals?: number) => {
    return (value: unknown) => {
      if (value === null || value === undefined) return "";
      const num = Number(value);
      if (isNaN(num)) return "";
      return decimals !== undefined
        ? num.toFixed(decimals)
        : num.toLocaleString();
    };
  },

  /** Format percentage */
  percent: (decimals = 1) => {
    return (value: unknown) => {
      if (value === null || value === undefined) return "";
      return `${Number(value).toFixed(decimals)}%`;
    };
  },

  /** Format boolean as Yes/No */
  yesNo: (value: unknown) => {
    return value ? "Yes" : "No";
  },

  /** Format array as comma-separated string */
  array: (separator = ", ") => {
    return (value: unknown) => {
      if (!Array.isArray(value)) return "";
      return value.join(separator);
    };
  },

  /** Truncate long text */
  truncate: (maxLength: number) => {
    return (value: unknown) => {
      if (!value) return "";
      const str = String(value);
      return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
    };
  },
};
