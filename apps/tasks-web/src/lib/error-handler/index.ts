/**
 * Centralized error handling utilities for Tasks app
 * Uses shared error handler from @appstandard/react-utils
 */

import {
	createErrorHandler,
	type ErrorResult,
	type HandleTRPCErrorOptions,
	type TRPCErrorLike,
} from "@appstandard/react-utils";
import { logger } from "../logger";
import { TASKS_ERROR_MESSAGES } from "./helpers";

// Create app-specific error handler
const tasksErrorHandler = createErrorHandler({
	customMessages: TASKS_ERROR_MESSAGES,
	logger,
});

/**
 * Handle tRPC client errors with proper typing and user-friendly messages
 */
export function handleTRPCError(
	error: TRPCErrorLike,
	options?: Partial<HandleTRPCErrorOptions>,
): ErrorResult {
	return tasksErrorHandler(error, options);
}
