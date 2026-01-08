/**
 * @appstandard/server-core
 * Shared server infrastructure for all AppStandard Calendar applications
 */

// App factory
export {
	createServerApp,
	handlePrismaErrorForAuth,
	Sentry,
	type ServerConfig,
	type SitemapRoute,
} from "./app";

// Auth handler factory
export { createAuthHandler } from "./auth-handler";

// Cleanup job factory
export {
	CLEANUP_DEFAULTS,
	type CleanupConfig,
	type CleanupFunctions,
	createCleanupJob,
} from "./cleanup-job";
// Anonymous ID (HMAC-signed cookies)
export {
	ANON_COOKIE_NAME,
	ANON_COOKIE_OPTIONS,
	generateSignedAnonymousId,
	isValidAnonymousIdFormat,
	validateSignedAnonymousId,
} from "./lib/anonymous-id";
// Logger
export {
	clearLogContext,
	generateCorrelationId,
	getLogContext,
	type LogContext,
	logger,
	logSecurityEvent,
	type SecurityEventType,
	setLogContext,
} from "./lib/logger";
// Secrets
export {
	getRequiredSecret,
	getSecret,
	isUsingDockerSecrets,
} from "./lib/secrets";
export {
	anonymousIdMiddleware,
	getAnonymousIdFromRequest,
} from "./middleware/anonymous-id";
// Middleware
export { env as rateLimitEnv } from "./middleware/env";
export {
	authRateLimit,
	changePasswordRateLimit,
	closeRedisConnection,
	deleteAccountRateLimit,
	emailVerificationResendRateLimit,
	exportDataRateLimit,
	passwordResetRequestRateLimit,
	rateLimit,
	signupRateLimit,
	updateProfileRateLimit,
} from "./middleware/rate-limit";
