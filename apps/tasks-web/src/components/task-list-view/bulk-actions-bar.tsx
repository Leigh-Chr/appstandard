/**
 * Bulk actions toolbar for selected task lists
 * Wrapper around shared BulkActionsBar component
 */

import { BulkActionsBar } from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { ShareTaskListsDialog } from "@/components/share-task-lists-dialog";
import { QUERY_KEYS } from "@/lib/query-keys";
import { exportTaskListsAsICSFile } from "@/lib/task-list-export";
import { trpc } from "@/utils/trpc";
import { CreateGroupDialog } from "./create-group-dialog";

interface TaskListBulkActionsBarProps {
	selectedCount: number;
	totalCount: number;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onExitSelectionMode: () => void;
	selectedIds: Set<string>;
}

export function TaskListBulkActionsBar({
	selectedCount,
	totalCount,
	onSelectAll,
	onDeselectAll,
	onExitSelectionMode,
	selectedIds,
}: TaskListBulkActionsBarProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	// Bulk delete mutation
	const bulkDeleteMutation = useMutation(
		trpc.taskList.bulkDelete.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.task.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success(`${data.deletedCount} task list(s) deleted`);
				onExitSelectionMode();
			},
			onError: (error) => {
				toast.error(error.message || "Error during deletion");
			},
		}),
	);

	const handleDeleteConfirm = useCallback(() => {
		bulkDeleteMutation.mutate({ taskListIds: Array.from(selectedIds) });
	}, [bulkDeleteMutation, selectedIds]);

	const handleMerge = useCallback(() => {
		const selectedStr = Array.from(selectedIds).join(",");
		navigate({
			to: "/tasks/merge",
			search: { selected: selectedStr },
		});
		onExitSelectionMode();
	}, [navigate, selectedIds, onExitSelectionMode]);

	const handleExport = useCallback(async () => {
		if (selectedIds.size === 0) return;
		try {
			await exportTaskListsAsICSFile(Array.from(selectedIds));
			toast.success("Task lists exported successfully");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to export");
		}
	}, [selectedIds]);

	return (
		<BulkActionsBar
			labels={{
				entitySingular: "task list",
				entityPlural: "task lists",
				subItemPlural: "tasks",
			}}
			selectedCount={selectedCount}
			totalCount={totalCount}
			selectedIds={selectedIds}
			isDeleting={bulkDeleteMutation.isPending}
			onSelectAll={onSelectAll}
			onDeselectAll={onDeselectAll}
			onExitSelectionMode={onExitSelectionMode}
			onDeleteConfirm={handleDeleteConfirm}
			onMerge={handleMerge}
			onExport={handleExport}
			renderShareDialog={({ open, onOpenChange }) => (
				<ShareTaskListsDialog
					taskListIds={Array.from(selectedIds)}
					open={open}
					onOpenChange={onOpenChange}
				/>
			)}
			renderCreateGroupDialog={({ open, onOpenChange }) => (
				<CreateGroupDialog
					open={open}
					onOpenChange={onOpenChange}
					initialTaskListIds={Array.from(selectedIds)}
				/>
			)}
		/>
	);
}
