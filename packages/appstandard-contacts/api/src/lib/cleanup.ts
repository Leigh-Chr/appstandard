/**
 * Cleanup utilities for contacts-specific expired and orphaned data
 * Common auth cleanup functions are imported from @appstandard/api-core
 */

import {
	type AppCleanupFunctions,
	type CleanupResult,
	cleanupExpiredSessions as coreCleanupExpiredSessions,
	cleanupExpiredVerifications as coreCleanupExpiredVerifications,
	createCleanupRunner,
	createLogger,
} from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { cleanupAddressBookRelations } from "./cleanup-address-book-relations";

const logger = createLogger("Contacts Cleanup");

// Re-export CleanupResult for consumers of this module
export type { CleanupResult } from "@appstandard/api-core";

// Re-export common cleanup functions for backwards compatibility
export const cleanupExpiredSessions = (): Promise<CleanupResult> =>
	coreCleanupExpiredSessions(logger);
export const cleanupExpiredVerifications = (): Promise<CleanupResult> =>
	coreCleanupExpiredVerifications(logger);

/**
 * Delete anonymous address books that haven't been accessed in the last N days
 */
export async function cleanupOrphanedAnonymousAddressBooks(
	daysInactive = 60,
): Promise<CleanupResult> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

	const orphanedAddressBooks = await prisma.addressBook.findMany({
		where: {
			userId: { startsWith: "anon-" },
			updatedAt: { lt: cutoffDate },
		},
		select: { id: true },
	});

	if (orphanedAddressBooks.length === 0) {
		return { count: 0 };
	}

	const addressBookIds = orphanedAddressBooks.map((ab) => ab.id);

	try {
		const result = await prisma.$transaction(async (tx) => {
			await cleanupAddressBookRelations(addressBookIds, tx);
			return await tx.addressBook.deleteMany({
				where: { id: { in: addressBookIds } },
			});
		});

		logger.info("Successfully cleaned up orphaned anonymous address books", {
			deletedCount: result.count,
			addressBookIds: addressBookIds.length,
		});

		return { count: result.count };
	} catch (error) {
		logger.error("Failed to delete orphaned address books", {
			error,
			addressBookIdsCount: addressBookIds.length,
		});
		return {
			count: 0,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * Delete expired share links
 */
export async function cleanupExpiredShareLinks(
	gracePeriodDays = 7,
): Promise<CleanupResult> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - gracePeriodDays);

	try {
		const result = await prisma.addressBookShareLink.deleteMany({
			where: { expiresAt: { not: null, lt: cutoffDate } },
		});

		if (result.count > 0) {
			logger.info("Cleaned up expired share links", {
				deletedCount: result.count,
				gracePeriodDays,
			});
		}

		return { count: result.count };
	} catch (error) {
		logger.error("Failed to delete expired share links", { error });
		return {
			count: 0,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * Delete expired share bundles
 */
export async function cleanupExpiredShareBundles(
	gracePeriodDays = 7,
): Promise<CleanupResult> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - gracePeriodDays);

	try {
		const result = await prisma.addressBookShareBundle.deleteMany({
			where: { expiresAt: { not: null, lt: cutoffDate } },
		});

		if (result.count > 0) {
			logger.info("Cleaned up expired share bundles", {
				deletedCount: result.count,
				gracePeriodDays,
			});
		}

		return { count: result.count };
	} catch (error) {
		logger.error("Failed to delete expired share bundles", { error });
		return {
			count: 0,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * Delete inactive share links that haven't been accessed in a long time
 */
export async function cleanupInactiveShareLinks(
	inactiveDays = 90,
	activeDays = 365,
): Promise<CleanupResult> {
	const inactiveCutoff = new Date();
	inactiveCutoff.setDate(inactiveCutoff.getDate() - inactiveDays);

	const activeCutoff = new Date();
	activeCutoff.setDate(activeCutoff.getDate() - activeDays);

	try {
		const inactiveResult = await prisma.addressBookShareLink.deleteMany({
			where: {
				isActive: false,
				OR: [
					{ lastAccessedAt: { not: null, lt: inactiveCutoff } },
					{ lastAccessedAt: null, createdAt: { lt: inactiveCutoff } },
				],
			},
		});

		const activeResult = await prisma.addressBookShareLink.deleteMany({
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

		return { count: totalCount };
	} catch (error) {
		logger.error("Failed to delete inactive share links", { error });
		return {
			count: 0,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * Delete inactive share bundles that haven't been accessed in a long time
 */
export async function cleanupInactiveShareBundles(
	inactiveDays = 90,
	activeDays = 365,
): Promise<CleanupResult> {
	const inactiveCutoff = new Date();
	inactiveCutoff.setDate(inactiveCutoff.getDate() - inactiveDays);

	const activeCutoff = new Date();
	activeCutoff.setDate(activeCutoff.getDate() - activeDays);

	try {
		const inactiveResult = await prisma.addressBookShareBundle.deleteMany({
			where: {
				isActive: false,
				OR: [
					{ lastAccessedAt: { not: null, lt: inactiveCutoff } },
					{ lastAccessedAt: null, createdAt: { lt: inactiveCutoff } },
				],
			},
		});

		const activeResult = await prisma.addressBookShareBundle.deleteMany({
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

		return { count: totalCount };
	} catch (error) {
		logger.error("Failed to delete inactive share bundles", { error });
		return {
			count: 0,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * Delete pending group invitations that haven't been accepted
 */
export async function cleanupPendingGroupInvitations(
	daysPending = 30,
): Promise<CleanupResult> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysPending);

	try {
		const result = await prisma.addressBookGroupMember2.deleteMany({
			where: { acceptedAt: null, invitedAt: { lt: cutoffDate } },
		});

		if (result.count > 0) {
			logger.info("Cleaned up pending group invitations", {
				deletedCount: result.count,
				daysPending,
			});
		}

		return { count: result.count };
	} catch (error) {
		logger.error("Failed to delete pending group invitations", { error });
		return {
			count: 0,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * App-specific cleanup functions for use with createCleanupRunner
 */
export const contactsCleanupFunctions: AppCleanupFunctions = {
	cleanupOrphanedAnonymousData: cleanupOrphanedAnonymousAddressBooks,
	cleanupExpiredShareLinks,
	cleanupExpiredShareBundles,
	cleanupInactiveShareLinks,
	cleanupInactiveShareBundles,
	cleanupPendingGroupInvitations,
};

/**
 * Create a cleanup runner pre-configured for contacts cleanup
 */
export function createContactsCleanupRunner(config = {}) {
	return createCleanupRunner(contactsCleanupFunctions, config, logger);
}
