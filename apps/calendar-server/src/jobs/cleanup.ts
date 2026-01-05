/**
 * Scheduled cleanup job for AppStandard Calendar
 * Uses the shared cleanup factory with calendar-specific cleanup functions
 */

import {
	cleanupExpiredSessions,
	cleanupExpiredShareBundles,
	cleanupExpiredShareLinks,
	cleanupExpiredVerifications,
	cleanupInactiveShareBundles,
	cleanupInactiveShareLinks,
	cleanupOrphanedAnonymousCalendars,
	cleanupPendingGroupInvitations,
} from "@appstandard/api/lib/cleanup";
import { createCleanupJob } from "@appstandard/server-core";

const { startCleanupJob } = createCleanupJob({
	cleanupExpiredSessions,
	cleanupExpiredVerifications,
	cleanupExpiredShareLinks,
	cleanupExpiredShareBundles,
	cleanupPendingGroupInvitations,
	cleanupInactiveShareLinks,
	cleanupInactiveShareBundles,
	cleanupOrphanedAnonymousData: cleanupOrphanedAnonymousCalendars,
});

export { startCleanupJob };
