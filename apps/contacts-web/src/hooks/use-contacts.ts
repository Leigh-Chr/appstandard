/**
 * Unified storage hooks for contacts
 * Follows AppStandard Calendar patterns for consistency
 */

import { removeFromIndex } from "@appstandard/react-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleTRPCError } from "@/lib/error-handler";
import { QUERY_KEYS } from "@/lib/query-keys";
import { trpc } from "@/utils/trpc";

/**
 * Hook to fetch contacts for an address book
 */
export function useContacts(addressBookId: string) {
	const trpcContacts = useQuery({
		...trpc.contact.list.queryOptions({ addressBookId }),
		enabled: !!addressBookId,
	});

	return {
		contacts: trpcContacts.data || [],
		isLoading: trpcContacts.isLoading,
		isError: trpcContacts.isError,
	};
}

/**
 * Hook to fetch a single contact by ID
 */
export function useContact(contactId: string | undefined) {
	const trpcContact = useQuery({
		...trpc.contact.getById.queryOptions({ id: contactId ?? "" }),
		enabled: !!contactId,
	});

	return {
		contact: trpcContact.data,
		isLoading: trpcContact.isLoading,
		isError: trpcContact.isError,
	};
}

/**
 * Hook to create a new contact
 */
export function useCreateContact() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.contact.create.mutationOptions({
			onSuccess: (_, variables) => {
				// Use QUERY_KEYS.contact.all as a prefix to invalidate all contact queries
				// This matches the pattern used in calendar-web with QUERY_KEYS.event.all
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contact.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.byId(variables.addressBookId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error creating contact",
					fallbackDescription:
						"Unable to create the contact. Please try again.",
				});
			},
		}),
	);

	return {
		createContact: mutation.mutate,
		isCreating: mutation.isPending,
	};
}

/**
 * Hook to update a contact
 */
export function useUpdateContact() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.contact.update.mutationOptions({
			onSuccess: (_, variables) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contact.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contact.byId(variables.id),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				toast.success("Contact updated");
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error updating contact",
					fallbackDescription:
						"Unable to update the contact. Please try again.",
				});
			},
		}),
	);

	return {
		updateContact: mutation.mutate,
		isUpdating: mutation.isPending,
	};
}

/**
 * Hook to delete a contact with undo capability
 */
export function useDeleteContact() {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.contact.delete.mutationOptions({
			onSuccess: (_, variables) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.contact.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.addressBook.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});
				// Remove from OS content index
				void removeFromIndex(`contact-${variables.id}`);
			},
			onError: (error) => {
				handleTRPCError(error, {
					fallbackTitle: "Error deleting contact",
					fallbackDescription:
						"Unable to delete the contact. Please try again.",
				});
			},
		}),
	);

	const deleteWithUndo = (params: { id: string; name?: string }) => {
		let cancelled = false;
		const toastId = toast("Contact deleted", {
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
		deleteContact: deleteWithUndo,
		isDeleting: mutation.isPending,
	};
}

/**
 * Hook to search contacts across all address books
 */
export function useSearchContacts(query: string) {
	const trpcSearch = useQuery({
		...trpc.contact.search.queryOptions({ query }),
		enabled: query.length >= 1,
	});

	return {
		contacts: trpcSearch.data || [],
		isLoading: trpcSearch.isLoading,
		isError: trpcSearch.isError,
	};
}
