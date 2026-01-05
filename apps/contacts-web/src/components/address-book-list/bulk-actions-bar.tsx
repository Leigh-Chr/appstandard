/**
 * Bulk actions toolbar for selected address books
 * Wrapper around shared BulkActionsBar component
 */

import { BulkActionsBar } from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { ShareAddressBooksDialog } from "@/components/share-address-books-dialog";
import { exportAddressBooksAsVCFFile } from "@/lib/address-book-export";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";
import { CreateGroupDialog } from "./create-group-dialog";

interface AddressBookBulkActionsBarProps {
	selectedCount: number;
	totalCount: number;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onExitSelectionMode: () => void;
	selectedIds: Set<string>;
}

export function AddressBookBulkActionsBar({
	selectedCount,
	totalCount,
	onSelectAll,
	onDeselectAll,
	onExitSelectionMode,
	selectedIds,
}: AddressBookBulkActionsBarProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	// Bulk delete mutation
	const bulkDeleteMutation = useMutation(
		trpc.addressBook.bulkDelete.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.list,
				});
				toast.success(`${data.deletedCount} address book(s) deleted`);
				onExitSelectionMode();
			},
			onError: (error) => {
				toast.error(error.message || "Error during deletion");
			},
		}),
	);

	const handleDeleteConfirm = useCallback(() => {
		bulkDeleteMutation.mutate({ addressBookIds: Array.from(selectedIds) });
	}, [bulkDeleteMutation, selectedIds]);

	const handleMerge = useCallback(() => {
		const selectedStr = Array.from(selectedIds).join(",");
		navigate({
			to: "/contacts/merge",
			search: { selected: selectedStr },
		});
		onExitSelectionMode();
	}, [navigate, selectedIds, onExitSelectionMode]);

	const handleExport = useCallback(async () => {
		if (selectedIds.size === 0) return;
		try {
			await exportAddressBooksAsVCFFile(Array.from(selectedIds));
			toast.success("Address books exported successfully");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to export");
		}
	}, [selectedIds]);

	return (
		<BulkActionsBar
			labels={{
				entitySingular: "address book",
				entityPlural: "address books",
				subItemPlural: "contacts",
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
				<ShareAddressBooksDialog
					addressBookIds={Array.from(selectedIds)}
					open={open}
					onOpenChange={onOpenChange}
				/>
			)}
			renderCreateGroupDialog={({ open, onOpenChange }) => (
				<CreateGroupDialog
					open={open}
					onOpenChange={onOpenChange}
					initialAddressBookIds={Array.from(selectedIds)}
				/>
			)}
		/>
	);
}
