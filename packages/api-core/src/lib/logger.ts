/**
 * Simple logger for API packages
 * Supports named loggers with customizable prefixes
 */

const isProduction = process.env["NODE_ENV"] === "production";

function formatTimestamp(): string {
	return new Date().toISOString();
}

export interface Logger {
	info: (message: string, data?: unknown) => void;
	warn: (message: string, data?: unknown) => void;
	error: (message: string, data?: unknown) => void;
}

/**
 * Create a named logger with a specific prefix
 * @param name - The name/prefix for this logger (e.g., "AppStandard Contacts")
 */
export function createLogger(name?: string | undefined): Logger {
	const prefix = name ? `[${name}]` : "";

	return {
		info: (message: string, data?: unknown) => {
			if (!isProduction) {
				const timestamp = formatTimestamp();
				console.log(`[${timestamp}] [INFO] ${prefix}`, message, data ?? "");
			}
		},
		warn: (message: string, data?: unknown) => {
			const timestamp = formatTimestamp();
			console.warn(`[${timestamp}] [WARN] ${prefix}`, message, data ?? "");
		},
		error: (message: string, data?: unknown) => {
			const timestamp = formatTimestamp();
			console.error(`[${timestamp}] [ERROR] ${prefix}`, message, data ?? "");
		},
	};
}

/**
 * Default logger instance (no prefix)
 */
export const logger = createLogger();
