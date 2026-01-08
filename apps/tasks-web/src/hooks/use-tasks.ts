/**
 * Unified storage hooks for tasks
 * Follows AppStandard Calendar patterns for consistency
 */

import { removeFromIndex } from "@appstandard/react-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleTRPCError } from "@/lib/error-handler";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

/**
 * Hook to fetch tasks for a task list
 */
export function useTasks(taskListId: string) {
	const trpcTasks = useQuery({
		...trpc.task.list.queryOptions({ taskListId }),
		enabled: !!taskListId,
	});

	return {
		tasks: trpcTasks.data || [],
		isLoading: trpcTasks.isLoading,
		isError: trpcTasks.isError,
	};
}

/**
 * Hook to delete a task with undo capability
 */
export function useDeleteTask() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.task.delete.mutationOptions({
			onSuccess: (_, variables) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.task.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				// Remove from OS content index
				void removeFromIndex(`task-${variables.id}`);
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error deleting task",
					fallbackDescription: "Unable to delete the task. Please try again.",
				});
			},
		}),
	);

	const deleteWithUndo = (params: { id: string; title?: string }) => {
		let cancelled = false;
		const toastId = toast("Task deleted", {
			description: params.title
				? `"${params.title}" has been deleted`
				: undefined,
			action: {
				label: "Undo",
				onClick: () => {
					cancelled = true;
					toast.dismiss(toastId);
					toast.success("Deletion cancelled");
				},
			},
			duration: 5000,
			onAutoClose: () => {
				if (!cancelled) {
					mutation.mutate({ id: params.id });
				}
			},
		});
	};

	return {
		deleteTask: deleteWithUndo,
		isDeleting: mutation.isPending,
	};
}

/**
 * Hook to toggle task completion
 */
export function useToggleTaskStatus() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.task.update.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.task.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error updating task status",
					fallbackDescription:
						"Unable to update the task status. Please try again.",
				});
			},
		}),
	);

	const toggleStatus = ({
		id,
		currentStatus,
	}: {
		id: string;
		currentStatus: string;
	}) => {
		const newStatus =
			currentStatus === "COMPLETED" ? "NEEDS_ACTION" : "COMPLETED";
		mutation.mutate({
			id,
			status: newStatus as "NEEDS_ACTION" | "COMPLETED",
			percentComplete: newStatus === "COMPLETED" ? 100 : 0,
		});
	};

	return {
		toggleStatus,
		isToggling: mutation.isPending,
	};
}
