/**
 * @appstandard/api-core
 * Shared API infrastructure for all AppStandard Calendar applications
 */

// Context
export {
	type Context,
	type CreateContextOptions,
	createContext,
	isValidAnonymousId,
} from "./context";
// Circuit Breaker
export {
	CircuitBreaker,
	type CircuitBreakerOptions,
	createUrlImportCircuitBreaker,
} from "./lib/circuit-breaker";
// Cleanup utilities
export {
	type AppCleanupFunctions,
	type CleanupJobConfig,
	type CleanupResult,
	cleanupExpiredSessions,
	cleanupExpiredVerifications,
	createCleanupRunner,
	DEFAULT_CLEANUP_CONFIG,
} from "./lib/cleanup";
// Error message constants
export * as ErrorMessages from "./lib/error-messages";
// Logger
export { createLogger, type Logger, logger } from "./lib/logger";
// Prisma error handling
export {
	handlePrismaError,
	isPrismaError,
	TRANSACTION_OPTIONS,
	withPrismaErrorHandling,
} from "./lib/prisma-error-handler";

// URL Validator
export {
	assertValidExternalUrl,
	type UrlValidationResult,
	validateExternalUrl,
} from "./lib/url-validator";
// Middleware utilities
export {
	buildOwnershipFilter,
	buildOwnershipFilterFromContext,
	getLimitsForUser,
	isAnonymousUser,
	isAnonymousUserFromContext,
	isAuthenticatedUser,
	isAuthenticatedUserFromContext,
	type OwnershipFilter,
	USER_LIMITS,
} from "./middleware";
// tRPC
export {
	authOrAnonProcedure,
	protectedProcedure,
	publicProcedure,
	router,
	t,
} from "./trpc";
