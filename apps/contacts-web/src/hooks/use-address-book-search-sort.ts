/**
 * Hook for managing address book search and sort
 */

import type { useNavigate } from "@tanstack/react-router";
import type {
	AddressBookSortBy,
	AddressBookSortDirection,
} from "@/components/address-book-list/address-book-filters";
import type { Route } from "@/routes/contacts";

export function useAddressBookSearchSortHandlers(
	navigate: ReturnType<typeof useNavigate>,
	search: ReturnType<typeof Route.useSearch>,
	sortDirection: AddressBookSortDirection,
) {
	const handleKeywordChange = (newKeyword: string) => {
		navigate({
			search: {
				...search,
				q: newKeyword || undefined,
			},
		});
	};

	const handleSortChange = (newSortBy: AddressBookSortBy) => {
		const shouldShowDirection =
			newSortBy === "updatedAt" || newSortBy === "createdAt";
		navigate({
			search: {
				...search,
				sortBy: newSortBy,
				sortDirection: shouldShowDirection ? sortDirection : "desc",
			},
		});
	};

	const handleSortDirectionChange = (
		newDirection: AddressBookSortDirection,
	) => {
		navigate({
			search: {
				...search,
				sortDirection: newDirection,
			},
		});
	};

	return {
		handleKeywordChange,
		handleSortChange,
		handleSortDirectionChange,
	};
}
