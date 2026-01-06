/**
 * Hook for managing address book group actions
 */

import { useMutation, type useQueryClient } from "@tanstack/react-query";
import type { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { exportGroupAsVCFFile } from "@/lib/address-book-export";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc, trpcClient } from "@/utils/trpc";

export function useAddressBookGroupHandlers(
	navigate: ReturnType<typeof useNavigate>,
	queryClient: ReturnType<typeof useQueryClient>,
) {
	const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
	const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
	const [groupToEdit, setGroupToEdit] = useState<{
		id: string;
		name: string;
		description?: string | null;
		color?: string | null;
	} | null>(null);
	const [shareGroupDialogOpen, setShareGroupDialogOpen] = useState(false);
	const [groupToShare, setGroupToShare] = useState<string | null>(null);
	const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
	const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

	const deleteGroupMutation = useMutation(
		trpc.group.delete.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.group.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Group deleted");
			},
			onError: (error) => {
				toast.error(error.message || "Error deleting group");
			},
		}),
	);

	const handleCreateGroup = () => {
		setCreateGroupDialogOpen(true);
	};

	const handleEditGroup = (group: {
		id: string;
		name: string;
		description?: string | null;
		color?: string | null;
	}) => {
		setGroupToEdit(group);
		setEditGroupDialogOpen(true);
	};

	const handleDeleteGroup = (groupId: string) => {
		setGroupToDelete(groupId);
		setDeleteGroupDialogOpen(true);
	};

	const handleShareGroup = (groupId: string) => {
		setGroupToShare(groupId);
		setShareGroupDialogOpen(true);
	};

	const handleMergeGroup = async (groupId: string) => {
		try {
			const group = await trpcClient.group.getById.query({
				id: groupId,
			});
			const addressBooksArray = Array.isArray(group.addressBooks)
				? group.addressBooks
				: [];
			const addressBookIds = addressBooksArray.map((ab) => ab.id).join(",");
			navigate({
				to: "/contacts/merge",
				search: { selected: addressBookIds },
			});
		} catch (_error) {
			toast.error("Error loading group details");
		}
	};

	const handleExportGroup = async (groupId: string) => {
		try {
			await exportGroupAsVCFFile(groupId);
			toast.success("Group exported successfully");
		} catch (_error) {
			toast.error("Error exporting group");
		}
	};

	const handleViewGroup = (groupId: string) => {
		navigate({ to: `/contacts/groups/${groupId}` });
	};

	return {
		createGroupDialogOpen,
		setCreateGroupDialogOpen,
		editGroupDialogOpen,
		setEditGroupDialogOpen,
		groupToEdit,
		setGroupToEdit,
		shareGroupDialogOpen,
		setShareGroupDialogOpen,
		groupToShare,
		setGroupToShare,
		deleteGroupDialogOpen,
		setDeleteGroupDialogOpen,
		groupToDelete,
		setGroupToDelete,
		deleteGroupMutation,
		handleCreateGroup,
		handleEditGroup,
		handleDeleteGroup,
		handleShareGroup,
		handleMergeGroup,
		handleExportGroup,
		handleViewGroup,
	};
}
