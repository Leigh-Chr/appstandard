/**
 * Generic tRPC error handler
 * Can be used across all AppStandard applications with custom error messages
 */

import { toast } from "sonner";
import type { Logger } from "../logger";
import {
	buildErrorResult,
	buildNetworkError,
	getErrorMessage,
	getTRPCErrorCode,
	isNetworkError,
} from "./helpers";
import type { ErrorInfo, ErrorResult } from "./types";

export interface HandleTRPCErrorOptions {
	/**
	 * Fallback title if no specific error message is found
	 */
	fallbackTitle?: string;
	/**
	 * Fallback description if no specific error message is found
	 */
	fallbackDescription?: string;
	/**
	 * Whether to show a toast notification. Defaults to true
	 */
	showToast?: boolean;
	/**
	 * Whether to log the error. Defaults to true
	 */
	logError?: boolean;
	/**
	 * Custom error messages to override defaults
	 */
	customMessages?: Partial<Record<string, ErrorInfo>>;
	/**
	 * Logger instance to use for error logging
	 */
	logger?: Logger;
	/**
	 * Toast duration in milliseconds. Defaults to 6000
	 */
	toastDuration?: number;
}

/**
 * Generic tRPC error type that works with any AppRouter
 */
export interface TRPCErrorLike {
	message: string;
	data?: {
		code?: string;
		[key: string]: unknown;
	} | null;
	shape?: unknown;
	cause?: unknown;
}

/**
 * Log error details using the provided logger
 */
export function logTRPCErrorDetails(
	error: TRPCErrorLike,
	logger?: Logger,
): void {
	const logFn = logger?.error ?? console.error;
	logFn("tRPC Error", error, {
		message: error.message,
		data: error.data,
		shape: error.shape,
		cause: error.cause,
	});
}

/**
 * Show toast notification for error
 */
export function showErrorToast(
	title: string,
	description: string,
	duration = 6000,
): void {
	toast.error(title, { description, duration });
}

/**
 * Handle tRPC client errors with proper typing and user-friendly messages
 * Works with any tRPC AppRouter
 *
 * @example
 * ```ts
 * import { handleTRPCError } from '@appstandard/react-utils';
 * import { logger } from '@/lib/logger';
 *
 * const CALENDAR_ERRORS = {
 *   NOT_FOUND: {
 *     title: "Not Found",
 *     description: "This calendar or event doesn't exist."
 *   }
 * };
 *
 * try {
 *   await trpc.calendar.delete.mutate({ id });
 * } catch (error) {
 *   handleTRPCError(error as TRPCErrorLike, {
 *     customMessages: CALENDAR_ERRORS,
 *     logger
 *   });
 * }
 * ```
 */
export function handleTRPCError(
	error: TRPCErrorLike,
	options?: HandleTRPCErrorOptions,
): ErrorResult {
	const {
		fallbackTitle = "Error",
		fallbackDescription = "An error occurred",
		showToast = true,
		logError = true,
		customMessages,
		logger,
		toastDuration = 6000,
	} = options || {};

	if (logError) {
		logTRPCErrorDetails(error, logger);
	}

	if (isNetworkError(error)) {
		const result = buildNetworkError(customMessages);
		if (showToast) {
			showErrorToast(result.title, result.description, 8000);
		}
		return result;
	}

	const errorCode = getTRPCErrorCode(error);
	const errorMessage = getErrorMessage(error);
	const result = buildErrorResult(
		errorCode,
		errorMessage,
		fallbackTitle,
		fallbackDescription,
		customMessages,
	);

	if (showToast) {
		showErrorToast(result.title, result.description, toastDuration);
	}

	return result;
}

/**
 * Create a pre-configured error handler for a specific app
 *
 * @example
 * ```ts
 * // In calendar-web
 * const handleCalendarError = createErrorHandler({
 *   customMessages: CALENDAR_ERRORS,
 *   logger: calendarLogger
 * });
 *
 * // Usage
 * handleCalendarError(error);
 * ```
 */
export function createErrorHandler(defaultOptions: HandleTRPCErrorOptions) {
	return function handleError(
		error: TRPCErrorLike,
		options?: Partial<HandleTRPCErrorOptions>,
	): ErrorResult {
		return handleTRPCError(error, { ...defaultOptions, ...options });
	};
}

// Re-export types
export type { ErrorInfo, ErrorResult } from "./types";
