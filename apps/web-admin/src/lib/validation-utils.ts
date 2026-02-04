/**
 * Advanced validation utilities for WashWise
 * Provides composable validators and form validation helpers
 */

import { z } from "zod";

// ============================================================================
// Basic Validators
// ============================================================================

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { valid: false, error: "Email is required" };
  }
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(
  password: string,
  options: PasswordOptions = {}
): ValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = true,
  } = options;

  const errors: string[] = [];

  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < minLength) {
    errors.push(`At least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter");
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter");
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push("At least one number");
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("At least one special character");
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join(", "), errors };
  }

  return { valid: true };
}

/**
 * Get password strength score (0-100)
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, level: "none", label: "No password" };
  }

  let score = 0;

  // Length scoring
  if (password.length >= 8) {
    score += 20;
  }
  if (password.length >= 12) {
    score += 10;
  }
  if (password.length >= 16) {
    score += 10;
  }

  // Character variety scoring
  if (/[a-z]/.test(password)) {
    score += 10;
  }
  if (/[A-Z]/.test(password)) {
    score += 15;
  }
  if (/\d/.test(password)) {
    score += 15;
  }
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 20;
  }

  // Bonus for mixed characters
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (varietyCount >= 3) {
    score += 10;
  }
  if (varietyCount === 4) {
    score += 10;
  }

  // Penalty for common patterns
  if (/^[a-z]+$/i.test(password)) {
    score -= 10;
  }
  if (/^\d+$/.test(password)) {
    score -= 20;
  }
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
  } // Repeated characters
  if (/12345|qwerty|password|admin/i.test(password)) {
    score -= 30;
  }

  score = Math.max(0, Math.min(100, score));

  let level: PasswordStrength["level"];
  let label: string;

  if (score < 20) {
    level = "weak";
    label = "Weak";
  } else if (score < 40) {
    level = "fair";
    label = "Fair";
  } else if (score < 60) {
    level = "good";
    label = "Good";
  } else if (score < 80) {
    level = "strong";
    label = "Strong";
  } else {
    level = "excellent";
    label = "Excellent";
  }

  return { score, level, label };
}

/**
 * Validate Thai phone number
 */
export function validateThaiPhone(phone: string): ValidationResult {
  const cleaned = phone.replace(/\D/g, "");

  if (!phone) {
    return { valid: false, error: "Phone number is required" };
  }

  // Mobile: 0[689]XXXXXXXX
  const isMobile = /^0[689]\d{8}$/.test(cleaned);
  // Landline: 0[23457]XXXXXXX
  const isLandline = /^0[23457]\d{7}$/.test(cleaned);

  if (!isMobile && !isLandline) {
    return { valid: false, error: "Invalid Thai phone number" };
  }

  return { valid: true };
}

/**
 * Validate Thai ID card number with checksum
 */
export function validateThaiIdCard(idCard: string): ValidationResult {
  const cleaned = idCard.replace(/\D/g, "");

  if (!idCard) {
    return { valid: false, error: "ID card number is required" };
  }

  if (cleaned.length !== 13) {
    return { valid: false, error: "ID card must be 13 digits" };
  }

  // Checksum validation
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;

  if (checkDigit !== parseInt(cleaned[12])) {
    return { valid: false, error: "Invalid ID card checksum" };
  }

  return { valid: true };
}

/**
 * Validate URL
 */
export function validateUrl(url: string): ValidationResult {
  if (!url) {
    return { valid: false, error: "URL is required" };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

// ============================================================================
// Numeric Validators
// ============================================================================

/**
 * Validate number within range
 */
export function validateRange(value: number, options: RangeOptions): ValidationResult {
  const { min, max, minInclusive = true, maxInclusive = true } = options;

  if (typeof value !== "number" || isNaN(value)) {
    return { valid: false, error: "Value must be a number" };
  }

  if (min !== undefined) {
    const minValid = minInclusive ? value >= min : value > min;
    if (!minValid) {
      return {
        valid: false,
        error: `Value must be ${minInclusive ? "at least" : "greater than"} ${min}`,
      };
    }
  }

  if (max !== undefined) {
    const maxValid = maxInclusive ? value <= max : value < max;
    if (!maxValid) {
      return {
        valid: false,
        error: `Value must be ${maxInclusive ? "at most" : "less than"} ${max}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate positive number
 */
export function validatePositive(value: number, allowZero = false): ValidationResult {
  return validateRange(value, {
    min: 0,
    minInclusive: allowZero,
  });
}

/**
 * Validate integer
 */
export function validateInteger(value: number): ValidationResult {
  if (!Number.isInteger(value)) {
    return { valid: false, error: "Value must be a whole number" };
  }
  return { valid: true };
}

// ============================================================================
// String Validators
// ============================================================================

/**
 * Validate string length
 */
export function validateLength(value: string, options: LengthOptions): ValidationResult {
  const { min, max, exact } = options;

  if (exact !== undefined && value.length !== exact) {
    return { valid: false, error: `Must be exactly ${exact} characters` };
  }

  if (min !== undefined && value.length < min) {
    return { valid: false, error: `Must be at least ${min} characters` };
  }

  if (max !== undefined && value.length > max) {
    return { valid: false, error: `Must be at most ${max} characters` };
  }

  return { valid: true };
}

/**
 * Validate against regex pattern
 */
export function validatePattern(
  value: string,
  pattern: RegExp,
  errorMessage = "Invalid format"
): ValidationResult {
  if (!pattern.test(value)) {
    return { valid: false, error: errorMessage };
  }
  return { valid: true };
}

/**
 * Validate required field
 */
export function validateRequired(value: unknown, fieldName = "This field"): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (typeof value === "string" && value.trim() === "") {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (Array.isArray(value) && value.length === 0) {
    return { valid: false, error: `${fieldName} is required` };
  }

  return { valid: true };
}

// ============================================================================
// Composable Validators
// ============================================================================

/**
 * Combine multiple validators
 */
export function combineValidators(...validators: ValidatorFn[]): ValidatorFn {
  return (value: unknown) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  };
}

/**
 * Create a conditional validator
 */
export function conditionalValidator(
  condition: (value: unknown) => boolean,
  validator: ValidatorFn
): ValidatorFn {
  return (value: unknown) => {
    if (condition(value)) {
      return validator(value);
    }
    return { valid: true };
  };
}

/**
 * Create an optional validator (only validates if value is present)
 */
export function optionalValidator(validator: ValidatorFn): ValidatorFn {
  return (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return { valid: true };
    }
    return validator(value);
  };
}

// ============================================================================
// Zod Schema Helpers
// ============================================================================

/**
 * Thai-specific Zod schemas
 */
export const thaiSchemas = {
  phone: z.string().refine((val) => validateThaiPhone(val).valid, "Invalid Thai phone number"),

  idCard: z.string().refine((val) => validateThaiIdCard(val).valid, "Invalid Thai ID card number"),

  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .regex(
      /^[\u0E00-\u0E7Fa-zA-Z\s'-]+$/,
      "Name can only contain Thai/English letters, spaces, hyphens, and apostrophes"
    ),
};

/**
 * Common Zod schemas
 */
export const commonSchemas = {
  email: z.string().email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),

  url: z.string().url("Invalid URL"),

  uuid: z.string().uuid("Invalid UUID"),

  positiveNumber: z.number().positive("Must be a positive number"),

  nonNegativeNumber: z.number().min(0, "Must be zero or greater"),

  positiveInteger: z.number().int().positive("Must be a positive integer"),

  percentage: z
    .number()
    .min(0, "Percentage must be at least 0")
    .max(100, "Percentage must be at most 100"),

  currency: z.number().min(0, "Amount must be zero or greater"),
};

/**
 * Create a refined Zod schema with custom validation
 */
export function createRefinedSchema<T extends z.ZodTypeAny>(
  schema: T,
  validator: (value: z.infer<T>) => ValidationResult
): z.ZodEffects<T, z.output<T>, z.input<T>> {
  return schema.refine(
    (val: z.infer<T>) => validator(val).valid,
    (val: z.infer<T>) => ({ message: validator(val).error || "Invalid value" })
  ) as z.ZodEffects<T, z.output<T>, z.input<T>>;
}

// ============================================================================
// Form Validation Helpers
// ============================================================================

/**
 * Validate entire form data
 */
export function validateForm<T extends Record<string, unknown>>(
  data: T,
  validators: { [K in keyof T]?: ValidatorFn }
): FormValidationResult<T> {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(validators)) {
    if (validator) {
      const result = validator(data[field as keyof T]);
      if (!result.valid) {
        errors[field as keyof T] = result.error;
        isValid = false;
      }
    }
  }

  return { valid: isValid, errors };
}

/**
 * Create field validator with multiple rules
 */
export function createFieldValidator(rules: FieldRule[]): ValidatorFn {
  return (value: unknown) => {
    for (const rule of rules) {
      if (rule.required && !validateRequired(value).valid) {
        return { valid: false, error: rule.message || "This field is required" };
      }

      if (value === null || value === undefined || value === "") {
        continue; // Skip other rules for empty values
      }

      if (rule.minLength && typeof value === "string" && value.length < rule.minLength) {
        return {
          valid: false,
          error: rule.message || `Must be at least ${rule.minLength} characters`,
        };
      }

      if (rule.maxLength && typeof value === "string" && value.length > rule.maxLength) {
        return {
          valid: false,
          error: rule.message || `Must be at most ${rule.maxLength} characters`,
        };
      }

      if (rule.min !== undefined && typeof value === "number" && value < rule.min) {
        return {
          valid: false,
          error: rule.message || `Must be at least ${rule.min}`,
        };
      }

      if (rule.max !== undefined && typeof value === "number" && value > rule.max) {
        return {
          valid: false,
          error: rule.message || `Must be at most ${rule.max}`,
        };
      }

      if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
        return {
          valid: false,
          error: rule.message || "Invalid format",
        };
      }

      if (rule.custom) {
        const customResult = rule.custom(value);
        if (!customResult.valid) {
          return customResult;
        }
      }
    }

    return { valid: true };
  };
}

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errors?: string[];
}

export interface PasswordOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}

export interface PasswordStrength {
  score: number;
  level: "none" | "weak" | "fair" | "good" | "strong" | "excellent";
  label: string;
}

export interface RangeOptions {
  min?: number;
  max?: number;
  minInclusive?: boolean;
  maxInclusive?: boolean;
}

export interface LengthOptions {
  min?: number;
  max?: number;
  exact?: number;
}

export type ValidatorFn = (value: unknown) => ValidationResult;

export interface FormValidationResult<T> {
  valid: boolean;
  errors: Partial<Record<keyof T, string>>;
}

export interface FieldRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: ValidatorFn;
  message?: string;
}
