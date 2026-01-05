/**
 * Create/Edit Address Book Group Dialog
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

interface ContactsCreateGroupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Pre-selected address book IDs (for creating from selection) */
	initialAddressBookIds?: string[];
	/** Group to edit (if provided, dialog is in edit mode) */
	groupToEdit?: {
		id: string;
		name: string;
		description?: string | null;
		color?: string | null;
	};
}

export function ContactsCreateGroupDialog({
	open,
	onOpenChange,
	initialAddressBookIds = [],
	groupToEdit,
}: ContactsCreateGroupDialogProps) {
	const queryClient = useQueryClient();

	// Get all address books
	const { data: addressBooksData } = useQuery({
		...trpc.addressBook.list.queryOptions(),
		enabled: open,
	});

	const addressBooks = addressBooksData || [];

	// Map to SelectableItem format
	const items: SelectableItem[] = addressBooks.map(
		(book: {
			id: string;
			name: string;
			color: string | null;
			contactCount: number;
		}) => ({
			id: book.id,
			name: book.name,
			color: book.color,
			count: book.contactCount,
		}),
	);

	// Get group details if editing
	const { data: groupDetails } = useQuery({
		...trpc.group.getById.queryOptions({ id: groupToEdit?.id || "" }),
		enabled: open && !!groupToEdit?.id,
	});

	// Get current item IDs from group details
	const currentItemIds =
		groupDetails?.addressBooks?.map((ab: { id: string }) => ab.id) || [];

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
					queryKey: QUERY_KEYS.contactGroup.all,
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
					queryKey: QUERY_KEYS.contactGroup.all,
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

	// Add address books mutation
	const addAddressBooksMutation = useMutation(
		trpc.group.addAddressBooks.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contactGroup.all,
				});
				toast.success("Address books added to group");
			},
			onError: (error) => {
				toast.error(error.message || "Error adding address books");
			},
		}),
	);

	// Remove address books mutation
	const removeAddressBooksMutation = useMutation(
		trpc.group.removeAddressBooks.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contactGroup.all,
				});
				toast.success("Address books removed from group");
			},
			onError: (error) => {
				toast.error(error.message || "Error removing address books");
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
			addressBookIds: data.itemIds,
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

		// Add new address books
		if (data.addItemIds.length > 0) {
			addAddressBooksMutation.mutate({
				groupId: data.id,
				addressBookIds: data.addItemIds,
			});
		}

		// Remove address books
		if (data.removeItemIds.length > 0) {
			removeAddressBooksMutation.mutate({
				groupId: data.id,
				addressBookIds: data.removeItemIds,
			});
		}
	};

	const isPending =
		createMutation.isPending ||
		updateMutation.isPending ||
		addAddressBooksMutation.isPending ||
		removeAddressBooksMutation.isPending;

	return (
		<CreateGroupDialog
			labels={{
				entitySingular: "address book",
				entityPlural: "address books",
				subItemPlural: "contact",
				defaultColor: "#6366f1",
				namePlaceholder: "Work contacts, Family",
			}}
			open={open}
			onOpenChange={onOpenChange}
			items={items}
			initialItemIds={initialAddressBookIds}
			groupToEdit={mappedGroupToEdit}
			currentItemIds={currentItemIds}
			isPending={isPending}
			onCreate={handleCreate}
			onUpdate={handleUpdate}
		/>
	);
}

// Re-export for backwards compatibility
export { ContactsCreateGroupDialog as CreateGroupDialog };
