/**
 * Prisma error handling utilities
 * Maps Prisma-specific errors to tRPC errors with user-friendly messages
 *
 * This is the shared version for all AppStandard apps (Calendar, Contacts, Tasks)
 */

import { TRPCError } from "@trpc/server";
import { createLogger } from "./logger";

const logger = createLogger("Prisma Error Handler");

// Prisma errors have a code property that starts with "P"
// We check for this pattern instead of using instanceof
// because the error class may not be available in all environments
interface PrismaError {
	code: string;
	meta?: { target?: string | string[] };
	message?: string;
}

/**
 * Check if an error is a Prisma error
 */
export function isPrismaError(error: unknown): error is PrismaError {
	return (
		error !== null &&
		typeof error === "object" &&
		"code" in error &&
		typeof (error as { code: unknown }).code === "string" &&
		(error as { code: string }).code.startsWith("P")
	);
}

/**
 * Handle Prisma-specific errors and convert them to tRPC errors
 * @param error - Error to handle (can be any error type)
 * @throws TRPCError with appropriate code and message
 */
export function handlePrismaError(error: unknown): never {
	if (!isPrismaError(error)) {
		// Not a Prisma error, re-throw as-is
		throw error;
	}

	switch (error.code) {
		case "P2002": {
			// Unique constraint violation
			// Extract field name from meta if available
			const field = error.meta?.target
				? Array.isArray(error.meta.target)
					? error.meta.target.join(", ")
					: String(error.meta.target)
				: "field";

			throw new TRPCError({
				code: "CONFLICT",
				message: `A resource with this ${field} already exists`,
				cause: error,
			});
		}

		case "P2003": {
			// Foreign key constraint violation
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Referenced resource does not exist",
				cause: error,
			});
		}

		case "P2025": {
			// Record not found (for update/delete operations)
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Resource not found",
				cause: error,
			});
		}

		case "P2014": {
			// Required relation violation
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Required relation is missing",
				cause: error,
			});
		}

		case "P2015": {
			// Record not found for update
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Resource not found for update",
				cause: error,
			});
		}

		case "P2034": {
			// Transaction failed
			logger.error("Prisma transaction failed", { code: error.code });
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Transaction failed. Please try again.",
				cause: error,
			});
		}

		case "P2024": {
			// Timed out fetching a new connection from the connection pool
			logger.error("Prisma connection pool timeout", { code: error.code });
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Database connection timeout. Please try again.",
				cause: error,
			});
		}

		case "P2028": {
			// Transaction API error
			logger.error("Prisma transaction API error", { code: error.code });
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Database transaction error. Please try again.",
				cause: error,
			});
		}

		default: {
			// Unknown Prisma error - log and return generic error
			logger.error("Unknown Prisma error", {
				code: error.code,
				message: error.message,
			});
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Database error occurred",
				cause: error,
			});
		}
	}
}

/**
 * Wrap a Prisma operation with error handling
 * Automatically converts Prisma errors to tRPC errors
 */
export async function withPrismaErrorHandling<T>(
	operation: () => Promise<T>,
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		handlePrismaError(error);
	}
}

/**
 * Transaction options with sensible timeout defaults
 * Use these when running Prisma transactions
 */
export const TRANSACTION_OPTIONS = {
	/** Maximum time to wait for a transaction slot */
	maxWait: 5000,
	/** Maximum time for the transaction to complete */
	timeout: 10000,
} as const;
