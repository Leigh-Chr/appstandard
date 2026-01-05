/**
 * Scheduled cleanup job for AppStandard Contacts
 * Uses the shared cleanup factory with contacts-specific cleanup functions
 */

import { createCleanupJob } from "@appstandard/server-core";
import {
	cleanupExpiredSessions,
	cleanupExpiredShareBundles,
	cleanupExpiredShareLinks,
	cleanupExpiredVerifications,
	cleanupInactiveShareBundles,
	cleanupInactiveShareLinks,
	cleanupOrphanedAnonymousAddressBooks,
	cleanupPendingGroupInvitations,
} from "@appstandard-contacts/api/lib/cleanup";

const { startCleanupJob } = createCleanupJob({
	cleanupExpiredSessions,
	cleanupExpiredVerifications,
	cleanupExpiredShareLinks,
	cleanupExpiredShareBundles,
	cleanupPendingGroupInvitations,
	cleanupInactiveShareLinks,
	cleanupInactiveShareBundles,
	cleanupOrphanedAnonymousData: cleanupOrphanedAnonymousAddressBooks,
});

export { startCleanupJob };
