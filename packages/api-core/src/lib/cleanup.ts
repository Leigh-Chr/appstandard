/**
 * Common cleanup utilities for expired authentication data
 * These functions are shared across all AppStandard applications
 * since they operate on the same auth tables (session, verification)
 */

import prisma from "@appstandard/db";
import { createLogger, type Logger } from "./logger";

const defaultLogger = createLogger("Cleanup");

/**
 * CODE-003: Result type for cleanup operations
 * Allows callers to distinguish between "0 items cleaned" and "error occurred"
 */
export interface CleanupResult {
	count: number;
	error?: Error;
}

/**
 * Delete expired sessions
 * Sessions are automatically invalid after expiration, but we clean them up for database hygiene
 * @param logger - Optional logger instance (defaults to cleanup logger)
 * @returns CleanupResult with count and optional error
 */
export async function cleanupExpiredSessions(
	logger: Logger = defaultLogger,
): Promise<CleanupResult> {
	const now = new Date();

	try {
		const result = await prisma.session.deleteMany({
			where: {
				expiresAt: {
					lt: now,
				},
			},
		});

		if (result.count > 0) {
			logger.info("Cleaned up expired sessions", {
				deletedCount: result.count,
			});
		}

		return { count: result.count };
	} catch (error) {
		logger.error("Failed to delete expired sessions", {
			error,
		});
		return {
			count: 0,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * Delete expired verification tokens
 * These are used for email verification and password reset
 * @param logger - Optional logger instance (defaults to cleanup logger)
 * @returns CleanupResult with count and optional error
 */
export async function cleanupExpiredVerifications(
	logger: Logger = defaultLogger,
): Promise<CleanupResult> {
	const now = new Date();

	try {
		const result = await prisma.verification.deleteMany({
			where: {
				expiresAt: {
					lt: now,
				},
			},
		});

		if (result.count > 0) {
			logger.info("Cleaned up expired verifications", {
				deletedCount: result.count,
			});
		}

		return { count: result.count };
	} catch (error) {
		logger.error("Failed to delete expired verifications", {
			error,
		});
		return {
			count: 0,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * Configuration for cleanup job scheduling
 */
export interface CleanupJobConfig {
	/** Interval in milliseconds between cleanup runs (default: 1 hour) */
	intervalMs?: number | undefined;
	/** Days of inactivity for orphaned data deletion (default: 60) */
	orphanedDaysInactive?: number | undefined;
	/** Grace period days for expired share links (default: 7) */
	expiredShareLinksGraceDays?: number | undefined;
	/** Days of inactivity for disabled share links (default: 90) */
	inactiveShareLinksDisabledDays?: number | undefined;
	/** Days of inactivity for active share links without expiration (default: 365) */
	inactiveShareLinksActiveDays?: number | undefined;
	/** Days after which pending group invitations are deleted (default: 30) */
	pendingInvitationsDays?: number | undefined;
}

/**
 * Default cleanup job configuration
 */
export const DEFAULT_CLEANUP_CONFIG: Required<CleanupJobConfig> = {
	intervalMs: 60 * 60 * 1000, // 1 hour
	orphanedDaysInactive: 60,
	expiredShareLinksGraceDays: 7,
	inactiveShareLinksDisabledDays: 90,
	inactiveShareLinksActiveDays: 365,
	pendingInvitationsDays: 30,
};

/**
 * Interface for app-specific cleanup functions
 * Each app must provide these functions for their specific data types
 * CODE-003: All functions return CleanupResult to report errors to callers
 */
export interface AppCleanupFunctions {
	/** Delete orphaned anonymous data (calendars, address books, task lists) */
	cleanupOrphanedAnonymousData: (
		daysInactive: number,
	) => Promise<CleanupResult>;
	/** Delete expired share links */
	cleanupExpiredShareLinks: (gracePeriodDays: number) => Promise<CleanupResult>;
	/** Delete expired share bundles */
	cleanupExpiredShareBundles: (
		gracePeriodDays: number,
	) => Promise<CleanupResult>;
	/** Delete inactive share links */
	cleanupInactiveShareLinks: (
		inactiveDays: number,
		activeDays: number,
	) => Promise<CleanupResult>;
	/** Delete inactive share bundles */
	cleanupInactiveShareBundles: (
		inactiveDays: number,
		activeDays: number,
	) => Promise<CleanupResult>;
	/** Delete pending group invitations */
	cleanupPendingGroupInvitations: (
		daysPending: number,
	) => Promise<CleanupResult>;
}

/**
 * Creates a cleanup job runner with both common and app-specific cleanup functions
 * @param appFunctions - App-specific cleanup functions
 * @param config - Optional configuration overrides
 * @param logger - Optional logger instance
 */
export function createCleanupRunner(
	appFunctions: AppCleanupFunctions,
	config: CleanupJobConfig = {},
	logger: Logger = defaultLogger,
) {
	const mergedConfig = { ...DEFAULT_CLEANUP_CONFIG, ...config };

	/**
	 * Run all cleanup tasks once
	 * CODE-003: Collects errors from all cleanup functions and reports them
	 */
	async function runCleanup(): Promise<void> {
		logger.info("Starting cleanup job...");

		const errors: Error[] = [];

		try {
			// Common auth cleanup
			const sessionsResult = await cleanupExpiredSessions(logger);
			const verificationsResult = await cleanupExpiredVerifications(logger);

			// App-specific cleanup
			const orphanedResult = await appFunctions.cleanupOrphanedAnonymousData(
				mergedConfig.orphanedDaysInactive,
			);
			const expiredLinksResult = await appFunctions.cleanupExpiredShareLinks(
				mergedConfig.expiredShareLinksGraceDays,
			);
			const expiredBundlesResult =
				await appFunctions.cleanupExpiredShareBundles(
					mergedConfig.expiredShareLinksGraceDays,
				);
			const inactiveLinksResult = await appFunctions.cleanupInactiveShareLinks(
				mergedConfig.inactiveShareLinksDisabledDays,
				mergedConfig.inactiveShareLinksActiveDays,
			);
			const inactiveBundlesResult =
				await appFunctions.cleanupInactiveShareBundles(
					mergedConfig.inactiveShareLinksDisabledDays,
					mergedConfig.inactiveShareLinksActiveDays,
				);
			const invitationsResult =
				await appFunctions.cleanupPendingGroupInvitations(
					mergedConfig.pendingInvitationsDays,
				);

			// Collect errors from all results
			const results = [
				sessionsResult,
				verificationsResult,
				orphanedResult,
				expiredLinksResult,
				expiredBundlesResult,
				inactiveLinksResult,
				inactiveBundlesResult,
				invitationsResult,
			];
			for (const result of results) {
				if (result.error) {
					errors.push(result.error);
				}
			}

			const totalDeleted =
				sessionsResult.count +
				verificationsResult.count +
				orphanedResult.count +
				expiredLinksResult.count +
				expiredBundlesResult.count +
				inactiveLinksResult.count +
				inactiveBundlesResult.count +
				invitationsResult.count;

			if (totalDeleted > 0 || errors.length > 0) {
				logger.info("Cleanup job completed", {
					totalDeleted,
					sessionsDeleted: sessionsResult.count,
					verificationsDeleted: verificationsResult.count,
					orphanedDeleted: orphanedResult.count,
					expiredLinksDeleted: expiredLinksResult.count,
					expiredBundlesDeleted: expiredBundlesResult.count,
					inactiveLinksDeleted: inactiveLinksResult.count,
					inactiveBundlesDeleted: inactiveBundlesResult.count,
					invitationsDeleted: invitationsResult.count,
					errorCount: errors.length,
				});
			} else {
				logger.info("Cleanup job completed with nothing to clean");
			}

			// Log any errors that occurred
			if (errors.length > 0) {
				logger.warn("Some cleanup operations failed", {
					errorCount: errors.length,
					errors: errors.map((e) => e.message),
				});
			}
		} catch (error) {
			logger.error("Cleanup job failed", { error });
		}
	}

	let intervalId: ReturnType<typeof setInterval> | null = null;

	/**
	 * Start the cleanup job on a schedule
	 */
	function startCleanupJob(): void {
		// Run immediately on start
		runCleanup();

		// Then run on interval
		intervalId = setInterval(runCleanup, mergedConfig.intervalMs);
		logger.info("Cleanup job scheduled", {
			intervalMs: mergedConfig.intervalMs,
		});
	}

	/**
	 * Stop the cleanup job
	 */
	function stopCleanupJob(): void {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
			logger.info("Cleanup job stopped");
		}
	}

	return {
		runCleanup,
		startCleanupJob,
		stopCleanupJob,
	};
}
