/**
 * Groups section component for address books
 * Displays the address book groups grid
 */

import { StaggerContainer, StaggerItem } from "@appstandard/ui";
import { GroupCard } from "./group-card";

interface GroupsSectionProps {
	groups:
		| Array<{
				id: string;
				name: string;
				description?: string | null;
				color?: string | null;
				addressBookCount: number;
				memberCount?: number;
				isShared?: boolean;
		  }>
		| undefined;
	groupHandlers: {
		handleViewGroup: (id: string) => void;
		handleEditGroup: (group: {
			id: string;
			name: string;
			description?: string | null;
			color?: string | null;
		}) => void;
		handleDeleteGroup: (id: string) => void;
		handleMergeGroup?: (id: string) => void;
		handleExportGroup: (id: string) => void;
		handleShareGroup: (id: string) => void;
		deleteGroupMutation: { isPending: boolean };
	};
}

export function GroupsSection({ groups, groupHandlers }: GroupsSectionProps) {
	if (!groups || groups.length === 0) {
		return null;
	}

	return (
		<div className="mb-8" data-tour="groups-section">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-heading-2">Groups</h2>
			</div>
			<StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{groups.map((group) => (
					<StaggerItem key={group.id}>
						<GroupCard
							group={group}
							onOpen={() => groupHandlers.handleViewGroup(group.id)}
							onEdit={() => groupHandlers.handleEditGroup(group)}
							onDelete={() => groupHandlers.handleDeleteGroup(group.id)}
							onExport={() => groupHandlers.handleExportGroup(group.id)}
							onShare={() => groupHandlers.handleShareGroup(group.id)}
							isDeleting={groupHandlers.deleteGroupMutation.isPending}
						/>
					</StaggerItem>
				))}
			</StaggerContainer>
		</div>
	);
}
