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
 * Error result with code for handling
 */
export interface ErrorResult {
	title: string;
	description: string;
	code: string;
}
