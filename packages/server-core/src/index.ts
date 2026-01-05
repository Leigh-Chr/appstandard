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
