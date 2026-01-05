/**
 * Task list sorting utilities
 * Uses shared entity sorter from @appstandard/react-utils
 */

import {
	createEntitySorter,
	type SortDirection,
} from "@appstandard/react-utils";
import type {
	TaskListSortBy,
	TaskListSortDirection,
} from "@/components/task-list-view/task-list-filters";

export type TaskListForSort = {
	id: string;
	name: string;
	updatedAt?: string | Date | null;
	createdAt?: string | Date | null;
	taskCount: number;
	completedCount?: number;
	color?: string | null;
};

// Create task-list-specific sorter
const taskListSorter = createEntitySorter<TaskListForSort>({
	countField: "taskCount",
});

/**
 * Sort task lists by the specified criteria
 */
export function sortTaskLists(
	taskLists: TaskListForSort[],
	sortBy: TaskListSortBy,
	sortDirection: TaskListSortDirection,
): TaskListForSort[] {
	// Map TaskListSortBy to generic sort type
	const genericSortBy =
		sortBy === "taskCount"
			? "count"
			: (sortBy as "name" | "updatedAt" | "createdAt");
	return taskListSorter.sort(
		taskLists,
		genericSortBy,
		sortDirection as SortDirection,
	);
}

/**
 * Filter task lists by keyword
 */
export function filterTaskListsByKeyword(
	taskLists: TaskListForSort[],
	keyword: string,
): TaskListForSort[] {
	return taskListSorter.filterByKeyword(taskLists, keyword);
}
