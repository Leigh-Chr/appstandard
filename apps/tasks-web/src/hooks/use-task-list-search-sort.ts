/**
 * Hook for managing task list search and sort
 */

import type { useNavigate } from "@tanstack/react-router";
import type {
	TaskListSortBy,
	TaskListSortDirection,
} from "@/components/task-list-view/task-list-filters";
import type { Route } from "@/routes/tasks";

export function useTaskListSearchSortHandlers(
	navigate: ReturnType<typeof useNavigate>,
	search: ReturnType<typeof Route.useSearch>,
	sortDirection: TaskListSortDirection,
) {
	const handleKeywordChange = (newKeyword: string) => {
		navigate({
			search: {
				...search,
				q: newKeyword || undefined,
			},
		});
	};

	const handleSortChange = (newSortBy: TaskListSortBy) => {
		const shouldShowDirection =
			newSortBy === "updatedAt" || newSortBy === "createdAt";
		navigate({
			search: {
				...search,
				sortBy: newSortBy,
				sortDirection: shouldShowDirection ? sortDirection : "desc",
			},
		});
	};

	const handleSortDirectionChange = (newDirection: TaskListSortDirection) => {
		navigate({
			search: {
				...search,
				sortDirection: newDirection,
			},
		});
	};

	return {
		handleKeywordChange,
		handleSortChange,
		handleSortDirectionChange,
	};
}
