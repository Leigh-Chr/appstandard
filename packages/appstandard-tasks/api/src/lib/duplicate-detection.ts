/**
 * Enhanced duplicate detection for tasks
 *
 * Detection strategy:
 * 1. If both tasks have a UID, compare by UID (strongest identifier)
 * 2. Otherwise, compare by title + dates with configurable tolerance
 */

/** Configuration for duplicate detection */
export interface DuplicateDetectionConfig {
	/** Tolerance in milliseconds for date comparison (default: 60000 = 1 minute) */
	dateTolerance?: number | undefined;
	/** Compare by UID when available (default: true) */
	useUid?: boolean | undefined;
	/** Compare by title in addition to dates (default: true) */
	useTitle?: boolean | undefined;
}

const DEFAULT_CONFIG: Required<DuplicateDetectionConfig> = {
	dateTolerance: 60000, // 1 minute
	useUid: true,
	useTitle: true,
};

/** Minimal task interface for duplicate detection */
export interface DuplicateCheckTask {
	id: string;
	uid?: string | null | undefined;
	title: string;
	dueDate?: Date | null | undefined;
	startDate?: Date | null | undefined;
}

/**
 * Generate a comparison key for a task based on its properties
 * This key is used to group potentially duplicate tasks
 */
function generateTaskKey(
	task: DuplicateCheckTask,
	config: Required<DuplicateDetectionConfig>,
): string {
	// If UID is available and we're using it, it's the primary key
	if (config.useUid && task.uid) {
		return `uid:${task.uid}`;
	}

	// Otherwise, create a composite key
	const parts: string[] = [];

	if (config.useTitle) {
		// Normalize title: lowercase, trim, remove extra spaces
		parts.push(task.title.toLowerCase().trim().replace(/\s+/g, " "));
	}

	// Use due date or start date if available
	const dateToUse = task.dueDate || task.startDate;
	if (dateToUse) {
		const dateBucket = Math.floor(dateToUse.getTime() / config.dateTolerance);
		parts.push(`${dateBucket}`);
	} else {
		parts.push("no-date");
	}

	return parts.join("|");
}

/**
 * Check if two tasks are duplicates based on the configuration
 */
function areTasksDuplicates(
	task1: DuplicateCheckTask,
	task2: DuplicateCheckTask,
	config: DuplicateDetectionConfig = {},
): boolean {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };

	// If both have UIDs and we're using them, compare UIDs directly
	if (mergedConfig.useUid && task1.uid && task2.uid) {
		return task1.uid === task2.uid;
	}

	// Compare titles if configured
	if (mergedConfig.useTitle) {
		const title1 = task1.title.toLowerCase().trim().replace(/\s+/g, " ");
		const title2 = task2.title.toLowerCase().trim().replace(/\s+/g, " ");
		if (title1 !== title2) {
			return false;
		}
	}

	// Compare dates with tolerance
	const date1 = task1.dueDate || task1.startDate;
	const date2 = task2.dueDate || task2.startDate;

	// If neither has a date, consider them potential duplicates based on title
	if (!date1 && !date2) {
		return true;
	}

	// If only one has a date, they're not duplicates
	if (!date1 || !date2) {
		return false;
	}

	const dateDiff = Math.abs(date1.getTime() - date2.getTime());
	if (dateDiff > mergedConfig.dateTolerance) {
		return false;
	}

	return true;
}

/**
 * Find and remove duplicates from an array of tasks
 * Returns the deduplicated array, keeping the first occurrence
 */
export function deduplicateTasks<T extends DuplicateCheckTask>(
	tasks: T[],
	config: DuplicateDetectionConfig = {},
): { unique: T[]; duplicates: T[] } {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };
	const seen = new Map<string, T>();
	const duplicates: T[] = [];

	for (const task of tasks) {
		const key = generateTaskKey(task, mergedConfig);

		const existing = seen.get(key);
		if (existing) {
			// Double-check with direct comparison to handle edge cases
			if (areTasksDuplicates(task, existing, config)) {
				duplicates.push(task);
				continue;
			}
		}

		seen.set(key, task);
	}

	return {
		unique: tasks.filter((t) => !duplicates.includes(t)),
		duplicates,
	};
}

/**
 * Find tasks in `newTasks` that are duplicates of tasks in `existingTasks`
 * Returns tasks from `newTasks` that should be skipped
 */
export function findDuplicatesAgainstExisting<T extends DuplicateCheckTask>(
	newTasks: T[],
	existingTasks: DuplicateCheckTask[],
	config: DuplicateDetectionConfig = {},
): { unique: T[]; duplicates: T[] } {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };
	const unique: T[] = [];
	const duplicates: T[] = [];

	// Build lookup for existing tasks
	const existingByKey = new Map<string, DuplicateCheckTask[]>();
	for (const task of existingTasks) {
		const key = generateTaskKey(task, mergedConfig);
		const existing = existingByKey.get(key) || [];
		existing.push(task);
		existingByKey.set(key, existing);
	}

	for (const newTask of newTasks) {
		const key = generateTaskKey(newTask, mergedConfig);
		const potentialDuplicates = existingByKey.get(key) || [];

		const isDuplicate = potentialDuplicates.some((existing) =>
			areTasksDuplicates(newTask, existing, config),
		);

		if (isDuplicate) {
			duplicates.push(newTask);
		} else {
			unique.push(newTask);
		}
	}

	return { unique, duplicates };
}

/**
 * Get duplicate IDs from an array of tasks
 * Returns IDs of tasks that should be removed (keeping first occurrence)
 */
export function getDuplicateIds(
	tasks: DuplicateCheckTask[],
	config: DuplicateDetectionConfig = {},
): string[] {
	const { duplicates } = deduplicateTasks(tasks, config);
	return duplicates.map((t) => t.id);
}
