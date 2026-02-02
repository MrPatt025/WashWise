/**
 * Comprehensive string utilities for WashWise
 * Includes formatting, validation, transformation, and Thai text support
 */

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize the first letter of each word
 */
export function titleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

/**
 * Convert string to camelCase
 */
export function camelCase(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

/**
 * Convert string to kebab-case
 */
export function kebabCase(str: string): string {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Convert string to snake_case
 */
export function snakeCase(str: string): string {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

/**
 * Truncate string to a maximum length
 */
export function truncate(str: string, maxLength: number, suffix: string = "..."): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Truncate string in the middle (useful for file paths, IDs)
 */
export function truncateMiddle(str: string, maxLength: number, separator: string = "..."): string {
  if (!str || str.length <= maxLength) return str;

  const charsToShow = maxLength - separator.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return str.slice(0, frontChars) + separator + str.slice(-backChars);
}

/**
 * Remove extra whitespace from a string
 */
export function normalizeWhitespace(str: string): string {
  if (!str) return "";
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Generate a slug from a string
 */
export function slugify(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Check if string contains only letters
 */
export function isAlpha(str: string): boolean {
  return /^[a-zA-Z]+$/.test(str);
}

/**
 * Check if string contains only alphanumeric characters
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Check if string is a valid email
 */
export function isEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Check if string is a valid URL
 */
export function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is a valid Thai phone number
 */
export function isThaiPhoneNumber(str: string): boolean {
  const cleaned = str.replace(/\D/g, "");
  // Thai mobile: 0[689]XXXXXXXX or landline: 0[23457]XXXXXXX
  return /^0[689]\d{8}$/.test(cleaned) || /^0[23457]\d{7}$/.test(cleaned);
}

/**
 * Check if string is a valid Thai ID card number
 */
export function isThaiIdCard(str: string): boolean {
  const cleaned = str.replace(/\D/g, "");
  if (cleaned.length !== 13) return false;

  // Checksum validation
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleaned[12]);
}

/**
 * Format Thai phone number
 */
export function formatThaiPhone(str: string): string {
  const cleaned = str.replace(/\D/g, "");
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 9) {
    return `+66 ${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  return str;
}

/**
 * Format Thai ID card number
 */
export function formatThaiIdCard(str: string): string {
  const cleaned = str.replace(/\D/g, "");
  if (cleaned.length !== 13) return str;
  return `${cleaned[0]}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned[12]}`;
}

/**
 * Mask string (useful for sensitive data)
 */
export function mask(
  str: string,
  options: {
    start?: number;
    end?: number;
    char?: string;
  } = {}
): string {
  const { start = 3, end = 3, char = "*" } = options;
  if (!str || str.length <= start + end) return str;

  const maskLength = str.length - start - end;
  return str.slice(0, start) + char.repeat(maskLength) + str.slice(-end);
}

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;

  const [local, domain] = email.split("@");
  const maskedLocal = mask(local, { start: 2, end: 1 });
  return `${maskedLocal}@${domain}`;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name) return "";

  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, maxLength);
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

/**
 * Format count with noun (e.g., "1 item", "5 items")
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}

/**
 * Generate a random string
 */
export function randomString(
  length: number,
  options: {
    includeNumbers?: boolean;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeSymbols?: boolean;
  } = {}
): string {
  const {
    includeNumbers = true,
    includeUppercase = true,
    includeLowercase = true,
    includeSymbols = false,
  } = options;

  let chars = "";
  if (includeNumbers) chars += "0123456789";
  if (includeUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeLowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (includeSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";

  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a UUID v4
 */
export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Highlight search term in text
 */
export function highlight(
  text: string,
  searchTerm: string,
  wrapFn: (match: string) => string = (m) => `<mark>${m}</mark>`
): string {
  if (!text || !searchTerm) return text;

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
  return text.replace(regex, (match) => wrapFn(match));
}

/**
 * Escape special regex characters
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compare strings case-insensitively
 */
export function equalsIgnoreCase(str1: string, str2: string): boolean {
  return str1.toLowerCase() === str2.toLowerCase();
}

/**
 * Check if string contains substring (case-insensitive)
 */
export function includesIgnoreCase(str: string, searchString: string): boolean {
  return str.toLowerCase().includes(searchString.toLowerCase());
}

/**
 * Count occurrences of a substring
 */
export function countOccurrences(str: string, searchString: string): number {
  if (!str || !searchString) return 0;
  return (str.match(new RegExp(escapeRegExp(searchString), "g")) || []).length;
}

/**
 * Pad string to a certain length
 */
export function pad(
  str: string,
  length: number,
  char: string = " ",
  position: "start" | "end" | "both" = "end"
): string {
  if (str.length >= length) return str;

  const padLength = length - str.length;

  switch (position) {
    case "start":
      return char.repeat(padLength) + str;
    case "end":
      return str + char.repeat(padLength);
    case "both": {
      const startPad = Math.floor(padLength / 2);
      const endPad = padLength - startPad;
      return char.repeat(startPad) + str + char.repeat(endPad);
    }
  }
}

/**
 * Remove accents/diacritics from string
 */
export function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Check if string is empty or only whitespace
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Check if string is not empty and not only whitespace
 */
export function isNotEmpty(str: string | null | undefined): str is string {
  return !isEmpty(str);
}

/**
 * Thai text utilities
 */
export const thai = {
  /**
   * Check if string contains Thai characters
   */
  containsThai: (str: string): boolean => /[\u0E00-\u0E7F]/.test(str),

  /**
   * Remove Thai tone marks
   */
  removeToneMarks: (str: string): string => str.replace(/[\u0E48-\u0E4B]/g, ""),

  /**
   * Count Thai words (basic word count)
   */
  wordCount: (str: string): number => {
    const thaiWords = str.match(/[\u0E00-\u0E7F]+/g) || [];
    const englishWords = str.match(/[a-zA-Z]+/g) || [];
    return thaiWords.length + englishWords.length;
  },
};
