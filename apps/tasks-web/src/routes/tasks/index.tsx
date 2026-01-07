/**
 * Task lists page
 * Follows AppStandard Calendar pattern for consistency
 */

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	ColorPicker,
	Input,
	Label,
} from "@appstandard/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { AnimatePresence } from "motion/react";
import { AccountPrompt } from "@/components/account-prompt";
import { TaskListBulkActionsBar } from "@/components/task-list-view/bulk-actions-bar";
import { GroupsSection } from "@/components/task-list-view/groups-section";
import { TaskListsHeader } from "@/components/task-list-view/header";
import { TaskListsLoadingState } from "@/components/task-list-view/loading-state";
import {
	TaskListSearchSortBar,
	type TaskListSortBy,
	type TaskListSortDirection,
} from "@/components/task-list-view/task-list-filters";
import { TaskListsSection } from "@/components/task-list-view/task-lists-section";
import { useTaskListDialogHandlers } from "@/hooks/use-task-list-dialogs";
import { useTaskListGroupHandlers } from "@/hooks/use-task-list-groups";
import { useTaskListSearchSortHandlers } from "@/hooks/use-task-list-search-sort";
import { useTaskListSelectionHandlers } from "@/hooks/use-task-list-selection";
import {
	useDeleteTaskList,
	useTaskLists,
	useUpdateTaskList,
} from "@/hooks/use-task-lists";
import {
	taskListsListDefaults,
	taskListsListSearchSchema,
} from "@/lib/search-params";
import {
	filterTaskListsByKeyword,
	sortTaskLists,
	type TaskListForSort,
} from "@/lib/task-list-sort";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/tasks/")({
	component: TaskListsPage,
	validateSearch: zodValidator(taskListsListSearchSchema),
	search: {
		middlewares: [stripSearchParams(taskListsListDefaults)],
	},
	errorComponent: ({ error }) => {
		if (import.meta.env.DEV) {
			console.error("Route error:", error);
		}
		return (
			<div className="container mx-auto max-w-2xl px-4 py-10">
				<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
					<h2 className="font-semibold text-destructive text-lg">
						An error occurred
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						{error?.message ||
							"An unexpected error occurred. Please try again."}
					</p>
					<Button
						type="button"
						onClick={() => window.location.reload()}
						className="mt-4"
					>
						Reload page
					</Button>
				</div>
			</div>
		);
	},
	head: () => ({
		meta: [
			{ title: "My Task Lists - AppStandard Tasks" },
			{
				name: "description",
				content: "Manage all your tasks and task lists in one place.",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

/**
 * All dialogs component
 */
function TaskListsDialogs({
	dialogHandlers,
	groupHandlers,
	isDeleting,
	isUpdating,
}: {
	dialogHandlers: ReturnType<typeof useTaskListDialogHandlers>;
	groupHandlers: ReturnType<typeof useTaskListGroupHandlers>;
	isDeleting: boolean;
	isUpdating: boolean;
}) {
	return (
		<>
			{/* Delete Dialog */}
			<AlertDialog
				open={dialogHandlers.dialog?.type === "delete"}
				onOpenChange={(open) => !open && dialogHandlers.closeDialog()}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete task list</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "
							{dialogHandlers.dialog?.type === "delete"
								? dialogHandlers.dialog.taskList.name
								: ""}
							"? This action is irreversible and will delete all tasks.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={dialogHandlers.confirmDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Edit Dialog */}
			<AlertDialog
				open={dialogHandlers.dialog?.type === "edit"}
				onOpenChange={(open) => !open && dialogHandlers.closeDialog()}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Edit task list</AlertDialogTitle>
						<AlertDialogDescription>
							Edit settings for "
							{dialogHandlers.dialog?.type === "edit"
								? dialogHandlers.dialog.taskList.name
								: ""}
							"
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="task-list-name">Name</Label>
							<Input
								id="task-list-name"
								value={
									dialogHandlers.dialog?.type === "edit"
										? dialogHandlers.dialog.newName
										: ""
								}
								onChange={(e) =>
									dialogHandlers.handleEditNameChange(e.target.value)
								}
								placeholder="Task list name"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										dialogHandlers.confirmEdit();
									}
								}}
							/>
						</div>
						<ColorPicker
							value={
								dialogHandlers.dialog?.type === "edit"
									? dialogHandlers.dialog.newColor
									: null
							}
							onChange={dialogHandlers.handleEditColorChange}
							label="Color"
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={dialogHandlers.confirmEdit}
							disabled={isUpdating}
						>
							{isUpdating ? "Saving..." : "Save"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete group dialog */}
			<AlertDialog
				open={groupHandlers.deleteGroupDialogOpen}
				onOpenChange={groupHandlers.setDeleteGroupDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete group?</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete the group. The task lists in this group will not
							be deleted, only the group itself.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (groupHandlers.groupToDelete) {
									groupHandlers.deleteGroupMutation.mutate({
										id: groupHandlers.groupToDelete,
									});
									groupHandlers.setDeleteGroupDialogOpen(false);
									groupHandlers.setGroupToDelete(null);
								}
							}}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

/**
 * Render task lists content
 */
function TaskListsContent({
	taskLists,
	groups,
	isLoadingGroups,
	keyword,
	sortBy,
	sortDirection,
	navigate,
	selectionHandlers,
	searchSortHandlers,
	groupHandlers,
	dialogHandlers,
	isDeleting,
	isUpdating,
}: {
	taskLists: TaskListForSort[];
	groups:
		| Array<{
				id: string;
				name: string;
				description?: string | null;
				color?: string | null;
				taskListCount: number;
		  }>
		| undefined;
	isLoadingGroups: boolean;
	keyword: string;
	sortBy: TaskListSortBy;
	sortDirection: TaskListSortDirection;
	navigate: ReturnType<typeof useNavigate>;
	selectionHandlers: ReturnType<typeof useTaskListSelectionHandlers>;
	searchSortHandlers: ReturnType<typeof useTaskListSearchSortHandlers>;
	groupHandlers: ReturnType<typeof useTaskListGroupHandlers>;
	dialogHandlers: ReturnType<typeof useTaskListDialogHandlers>;
	isDeleting: boolean;
	isUpdating: boolean;
}) {
	return (
		<>
			<AccountPrompt variant="banner" />

			{/* Search and sort */}
			{taskLists.length > 0 && (
				<div className="mb-4">
					<TaskListSearchSortBar
						keyword={keyword}
						sortBy={sortBy}
						sortDirection={sortDirection}
						onKeywordChange={searchSortHandlers.handleKeywordChange}
						onSortChange={searchSortHandlers.handleSortChange}
						onSortDirectionChange={searchSortHandlers.handleSortDirectionChange}
						showDirectionToggle={
							sortBy === "updatedAt" || sortBy === "createdAt"
						}
					/>
				</div>
			)}

			{/* Bulk actions bar */}
			<AnimatePresence>
				{selectionHandlers.selectionMode && (
					<TaskListBulkActionsBar
						selectedCount={selectionHandlers.selectedIds.size}
						totalCount={taskLists.length}
						onSelectAll={selectionHandlers.handleSelectAll}
						onDeselectAll={selectionHandlers.handleDeselectAll}
						onExitSelectionMode={selectionHandlers.handleExitSelectionMode}
						selectedIds={selectionHandlers.selectedIds}
					/>
				)}
			</AnimatePresence>

			{/* Groups section */}
			{!isLoadingGroups && groups && groups.length > 0 && (
				<GroupsSection
					groups={groups.map((g) => ({
						id: g.id,
						name: g.name,
						description: g.description,
						color: g.color,
						taskListCount: g.taskListCount,
					}))}
					groupHandlers={groupHandlers}
				/>
			)}

			{/* Task lists section */}
			<TaskListsSection
				taskLists={taskLists}
				navigate={navigate}
				dialogHandlers={dialogHandlers}
				selectionHandlers={selectionHandlers}
				isDeleting={isDeleting}
				isUpdating={isUpdating}
			/>
		</>
	);
}

function TaskListsPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const search = Route.useSearch();

	// Parse filters from URL
	const keyword = search["q"] || "";
	const sortBy = search["sortBy"] || "updatedAt";
	const sortDirection = search["sortDirection"] || "desc";

	// Get task lists
	const { taskLists: allTaskLists, isLoading } = useTaskLists();

	// Filter and sort task lists
	const taskLists = (() => {
		const listsArray = Array.isArray(allTaskLists) ? allTaskLists : [];
		const filtered = filterTaskListsByKeyword(listsArray, keyword);
		return sortTaskLists(filtered, sortBy, sortDirection);
	})();

	const { deleteTaskList, isDeleting } = useDeleteTaskList();
	const { updateTaskList, isUpdating } = useUpdateTaskList();

	// Dialog handlers
	const dialogHandlers = useTaskListDialogHandlers(
		deleteTaskList,
		updateTaskList,
	);

	// Selection mode handlers
	const selectionHandlers = useTaskListSelectionHandlers(taskLists);

	// Groups state and handlers
	const groupHandlers = useTaskListGroupHandlers(navigate, queryClient);

	// Get groups
	const { data: groups, isLoading: isLoadingGroups } = useQuery({
		...trpc.group.list.queryOptions(),
	});

	// Search and sort handlers
	const searchSortHandlers = useTaskListSearchSortHandlers(
		navigate,
		search,
		sortDirection,
	);

	if (isLoading) {
		return <TaskListsLoadingState />;
	}

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background pattern */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-30" />
				<div className="cross-grid absolute inset-0 opacity-20 [mask-image:linear-gradient(to_bottom,#000_0%,transparent_50%)]" />
			</div>

			<div className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
				<TaskListsHeader
					taskLists={taskLists}
					navigate={navigate}
					groupHandlers={groupHandlers}
					selectionHandlers={selectionHandlers}
				/>

				<TaskListsContent
					taskLists={taskLists}
					groups={groups}
					isLoadingGroups={isLoadingGroups}
					keyword={keyword}
					sortBy={sortBy as TaskListSortBy}
					sortDirection={sortDirection as TaskListSortDirection}
					navigate={navigate}
					selectionHandlers={selectionHandlers}
					searchSortHandlers={searchSortHandlers}
					groupHandlers={groupHandlers}
					dialogHandlers={dialogHandlers}
					isDeleting={isDeleting}
					isUpdating={isUpdating}
				/>

				<TaskListsDialogs
					dialogHandlers={dialogHandlers}
					groupHandlers={groupHandlers}
					isDeleting={isDeleting}
					isUpdating={isUpdating}
				/>
			</div>
		</div>
	);
}
