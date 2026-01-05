/**
 * Hook for managing address book selection mode
 */

import { useState } from "react";
import type { AddressBookForSort } from "@/lib/address-book-sort";

export function useAddressBookSelectionHandlers(
	addressBooks: AddressBookForSort[],
) {
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const handleToggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleSelectAll = () => {
		setSelectedIds(new Set(addressBooks.map((ab) => ab.id)));
	};

	const handleDeselectAll = () => {
		setSelectedIds(new Set());
	};

	const handleExitSelectionMode = () => {
		setSelectionMode(false);
		setSelectedIds(new Set());
	};

	const handleEnterSelectionMode = () => {
		setSelectionMode(true);
	};

	return {
		selectionMode,
		selectedIds,
		handleToggleSelect,
		handleSelectAll,
		handleDeselectAll,
		handleExitSelectionMode,
		handleEnterSelectionMode,
	};
}
