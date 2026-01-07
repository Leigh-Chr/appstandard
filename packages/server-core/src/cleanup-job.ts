/**
 * Cleanup job factory for scheduled data cleanup
 * Provides a consistent pattern for running periodic cleanup tasks
 */

import { logger } from "./lib/logger";

/** Default configuration for cleanup operations */
export const CLEANUP_DEFAULTS = {
	/** Cleanup interval in milliseconds (24 hours) */
	intervalMs: 24 * 60 * 60 * 1000,
	/** Days of inactivity before deleting anonymous data */
	daysInactiveData: 60,
	/** Days to wait after share expiration before deleting */
	gracePeriodExpiredShares: 7,
	/** Days of inactivity for disabled shares */
	daysInactiveShares: 90,
	/** Days of inactivity for active shares without expiration */
	daysInactiveActiveShares: 365,
	/** Days after which pending group invitations are deleted */
	daysPendingInvitations: 30,
	/** Delay before running cleanup on startup (ms) - allows server to warm up first */
	startupDelayMs: 30000, // 30 seconds
} as const;

/**
 * Configuration for cleanup operations
 */
export interface CleanupConfig {
	/** Cleanup interval in milliseconds */
	intervalMs?: number | undefined;
	/** Days of inactivity before deleting anonymous data */
	daysInactiveData?: number | undefined;
	/** Days to wait after share expiration before deleting */
	gracePeriodExpiredShares?: number | undefined;
	/** Days of inactivity for disabled shares */
	daysInactiveShares?: number | undefined;
	/** Days of inactivity for active shares without expiration */
	daysInactiveActiveShares?: number | undefined;
	/** Days after which pending group invitations are deleted */
	daysPendingInvitations?: number | undefined;
	/** Whether to run cleanup on startup (deferred to not block server) */
	runOnStartup?: boolean | undefined;
	/** Delay before running startup cleanup (allows server to warm up first) */
	startupDelayMs?: number | undefined;
}

/**
 * Common cleanup functions interface
 * Each product (calendar, contacts, tasks) provides its own implementation
 */
export interface CleanupFunctions {
	/** Clean up expired sessions */
	cleanupExpiredSessions: () => Promise<number>;
	/** Clean up expired email verifications */
	cleanupExpiredVerifications: () => Promise<number>;
	/** Clean up expired share links */
	cleanupExpiredShareLinks: (gracePeriodDays: number) => Promise<number>;
	/** Clean up expired share bundles */
	cleanupExpiredShareBundles: (gracePeriodDays: number) => Promise<number>;
	/** Clean up pending group invitations */
	cleanupPendingGroupInvitations: (maxAgeDays: number) => Promise<number>;
	/** Clean up inactive share links */
	cleanupInactiveShareLinks: (
		daysInactive: number,
		daysInactiveActive: number,
	) => Promise<number>;
	/** Clean up inactive share bundles */
	cleanupInactiveShareBundles: (
		daysInactive: number,
		daysInactiveActive: number,
	) => Promise<number>;
	/** Clean up orphaned anonymous data (calendars, address books, task lists) */
	cleanupOrphanedAnonymousData: (daysInactive: number) => Promise<number>;
}

/**
 * Create a cleanup job runner
 * @param functions - Cleanup functions to run
 * @param config - Optional configuration overrides
 * @returns startCleanupJob function
 */
export function createCleanupJob(
	functions: CleanupFunctions,
	config?: CleanupConfig,
) {
	const {
		intervalMs = CLEANUP_DEFAULTS.intervalMs,
		daysInactiveData = CLEANUP_DEFAULTS.daysInactiveData,
		gracePeriodExpiredShares = CLEANUP_DEFAULTS.gracePeriodExpiredShares,
		daysInactiveShares = CLEANUP_DEFAULTS.daysInactiveShares,
		daysInactiveActiveShares = CLEANUP_DEFAULTS.daysInactiveActiveShares,
		daysPendingInvitations = CLEANUP_DEFAULTS.daysPendingInvitations,
		runOnStartup = true,
		startupDelayMs = CLEANUP_DEFAULTS.startupDelayMs,
	} = config || {};

	/**
	 * Run the cleanup process
	 */
	async function runCleanup() {
		const startTime = Date.now();
		logger.info("Running cleanup job...");

		const results = {
			expiredSessions: 0,
			expiredVerifications: 0,
			expiredShareLinks: 0,
			expiredShareBundles: 0,
			pendingInvitations: 0,
			inactiveShareLinks: 0,
			inactiveShareBundles: 0,
			orphanedData: 0,
		};

		try {
			// High priority: Security-related cleanup
			logger.info("Running high-priority cleanup (security)...");
			results.expiredSessions = await functions.cleanupExpiredSessions();
			results.expiredVerifications =
				await functions.cleanupExpiredVerifications();

			// Medium priority: Regular cleanup
			logger.info(
				"Running medium-priority cleanup (expired shares, invitations)...",
			);
			results.expiredShareLinks = await functions.cleanupExpiredShareLinks(
				gracePeriodExpiredShares,
			);
			results.expiredShareBundles = await functions.cleanupExpiredShareBundles(
				gracePeriodExpiredShares,
			);
			results.pendingInvitations =
				await functions.cleanupPendingGroupInvitations(daysPendingInvitations);

			// Low priority: Optimization cleanup
			logger.info(
				"Running low-priority cleanup (inactive shares, orphaned data)...",
			);
			results.inactiveShareLinks = await functions.cleanupInactiveShareLinks(
				daysInactiveShares,
				daysInactiveActiveShares,
			);
			results.inactiveShareBundles =
				await functions.cleanupInactiveShareBundles(
					daysInactiveShares,
					daysInactiveActiveShares,
				);
			results.orphanedData =
				await functions.cleanupOrphanedAnonymousData(daysInactiveData);

			const totalDeleted =
				results.expiredSessions +
				results.expiredVerifications +
				results.expiredShareLinks +
				results.expiredShareBundles +
				results.pendingInvitations +
				results.inactiveShareLinks +
				results.inactiveShareBundles +
				results.orphanedData;

			const duration = Date.now() - startTime;

			if (totalDeleted > 0) {
				logger.info("Cleanup job completed", {
					duration: `${duration}ms`,
					totalDeleted,
					details: results,
				});
			} else {
				logger.info("Cleanup job completed: No data to clean up", {
					duration: `${duration}ms`,
				});
			}
		} catch (error) {
			logger.error("Cleanup job failed", {
				error,
				partialResults: results,
			});
		}
	}

	/**
	 * Start the cleanup job
	 * Runs periodically to clean up expired and orphaned data
	 */
	function startCleanupJob() {
		const intervalHours = Math.round(intervalMs / (60 * 60 * 1000));
		const delaySeconds = Math.round(startupDelayMs / 1000);
		logger.info(`Cleanup job started (runs every ${intervalHours} hours)`);

		// Run cleanup after startup delay if configured
		// This prevents blocking the server during cold start
		if (runOnStartup) {
			logger.info(
				`Cleanup will run in ${delaySeconds}s to allow server warmup`,
			);
			setTimeout(() => {
				runCleanup();
			}, startupDelayMs);
		}

		// Schedule periodic cleanup
		setInterval(() => {
			runCleanup();
		}, intervalMs);
	}

	return { startCleanupJob, runCleanup };
}
