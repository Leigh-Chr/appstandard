/**
 * Cleanup utilities for calendar-specific expired and orphaned data
 * Common auth cleanup functions are imported from @appstandard/api-core
 */

import {
	type AppCleanupFunctions,
	cleanupExpiredSessions as coreCleanupExpiredSessions,
	cleanupExpiredVerifications as coreCleanupExpiredVerifications,
	createCleanupRunner,
} from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { cleanupCalendarRelations } from "./cleanup-calendar-relations";
import { logger } from "./logger";

// Re-export common cleanup functions for backwards compatibility
export const cleanupExpiredSessions = () => coreCleanupExpiredSessions(logger);
export const cleanupExpiredVerifications = () =>
	coreCleanupExpiredVerifications(logger);

/**
 * Delete anonymous calendars that haven't been accessed in the last N days
 * Uses updatedAt which is updated on both modifications AND access (getById/list)
 * @param daysInactive - Number of days of inactivity before deletion (default: 60)
 * @returns Number of deleted calendars
 */
export async function cleanupOrphanedAnonymousCalendars(
	daysInactive = 60,
): Promise<number> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

	const orphanedCalendars = await prisma.calendar.findMany({
		where: {
			userId: { startsWith: "anon-" },
			updatedAt: { lt: cutoffDate },
		},
		select: { id: true },
	});

	if (orphanedCalendars.length === 0) {
		return 0;
	}

	const calendarIds = orphanedCalendars.map((cal) => cal.id);

	try {
		const result = await prisma.$transaction(async (tx) => {
			await cleanupCalendarRelations(calendarIds, tx);
			return await tx.calendar.deleteMany({
				where: { id: { in: calendarIds } },
			});
		});

		logger.info("Successfully cleaned up orphaned anonymous calendars", {
			deletedCount: result.count,
			calendarIds: calendarIds.length,
		});

		return result.count;
	} catch (error) {
		logger.error("Failed to delete orphaned calendars", {
			error,
			calendarIdsCount: calendarIds.length,
			calendarIds: calendarIds.slice(0, 10),
		});
		return 0;
	}
}

/**
 * Delete expired share links
 */
export async function cleanupExpiredShareLinks(
	gracePeriodDays = 7,
): Promise<number> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - gracePeriodDays);

	try {
		const result = await prisma.calendarShareLink.deleteMany({
			where: { expiresAt: { not: null, lt: cutoffDate } },
		});

		if (result.count > 0) {
			logger.info("Cleaned up expired share links", {
				deletedCount: result.count,
				gracePeriodDays,
			});
		}

		return result.count;
	} catch (error) {
		logger.error("Failed to delete expired share links", { error });
		return 0;
	}
}

/**
 * Delete expired share bundles
 */
export async function cleanupExpiredShareBundles(
	gracePeriodDays = 7,
): Promise<number> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - gracePeriodDays);

	try {
		const result = await prisma.calendarShareBundle.deleteMany({
			where: { expiresAt: { not: null, lt: cutoffDate } },
		});

		if (result.count > 0) {
			logger.info("Cleaned up expired share bundles", {
				deletedCount: result.count,
				gracePeriodDays,
			});
		}

		return result.count;
	} catch (error) {
		logger.error("Failed to delete expired share bundles", { error });
		return 0;
	}
}

/**
 * Delete inactive share links that haven't been accessed in a long time
 */
export async function cleanupInactiveShareLinks(
	inactiveDays = 90,
	activeDays = 365,
): Promise<number> {
	const inactiveCutoff = new Date();
	inactiveCutoff.setDate(inactiveCutoff.getDate() - inactiveDays);

	const activeCutoff = new Date();
	activeCutoff.setDate(activeCutoff.getDate() - activeDays);

	try {
		const inactiveResult = await prisma.calendarShareLink.deleteMany({
			where: {
				isActive: false,
				OR: [
					{ lastAccessedAt: { not: null, lt: inactiveCutoff } },
					{ lastAccessedAt: null, createdAt: { lt: inactiveCutoff } },
				],
			},
		});

		const activeResult = await prisma.calendarShareLink.deleteMany({
			where: {
				isActive: true,
				expiresAt: null,
				OR: [
					{ lastAccessedAt: { not: null, lt: activeCutoff } },
					{ lastAccessedAt: null, createdAt: { lt: activeCutoff } },
				],
			},
		});

		const totalCount = inactiveResult.count + activeResult.count;

		if (totalCount > 0) {
			logger.info("Cleaned up inactive share links", {
				deletedCount: totalCount,
				inactiveCount: inactiveResult.count,
				activeCount: activeResult.count,
			});
		}

		return totalCount;
	} catch (error) {
		logger.error("Failed to delete inactive share links", { error });
		return 0;
	}
}

/**
 * Delete inactive share bundles that haven't been accessed in a long time
 */
export async function cleanupInactiveShareBundles(
	inactiveDays = 90,
	activeDays = 365,
): Promise<number> {
	const inactiveCutoff = new Date();
	inactiveCutoff.setDate(inactiveCutoff.getDate() - inactiveDays);

	const activeCutoff = new Date();
	activeCutoff.setDate(activeCutoff.getDate() - activeDays);

	try {
		const inactiveResult = await prisma.calendarShareBundle.deleteMany({
			where: {
				isActive: false,
				OR: [
					{ lastAccessedAt: { not: null, lt: inactiveCutoff } },
					{ lastAccessedAt: null, createdAt: { lt: inactiveCutoff } },
				],
			},
		});

		const activeResult = await prisma.calendarShareBundle.deleteMany({
			where: {
				isActive: true,
				expiresAt: null,
				OR: [
					{ lastAccessedAt: { not: null, lt: activeCutoff } },
					{ lastAccessedAt: null, createdAt: { lt: activeCutoff } },
				],
			},
		});

		const totalCount = inactiveResult.count + activeResult.count;

		if (totalCount > 0) {
			logger.info("Cleaned up inactive share bundles", {
				deletedCount: totalCount,
				inactiveCount: inactiveResult.count,
				activeCount: activeResult.count,
			});
		}

		return totalCount;
	} catch (error) {
		logger.error("Failed to delete inactive share bundles", { error });
		return 0;
	}
}

/**
 * Delete pending group invitations that haven't been accepted
 */
export async function cleanupPendingGroupInvitations(
	daysPending = 30,
): Promise<number> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysPending);

	try {
		const result = await prisma.groupMember.deleteMany({
			where: { acceptedAt: null, invitedAt: { lt: cutoffDate } },
		});

		if (result.count > 0) {
			logger.info("Cleaned up pending group invitations", {
				deletedCount: result.count,
				daysPending,
			});
		}

		return result.count;
	} catch (error) {
		logger.error("Failed to delete pending group invitations", { error });
		return 0;
	}
}

/**
 * App-specific cleanup functions for use with createCleanupRunner
 */
export const calendarCleanupFunctions: AppCleanupFunctions = {
	cleanupOrphanedAnonymousData: cleanupOrphanedAnonymousCalendars,
	cleanupExpiredShareLinks,
	cleanupExpiredShareBundles,
	cleanupInactiveShareLinks,
	cleanupInactiveShareBundles,
	cleanupPendingGroupInvitations,
};

/**
 * Create a cleanup runner pre-configured for calendar cleanup
 */
export function createCalendarCleanupRunner(config = {}) {
	return createCleanupRunner(calendarCleanupFunctions, config, logger);
}
