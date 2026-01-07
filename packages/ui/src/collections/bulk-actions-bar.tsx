/**
 * Generic Bulk Actions Bar for collection management
 * Used by Calendar, Contacts, and Tasks apps
 */

import { useIsMobile } from "@appstandard/react-utils";
import {
	CheckSquare,
	Download,
	Folder,
	GitMerge,
	Link2,
	Loader2,
	MoreHorizontal,
	Square,
	Trash2,
	X,
} from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../alert-dialog";
import { Button } from "../button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../dropdown-menu";

interface MobileActionsProps {
	isPending: boolean;
	selectedCount: number;
	canMerge: boolean;
	onDelete: () => void;
	onCreateGroup: () => void;
	onShare: () => void;
	onMerge: () => void;
	onExport: () => void;
	onExit: () => void;
}

function MobileActions({
	isPending,
	selectedCount,
	canMerge,
	onDelete,
	onCreateGroup,
	onShare,
	onMerge,
	onExport,
	onExit,
}: MobileActionsProps) {
	return (
		<>
			<Button
				variant="destructive"
				size="sm"
				onClick={onDelete}
				disabled={isPending || selectedCount === 0}
				className="h-10 min-h-[44px] sm:h-8 sm:min-h-0"
			>
				{isPending ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Trash2 className="mr-2 h-4 w-4" />
				)}
				Delete
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="h-10 min-h-[44px] sm:h-8 sm:min-h-0"
					>
						<MoreHorizontal className="h-4 w-4" />
						<span className="sr-only">More actions</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" mobileAlign="start">
					<DropdownMenuItem
						onClick={onCreateGroup}
						disabled={isPending || selectedCount === 0}
					>
						<Folder className="mr-2 h-4 w-4" />
						Save as group
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={onShare}
						disabled={isPending || selectedCount === 0}
					>
						<Link2 className="mr-2 h-4 w-4" />
						Share
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onMerge} disabled={isPending || !canMerge}>
						<GitMerge className="mr-2 h-4 w-4" />
						Merge
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={onExport}
						disabled={isPending || selectedCount === 0}
					>
						<Download className="mr-2 h-4 w-4" />
						Export
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Button
				variant="ghost"
				size="icon"
				onClick={onExit}
				className="h-10 min-h-[44px] w-10 sm:h-8 sm:min-h-0 sm:w-8"
				disabled={isPending}
				aria-label="Exit selection mode"
			>
				<X className="h-4 w-4" />
			</Button>
		</>
	);
}

interface DesktopActionsProps {
	isPending: boolean;
	selectedCount: number;
	canMerge: boolean;
	onDelete: () => void;
	onCreateGroup: () => void;
	onShare: () => void;
	onMerge: () => void;
	onExport: () => void;
	onExit: () => void;
}

function DesktopActions({
	isPending,
	selectedCount,
	canMerge,
	onDelete,
	onCreateGroup,
	onShare,
	onMerge,
	onExport,
	onExit,
}: DesktopActionsProps) {
	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={onCreateGroup}
				disabled={isPending || selectedCount === 0}
				className="h-8"
			>
				<Folder className="mr-2 h-4 w-4" />
				Save as group
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={onShare}
				disabled={isPending || selectedCount === 0}
				className="h-8"
			>
				<Link2 className="mr-2 h-4 w-4" />
				Share
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={onMerge}
				disabled={isPending || !canMerge}
				className="h-8"
			>
				<GitMerge className="mr-2 h-4 w-4" />
				Merge
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={onExport}
				disabled={isPending || selectedCount === 0}
				className="h-8"
			>
				<Download className="mr-2 h-4 w-4" />
				Export
			</Button>
			<Button
				variant="destructive"
				size="sm"
				onClick={onDelete}
				disabled={isPending || selectedCount === 0}
				className="h-8"
			>
				{isPending ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Trash2 className="mr-2 h-4 w-4" />
				)}
				Delete
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onClick={onExit}
				className="h-8 w-8"
				disabled={isPending}
				aria-label="Exit selection mode"
			>
				<X className="h-4 w-4" />
			</Button>
		</>
	);
}

export interface BulkActionsBarLabels {
	/** Entity name in singular form (e.g., "calendar", "address book", "task list") */
	entitySingular: string;
	/** Entity name in plural form (e.g., "calendars", "address books", "task lists") */
	entityPlural: string;
	/** Sub-item name (e.g., "events", "contacts", "tasks") */
	subItemPlural: string;
}

export interface BulkActionsBarProps {
	/** Labels for the entity being managed */
	labels: BulkActionsBarLabels;
	/** Number of selected items */
	selectedCount: number;
	/** Total number of items */
	totalCount: number;
	/** Selected item IDs */
	selectedIds: Set<string>;
	/** Whether a delete operation is pending */
	isDeleting: boolean;
	/** Callback when select all is clicked */
	onSelectAll: () => void;
	/** Callback when deselect all is clicked */
	onDeselectAll: () => void;
	/** Callback to exit selection mode */
	onExitSelectionMode: () => void;
	/** Callback when delete is confirmed */
	onDeleteConfirm: () => void;
	/** Callback when merge is clicked */
	onMerge: () => void;
	/** Callback when export is clicked */
	onExport: () => Promise<void>;
	/** Render prop for the share dialog */
	renderShareDialog: (props: {
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}) => ReactNode;
	/** Render prop for the create group dialog */
	renderCreateGroupDialog: (props: {
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}) => ReactNode;
}

export function BulkActionsBar({
	labels,
	selectedCount,
	totalCount,
	selectedIds: _selectedIds,
	isDeleting,
	onSelectAll,
	onDeselectAll,
	onExitSelectionMode,
	onDeleteConfirm,
	onMerge,
	onExport,
	renderShareDialog,
	renderCreateGroupDialog,
}: BulkActionsBarProps) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);

	const isAllSelected = selectedCount === totalCount;
	const canMerge = selectedCount >= 2;
	const isMobile = useIsMobile();

	const handleDelete = () => {
		onDeleteConfirm();
		setDeleteDialogOpen(false);
	};

	const handleExport = async () => {
		await onExport();
	};

	const actionHandlers = {
		onDelete: () => setDeleteDialogOpen(true),
		onCreateGroup: () => setCreateGroupDialogOpen(true),
		onShare: () => setShareDialogOpen(true),
		onMerge,
		onExport: handleExport,
		onExit: onExitSelectionMode,
	};

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -20 }}
				className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card/95 p-3 shadow-lg backdrop-blur-sm"
			>
				{/* Selection info */}
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={isAllSelected ? onDeselectAll : onSelectAll}
						className="h-10 min-h-[44px] sm:h-8 sm:min-h-0"
					>
						{isAllSelected ? (
							<CheckSquare className="mr-2 h-4 w-4" />
						) : (
							<Square className="mr-2 h-4 w-4" />
						)}
						{isAllSelected ? "Deselect all" : "Select all"}
					</Button>
					<span className="text-muted-foreground text-sm">
						{selectedCount} of {totalCount} selected
					</span>
				</div>

				<div className="flex-1" />

				{/* Actions */}
				<div className="flex items-center gap-2">
					{isMobile ? (
						<MobileActions
							isPending={isDeleting}
							selectedCount={selectedCount}
							canMerge={canMerge}
							{...actionHandlers}
						/>
					) : (
						<DesktopActions
							isPending={isDeleting}
							selectedCount={selectedCount}
							canMerge={canMerge}
							{...actionHandlers}
						/>
					)}
				</div>
			</motion.div>

			{/* Delete confirmation dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete {selectedCount} {labels.entitySingular}
							{selectedCount !== 1 ? "s" : ""}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action is irreversible. The selected {labels.entityPlural}{" "}
							and all their {labels.subItemPlural} will be permanently deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Share dialog */}
			{renderShareDialog({
				open: shareDialogOpen,
				onOpenChange: setShareDialogOpen,
			})}

			{/* Create group dialog */}
			{renderCreateGroupDialog({
				open: createGroupDialogOpen,
				onOpenChange: setCreateGroupDialogOpen,
			})}
		</>
	);
}
