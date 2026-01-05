/**
 * Task list entity types
 */

/**
 * Task list entity - Database representation
 */
export interface TaskListEntity {
	id: string;
	name: string;
	color?: string | null;
	userId?: string | null;
	sourceUrl?: string | null;
	lastSyncedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Task list summary with task count
 */
export interface TaskListSummary {
	id: string;
	name: string;
	color?: string | null;
	taskCount: number;
	completedCount: number;
	overdueCount: number;
}
