/**
 * Shared Hono application factory for all server applications
 * Provides common middleware, security headers, and error handling
 */

import * as Sentry from "@sentry/bun";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { logger as honoLogger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { z } from "zod";
import { logger } from "./lib/logger";
import { metrics, recordHttpRequest, startTimer } from "./lib/metrics";
import {
	getRequiredSecret,
	getSecret,
	isUsingDockerSecrets,
} from "./lib/secrets";
import { anonymousIdMiddleware } from "./middleware/anonymous-id";
import { privacyMiddleware } from "./middleware/privacy";
import {
	authRateLimit,
	changePasswordRateLimit,
	deleteAccountRateLimit,
	emailVerificationResendRateLimit,
	passwordResetRequestRateLimit,
	rateLimit,
	signupRateLimit,
	updateProfileRateLimit,
} from "./middleware/rate-limit";

/**
 * Server application configuration
 */
export interface ServerConfig {
	/** Service name (e.g., "appstandard", "appstandard-contacts", "appstandard-tasks") */
	serviceName: string;
	/** Default CORS origin for development (e.g., "http://localhost:3001") */
	defaultCorsOrigin: string;
	/** Default port for development */
	defaultPort: number;
	/** Base URL for sitemap (e.g., "https://calendar.appstandard.io") */
	baseUrl: string;
	/** Sitemap routes configuration */
	sitemapRoutes: SitemapRoute[];
	/** Redis key prefix for rate limiting */
	redisKeyPrefix?: string | undefined;
}

export interface SitemapRoute {
	path: string;
	changefreq:
		| "always"
		| "hourly"
		| "daily"
		| "weekly"
		| "monthly"
		| "yearly"
		| "never";
	priority: number;
}

/**
 * Environment schema for all server applications
 */
const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).optional(),
	CORS_ORIGIN: z.string().min(1).optional(),
	BETTER_AUTH_SECRET: z.string().min(1).optional(),
	PORT: z.string().optional(),
	SENTRY_DSN: z.string().optional(),
	// Email configuration
	RESEND_API_KEY: z.string().optional(),
	EMAIL_FROM: z.string().optional(),
	// SMTP (alternative)
	SMTP_HOST: z.string().optional(),
	SMTP_PORT: z.string().optional(),
	SMTP_SECURE: z.string().optional(),
	SMTP_USER: z.string().optional(),
	SMTP_PASSWORD: z.string().optional(),
});

/**
 * Helper function to convert Prisma errors to HTTP responses
 * Better-Auth uses Prisma internally, so we need to handle Prisma errors
 */
export function handlePrismaErrorForAuth(error: unknown): {
	status: number;
	body: { error: string; code?: string };
} | null {
	// Check if error is a Prisma error by checking for the code property
	if (
		error &&
		typeof error === "object" &&
		"code" in error &&
		typeof error.code === "string" &&
		error.code.startsWith("P")
	) {
		const prismaError = error as {
			code: string;
			meta?: { target?: string | string[] };
		};

		switch (prismaError.code) {
			case "P2002": {
				// Unique constraint violation (e.g., email already exists)
				const field = prismaError.meta?.target
					? Array.isArray(prismaError.meta.target)
						? prismaError.meta.target.join(", ")
						: String(prismaError.meta.target)
					: "field";

				return {
					status: 409,
					body: {
						error: `A resource with this ${field} already exists`,
						code: "CONFLICT",
					},
				};
			}

			case "P2003": {
				// Foreign key constraint violation
				return {
					status: 400,
					body: {
						error: "Referenced resource does not exist",
						code: "BAD_REQUEST",
					},
				};
			}

			case "P2025": {
				// Record not found
				return {
					status: 404,
					body: {
						error: "Resource not found",
						code: "NOT_FOUND",
					},
				};
			}

			default: {
				// Unknown Prisma error
				return {
					status: 500,
					body: {
						error: "Database error occurred",
						code: "INTERNAL_SERVER_ERROR",
					},
				};
			}
		}
	}

	return null;
}

/**
 * Generate sitemap XML content
 */
function generateSitemap(baseUrl: string, routes: SitemapRoute[]): string {
	const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

	const urlEntries = routes
		.map(
			(route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
		)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Create a configured Hono application with all shared middleware
 */
export function createServerApp(config: ServerConfig) {
	// Read secrets from Docker secrets or environment variables
	const rawEnv = {
		...process.env,
		// Override with Docker secrets if available (more secure)
		BETTER_AUTH_SECRET:
			getSecret("BETTER_AUTH_SECRET") || process.env["BETTER_AUTH_SECRET"],
		RESEND_API_KEY:
			getSecret("RESEND_API_KEY") || process.env["RESEND_API_KEY"],
		SMTP_PASSWORD: getSecret("SMTP_PASSWORD") || process.env["SMTP_PASSWORD"],
	};

	const env = envSchema.parse(rawEnv);
	const isProduction = env.NODE_ENV === "production";
	const redisKeyPrefix = config.redisKeyPrefix || "ratelimit";

	// Initialize Sentry for error tracking and performance monitoring
	// Only initialize if DSN is provided (Sentry is optional)
	if (env.SENTRY_DSN) {
		Sentry.init({
			dsn: env.SENTRY_DSN,
			environment: env.NODE_ENV || "development",
			enabled: true,

			// Disable PII collection by default for privacy
			sendDefaultPii: false,

			// Performance monitoring - adjust in production
			tracesSampleRate: isProduction ? 0.1 : 1.0,

			// Filter sensitive data before sending to Sentry
			beforeSend(event) {
				// Remove any sensitive headers
				if (
					event.request?.headers &&
					typeof event.request.headers === "object"
				) {
					const headers = event.request.headers as Record<
						string,
						string | undefined
					>;
					headers["authorization"] = undefined;
					headers["cookie"] = undefined;
					headers["x-anonymous-id"] = undefined;
				}

				// Remove any cookies from request
				if (event.request?.cookies) {
					event.request.cookies = {};
				}

				return event;
			},
		});

		// SEC-006: Explicitly verify PII settings in production
		if (isProduction) {
			logger.info(
				"Sentry initialized with sendDefaultPii=false (PII collection disabled)",
			);
		}
	}

	// Log which secret management method is being used
	if (isUsingDockerSecrets()) {
		logger.info("Using Docker secrets for sensitive configuration");
	} else {
		logger.info("Using environment variables for configuration");
	}

	// Check critical variables in production
	if (isProduction) {
		if (!env.CORS_ORIGIN) {
			logger.error("CORS_ORIGIN is required in production");
			process.exit(1);
		}
		if (env.CORS_ORIGIN === "*") {
			// SEC-007: Hard-fail on CORS wildcard in production
			logger.error(
				"CORS_ORIGIN cannot be '*' in production. This is a security risk.",
			);
			process.exit(1);
		}
		if (env.CORS_ORIGIN.includes("localhost")) {
			logger.warn(
				"CORS_ORIGIN contains 'localhost' in production. This may be incorrect.",
			);
		}
		// BETTER_AUTH_SECRET is required in production
		if (!env.BETTER_AUTH_SECRET) {
			logger.error(
				"BETTER_AUTH_SECRET is required in production. Set it via Docker secret or environment variable.",
			);
			try {
				getRequiredSecret("BETTER_AUTH_SECRET");
			} catch {
				// Error already logged by getRequiredSecret
			}
			process.exit(1);
		}
	}

	const app = new Hono();

	// Use Hono's logger in development only
	if (!isProduction) {
		app.use(honoLogger());
	}

	// Enable response compression for better performance
	// This reduces payload size significantly for JSON responses
	app.use(compress());

	// CORS configuration - apply FIRST before security headers
	app.use(
		"/*",
		cors({
			origin: env.CORS_ORIGIN || config.defaultCorsOrigin,
			allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
			allowHeaders: [
				"Content-Type",
				"Authorization",
				"x-anonymous-id",
				"Cookie",
				"Set-Cookie",
				"User-Agent",
				"Accept",
				"Accept-Language",
				"Accept-Encoding",
				// Sentry distributed tracing headers
				"baggage",
				"sentry-trace",
			],
			credentials: true,
			exposeHeaders: ["Set-Cookie"],
		}),
	);

	// Security headers
	app.use(async (c, next) => {
		const extendedPermissionsPolicy = {
			geolocation: [],
			microphone: [],
			camera: [],
			payment: [],
			usb: [],
			accelerometer: [],
			gyroscope: [],
			magnetometer: [],
		};

		// For auth endpoints, use less restrictive headers to allow cross-origin requests
		if (c.req.path.startsWith("/api/auth/")) {
			return secureHeaders({
				xFrameOptions: "DENY",
				xContentTypeOptions: "nosniff",
				referrerPolicy: "strict-origin-when-cross-origin",
				strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
				permissionsPolicy: extendedPermissionsPolicy,
				contentSecurityPolicy: {
					defaultSrc: ["'none'"],
					frameAncestors: ["'none'"],
					baseUri: ["'none'"],
				},
				crossOriginResourcePolicy: "cross-origin",
				crossOriginOpenerPolicy: "same-origin-allow-popups",
			})(c, next);
		}
		// For other endpoints, use default restrictive headers
		return secureHeaders({
			xFrameOptions: "DENY",
			xContentTypeOptions: "nosniff",
			referrerPolicy: "strict-origin-when-cross-origin",
			strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
			permissionsPolicy: extendedPermissionsPolicy,
			contentSecurityPolicy: {
				defaultSrc: ["'none'"],
				frameAncestors: ["'none'"],
				baseUri: ["'none'"],
			},
		})(c, next);
	});

	// DEVOPS-004: HTTP metrics collection middleware
	// Records request counts, durations, and error rates
	app.use(async (c, next) => {
		// Skip metrics for metrics/health endpoints to avoid noise
		if (
			c.req.path === "/metrics" ||
			c.req.path === "/health" ||
			c.req.path === "/livez" ||
			c.req.path === "/readyz"
		) {
			return next();
		}

		const timer = startTimer();
		metrics.incrementGauge("http_requests_in_flight");

		try {
			await next();
		} finally {
			metrics.incrementGauge("http_requests_in_flight", -1);
			const duration = timer();
			recordHttpRequest(c.req.method, c.req.path, c.res.status, duration);
		}
	});

	// Anonymous ID management (server-generated signed cookies)
	// SECURITY: Generates and validates cryptographically signed anonymous IDs
	app.use(anonymousIdMiddleware());

	// Privacy middleware: Detect GPC (Global Privacy Control) and DNT signals
	// GDPR/CCPA: Honors user privacy preferences from browser signals
	app.use(privacyMiddleware());

	// Rate limiting: 100 requests per minute for general routes
	app.use(async (c, next) => {
		if (c.req.path.startsWith("/api/auth/")) {
			return next();
		}
		return rateLimit(100, 60000, "", redisKeyPrefix)(c, next);
	});

	// CSRF protection for state-changing requests
	app.use(async (c, next) => {
		if (c.req.path.startsWith("/api/auth/")) {
			return next();
		}
		if (c.req.path === "/api/sentry-tunnel") {
			return next();
		}
		return csrf({
			origin: env.CORS_ORIGIN || config.defaultCorsOrigin,
		})(c, next);
	});

	// Auth-specific rate limiting
	app.use("/api/auth/sign-up/email", signupRateLimit(redisKeyPrefix));
	app.use(
		"/api/auth/send-verification-email",
		emailVerificationResendRateLimit(redisKeyPrefix),
	);
	app.use("/api/auth/delete-user", deleteAccountRateLimit(redisKeyPrefix));
	app.use(
		"/api/auth/request-password-reset",
		passwordResetRequestRateLimit(redisKeyPrefix),
	);
	app.use("/api/auth/change-password", changePasswordRateLimit(redisKeyPrefix));
	app.use("/api/auth/update-user", updateProfileRateLimit(redisKeyPrefix));
	app.use("/api/auth/*", authRateLimit(redisKeyPrefix));

	// Sentry tunnel endpoint
	app.post("/api/sentry-tunnel", async (c) => {
		try {
			const envelope = await c.req.text();

			if (!envelope || envelope.trim().length === 0) {
				logger.warn("Sentry tunnel: Empty envelope received");
				return c.json({ error: "Empty envelope" }, 400);
			}

			const pieces = envelope.split("\n");
			if (pieces.length === 0) {
				logger.error("Sentry tunnel: Invalid envelope format (no newlines)");
				return c.json({ error: "Invalid envelope format" }, 400);
			}

			const firstPiece = pieces[0];
			if (!firstPiece) {
				logger.error(
					"Sentry tunnel: Invalid envelope format (empty first piece)",
				);
				return c.json({ error: "Invalid envelope format" }, 400);
			}

			let header: { dsn?: string } | undefined;
			try {
				header = JSON.parse(firstPiece) as { dsn?: string };
			} catch (error) {
				logger.error("Sentry tunnel: Failed to parse envelope header", {
					error,
					headerPreview: firstPiece.substring(0, 100),
				});
				return c.json({ error: "Invalid envelope header" }, 400);
			}

			const dsn = header.dsn;
			if (!dsn) {
				logger.error("Sentry tunnel: DSN not found in envelope header");
				return c.json({ error: "DSN not found in envelope" }, 400);
			}

			let projectId: string;
			try {
				const dsnUrl = new URL(dsn);
				projectId = dsnUrl.pathname.replace("/", "");

				if (!projectId) {
					logger.error("Sentry tunnel: Project ID not found in DSN", {
						dsn: `${dsn.substring(0, 30)}...`,
					});
					return c.json({ error: "Invalid DSN format" }, 400);
				}
			} catch (error) {
				logger.error("Sentry tunnel: Failed to parse DSN URL", {
					error,
					dsn: `${dsn.substring(0, 30)}...`,
				});
				return c.json({ error: "Invalid DSN format" }, 400);
			}

			const dsnUrl = new URL(dsn);
			const sentryUrl = `https://${dsnUrl.host}/api/${projectId}/envelope/`;

			const response = await fetch(sentryUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-sentry-envelope",
				},
				body: envelope,
			});

			if (!response.ok) {
				const errorText = await response.text();
				logger.error("Sentry tunnel error", {
					status: response.status,
					statusText: response.statusText,
					error: errorText.substring(0, 200),
				});
				return new Response("Failed to forward to Sentry", {
					status: response.status,
				});
			}

			return new Response("", {
				status: response.status,
			});
		} catch (error) {
			logger.error("Sentry tunnel exception", { error });
			return c.json({ error: "Internal server error" }, 500);
		}
	});

	// CSP violation reporting endpoint
	app.post("/api/csp-report", async (c) => {
		try {
			const contentType = c.req.header("content-type") || "";

			if (
				!contentType.includes("application/csp-report") &&
				!contentType.includes("application/json")
			) {
				return c.json({ error: "Invalid content type" }, 400);
			}

			const report = await c.req.json();
			const violation = report["csp-report"] || report;

			logger.warn("CSP violation detected", {
				documentUri: violation["document-uri"],
				violatedDirective: violation["violated-directive"],
				effectiveDirective: violation["effective-directive"],
				blockedUri: violation["blocked-uri"],
				sourceFile: violation["source-file"],
				lineNumber: violation["line-number"],
				columnNumber: violation["column-number"],
			});

			Sentry.captureMessage("CSP Violation", {
				level: "warning",
				tags: {
					type: "csp-violation",
					directive: violation["violated-directive"] || "unknown",
				},
				extra: {
					documentUri: violation["document-uri"],
					blockedUri: violation["blocked-uri"],
					sourceFile: violation["source-file"],
				},
			});

			return new Response(null, { status: 204 });
		} catch (error) {
			logger.error("CSP report processing error", error);
			return new Response(null, { status: 204 });
		}
	});

	// Root endpoint
	app.get("/", (c) => {
		return c.text(`${config.serviceName} API OK`);
	});

	// Warmup endpoint - prewarms database connections without full health check
	// Use this endpoint for container/serverless warmup to reduce cold start latency
	app.get("/warmup", async (c) => {
		try {
			const prisma = (await import("@appstandard/db")).default;
			// Simple query to warm up the connection pool
			await prisma.$queryRaw`SELECT 1`;
			return c.text("warm", 200);
		} catch {
			// Don't expose errors on warmup - just return OK
			// The health endpoint will catch real issues
			return c.text("warm", 200);
		}
	});

	// Health check endpoint with database verification
	// Supports ?quick=true for fast checks without DB verification
	app.get("/health", async (c) => {
		const quick = c.req.query("quick") === "true";

		// Quick mode: skip DB check for load balancer health checks
		if (quick) {
			return c.json(
				{
					status: "healthy",
					service: config.serviceName,
					timestamp: new Date().toISOString(),
					mode: "quick",
				},
				200,
			);
		}

		try {
			const prisma = (await import("@appstandard/db")).default;
			await prisma.$queryRaw`SELECT 1`;

			return c.json(
				{
					status: "healthy",
					service: config.serviceName,
					timestamp: new Date().toISOString(),
				},
				200,
			);
		} catch (error) {
			logger.error("Health check failed", error);
			Sentry.captureException(error);
			return c.json(
				{
					status: "unhealthy",
					service: config.serviceName,
					error: "Database connection failed",
					timestamp: new Date().toISOString(),
				},
				503,
			);
		}
	});

	// DEVOPS-004: Prometheus metrics endpoint
	// Exposes application metrics in Prometheus text format
	app.get("/metrics", (c) => {
		return c.text(metrics.getMetrics(), 200, {
			"Content-Type": "text/plain; version=0.0.4; charset=utf-8",
		});
	});

	// DEVOPS-005: Liveness probe (lightweight, no dependencies)
	// Returns 200 if the process is running
	app.get("/livez", (c) => {
		return c.text("ok", 200);
	});

	// DEVOPS-005: Readiness probe (checks if ready to serve traffic)
	// Verifies database connectivity
	app.get("/readyz", async (c) => {
		try {
			const prisma = (await import("@appstandard/db")).default;
			await prisma.$queryRaw`SELECT 1`;
			return c.text("ok", 200);
		} catch {
			return c.text("not ready", 503);
		}
	});

	// Dynamic sitemap.xml generation
	app.get("/sitemap.xml", (c) => {
		const sitemap = generateSitemap(config.baseUrl, config.sitemapRoutes);
		return c.text(sitemap, 200, {
			"Content-Type": "application/xml; charset=utf-8",
		});
	});

	// Global error handler
	app.onError((err, c) => {
		Sentry.captureException(err);
		logger.error("Unhandled error", err);
		return c.json(
			{
				error: "Internal Server Error",
				timestamp: new Date().toISOString(),
			},
			500,
		);
	});

	// 404 Not Found handler for unmatched routes
	app.notFound((c) => {
		logger.warn("Route not found", {
			method: c.req.method,
			path: c.req.path,
		});
		return c.json(
			{
				error: "Not Found",
				message: `Cannot ${c.req.method} ${c.req.path}`,
				timestamp: new Date().toISOString(),
			},
			404,
		);
	});

	// Handle unhandled promise rejections
	process.on("unhandledRejection", (reason, promise) => {
		logger.error("Unhandled Rejection", reason, { promise });
		Sentry.captureException(
			reason instanceof Error ? reason : new Error(String(reason)),
		);
		if (isProduction) {
			logger.error("Crashing due to unhandled rejection in production");
			process.exit(1);
		} else {
			logger.warn("Unhandled rejection in development - continuing");
		}
	});

	// Handle uncaught exceptions
	process.on("uncaughtException", (error) => {
		logger.error("Uncaught Exception", error);
		Sentry.captureException(error);
		logger.error("Crashing due to uncaught exception");
		process.exit(1);
	});

	const port = Number(env.PORT) || config.defaultPort;

	return {
		app,
		env,
		port,
		isProduction,
		Sentry,
		logger,
		handlePrismaErrorForAuth,
	};
}

export { Sentry };
