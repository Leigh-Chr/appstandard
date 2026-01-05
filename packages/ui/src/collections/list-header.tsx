/**
 * Generic List Header Component
 * Shared header for entity list pages (calendars, address books, task lists)
 */

import { useIsMobile } from "@appstandard/react-utils";
import {
	CheckSquare,
	FileUp,
	Folder,
	GitMerge,
	type LucideIcon,
	Merge,
	MoreHorizontal,
	Plus,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../dropdown-menu";

export interface ListHeaderLabels {
	/** Page title (e.g., "My calendars") */
	title: string;
	/** Label for the primary create button (e.g., "New calendar") */
	newItemLabel: string;
	/** Icon for merge button - defaults to GitMerge */
	mergeIcon?: "gitMerge" | "merge" | undefined;
}

export interface ListHeaderItem {
	id: string;
	name: string;
}

export interface ListHeaderProps {
	labels: ListHeaderLabels;
	/** Array of items (used to determine if group/selection buttons should be enabled) */
	items: ListHeaderItem[];
	/** Selection mode state */
	selectionMode: boolean;
	/** Callback when entering selection mode */
	onEnterSelectionMode: () => void;
	/** Callback when creating a new group */
	onCreateGroup: () => void;
	/** Route for creating a new item */
	newItemRoute: string;
	/** Route for importing items */
	importRoute: string;
	/** Route for merging items */
	mergeRoute: string;
	/** Render prop for the Link component (to avoid router dependency) */
	renderLink: (props: {
		to: string;
		children: ReactNode;
		id?: string;
		"data-tour"?: string;
	}) => ReactNode;
	/** Render prop for navigating programmatically */
	onNavigate: (to: string) => void;
	/** ID for the new item button (for tours) */
	newItemButtonId?: string | undefined;
	/** ID for the import button (for tours) */
	importButtonId?: string | undefined;
	/** Data-tour attribute for the header */
	headerTourId?: string | undefined;
	/** Data-tour attribute for the new item button */
	newItemTourId?: string | undefined;
	/** Data-tour attribute for the import button */
	importTourId?: string | undefined;
}

export function ListHeader({
	labels,
	items,
	selectionMode,
	onEnterSelectionMode,
	onCreateGroup,
	newItemRoute,
	importRoute,
	mergeRoute,
	renderLink,
	onNavigate,
	newItemButtonId,
	importButtonId,
	headerTourId,
	newItemTourId,
	importTourId,
}: ListHeaderProps) {
	const isMobile = useIsMobile();
	const MergeIcon: LucideIcon = labels.mergeIcon === "merge" ? Merge : GitMerge;
	const hasItems = items.length > 0;

	return (
		<div
			className="mb-4 flex flex-wrap items-center gap-3 sm:mb-6 sm:gap-4"
			{...(headerTourId ? { "data-tour": headerTourId } : {})}
		>
			<h1 className="text-heading-1">{labels.title}</h1>
			<div className="ml-auto flex flex-wrap items-center gap-3 sm:gap-2">
				{/* Primary action - always visible */}
				<Button
					id={newItemButtonId}
					onClick={() => onNavigate(newItemRoute)}
					size="sm"
					{...(newItemTourId ? { "data-tour": newItemTourId } : {})}
				>
					<Plus className="mr-2 h-4 w-4" />
					{labels.newItemLabel}
				</Button>
				{/* Mobile: More actions menu */}
				{isMobile ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">More actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" mobileAlign="start">
							<DropdownMenuItem onClick={onCreateGroup} disabled={!hasItems}>
								<Folder className="mr-2 h-4 w-4" />
								New group
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								{renderLink({
									to: importRoute,
									...(importButtonId !== undefined
										? { id: importButtonId }
										: {}),
									...(importTourId ? { "data-tour": importTourId } : {}),
									children: (
										<>
											<FileUp className="mr-2 h-4 w-4" />
											Import
										</>
									),
								})}
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								{renderLink({
									to: mergeRoute,
									children: (
										<>
											<MergeIcon className="mr-2 h-4 w-4" />
											Merge
										</>
									),
								})}
							</DropdownMenuItem>
							{hasItems && !selectionMode && (
								<DropdownMenuItem onClick={onEnterSelectionMode}>
									<CheckSquare className="mr-2 h-4 w-4" />
									Select
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<>
						{/* Desktop: All actions visible */}
						<Button
							variant="outline"
							size="sm"
							onClick={onCreateGroup}
							disabled={!hasItems}
						>
							<Folder className="mr-2 h-4 w-4" />
							New group
						</Button>
						<Button
							id={importButtonId}
							variant="outline"
							size="sm"
							asChild
							{...(importTourId ? { "data-tour": importTourId } : {})}
						>
							{renderLink({
								to: importRoute,
								children: (
									<>
										<FileUp className="mr-2 h-4 w-4" />
										Import
									</>
								),
							})}
						</Button>
						<Button variant="outline" size="sm" asChild>
							{renderLink({
								to: mergeRoute,
								children: (
									<>
										<MergeIcon className="mr-2 h-4 w-4" />
										Merge
									</>
								),
							})}
						</Button>
						{/* Selection mode toggle */}
						{hasItems && !selectionMode && (
							<Button
								variant="outline"
								size="sm"
								onClick={onEnterSelectionMode}
							>
								<CheckSquare className="mr-2 h-4 w-4" />
								Select
							</Button>
						)}
					</>
				)}
			</div>
		</div>
	);
}
