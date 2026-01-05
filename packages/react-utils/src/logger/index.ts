/**
 * Client-side logger with optional Sentry integration
 * Uses console in development, optionally sends to Sentry in production
 */

export interface SentryLike {
	captureMessage: (message: string, captureContext?: any) => any;
	captureException: (error: unknown, captureContext?: any) => any;
}

export interface LoggerConfig {
	/** Sentry instance for production error reporting */
	sentry?: SentryLike | undefined;
	/** Force development mode (defaults to import.meta.env.DEV or process.env.NODE_ENV !== 'production') */
	isDev?: boolean | undefined;
	/** Prefix for log messages */
	prefix?: string | undefined;
}

export interface Logger {
	info: (message: string, data?: unknown) => void;
	warn: (message: string, data?: unknown) => void;
	error: (message: string, error?: unknown, data?: unknown) => void;
}

/**
 * Determine if we're in development mode
 */
function detectDevMode(): boolean {
	// Check Vite's import.meta.env first (browser environment)
	if (typeof import.meta !== "undefined" && import.meta.env) {
		const mode = import.meta.env["MODE"];
		const isDev = import.meta.env["DEV"];
		// DEV is typed as string | undefined in TypeScript, but Vite may set it as boolean
		// Use String() to normalize and compare safely
		return String(isDev) === "true" || mode === "development";
	}
	// Fallback to Node.js process.env (server-side)
	try {
		if (typeof process !== "undefined" && process.env) {
			return process.env["NODE_ENV"] !== "production";
		}
	} catch {
		// process is not available
	}
	return false;
}

/**
 * Create a logger instance with optional Sentry integration
 */
export function createLogger(config: LoggerConfig = {}): Logger {
	const { sentry, isDev = detectDevMode(), prefix = "" } = config;
	const logPrefix = prefix ? `[${prefix}] ` : "";

	return {
		info: (message: string, data?: unknown) => {
			if (isDev) {
				console.log(`${logPrefix}[INFO] ${message}`, data || "");
			}
			// In production, info logs are typically not sent to Sentry
		},

		warn: (message: string, data?: unknown) => {
			if (isDev) {
				console.warn(`${logPrefix}[WARN] ${message}`, data || "");
			}
			// Send warnings to Sentry in production
			if (!isDev && sentry) {
				sentry.captureMessage(message, {
					level: "warning",
					extra:
						data !== undefined ? (data as Record<string, unknown>) : undefined,
				});
			}
		},

		error: (message: string, error?: unknown, data?: unknown) => {
			if (isDev) {
				console.error(
					`${logPrefix}[ERROR] ${message}`,
					error || "",
					data || "",
				);
			}
			// Always send errors to Sentry if available
			if (sentry) {
				if (error instanceof Error) {
					sentry.captureException(error, {
						extra: data as Record<string, unknown>,
					});
				} else {
					sentry.captureMessage(message, {
						level: "error",
						extra: {
							error,
							...(typeof data === "object" && data !== null
								? (data as Record<string, unknown>)
								: { data }),
						},
					});
				}
			}
		},
	};
}

/**
 * Default logger instance (console only, no Sentry)
 * Apps should create their own logger with Sentry if needed
 */
export const logger = createLogger();
