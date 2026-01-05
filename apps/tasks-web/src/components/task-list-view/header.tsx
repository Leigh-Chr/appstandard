/**
 * Header component for task lists
 * Wrapper around shared ListHeader component
 */

import { ListHeader } from "@appstandard/ui";
import { Link, type useNavigate } from "@tanstack/react-router";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";

interface TaskListsHeaderProps {
	taskLists: Array<{
		id: string;
		name: string;
		taskCount: number;
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

export function TaskListsHeader({
	taskLists,
	navigate,
	groupHandlers,
	selectionHandlers,
}: TaskListsHeaderProps) {
	return (
		<ListHeader
			labels={{
				title: "My task lists",
				newItemLabel: "New list",
				mergeIcon: "merge",
			}}
			items={taskLists}
			selectionMode={selectionHandlers.selectionMode}
			onEnterSelectionMode={selectionHandlers.handleEnterSelectionMode}
			onCreateGroup={groupHandlers.handleCreateGroup}
			newItemRoute="/tasks/new"
			importRoute="/tasks/import"
			mergeRoute="/tasks/merge"
			headerTourId={TOUR_STEP_IDS.HEADER}
			newItemTourId={TOUR_STEP_IDS.NEW_TASK_LIST_BUTTON}
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
