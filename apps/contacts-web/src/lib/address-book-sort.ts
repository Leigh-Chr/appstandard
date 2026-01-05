/**
 * Address book sorting utilities
 * Uses shared entity sorter from @appstandard/react-utils
 */

import {
	createEntitySorter,
	type SortDirection,
} from "@appstandard/react-utils";
import type {
	AddressBookSortBy,
	AddressBookSortDirection,
} from "@/components/address-book-list/address-book-filters";

export type AddressBookForSort = {
	id: string;
	name: string;
	updatedAt?: string | Date | null;
	createdAt?: string | Date | null;
	contactCount: number;
	color?: string | null;
};

// Create address-book-specific sorter
const addressBookSorter = createEntitySorter<AddressBookForSort>({
	countField: "contactCount",
});

/**
 * Sort address books by the specified criteria
 */
export function sortAddressBooks(
	addressBooks: AddressBookForSort[],
	sortBy: AddressBookSortBy,
	sortDirection: AddressBookSortDirection,
): AddressBookForSort[] {
	// Map AddressBookSortBy to generic sort type
	const genericSortBy =
		sortBy === "contactCount"
			? "count"
			: (sortBy as "name" | "updatedAt" | "createdAt");
	return addressBookSorter.sort(
		addressBooks,
		genericSortBy,
		sortDirection as SortDirection,
	);
}

/**
 * Filter address books by keyword
 */
export function filterAddressBooksByKeyword(
	addressBooks: AddressBookForSort[],
	keyword: string,
): AddressBookForSort[] {
	return addressBookSorter.filterByKeyword(addressBooks, keyword);
}
