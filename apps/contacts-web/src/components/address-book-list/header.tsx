/**
 * Header component for address books list
 * Wrapper around shared ListHeader component
 */

import { ListHeader } from "@appstandard/ui";
import { Link, type useNavigate } from "@tanstack/react-router";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";

interface AddressBooksListHeaderProps {
	addressBooks: Array<{
		id: string;
		name: string;
		contactCount: number;
	}>;
	navigate: ReturnType<typeof useNavigate>;
	groupHandlers: {
		handleCreateGroup: () => void;
	};
	selectionHandlers: {
		selectionMode: boolean;
		handleEnterSelectionMode: () => void;
	};
}

export function AddressBooksListHeader({
	addressBooks,
	navigate,
	groupHandlers,
	selectionHandlers,
}: AddressBooksListHeaderProps) {
	return (
		<ListHeader
			labels={{
				title: "My address books",
				newItemLabel: "New address book",
				mergeIcon: "gitMerge",
			}}
			items={addressBooks}
			selectionMode={selectionHandlers.selectionMode}
			onEnterSelectionMode={selectionHandlers.handleEnterSelectionMode}
			onCreateGroup={groupHandlers.handleCreateGroup}
			newItemRoute="/contacts/new"
			importRoute="/contacts/import"
			mergeRoute="/contacts/merge"
			headerTourId={TOUR_STEP_IDS.HEADER}
			newItemTourId={TOUR_STEP_IDS.NEW_ADDRESS_BOOK_BUTTON}
			importTourId={TOUR_STEP_IDS.IMPORT_BUTTON}
			renderLink={({ to, children, "data-tour": dataTour }) => (
				<Link to={to} data-tour={dataTour}>
					{children}
				</Link>
			)}
			onNavigate={(to) => navigate({ to })}
		/>
	);
}
