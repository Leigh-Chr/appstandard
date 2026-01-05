/**
 * Unified storage hooks for task lists
 * Follows AppStandard Calendar patterns for consistency
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleTRPCError } from "@/lib/error-handler";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

/**
 * Hook to fetch all task lists
 */
export function useTaskLists() {
	const trpcTaskLists = useQuery({
		...trpc.taskList.list.queryOptions(),
		enabled: true,
	});

	return {
		taskLists: trpcTaskLists.data || [],
		isLoading: trpcTaskLists.isLoading,
		isError: trpcTaskLists.isError,
	};
}

/**
 * Hook to fetch a single task list by ID
 */
export function useTaskList(listId: string | undefined) {
	const trpcTaskList = useQuery({
		...trpc.taskList.getById.queryOptions({ id: listId ?? "" }),
		enabled: !!listId,
	});

	return {
		taskList: trpcTaskList.data,
		isLoading: trpcTaskList.isLoading,
		isError: trpcTaskList.isError,
	};
}

/**
 * Hook to create a new task list
 */
export function useCreateTaskList() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.taskList.create.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error creating task list",
					fallbackDescription:
						"Unable to create the task list. Please try again.",
				});
			},
		}),
	);

	return {
		createTaskList: mutation.mutate,
		isCreating: mutation.isPending,
	};
}

/**
 * Hook to update a task list
 */
export function useUpdateTaskList() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.taskList.update.mutationOptions({
			onSuccess: (_, variables) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.byId(variables.id),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Task list updated");
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error updating task list",
					fallbackDescription:
						"Unable to update the task list. Please try again.",
				});
			},
		}),
	);

	return {
		updateTaskList: mutation.mutate,
		isUpdating: mutation.isPending,
	};
}

/**
 * Hook to delete a task list with undo capability
 */
export function useDeleteTaskList() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.taskList.delete.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error deleting task list",
					fallbackDescription:
						"Unable to delete the task list. Please try again.",
				});
			},
		}),
	);

	const deleteWithUndo = (params: { id: string; name?: string }) => {
		let cancelled = false;
		const toastId = toast("Task list deleted", {
			description: params.name
				? `"${params.name}" has been deleted`
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
		deleteTaskList: deleteWithUndo,
		isDeleting: mutation.isPending,
	};
}
