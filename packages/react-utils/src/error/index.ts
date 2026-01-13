/**
 * Error handling exports
 */

// Constants
export { ERROR_MESSAGES, NETWORK_ERROR_PATTERNS } from "./constants";
// Generic tRPC error handler
export {
	createErrorHandler,
	type HandleTRPCErrorOptions,
	handleTRPCError,
	logTRPCErrorDetails,
	showErrorToast,
	type TRPCErrorLike,
} from "./handler";
// Helper functions
export {
	buildErrorResult,
	buildNetworkError,
	createAppError,
	formatErrorForLog,
	getErrorCategory,
	getErrorCategoryFromCode,
	getErrorCode,
	getErrorMessage,
	getErrorSeverity,
	getTRPCErrorCode,
	isNetworkError,
	isTimeoutError,
	logErrorInDev,
} from "./helpers";

// Types
export type {
	AppError,
	ErrorCategory,
	ErrorContext,
	ErrorHandlerOptions,
	ErrorInfo,
	ErrorResult,
	ErrorSeverity,
} from "./types";
