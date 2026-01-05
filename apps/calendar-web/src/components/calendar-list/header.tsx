/**
 * Header component for calendars list
 * Wrapper around shared ListHeader component
 */

import { ListHeader } from "@appstandard/ui";
import { Link, type useNavigate } from "@tanstack/react-router";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";

interface CalendarsListHeaderProps {
	calendars: Array<{
		id: string;
		name: string;
		eventCount: number;
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

export function CalendarsListHeader({
	calendars,
	navigate,
	groupHandlers,
	selectionHandlers,
}: CalendarsListHeaderProps) {
	return (
		<ListHeader
			labels={{
				title: "My calendars",
				newItemLabel: "New calendar",
				mergeIcon: "gitMerge",
			}}
			items={calendars}
			selectionMode={selectionHandlers.selectionMode}
			onEnterSelectionMode={selectionHandlers.handleEnterSelectionMode}
			onCreateGroup={groupHandlers.handleCreateGroup}
			newItemRoute="/calendars/new"
			importRoute="/calendars/import"
			mergeRoute="/calendars/merge"
			headerTourId={TOUR_STEP_IDS.HEADER}
			newItemTourId={TOUR_STEP_IDS.NEW_CALENDAR_BUTTON}
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
