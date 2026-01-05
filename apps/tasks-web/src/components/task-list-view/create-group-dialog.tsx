/**
 * Create/Edit Task List Group Dialog
 * Wrapper around shared CreateGroupDialog component
 */

import {
	CreateGroupDialog,
	type GroupToEdit,
	type SelectableItem,
} from "@appstandard/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

interface TasksCreateGroupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Pre-selected task list IDs (for creating from selection) */
	initialTaskListIds?: string[];
	/** Group to edit (if provided, dialog is in edit mode) */
	groupToEdit?: {
		id: string;
		name: string;
		description?: string | null;
		color?: string | null;
	};
}

export function TasksCreateGroupDialog({
	open,
	onOpenChange,
	initialTaskListIds = [],
	groupToEdit,
}: TasksCreateGroupDialogProps) {
	const queryClient = useQueryClient();

	// Get all task lists
	const { data: taskListsData } = useQuery({
		...trpc.taskList.list.queryOptions(),
		enabled: open,
	});

	const taskLists = taskListsData || [];

	// Map to SelectableItem format
	const items: SelectableItem[] = taskLists.map(
		(list: {
			id: string;
			name: string;
			color: string | null;
			taskCount: number;
		}) => ({
			id: list.id,
			name: list.name,
			color: list.color,
			count: list.taskCount,
		}),
	);

	// Get group details if editing
	const { data: groupDetails } = useQuery({
		...trpc.group.getById.queryOptions({ id: groupToEdit?.id || "" }),
		enabled: open && !!groupToEdit?.id,
	});

	// Get current item IDs from group details
	const currentItemIds =
		groupDetails?.taskLists?.map((tl: { id: string }) => tl.id) || [];

	// Map groupToEdit to GroupToEdit format
	const mappedGroupToEdit: GroupToEdit | undefined = groupToEdit
		? {
				id: groupToEdit.id,
				name: groupToEdit.name,
				description: groupToEdit.description,
				color: groupToEdit.color,
			}
		: undefined;

	// Create mutation
	const createMutation = useMutation(
		trpc.group.create.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskGroup.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Group created successfully");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message || "Error creating group");
			},
		}),
	);

	// Update mutation
	const updateMutation = useMutation(
		trpc.group.update.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskGroup.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Group updated successfully");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message || "Error updating group");
			},
		}),
	);

	// Add task lists mutation
	const addTaskListsMutation = useMutation(
		trpc.group.addTaskLists.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskGroup.all,
				});
				toast.success("Task lists added to group");
			},
			onError: (error) => {
				toast.error(error.message || "Error adding task lists");
			},
		}),
	);

	// Remove task lists mutation
	const removeTaskListsMutation = useMutation(
		trpc.group.removeTaskLists.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskGroup.all,
				});
				toast.success("Task lists removed from group");
			},
			onError: (error) => {
				toast.error(error.message || "Error removing task lists");
			},
		}),
	);

	const handleCreate = (data: {
		name: string;
		description: string | undefined;
		color: string | undefined;
		itemIds: string[];
	}) => {
		createMutation.mutate({
			name: data.name,
			description: data.description,
			color: data.color,
			taskListIds: data.itemIds,
		});
	};

	const handleUpdate = (data: {
		id: string;
		name: string;
		description: string | null;
		color: string | null;
		addItemIds: string[];
		removeItemIds: string[];
	}) => {
		// Update group metadata
		updateMutation.mutate({
			id: data.id,
			name: data.name,
			description: data.description,
			color: data.color,
		});

		// Add new task lists
		if (data.addItemIds.length > 0) {
			addTaskListsMutation.mutate({
				groupId: data.id,
				taskListIds: data.addItemIds,
			});
		}

		// Remove task lists
		if (data.removeItemIds.length > 0) {
			removeTaskListsMutation.mutate({
				groupId: data.id,
				taskListIds: data.removeItemIds,
			});
		}
	};

	const isPending =
		createMutation.isPending ||
		updateMutation.isPending ||
		addTaskListsMutation.isPending ||
		removeTaskListsMutation.isPending;

	return (
		<CreateGroupDialog
			labels={{
				entitySingular: "task list",
				entityPlural: "task lists",
				subItemPlural: "task",
				defaultColor: "#10b981",
				namePlaceholder: "Work tasks, Personal",
			}}
			open={open}
			onOpenChange={onOpenChange}
			items={items}
			initialItemIds={initialTaskListIds}
			groupToEdit={mappedGroupToEdit}
			currentItemIds={currentItemIds}
			isPending={isPending}
			onCreate={handleCreate}
			onUpdate={handleUpdate}
		/>
	);
}

// Re-export for backwards compatibility
export { TasksCreateGroupDialog as CreateGroupDialog };
