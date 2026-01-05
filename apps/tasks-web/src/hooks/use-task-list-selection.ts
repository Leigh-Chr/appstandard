/**
 * Hook for managing task list selection mode
 */

import { useState } from "react";
import type { TaskListForSort } from "@/lib/task-list-sort";

export function useTaskListSelectionHandlers(taskLists: TaskListForSort[]) {
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const handleToggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleSelectAll = () => {
		setSelectedIds(new Set(taskLists.map((tl) => tl.id)));
	};

	const handleDeselectAll = () => {
		setSelectedIds(new Set());
	};

	const handleExitSelectionMode = () => {
		setSelectionMode(false);
		setSelectedIds(new Set());
	};

	const handleEnterSelectionMode = () => {
		setSelectionMode(true);
	};

	return {
		selectionMode,
		selectedIds,
		handleToggleSelect,
		handleSelectAll,
		handleDeselectAll,
		handleExitSelectionMode,
		handleEnterSelectionMode,
	};
}
