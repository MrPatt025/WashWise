/**
 * Comprehensive date and time utilities for WashWise
 * Handles formatting, parsing, relative time, and Thai locale support
 */

/**
 * Date formats
 */
export type DateFormat =
    | "short" // 01/15/24
    | "medium" // Jan 15, 2024
    | "long" // January 15, 2024
    | "full" // Monday, January 15, 2024
    | "iso" // 2024-01-15
    | "thai" // 15 ม.ค. 2567
    | "thai-full"; // 15 มกราคม 2567

export type TimeFormat =
    | "short" // 2:30 PM
    | "medium" // 2:30:45 PM
    | "24h" // 14:30
    | "24h-seconds"; // 14:30:45

export type DateTimeFormat = `${DateFormat}-${TimeFormat}`;

/**
 * Thai month names
 */
const THAI_MONTHS_SHORT = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const THAI_MONTHS_FULL = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const THAI_DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

const THAI_DAYS_FULL = [
    "วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ",
    "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์",
];

/**
 * Parse date from various inputs
 */
export function parseDate(value: Date | string | number | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Format date according to format type
 */
export function formatDate(
    value: Date | string | number | null | undefined,
    format: DateFormat = "medium",
    locale: string = "en-US"
): string {
    const date = parseDate(value);
    if (!date) return "—";

    switch (format) {
        case "short":
            return date.toLocaleDateString(locale, {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
            });

        case "medium":
            return date.toLocaleDateString(locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
            });

        case "long":
            return date.toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

        case "full":
            return date.toLocaleDateString(locale, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });

        case "iso":
            return date.toISOString().split("T")[0];

        case "thai": {
            const day = date.getDate();
            const month = THAI_MONTHS_SHORT[date.getMonth()];
            const year = date.getFullYear() + 543; // Buddhist Era
            return `${day} ${month} ${year}`;
        }

        case "thai-full": {
            const day = date.getDate();
            const month = THAI_MONTHS_FULL[date.getMonth()];
            const year = date.getFullYear() + 543;
            return `${day} ${month} ${year}`;
        }

        default:
            return date.toLocaleDateString(locale);
    }
}

/**
 * Format time according to format type
 */
export function formatTime(
    value: Date | string | number | null | undefined,
    format: TimeFormat = "short",
    locale: string = "en-US"
): string {
    const date = parseDate(value);
    if (!date) return "—";

    switch (format) {
        case "short":
            return date.toLocaleTimeString(locale, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });

        case "medium":
            return date.toLocaleTimeString(locale, {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            });

        case "24h":
            return date.toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });

        case "24h-seconds":
            return date.toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });

        default:
            return date.toLocaleTimeString(locale);
    }
}

/**
 * Format date and time together
 */
export function formatDateTime(
    value: Date | string | number | null | undefined,
    dateFormat: DateFormat = "medium",
    timeFormat: TimeFormat = "short",
    locale: string = "en-US"
): string {
    const date = parseDate(value);
    if (!date) return "—";

    return `${formatDate(date, dateFormat, locale)} ${formatTime(date, timeFormat, locale)}`;
}

/**
 * Relative time formatting
 */
export interface RelativeTimeOptions {
    /** Whether to show "ago" suffix */
    addSuffix?: boolean;
    /** Locale for formatting */
    locale?: string;
    /** Base date for comparison (defaults to now) */
    baseDate?: Date;
    /** Maximum unit to use (e.g., stop at "days" instead of going to months) */
    maxUnit?: "second" | "minute" | "hour" | "day" | "week" | "month" | "year";
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
    value: Date | string | number | null | undefined,
    options: RelativeTimeOptions = {}
): string {
    const { addSuffix = true, locale = "en-US", baseDate = new Date(), maxUnit } = options;

    const date = parseDate(value);
    if (!date) return "—";

    const diff = date.getTime() - baseDate.getTime();
    const absDiff = Math.abs(diff);
    const isFuture = diff > 0;

    let unitValue: number;
    let unit: Intl.RelativeTimeFormatUnit;

    // Determine the appropriate unit
    if (absDiff < MINUTE && maxUnit !== "second") {
        return addSuffix ? (isFuture ? "in a moment" : "just now") : "now";
    } else if (absDiff < MINUTE || maxUnit === "second") {
        unitValue = Math.round(absDiff / SECOND);
        unit = "second";
    } else if (absDiff < HOUR || maxUnit === "minute") {
        unitValue = Math.round(absDiff / MINUTE);
        unit = "minute";
    } else if (absDiff < DAY || maxUnit === "hour") {
        unitValue = Math.round(absDiff / HOUR);
        unit = "hour";
    } else if (absDiff < WEEK || maxUnit === "day") {
        unitValue = Math.round(absDiff / DAY);
        unit = "day";
    } else if (absDiff < MONTH || maxUnit === "week") {
        unitValue = Math.round(absDiff / WEEK);
        unit = "week";
    } else if (absDiff < YEAR || maxUnit === "month") {
        unitValue = Math.round(absDiff / MONTH);
        unit = "month";
    } else {
        unitValue = Math.round(absDiff / YEAR);
        unit = "year";
    }

    const rtf = new Intl.RelativeTimeFormat(locale, {
        numeric: "auto",
        style: "long",
    });

    return rtf.format(isFuture ? unitValue : -unitValue, unit);
}

/**
 * Get human-readable duration string
 */
export function formatDuration(
    milliseconds: number,
    options: {
        /** Maximum number of parts to include */
        maxParts?: number;
        /** Use short labels (h, m, s) instead of full words */
        short?: boolean;
    } = {}
): string {
    const { maxParts = 2, short = false } = options;

    if (milliseconds < 1000) {
        return short ? "0s" : "0 seconds";
    }

    const parts: string[] = [];
    let remaining = milliseconds;

    const units = [
        { ms: YEAR, label: short ? "y" : " year" },
        { ms: MONTH, label: short ? "mo" : " month" },
        { ms: WEEK, label: short ? "w" : " week" },
        { ms: DAY, label: short ? "d" : " day" },
        { ms: HOUR, label: short ? "h" : " hour" },
        { ms: MINUTE, label: short ? "m" : " minute" },
        { ms: SECOND, label: short ? "s" : " second" },
    ];

    for (const { ms, label } of units) {
        if (remaining >= ms && parts.length < maxParts) {
            const value = Math.floor(remaining / ms);
            remaining %= ms;

            if (short) {
                parts.push(`${value}${label}`);
            } else {
                parts.push(`${value}${label}${value !== 1 ? "s" : ""}`);
            }
        }
    }

    return parts.join(short ? " " : ", ");
}

/**
 * Check if date is today
 */
export function isToday(value: Date | string | number | null | undefined): boolean {
    const date = parseDate(value);
    if (!date) return false;

    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(value: Date | string | number | null | undefined): boolean {
    const date = parseDate(value);
    if (!date) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    );
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(value: Date | string | number | null | undefined): boolean {
    const date = parseDate(value);
    if (!date) return false;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return (
        date.getDate() === tomorrow.getDate() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getFullYear() === tomorrow.getFullYear()
    );
}

/**
 * Check if date is in the past
 */
export function isPast(value: Date | string | number | null | undefined): boolean {
    const date = parseDate(value);
    if (!date) return false;
    return date.getTime() < Date.now();
}

/**
 * Check if date is in the future
 */
export function isFuture(value: Date | string | number | null | undefined): boolean {
    const date = parseDate(value);
    if (!date) return false;
    return date.getTime() > Date.now();
}

/**
 * Get start of day
 */
export function startOfDay(value: Date | string | number | null | undefined): Date | null {
    const date = parseDate(value);
    if (!date) return null;

    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Get end of day
 */
export function endOfDay(value: Date | string | number | null | undefined): Date | null {
    const date = parseDate(value);
    if (!date) return null;

    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

/**
 * Get start of week
 */
export function startOfWeek(
    value: Date | string | number | null | undefined,
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): Date | null {
    const date = parseDate(value);
    if (!date) return null;

    const result = new Date(date);
    const day = result.getDay();
    const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Get start of month
 */
export function startOfMonth(value: Date | string | number | null | undefined): Date | null {
    const date = parseDate(value);
    if (!date) return null;

    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Add time to date
 */
export function addTime(
    value: Date | string | number | null | undefined,
    amount: number,
    unit: "second" | "minute" | "hour" | "day" | "week" | "month" | "year"
): Date | null {
    const date = parseDate(value);
    if (!date) return null;

    const result = new Date(date);

    switch (unit) {
        case "second":
            result.setSeconds(result.getSeconds() + amount);
            break;
        case "minute":
            result.setMinutes(result.getMinutes() + amount);
            break;
        case "hour":
            result.setHours(result.getHours() + amount);
            break;
        case "day":
            result.setDate(result.getDate() + amount);
            break;
        case "week":
            result.setDate(result.getDate() + amount * 7);
            break;
        case "month":
            result.setMonth(result.getMonth() + amount);
            break;
        case "year":
            result.setFullYear(result.getFullYear() + amount);
            break;
    }

    return result;
}

/**
 * Get difference between two dates
 */
export function dateDiff(
    start: Date | string | number | null | undefined,
    end: Date | string | number | null | undefined,
    unit: "second" | "minute" | "hour" | "day" | "week" | "month" | "year" = "day"
): number | null {
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    if (!startDate || !endDate) return null;

    const diff = endDate.getTime() - startDate.getTime();

    switch (unit) {
        case "second":
            return Math.floor(diff / SECOND);
        case "minute":
            return Math.floor(diff / MINUTE);
        case "hour":
            return Math.floor(diff / HOUR);
        case "day":
            return Math.floor(diff / DAY);
        case "week":
            return Math.floor(diff / WEEK);
        case "month":
            return Math.floor(diff / MONTH);
        case "year":
            return Math.floor(diff / YEAR);
        default:
            return diff;
    }
}

/**
 * Format date for display with smart relative formatting
 */
export function smartFormatDate(
    value: Date | string | number | null | undefined,
    options: {
        /** Show time for recent dates */
        showTime?: boolean;
        /** Locale */
        locale?: string;
    } = {}
): string {
    const { showTime = true, locale = "en-US" } = options;
    const date = parseDate(value);
    if (!date) return "—";

    if (isToday(date)) {
        return showTime ? `Today at ${formatTime(date, "short", locale)}` : "Today";
    }

    if (isYesterday(date)) {
        return showTime ? `Yesterday at ${formatTime(date, "short", locale)}` : "Yesterday";
    }

    if (isTomorrow(date)) {
        return showTime ? `Tomorrow at ${formatTime(date, "short", locale)}` : "Tomorrow";
    }

    // Within last week
    const daysDiff = dateDiff(date, new Date(), "day");
    if (daysDiff !== null && daysDiff >= -7 && daysDiff <= 7) {
        return formatRelativeTime(date, { locale });
    }

    // Older dates
    const currentYear = new Date().getFullYear();
    if (date.getFullYear() === currentYear) {
        return formatDate(date, "medium", locale);
    }

    return formatDate(date, "long", locale);
}

/**
 * Get time slots for scheduling
 */
export function generateTimeSlots(
    startHour: number = 0,
    endHour: number = 24,
    intervalMinutes: number = 30
): { value: string; label: string }[] {
    const slots: { value: string; label: string }[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
            const h = hour.toString().padStart(2, "0");
            const m = minute.toString().padStart(2, "0");
            const value = `${h}:${m}`;

            const date = new Date();
            date.setHours(hour, minute, 0, 0);
            const label = formatTime(date, "short");

            slots.push({ value, label });
        }
    }

    return slots;
}

/**
 * Thai utilities
 */
export const thai = {
    formatDate: (value: Date | string | number | null | undefined, full = false) =>
        formatDate(value, full ? "thai-full" : "thai"),

    getDayName: (date: Date, full = false) =>
        full ? THAI_DAYS_FULL[date.getDay()] : THAI_DAYS_SHORT[date.getDay()],

    getMonthName: (month: number, full = false) =>
        full ? THAI_MONTHS_FULL[month] : THAI_MONTHS_SHORT[month],

    toBuddhistYear: (year: number) => year + 543,

    fromBuddhistYear: (year: number) => year - 543,
};
