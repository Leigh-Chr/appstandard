/**
 * @appstandard/react-utils
 * React utilities and hooks for AppStandard applications
 */

// Auth client
export { type AuthClient, authClient, createAuthClient } from "./auth";

// Error handling - Types
export type {
	AppError,
	ErrorContext,
	ErrorHandlerOptions,
	ErrorInfo,
	ErrorResult,
	ErrorSeverity,
	HandleTRPCErrorOptions,
	TRPCErrorLike,
} from "./error";
// Error handling - Functions
export {
	buildErrorResult,
	buildNetworkError,
	createAppError,
	createErrorHandler,
	ERROR_MESSAGES,
	formatErrorForLog,
	getErrorCode,
	getErrorMessage,
	getErrorSeverity,
	getTRPCErrorCode,
	handleTRPCError,
	isNetworkError,
	isTimeoutError,
	logErrorInDev,
	logTRPCErrorDetails,
	NETWORK_ERROR_PATTERNS,
	showErrorToast,
} from "./error";

// Hooks
export {
	type Contact,
	type ContactPickerOptions,
	type ContentDescription,
	// PWA hooks
	clearAppBadge,
	// Server status
	createServerStatusHook,
	type DisplayMode,
	type FieldSectionMap,
	type FileHandlerOptions,
	indexCalendarEvent,
	indexContact,
	indexTask,
	isAppInstalled,
	isContactPickerSupported,
	isFileHandlerSupported,
	isWindowControlsOverlayActive,
	readFileAsText,
	readFilesAsText,
	removeFromIndex,
	type ServerStatus,
	type ServerStatusOptions,
	type ServerStatusState,
	type ShareData,
	setAppBadge,
	shareContent,
	shareFile,
	type UseFormTrackingOptions,
	type UseFormTrackingReturn,
	type UseFormValidationOptions,
	type UseFormValidationReturn,
	type UseInstallPromptReturn,
	type UseShareReturn,
	useBadge,
	useContactPicker,
	useContentIndex,
	useDebounce,
	useDisplayMode,
	useFileHandler,
	// Form tracking
	useFormTracking,
	// Form validation
	useFormValidation,
	useInstallPrompt,
	useIsDesktop,
	useIsMobile,
	useIsMounted,
	useIsTablet,
	useLocalStorage,
	useMediaQuery,
	useMounted,
	usePrefersDarkMode,
	usePrefersReducedMotion,
	usePrevious,
	useServerStatus,
	useShare,
	type ValidationErrors,
} from "./hooks";

// Logger
export type { Logger, LoggerConfig, SentryLike } from "./logger";
export { createLogger, logger } from "./logger";

// Query utilities
export { createQueryKeys, queryKeyUtils } from "./query";

// Sorting utilities
export {
	type BaseEntityForSort,
	compareDates,
	createEntitySorter,
	type EntitySorter,
	type EntitySorterConfig,
	type SortDirection,
} from "./sorting";

// Storage utilities
export { createAnonymousIdGetter, isValidAnonymousId } from "./storage";

// Utility functions
export { cn } from "./utils/cn";
