// ============================================================================
// WashWise Utility Library
// Comprehensive utilities for production applications
// ============================================================================

// Core utilities (the base exports)
export * from "./utils";

// API utilities
export * from "./api";
export * from "./api-utils";
export * from "./query";
export * from "./socket";
export * from "./errors";

// Validation utilities
export * from "./validation-utils";

// Browser utilities
export * from "./storage";
export * from "./export";

// Note: string-utils, number-utils, date-utils, and accessibility have
// overlapping exports with utils.ts. Import them directly when needed:
// import { specific } from "@/lib/string-utils"
