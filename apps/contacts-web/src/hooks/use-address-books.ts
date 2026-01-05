/**
 * Unified storage hooks for address books
 * Follows AppStandard Calendar patterns for consistency
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleTRPCError } from "@/lib/error-handler";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

/**
 * Hook to get address books (works for both authenticated and anonymous users)
 */
export function useAddressBooks() {
	const trpcAddressBooks = useQuery({
		...trpc.addressBook.list.queryOptions(),
		enabled: true,
	});

	return {
		addressBooks: trpcAddressBooks.data || [],
		isLoading: trpcAddressBooks.isLoading,
		isError: trpcAddressBooks.isError,
	};
}

/**
 * Hook to get a single address book
 */
export function useAddressBook(addressBookId: string | undefined) {
	const trpcAddressBook = useQuery({
		...trpc.addressBook.getById.queryOptions({ id: addressBookId ?? "" }),
		enabled: !!addressBookId,
	});

	return {
		addressBook: trpcAddressBook.data,
		isLoading: trpcAddressBook.isLoading,
		isError: trpcAddressBook.isError,
	};
}

/**
 * Hook to create an address book
 */
export function useCreateAddressBook() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.addressBook.create.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error creating address book",
					fallbackDescription:
						"Unable to create the address book. Please try again.",
				});
			},
		}),
	);

	return {
		createAddressBook: mutation.mutate,
		isCreating: mutation.isPending,
	};
}

/**
 * Hook to update an address book
 */
export function useUpdateAddressBook() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.addressBook.update.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Address book updated");
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error updating",
					fallbackDescription:
						"Unable to update the address book. Please try again.",
				});
			},
		}),
	);

	return {
		updateAddressBook: mutation.mutate,
		isUpdating: mutation.isPending,
	};
}

/**
 * Hook to delete an address book with undo capability
 */
export function useDeleteAddressBook() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.addressBook.delete.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error deleting",
					fallbackDescription:
						"Unable to delete the address book. Please try again.",
				});
			},
		}),
	);

	const deleteWithUndo = (params: { id: string; name?: string }) => {
		let cancelled = false;
		const toastId = toast("Address book deleted", {
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
		deleteAddressBook: deleteWithUndo,
		isDeleting: mutation.isPending,
	};
}
