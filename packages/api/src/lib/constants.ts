/**
 * API Constants
 * Centralized configuration for limits, timeouts, and thresholds
 *
 * API-002: Magic numbers extracted to named constants for maintainability
 */

// ============================================================================
// FILE SIZE LIMITS
// ============================================================================

/**
 * Maximum file size for ICS imports (5MB)
 * SECURITY: Prevents memory exhaustion from large files
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Maximum events per ICS file
 * Prevents performance issues from extremely large calendar files
 */
export const MAX_EVENTS_PER_FILE = 5000;

/**
 * Maximum estimated export size before warning (4MB)
 */
export const MAX_EXPORT_SIZE_WARN = 4 * 1024 * 1024; // 4MB

/**
 * Maximum export size before hard limit (5MB)
 */
export const MAX_EXPORT_SIZE_HARD = 5 * 1024 * 1024; // 5MB

// ============================================================================
// TIMEOUTS
// ============================================================================

/**
 * Default timeout for URL fetch operations (60 seconds)
 */
export const URL_FETCH_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Timeout for initial URL import (faster feedback) (30 seconds)
 */
export const URL_IMPORT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Transaction timeout for database operations (10 seconds)
 */
export const TRANSACTION_TIMEOUT_MS = 10000; // 10 seconds

// ============================================================================
// SHARING LIMITS
// ============================================================================

/**
 * Maximum share bundles per user
 */
export const MAX_SHARE_BUNDLES_PER_USER = 20;

/**
 * Maximum share links per calendar
 */
export const MAX_SHARE_LINKS_PER_CALENDAR = 10;

// ============================================================================
// DASHBOARD LIMITS
// ============================================================================

/**
 * Maximum conflicts to show in dashboard
 */
export const MAX_DASHBOARD_CONFLICTS = 10;

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Date tolerance for duplicate detection (1 minute)
 * Events within this time window are considered potential duplicates
 */
export const DUPLICATE_DATE_TOLERANCE_MS = 60000; // 1 minute
