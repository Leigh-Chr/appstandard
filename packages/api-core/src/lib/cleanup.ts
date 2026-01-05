/**
 * Common cleanup utilities for expired authentication data
 * These functions are shared across all AppStandard applications
 * since they operate on the same auth tables (session, verification)
 */

import prisma from "@appstandard/db";
import { createLogger, type Logger } from "./logger";

const defaultLogger = createLogger("Cleanup");

/**
 * Delete expired sessions
 * Sessions are automatically invalid after expiration, but we clean them up for database hygiene
 * @param logger - Optional logger instance (defaults to cleanup logger)
 * @returns Number of deleted sessions
 */
export async function cleanupExpiredSessions(
	logger: Logger = defaultLogger,
): Promise<number> {
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

		return result.count;
	} catch (error) {
		logger.error("Failed to delete expired sessions", {
			error,
		});
		return 0;
	}
}

/**
 * Delete expired verification tokens
 * These are used for email verification and password reset
 * @param logger - Optional logger instance (defaults to cleanup logger)
 * @returns Number of deleted verifications
 */
export async function cleanupExpiredVerifications(
	logger: Logger = defaultLogger,
): Promise<number> {
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

		return result.count;
	} catch (error) {
		logger.error("Failed to delete expired verifications", {
			error,
		});
		return 0;
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
 */
export interface AppCleanupFunctions {
	/** Delete orphaned anonymous data (calendars, address books, task lists) */
	cleanupOrphanedAnonymousData: (daysInactive: number) => Promise<number>;
	/** Delete expired share links */
	cleanupExpiredShareLinks: (gracePeriodDays: number) => Promise<number>;
	/** Delete expired share bundles */
	cleanupExpiredShareBundles: (gracePeriodDays: number) => Promise<number>;
	/** Delete inactive share links */
	cleanupInactiveShareLinks: (
		inactiveDays: number,
		activeDays: number,
	) => Promise<number>;
	/** Delete inactive share bundles */
	cleanupInactiveShareBundles: (
		inactiveDays: number,
		activeDays: number,
	) => Promise<number>;
	/** Delete pending group invitations */
	cleanupPendingGroupInvitations: (daysPending: number) => Promise<number>;
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
	 */
	async function runCleanup(): Promise<void> {
		logger.info("Starting cleanup job...");

		try {
			// Common auth cleanup
			const sessionsDeleted = await cleanupExpiredSessions(logger);
			const verificationsDeleted = await cleanupExpiredVerifications(logger);

			// App-specific cleanup
			const orphanedDeleted = await appFunctions.cleanupOrphanedAnonymousData(
				mergedConfig.orphanedDaysInactive,
			);
			const expiredLinksDeleted = await appFunctions.cleanupExpiredShareLinks(
				mergedConfig.expiredShareLinksGraceDays,
			);
			const expiredBundlesDeleted =
				await appFunctions.cleanupExpiredShareBundles(
					mergedConfig.expiredShareLinksGraceDays,
				);
			const inactiveLinksDeleted = await appFunctions.cleanupInactiveShareLinks(
				mergedConfig.inactiveShareLinksDisabledDays,
				mergedConfig.inactiveShareLinksActiveDays,
			);
			const inactiveBundlesDeleted =
				await appFunctions.cleanupInactiveShareBundles(
					mergedConfig.inactiveShareLinksDisabledDays,
					mergedConfig.inactiveShareLinksActiveDays,
				);
			const invitationsDeleted =
				await appFunctions.cleanupPendingGroupInvitations(
					mergedConfig.pendingInvitationsDays,
				);

			const totalDeleted =
				sessionsDeleted +
				verificationsDeleted +
				orphanedDeleted +
				expiredLinksDeleted +
				expiredBundlesDeleted +
				inactiveLinksDeleted +
				inactiveBundlesDeleted +
				invitationsDeleted;

			if (totalDeleted > 0) {
				logger.info("Cleanup job completed", {
					totalDeleted,
					sessionsDeleted,
					verificationsDeleted,
					orphanedDeleted,
					expiredLinksDeleted,
					expiredBundlesDeleted,
					inactiveLinksDeleted,
					inactiveBundlesDeleted,
					invitationsDeleted,
				});
			} else {
				logger.info("Cleanup job completed with nothing to clean");
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
