/**
 * Comprehensive number formatting utilities for WashWise
 * Supports currency, percentages, compact notation, and Thai locale
 */

/**
 * Format options for numbers
 */
export interface NumberFormatOptions {
  /** Locale for formatting */
  locale?: string;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Use grouping separators */
  useGrouping?: boolean;
  /** Notation (standard, scientific, engineering, compact) */
  notation?: "standard" | "scientific" | "engineering" | "compact";
  /** Compact display (short or long) */
  compactDisplay?: "short" | "long";
}

/**
 * Currency format options
 */
export interface CurrencyFormatOptions extends NumberFormatOptions {
  /** Currency code (default: THB) */
  currency?: string;
  /** Currency display style */
  currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
  /** Sign display */
  signDisplay?: "auto" | "always" | "exceptZero" | "never";
}

/**
 * Percent format options
 */
export interface PercentFormatOptions extends NumberFormatOptions {
  /** Whether input is already a percentage (0-100) or decimal (0-1) */
  isPercentage?: boolean;
}

/**
 * Default locale (Thai)
 */
const DEFAULT_LOCALE = "th-TH";

/**
 * Format a number with standard formatting
 */
export function formatNumber(
  value: number | null | undefined,
  options: NumberFormatOptions = {}
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }

  const {
    locale = DEFAULT_LOCALE,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping = true,
    notation = "standard",
    compactDisplay = "short",
  } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
    notation,
    compactDisplay: notation === "compact" ? compactDisplay : undefined,
  }).format(value);
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  value: number | null | undefined,
  options: CurrencyFormatOptions = {}
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }

  const {
    locale = DEFAULT_LOCALE,
    currency = "THB",
    currencyDisplay = "symbol",
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    signDisplay = "auto",
    notation = "standard",
    compactDisplay = "short",
  } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay,
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay,
    notation,
    compactDisplay: notation === "compact" ? compactDisplay : undefined,
  }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercent(
  value: number | null | undefined,
  options: PercentFormatOptions = {}
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }

  const {
    locale = DEFAULT_LOCALE,
    isPercentage = false,
    minimumFractionDigits = 0,
    maximumFractionDigits = 1,
  } = options;

  // Convert percentage (0-100) to decimal (0-1) if needed
  const normalizedValue = isPercentage ? value / 100 : value;

  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(normalizedValue);
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(
  bytes: number | null | undefined,
  options: { decimals?: number; locale?: string } = {}
): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) {
    return "—";
  }

  if (bytes === 0) return "0 Bytes";

  const { decimals = 2, locale = "en-US" } = options;
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${formatNumber(value, { locale, maximumFractionDigits: dm })} ${sizes[i]}`;
}

/**
 * Format number with compact notation (e.g., 1.2K, 3.4M)
 */
export function formatCompact(
  value: number | null | undefined,
  options: { locale?: string; maximumFractionDigits?: number } = {}
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }

  const { locale = DEFAULT_LOCALE, maximumFractionDigits = 1 } = options;

  return formatNumber(value, {
    locale,
    notation: "compact",
    maximumFractionDigits,
  });
}

/**
 * Format number with ordinal suffix (1st, 2nd, 3rd, etc.)
 */
export function formatOrdinal(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }

  const int = Math.floor(value);
  const suffixes = ["th", "st", "nd", "rd"];
  const v = int % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];

  return `${int}${suffix}`;
}

/**
 * Format number as phone number
 */
export function formatPhone(
  value: string | number | null | undefined,
  options: { countryCode?: string } = {}
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const { countryCode = "+66" } = options;
  const digits = String(value).replace(/\D/g, "");

  // Thai phone format: 0XX-XXX-XXXX or +66 XX-XXX-XXXX
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 9) {
    return `${countryCode} ${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }

  return String(value);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number | null {
  if (!value) return null;

  // Remove currency symbols, spaces, and grouping separators
  const cleaned = value
    .replace(/[฿$€£¥₹]/g, "")
    .replace(/\s/g, "")
    .replace(/,/g, "");

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to specific decimal places
 */
export function round(value: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Calculate percentage change
 */
export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage change with sign
 */
export function formatPercentageChange(
  current: number,
  previous: number,
  options: { locale?: string; maximumFractionDigits?: number } = {}
): string {
  const { locale = DEFAULT_LOCALE, maximumFractionDigits = 1 } = options;
  const change = percentageChange(current, previous);

  const formatted = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits,
    signDisplay: "exceptZero",
  }).format(change / 100);

  return formatted;
}

/**
 * Sum an array of numbers
 */
export function sum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculate average
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

/**
 * Calculate median
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Find min and max
 */
export function minMax(values: number[]): { min: number; max: number } | null {
  if (values.length === 0) return null;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * Generate a random number between min and max (inclusive)
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pad number with leading zeros
 */
export function padNumber(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

/**
 * Format number range (e.g., "100 - 200" or "100+")
 */
export function formatRange(
  min: number | null,
  max: number | null,
  options: NumberFormatOptions = {}
): string {
  if (min === null && max === null) return "—";
  if (min !== null && max === null) return `${formatNumber(min, options)}+`;
  if (min === null && max !== null) return `Up to ${formatNumber(max, options)}`;
  return `${formatNumber(min!, options)} – ${formatNumber(max!, options)}`;
}

/**
 * Thai Baht specific formatting
 */
export const thb = {
  format: (value: number | null | undefined) =>
    formatCurrency(value, { currency: "THB", locale: "th-TH" }),

  formatCompact: (value: number | null | undefined) =>
    formatCurrency(value, { currency: "THB", locale: "th-TH", notation: "compact" }),

  parse: parseCurrency,

  /**
   * Convert Baht to Satang
   */
  toSatang: (baht: number): number => Math.round(baht * 100),

  /**
   * Convert Satang to Baht
   */
  fromSatang: (satang: number): number => satang / 100,
};

/**
 * Utility for formatting price ranges
 */
export function formatPriceRange(
  min: number | null,
  max: number | null,
  options: CurrencyFormatOptions = {}
): string {
  if (min === null && max === null) return "Free";
  if (min !== null && max === null) return `From ${formatCurrency(min, options)}`;
  if (min === null && max !== null) return `Up to ${formatCurrency(max, options)}`;
  if (min === max) return formatCurrency(min!, options);
  return `${formatCurrency(min!, options)} – ${formatCurrency(max!, options)}`;
}

/**
 * Is valid number check
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}
