import { useIsMobile } from "@appstandard/react-utils";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Loader,
} from "@appstandard/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createLazyFileRoute,
	Link,
	Outlet,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
	ArrowLeft,
	Check,
	Circle,
	Download,
	Kanban,
	Link2,
	List,
	Loader2,
	Merge,
	MoreHorizontal,
	Play,
	Plus,
	RefreshCw,
	Search,
	Sparkles,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AccountPrompt } from "@/components/account-prompt";
import { ExportTaskListDialog } from "@/components/export-task-list-dialog";
import { MoveTaskDialog } from "@/components/move-task-dialog";
import { ShareTaskListDialog } from "@/components/share-task-list-dialog";
import { TaskFilterBar } from "@/components/task-filters";
import { KanbanColumn, TaskCard } from "@/components/task-item";
import { useTaskList } from "@/hooks/use-task-lists";
import {
	useDeleteTask,
	useTasks,
	useToggleTaskStatus,
} from "@/hooks/use-tasks";
import { QUERY_KEYS } from "@/lib/query-keys";
import type {
	SortDirection,
	TaskPriorityFilter,
	TaskSortBy,
	TaskStatusFilter,
} from "@/lib/search-params";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/tasks/$taskListId")({
	component: TaskListDetailPage,
});

function TaskListDetailPage() {
	const { taskListId } = Route.useParams();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();
	const isMobile = useIsMobile();
	const [cleanDialogOpen, setCleanDialogOpen] = useState(false);
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [moveDialogOpen, setMoveDialogOpen] = useState(false);
	const [taskToMove, setTaskToMove] = useState<string | null>(null);

	// URL-driven view mode and filters
	const viewMode = search["view"];

	// Helper for updating search params on current route
	const updateSearch = (updates: Partial<typeof search>) => {
		navigate({
			to: ".",
			search: { ...search, ...updates },
		});
	};

	const { taskList, isLoading: isLoadingList } = useTaskList(taskListId);
	const { tasks, isLoading: isLoadingTasks } = useTasks(taskListId);
	const { toggleStatus, isToggling } = useToggleTaskStatus();
	const { deleteTask, isDeleting } = useDeleteTask();

	const isLoading = isLoadingList || isLoadingTasks;

	// Clean duplicates mutation
	const cleanDuplicatesMutation = useMutation(
		trpc.merge.cleanDuplicates.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.task.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.byId(taskListId),
				});
				if (data.removedCount > 0) {
					toast.success(
						`${data.removedCount} duplicate(s) cleaned up. ${data.remainingTasks} task(s) remaining.`,
					);
				} else {
					toast.info("No duplicates found in this task list.");
				}
				setCleanDialogOpen(false);
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error
						? error.message
						: "Error during duplicate cleanup";
				toast.error(message);
			},
		}),
	);

	// Refresh from URL mutation
	const refreshFromUrlMutation = useMutation(
		trpc.import.refreshFromUrl.mutationOptions({
			onSuccess: (data) => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.task.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.byId(taskListId),
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.list,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.dashboard.all,
				});

				toast.success(
					`Task list refreshed! ${data.importedTasks} task(s) imported, ${data.skippedDuplicates} duplicate(s) skipped.`,
				);
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error during refresh";
				toast.error(message);
			},
		}),
	);

	// Duplicate task mutation
	const duplicateTaskMutation = useMutation(
		trpc.task.duplicate.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.task.all,
				});
				void queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.taskList.byId(taskListId),
				});
				toast.success("Task duplicated successfully");
			},
			onError: (error: unknown) => {
				const message =
					error instanceof Error ? error.message : "Error duplicating task";
				toast.error(message);
			},
		}),
	);

	const handleCleanDuplicates = () => {
		cleanDuplicatesMutation.mutate({ taskListId });
	};

	const handleRefreshFromUrl = () => {
		refreshFromUrlMutation.mutate({
			taskListId,
			replaceAll: false,
			skipDuplicates: true,
		});
	};

	const handleDuplicateTask = (taskId: string) => {
		duplicateTaskMutation.mutate({ id: taskId });
	};

	const handleMoveTask = (taskId: string) => {
		setTaskToMove(taskId);
		setMoveDialogOpen(true);
	};

	// Filter and sort tasks using URL params
	const filteredTasks = useMemo(() => {
		if (!tasks) return [];

		let result = [...tasks];

		// Apply search filter from URL
		if (search["q"]) {
			const searchLower = search["q"].toLowerCase();
			result = result.filter(
				(task) =>
					task.title.toLowerCase().includes(searchLower) ||
					task.description?.toLowerCase().includes(searchLower),
			);
		}

		// Apply status filter from URL
		if (search["status"] !== "all") {
			const statusMap: Record<string, string> = {
				"needs-action": "NEEDS_ACTION",
				"in-progress": "IN_PROCESS",
				completed: "COMPLETED",
				cancelled: "CANCELLED",
			};
			const targetStatus = statusMap[search["status"]];
			result = result.filter((task) => task.status === targetStatus);
		}

		// Apply priority filter from URL
		if (search["priority"] !== "all") {
			result = result.filter((task) => {
				const priority = task.priority ?? 0;
				if (search["priority"] === "high")
					return priority >= 1 && priority <= 4;
				if (search["priority"] === "medium")
					return priority >= 5 && priority <= 6;
				if (search["priority"] === "low") return priority >= 7;
				return true;
			});
		}

		// Apply sorting from URL
		result.sort((a, b) => {
			let comparison = 0;

			switch (search["sortBy"]) {
				case "dueDate": {
					const aDate = a.dueDate
						? new Date(a.dueDate).getTime()
						: Number.POSITIVE_INFINITY;
					const bDate = b.dueDate
						? new Date(b.dueDate).getTime()
						: Number.POSITIVE_INFINITY;
					comparison = aDate - bDate;
					break;
				}
				case "created": {
					const aDate = new Date(a.createdAt).getTime();
					const bDate = new Date(b.createdAt).getTime();
					comparison = aDate - bDate;
					break;
				}
				case "priority": {
					const aPriority = a.priority ?? 0;
					const bPriority = b.priority ?? 0;
					comparison = aPriority - bPriority;
					break;
				}
				case "title":
					comparison = a.title.localeCompare(b.title);
					break;
			}

			return search["sortDirection"] === "asc" ? comparison : -comparison;
		});

		return result;
	}, [
		tasks,
		search["q"],
		search["status"],
		search["priority"],
		search["sortBy"],
		search["sortDirection"],
	]);

	// Group tasks by status for Kanban view
	// IMPORTANT: This must be defined BEFORE early returns to respect Rules of Hooks
	const tasksByStatus = useMemo(() => {
		return {
			needsAction: filteredTasks.filter((t) => t.status === "NEEDS_ACTION"),
			inProgress: filteredTasks.filter((t) => t.status === "IN_PROCESS"),
			completed: filteredTasks.filter((t) => t.status === "COMPLETED"),
			cancelled: filteredTasks.filter((t) => t.status === "CANCELLED"),
		};
	}, [filteredTasks]);

	const handleFiltersChange = (updates: {
		search?: string;
		status?: TaskStatusFilter;
		priority?: TaskPriorityFilter;
		sortBy?: TaskSortBy;
		sortDirection?: SortDirection;
	}) => {
		updateSearch({
			q: updates.search !== undefined ? updates.search : search["q"],
			status: updates.status ?? search["status"],
			priority: updates.priority ?? search["priority"],
			sortBy: updates.sortBy ?? search["sortBy"],
			sortDirection: updates.sortDirection ?? search["sortDirection"],
		});
	};

	const handleToggleTask = (taskId: string, currentStatus: string) => {
		toggleStatus({ id: taskId, currentStatus });
	};

	const handleDeleteTask = (taskId: string, title?: string) => {
		deleteTask({ id: taskId, title });
	};

	// Check if we're on a child route (like /tasks/new or /$taskId)
	// If so, render the child route via Outlet
	// IMPORTANT: This must be AFTER all hooks to respect Rules of Hooks
	const isChildRoute =
		location.pathname !== `/tasks/${taskListId}` &&
		location.pathname.startsWith(`/tasks/${taskListId}/tasks/`);

	if (isChildRoute) {
		return <Outlet />;
	}

	if (isLoading) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="gradient-mesh absolute inset-0 opacity-30" />
				</div>
				<div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
					<div className="flex min-h-[400px] items-center justify-center">
						<Loader size="lg" />
					</div>
				</div>
			</div>
		);
	}

	if (!taskList) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="gradient-mesh absolute inset-0 opacity-30" />
				</div>
				<div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
					<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
						<p className="text-destructive">Task list not found.</p>
						<Link to="/tasks" className="mt-2 inline-block text-sm underline">
							Go back to lists
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const tasksList = tasks ?? [];
	// When filtering is active, use filtered results grouped by status
	const pendingTasks = filteredTasks.filter((t) => t.status !== "COMPLETED");
	const completedTasks = filteredTasks.filter((t) => t.status === "COMPLETED");
	const hasActiveFilters =
		search["q"] !== "" ||
		search["status"] !== "all" ||
		search["priority"] !== "all";

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-25" />
			</div>

			<div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
				<AccountPrompt variant="banner" />

				{/* Header */}
				<div className="mb-6 flex flex-wrap items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						className="min-h-[44px] sm:min-h-0"
						onClick={() => navigate({ to: "/tasks" })}
						aria-label="Back to task lists"
					>
						<ArrowLeft className="h-4 w-4" />
						<span className="sr-only">Back to task lists</span>
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<div
								className="h-3 w-3 rounded-full"
								style={{ backgroundColor: taskList.color || "#22c55e" }}
							/>
							<h1 className="text-heading-1">{taskList.name}</h1>
						</div>
						<p className="text-muted-foreground">{tasksList.length} task(s)</p>
					</div>
					<div className="ml-auto flex flex-wrap items-center gap-3 sm:gap-2">
						{/* Primary action - always visible */}
						<Button
							onClick={() => navigate({ to: `/tasks/${taskListId}/tasks/new` })}
							size="sm"
						>
							<Plus className="mr-2 h-4 w-4" />
							Add a task
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
									<DropdownMenuItem
										onClick={() => navigate({ to: "/tasks/import" })}
									>
										<Upload className="mr-2 h-4 w-4" />
										Import
									</DropdownMenuItem>
									{taskList.sourceUrl && (
										<DropdownMenuItem
											onClick={handleRefreshFromUrl}
											disabled={refreshFromUrlMutation.isPending}
										>
											{refreshFromUrlMutation.isPending ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<RefreshCw className="mr-2 h-4 w-4" />
											)}
											Refresh
										</DropdownMenuItem>
									)}
									<DropdownMenuItem onClick={() => setCleanDialogOpen(true)}>
										<Sparkles className="mr-2 h-4 w-4" />
										Clean up
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											navigate({
												to: "/tasks/merge",
												search: { selected: taskListId },
											})
										}
									>
										<Merge className="mr-2 h-4 w-4" />
										Merge
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
										<Download className="mr-2 h-4 w-4" />
										Export
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
										<Link2 className="mr-2 h-4 w-4" />
										Share
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<>
								{/* Desktop: All actions visible */}
								<Button
									variant="outline"
									size="sm"
									onClick={() => navigate({ to: "/tasks/import" })}
								>
									<Upload className="mr-2 h-4 w-4" />
									Import
								</Button>
								{/* Refresh button - only shown for task lists with a source URL */}
								{taskList.sourceUrl && (
									<Button
										variant="outline"
										size="sm"
										onClick={handleRefreshFromUrl}
										disabled={refreshFromUrlMutation.isPending}
										title={
											taskList.lastSyncedAt
												? `Last synced ${formatDistanceToNow(new Date(taskList.lastSyncedAt), { addSuffix: true })}. Click to refresh.`
												: `Refresh from ${taskList.sourceUrl}`
										}
									>
										{refreshFromUrlMutation.isPending ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<RefreshCw className="mr-2 h-4 w-4" />
										)}
										Refresh
									</Button>
								)}
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCleanDialogOpen(true)}
								>
									<Sparkles className="mr-2 h-4 w-4" />
									Clean up
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										navigate({
											to: "/tasks/merge",
											search: { selected: taskListId },
										})
									}
								>
									<Merge className="mr-2 h-4 w-4" />
									Merge
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setExportDialogOpen(true)}
								>
									<Download className="mr-2 h-4 w-4" />
									Export
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShareDialogOpen(true)}
								>
									<Link2 className="mr-2 h-4 w-4" />
									Share
								</Button>
							</>
						)}
					</div>
				</div>

				{/* View toggle */}
				<div className="mb-4 flex items-center gap-2">
					<div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
						<Button
							variant={viewMode === "list" ? "default" : "ghost"}
							size="sm"
							className="h-10 min-h-[44px] sm:h-8 sm:min-h-0"
							onClick={() => updateSearch({ view: "list" })}
						>
							<List className="mr-2 h-4 w-4" />
							List
						</Button>
						<Button
							variant={viewMode === "kanban" ? "default" : "ghost"}
							size="sm"
							className="h-10 min-h-[44px] sm:h-8 sm:min-h-0"
							onClick={() => updateSearch({ view: "kanban" })}
						>
							<Kanban className="mr-2 h-4 w-4" />
							Kanban
						</Button>
					</div>
				</div>

				{/* Filter bar */}
				{tasksList.length > 0 && (
					<div className="mb-6">
						<TaskFilterBar
							filters={{
								search: search["q"],
								status: search["status"],
								priority: search["priority"],
								sortBy: search["sortBy"],
								sortDirection: search["sortDirection"],
							}}
							onFiltersChange={handleFiltersChange}
						/>
					</div>
				)}

				{/* Tasks display - List or Kanban view */}
				{viewMode === "kanban" ? (
					/* Kanban View */
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{/* To Do Column */}
						<KanbanColumn
							title="To Do"
							icon={<Circle className="h-4 w-4" />}
							color="text-slate-600"
							bgColor="bg-slate-100 dark:bg-slate-900/30"
							tasks={tasksByStatus.needsAction}
							taskListId={taskListId}
							taskListColor={taskList?.color}
							onToggle={handleToggleTask}
							onEdit={(id) =>
								navigate({ to: `/tasks/${taskListId}/tasks/${id}` })
							}
							onDuplicate={handleDuplicateTask}
							onMove={handleMoveTask}
							onDelete={handleDeleteTask}
							isToggling={isToggling}
							isDuplicating={duplicateTaskMutation.isPending}
						/>
						{/* In Progress Column */}
						<KanbanColumn
							title="In Progress"
							icon={<Play className="h-4 w-4" />}
							color="text-blue-600"
							bgColor="bg-blue-100 dark:bg-blue-900/30"
							tasks={tasksByStatus.inProgress}
							taskListId={taskListId}
							taskListColor={taskList?.color}
							onToggle={handleToggleTask}
							onEdit={(id) =>
								navigate({ to: `/tasks/${taskListId}/tasks/${id}` })
							}
							onDuplicate={handleDuplicateTask}
							onMove={handleMoveTask}
							onDelete={handleDeleteTask}
							isToggling={isToggling}
							isDuplicating={duplicateTaskMutation.isPending}
						/>
						{/* Completed Column */}
						<KanbanColumn
							title="Completed"
							icon={<Check className="h-4 w-4" />}
							color="text-green-600"
							bgColor="bg-green-100 dark:bg-green-900/30"
							tasks={tasksByStatus.completed}
							taskListId={taskListId}
							taskListColor={taskList?.color}
							onToggle={handleToggleTask}
							onEdit={(id) =>
								navigate({ to: `/tasks/${taskListId}/tasks/${id}` })
							}
							onDuplicate={handleDuplicateTask}
							onMove={handleMoveTask}
							onDelete={handleDeleteTask}
							isToggling={isToggling}
							isDuplicating={duplicateTaskMutation.isPending}
						/>
						{/* Cancelled Column */}
						<KanbanColumn
							title="Cancelled"
							icon={<X className="h-4 w-4" />}
							color="text-red-600"
							bgColor="bg-red-100 dark:bg-red-900/30"
							tasks={tasksByStatus.cancelled}
							taskListId={taskListId}
							taskListColor={taskList?.color}
							onToggle={handleToggleTask}
							onEdit={(id) =>
								navigate({ to: `/tasks/${taskListId}/tasks/${id}` })
							}
							onDuplicate={handleDuplicateTask}
							onMove={handleMoveTask}
							onDelete={handleDeleteTask}
							isToggling={isToggling}
							isDuplicating={duplicateTaskMutation.isPending}
						/>
					</div>
				) : (
					/* List View */
					<>
						{/* Pending tasks */}
						{pendingTasks.length > 0 && (
							<div className="mb-8 space-y-2">
								{/* Animated header */}
								<motion.div
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									className="sticky top-0 z-10 mb-3 flex items-center gap-3 bg-gradient-to-r from-background via-background to-transparent py-2"
								>
									<Circle className="h-4 w-4 text-muted-foreground" />
									<span className="font-semibold text-muted-foreground text-sm">
										To Do
									</span>
									<div className="h-px flex-1 bg-border" />
									<span className="text-muted-foreground/60 text-xs">
										{pendingTasks.length} task
										{pendingTasks.length > 1 ? "s" : ""}
									</span>
								</motion.div>
								<AnimatePresence mode="popLayout">
									{pendingTasks.map((task) => (
										<TaskCard
											key={task.id}
											task={task}
											taskListId={taskListId}
											taskListColor={taskList?.color}
											onToggle={handleToggleTask}
											onEdit={(id) =>
												navigate({ to: `/tasks/${taskListId}/tasks/${id}` })
											}
											onDuplicate={handleDuplicateTask}
											onMove={handleMoveTask}
											onDelete={handleDeleteTask}
											isToggling={isToggling}
											isDuplicating={duplicateTaskMutation.isPending}
										/>
									))}
								</AnimatePresence>
							</div>
						)}

						{/* Completed tasks */}
						{completedTasks.length > 0 && (
							<div className="space-y-2">
								{/* Animated header */}
								<motion.div
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									className="sticky top-0 z-10 mb-3 flex items-center gap-3 bg-gradient-to-r from-background via-background to-transparent py-2"
								>
									<Check className="h-4 w-4 text-green-600" />
									<span className="font-semibold text-green-600 text-sm">
										Completed
									</span>
									<div className="h-px flex-1 bg-border" />
									<span className="text-muted-foreground/60 text-xs">
										{completedTasks.length} task
										{completedTasks.length > 1 ? "s" : ""}
									</span>
								</motion.div>
								<AnimatePresence mode="popLayout">
									{completedTasks.map((task) => (
										<motion.div
											key={task.id}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -10 }}
											className="group flex items-center gap-3 rounded-lg border bg-card/50 p-4 transition-all"
										>
											<button
												type="button"
												onClick={() => handleToggleTask(task.id, task.status)}
												disabled={isToggling}
												className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-white disabled:opacity-50"
											>
												<Check className="h-3 w-3" />
											</button>
											<div className="min-w-0 flex-1">
												<p className="font-medium text-muted-foreground line-through">
													{task.title}
												</p>
											</div>
											<button
												type="button"
												onClick={() => handleDeleteTask(task.id, task.title)}
												disabled={isDeleting}
												className="rounded p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 group-hover:opacity-100"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						)}
					</>
				)}

				{/* Empty state */}
				{tasksList.length === 0 && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-full bg-muted p-4">
							<Check className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="mb-2 font-medium">No tasks yet</h3>
						<p className="text-muted-foreground text-sm">
							Add your first task using the button above
						</p>
					</div>
				)}

				{/* No results from filters */}
				{tasksList.length > 0 &&
					filteredTasks.length === 0 &&
					hasActiveFilters && (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 rounded-full bg-muted p-4">
								<Search className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="mb-2 font-medium">No matching tasks</h3>
							<p className="text-muted-foreground text-sm">
								Try adjusting your filters or search query
							</p>
						</div>
					)}

				{/* Clean duplicates dialog */}
				<AlertDialog open={cleanDialogOpen} onOpenChange={setCleanDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Clean up duplicates</AlertDialogTitle>
							<AlertDialogDescription>
								This will remove all duplicate tasks (same title and same due
								date). This action is irreversible. Continue?
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleCleanDuplicates}
								disabled={cleanDuplicatesMutation.isPending}
							>
								{cleanDuplicatesMutation.isPending ? "Cleaning..." : "Clean up"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Share Dialog */}
				<ShareTaskListDialog
					taskListId={taskListId}
					taskListName={taskList.name}
					open={shareDialogOpen}
					onOpenChange={setShareDialogOpen}
				/>

				{/* Export Dialog */}
				<ExportTaskListDialog
					taskListId={taskListId}
					taskListName={taskList.name}
					open={exportDialogOpen}
					onOpenChange={setExportDialogOpen}
				/>

				{/* Move Task Dialog */}
				{taskToMove && (
					<MoveTaskDialog
						open={moveDialogOpen}
						onOpenChange={(open) => {
							setMoveDialogOpen(open);
							if (!open) setTaskToMove(null);
						}}
						taskIds={[taskToMove]}
						currentTaskListId={taskListId}
					/>
				)}
			</div>
		</div>
	);
}
