/**
 * Share task lists dialog
 * Wrapper around shared ShareBundleDialog component
 */

import {
	type SelectedItem,
	type ShareBundle,
	ShareBundleDialog,
} from "@appstandard/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

interface ShareTaskListsDialogProps {
	taskListIds: string[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	groupId?: string | undefined;
}

export function ShareTaskListsDialog({
	taskListIds,
	open,
	onOpenChange,
	groupId,
}: ShareTaskListsDialogProps) {
	const queryClient = useQueryClient();

	// Get task lists info for display
	const { data: taskListsData } = useQuery({
		...trpc.taskList.list.queryOptions(),
		enabled: open,
	});

	const taskLists = taskListsData || [];
	const selectedTaskLists = taskLists.filter((list: { id: string }) =>
		taskListIds.includes(list.id),
	);

	// Map to SelectedItem format
	const selectedItems: SelectedItem[] = selectedTaskLists.map(
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

	// Query existing share bundles
	const { data: shareBundlesData, isLoading } = useQuery({
		...trpc.share.bundle.list.queryOptions(),
		enabled: open,
	});

	// Map to ShareBundle format
	const shareBundles: ShareBundle[] | undefined = shareBundlesData?.map(
		(bundle) => ({
			id: bundle.id,
			name: bundle.name,
			token: bundle.token,
			itemCount: bundle.taskListCount,
			isActive: bundle.isActive,
			removeDuplicates: bundle.removeDuplicates,
			accessCount: bundle.accessCount,
			lastAccessedAt: bundle.lastAccessedAt,
			createdAt: bundle.createdAt,
		}),
	);

	// Create share bundle mutation
	const createMutation = useMutation(
		trpc.share.bundle.create.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.shareBundle.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Sharing bundle created");
			},
			onError: (error) => {
				toast.error(error.message || "Error during bundle creation");
			},
		}),
	);

	// Update share bundle mutation
	const updateMutation = useMutation(
		trpc.share.bundle.update.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.shareBundle.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
			},
			onError: (error) => {
				toast.error(error.message || "Error during update");
			},
		}),
	);

	// Delete share bundle mutation
	const deleteMutation = useMutation(
		trpc.share.bundle.delete.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.shareBundle.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Sharing bundle deleted");
			},
			onError: (error) => {
				toast.error(error.message || "Error during deletion");
			},
		}),
	);

	const handleCreate = (name: string, removeDuplicates: boolean) => {
		if (taskListIds.length === 0 && !groupId) {
			toast.error("Please select at least one task list");
			return;
		}

		createMutation.mutate({
			...(groupId ? { groupId } : { taskListIds }),
			name: name || undefined,
			removeDuplicates,
		});
	};

	const handleToggleActive = (bundleId: string, isActive: boolean) => {
		updateMutation.mutate({ id: bundleId, isActive });
	};

	const handleDelete = (bundleId: string) => {
		deleteMutation.mutate({ id: bundleId });
	};

	return (
		<ShareBundleDialog
			labels={{
				entitySingular: "task list",
				entityPlural: "task lists",
				subItemPlural: "tasks",
				fileExtension: ".ics",
				defaultColor: "#10b981",
			}}
			itemIds={taskListIds}
			open={open}
			onOpenChange={onOpenChange}
			groupId={groupId}
			selectedItems={selectedItems}
			shareBundles={shareBundles}
			isLoading={isLoading}
			isCreating={createMutation.isPending}
			isUpdating={updateMutation.isPending}
			isDeleting={deleteMutation.isPending}
			onCreate={handleCreate}
			onToggleActive={handleToggleActive}
			onDelete={handleDelete}
		/>
	);
}
