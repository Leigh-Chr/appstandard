/**
 * Share address books dialog
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

interface ShareAddressBooksDialogProps {
	addressBookIds: string[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	groupId?: string | undefined;
}

export function ShareAddressBooksDialog({
	addressBookIds,
	open,
	onOpenChange,
	groupId,
}: ShareAddressBooksDialogProps) {
	const queryClient = useQueryClient();

	// Get address books info for display
	const { data: addressBooksData } = useQuery({
		...trpc.addressBook.list.queryOptions(),
		enabled: open,
	});

	const addressBooks = addressBooksData || [];
	const selectedAddressBooks = addressBooks.filter((book: { id: string }) =>
		addressBookIds.includes(book.id),
	);

	// Map to SelectedItem format
	const selectedItems: SelectedItem[] = selectedAddressBooks.map(
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
			itemCount: bundle.addressBookCount,
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
		if (addressBookIds.length === 0 && !groupId) {
			toast.error("Please select at least one address book");
			return;
		}

		createMutation.mutate({
			...(groupId ? { groupId } : { addressBookIds }),
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
				entitySingular: "address book",
				entityPlural: "address books",
				subItemPlural: "contacts",
				fileExtension: ".vcf",
				defaultColor: "#6366f1",
			}}
			itemIds={addressBookIds}
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
