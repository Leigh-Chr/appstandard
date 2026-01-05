/**
 * Scheduled cleanup job for AppStandard Tasks
 * Uses the shared cleanup factory with tasks-specific cleanup functions
 */

import { createCleanupJob } from "@appstandard/server-core";
import {
	cleanupExpiredSessions,
	cleanupExpiredShareBundles,
	cleanupExpiredShareLinks,
	cleanupExpiredVerifications,
	cleanupInactiveShareBundles,
	cleanupInactiveShareLinks,
	cleanupOrphanedAnonymousTaskLists,
	cleanupPendingGroupInvitations,
} from "@appstandard-tasks/api/lib/cleanup";

const { startCleanupJob } = createCleanupJob({
	cleanupExpiredSessions,
	cleanupExpiredVerifications,
	cleanupExpiredShareLinks,
	cleanupExpiredShareBundles,
	cleanupPendingGroupInvitations,
	cleanupInactiveShareLinks,
	cleanupInactiveShareBundles,
	cleanupOrphanedAnonymousData: cleanupOrphanedAnonymousTaskLists,
});

export { startCleanupJob };
