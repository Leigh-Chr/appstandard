/**
 * Error handling helper functions
 */

import { logger } from "../logger";
import { ERROR_MESSAGES, NETWORK_ERROR_PATTERNS } from "./constants";
import type {
	AppError,
	ErrorContext,
	ErrorInfo,
	ErrorResult,
	ErrorSeverity,
} from "./types";

/**
 * Create a standardized app error
 */
export function createAppError(
	code: string,
	message: string,
	details?: Record<string, unknown>,
): AppError {
	return {
		code,
		message,
		details: details ?? undefined,
		timestamp: new Date(),
	};
}

/**
 * Check if an error is a network error
 * Handles both regular Error instances and tRPC errors with cause
 */
export function isNetworkError(error: unknown): boolean {
	// Check if it's a tRPC error with network error in cause
	if (error && typeof error === "object" && "cause" in error) {
		const cause = (error as { cause: unknown }).cause;
		if (cause instanceof Error) {
			const causeMessage = cause.message.toLowerCase();
			if (
				NETWORK_ERROR_PATTERNS.some((p) => causeMessage.includes(p)) ||
				cause.name === "NetworkError" ||
				cause.name === "TypeError"
			) {
				return true;
			}
		}
	}

	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		return (
			NETWORK_ERROR_PATTERNS.some((p) => message.includes(p)) ||
			error.name === "NetworkError" ||
			error.name === "TypeError"
		);
	}
	return false;
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
	if (error instanceof Error) {
		return (
			error.message.toLowerCase().includes("timeout") ||
			error.name === "AbortError"
		);
	}
	return false;
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	if (error && typeof error === "object" && "message" in error) {
		return String(error.message);
	}
	return "An unknown error occurred";
}

/**
 * Get error code from unknown error
 */
export function getErrorCode(error: unknown): string | undefined {
	if (error && typeof error === "object") {
		const errorRecord = error as Record<string, unknown>;
		if ("code" in errorRecord) {
			return String(errorRecord["code"]);
		}
		if (
			"data" in errorRecord &&
			errorRecord["data"] &&
			typeof errorRecord["data"] === "object"
		) {
			const data = errorRecord["data"] as Record<string, unknown>;
			if ("code" in data) {
				return String(data["code"]);
			}
		}
	}
	return undefined;
}

/**
 * Determine error severity
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
	const code = getErrorCode(error);

	if (code) {
		if (code.startsWith("AUTH_")) return "warning";
		if (code.startsWith("VALIDATION_")) return "info";
		if (code === "INTERNAL_SERVER_ERROR") return "critical";
	}

	if (isNetworkError(error)) return "error";
	if (isTimeoutError(error)) return "warning";

	return "error";
}

/**
 * Format error for logging
 */
export function formatErrorForLog(
	error: unknown,
	context?: ErrorContext,
): string {
	const message = getErrorMessage(error);
	const code = getErrorCode(error);
	const severity = getErrorSeverity(error);

	let log = `[${severity.toUpperCase()}]`;
	if (code) log += ` (${code})`;
	log += ` ${message}`;
	if (context?.source) log += ` | Source: ${context.source}`;
	if (context?.action) log += ` | Action: ${context.action}`;

	return log;
}

/**
 * Safely log error in development only
 */
export function logErrorInDev(error: unknown, context?: ErrorContext): void {
	// Check for Vite's import.meta.env.DEV or process.env.NODE_ENV
	let isDev = false;

	try {
		// Check Vite's import.meta.env
		if (typeof import.meta !== "undefined" && import.meta.env) {
			isDev = Boolean(import.meta.env["DEV"]);
		}
	} catch {
		// Ignore if import.meta is not available
	}

	// Fallback to process.env
	if (
		!isDev &&
		typeof process !== "undefined" &&
		process.env &&
		process.env["NODE_ENV"] === "development"
	) {
		isDev = true;
	}

	if (isDev) {
		// Use logger for consistent error logging
		logger.error(formatErrorForLog(error, context), error);
	}
}

/**
 * Extract tRPC error code from error object
 * Returns the error code if it's a known tRPC error, otherwise "UNKNOWN"
 */
export function getTRPCErrorCode(error: unknown): string {
	if (!error || typeof error !== "object" || !("data" in error)) {
		return "UNKNOWN";
	}
	const data = (error as { data?: { code?: string } }).data;
	const code = data?.code;
	return code && code in ERROR_MESSAGES ? code : "UNKNOWN";
}

/**
 * Build error result from network error
 * @param customMessages - Optional custom error messages to override defaults
 */
export function buildNetworkError(
	customMessages?: Partial<Record<string, ErrorInfo>>,
): ErrorResult {
	const messages = { ...ERROR_MESSAGES, ...customMessages };
	const networkError = messages["NETWORK_ERROR"];
	if (!networkError) {
		return {
			title: "Network Error",
			description:
				"Unable to contact the server. Please check your connection.",
			code: "NETWORK_ERROR",
		};
	}
	return {
		title: networkError.title,
		description: networkError.description,
		code: "NETWORK_ERROR",
	};
}

/**
 * Build error result from error code and fallbacks
 * @param customMessages - Optional custom error messages to override defaults
 */
export function buildErrorResult(
	errorCode: string,
	errorMessage: string,
	fallbackTitle: string,
	fallbackDescription: string,
	customMessages?: Partial<Record<string, ErrorInfo>>,
): ErrorResult {
	const messages = { ...ERROR_MESSAGES, ...customMessages };
	const errorInfo = errorCode !== "UNKNOWN" ? messages[errorCode] : undefined;
	return {
		title: errorInfo?.title || fallbackTitle,
		description: errorInfo?.description || errorMessage || fallbackDescription,
		code: errorCode,
	};
}
