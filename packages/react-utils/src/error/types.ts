/**
 * Error handling types
 */

export interface AppError {
	code: string;
	message: string;
	details?: Record<string, unknown> | undefined;
	timestamp: Date;
}

export interface ErrorHandlerOptions {
	/** Whether to log the error to console (only in dev) */
	logError?: boolean;
	/** Custom error title */
	fallbackTitle?: string;
	/** Custom error description */
	fallbackDescription?: string;
	/** Whether to show a toast notification */
	showToast?: boolean;
}

export type ErrorSeverity = "info" | "warning" | "error" | "critical";

/**
 * UX-010: Error categories for UI treatment
 * - network: Connection issues, server unreachable
 * - auth: Authentication/authorization failures
 * - server: Server-side errors (5xx)
 * - client: Client-side errors (4xx validation, bad requests)
 * - unknown: Unclassified errors
 */
export type ErrorCategory =
	| "network"
	| "auth"
	| "server"
	| "client"
	| "unknown";

export interface ErrorContext {
	/** Component or function where error occurred */
	source?: string;
	/** User-facing action that triggered the error */
	action?: string;
	/** Additional metadata */
	metadata?: Record<string, unknown>;
}

/**
 * Error info for display (title + description)
 */
export interface ErrorInfo {
	title: string;
	description: string;
}

/**
 * Error result with code and category for handling
 * UX-010: Added category for error type differentiation
 */
export interface ErrorResult {
	title: string;
	description: string;
	code: string;
	/** UX-010: Error category for UI treatment (network/auth/server/client/unknown) */
	category: ErrorCategory;
}
