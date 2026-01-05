/**
 * Task List Card Component
 * Displays a single task list with actions and upcoming tasks preview
 */

import { cn, useIsMobile } from "@appstandard/react-utils";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@appstandard/ui";
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import {
	AlertCircle,
	CheckCircle2,
	Edit,
	ExternalLink,
	Globe,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { TaskListGroupBadges } from "./group-badges";

interface TaskListCardProps {
	taskList: {
		id: string;
		name: string;
		taskCount: number;
		completedCount?: number;
		color?: string | null;
		sourceUrl?: string | null;
		lastSyncedAt?: string | Date | null;
		tasks?: Array<{
			id: string;
			title: string;
			dueDate: string | Date | null;
			priority: number | null;
			status: string;
		}>;
	};
	onOpen: () => void;
	onEdit: () => void;
	onDelete: () => void;
	isDeleting: boolean;
	isUpdating: boolean;
	/** Selection mode props */
	selectionMode?: boolean;
	isSelected?: boolean;
	onToggleSelect?: (id: string) => void;
}

/**
 * Format date for task card preview
 * Shows contextual labels: "Today", "Tomorrow", "Overdue", or date
 */
function formatCardDate(date: string | Date): {
	label: string;
	isOverdue: boolean;
	isToday: boolean;
} {
	const d = new Date(date);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

	if (taskDate.getTime() < today.getTime()) {
		return { label: "Overdue", isOverdue: true, isToday: false };
	}
	if (taskDate.getTime() === today.getTime()) {
		return { label: "Today", isOverdue: false, isToday: true };
	}
	if (taskDate.getTime() === tomorrow.getTime()) {
		return { label: "Tomorrow", isOverdue: false, isToday: false };
	}
	return {
		label: format(d, "MMM d", { locale: enUS }),
		isOverdue: false,
		isToday: false,
	};
}

export function TaskListCard({
	taskList,
	onOpen,
	onEdit,
	onDelete,
	isDeleting,
	isUpdating,
	selectionMode = false,
	isSelected = false,
	onToggleSelect,
}: TaskListCardProps) {
	const isMobile = useIsMobile();
	const completedCount = taskList.completedCount ?? 0;

	// Get upcoming tasks for preview (already filtered by API)
	const upcomingTasks = taskList.tasks || [];

	// Check if any task is due today or overdue
	const hasOverdue = upcomingTasks.some((task) => {
		if (!task.dueDate) return false;
		const taskDate = new Date(task.dueDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		taskDate.setHours(0, 0, 0, 0);
		return taskDate < today;
	});

	const handleNavigate = () => {
		if (selectionMode) {
			onToggleSelect?.(taskList.id);
		} else {
			onOpen();
		}
	};

	const handleCheckboxChange = (_checked: boolean) => {
		onToggleSelect?.(taskList.id);
	};

	return (
		<Card
			className={cn(
				"group relative cursor-pointer overflow-hidden transition-all duration-200",
				"hover:border-primary/30 hover:shadow-lg",
				selectionMode && "cursor-pointer",
				isSelected && "bg-primary/5 ring-2 ring-primary",
			)}
			onClick={selectionMode ? handleNavigate : onOpen}
		>
			{/* Color accent - left border */}
			<div
				className="absolute inset-y-0 left-0 w-1 transition-all duration-200 group-hover:w-1.5"
				style={{ backgroundColor: taskList.color || "#22c55e" }}
			/>

			<CardHeader className="pb-2 pl-5">
				<div className="flex items-start justify-between">
					{/* Selection checkbox */}
					{selectionMode && (
						<div className="mr-3 flex items-center pt-0.5">
							<Checkbox
								checked={isSelected}
								onCheckedChange={handleCheckboxChange}
								onClick={(e) => e.stopPropagation()}
								aria-label={`Select ${taskList.name}`}
							/>
						</div>
					)}
					<div className="min-w-0 flex-1 pr-8">
						<CardTitle className="line-clamp-1 text-card-title">
							{taskList.name}
						</CardTitle>
						<TaskListGroupBadges taskListId={taskList.id} />
						<CardDescription className="mt-0.5 flex flex-wrap items-center gap-2">
							<span>
								{taskList.taskCount} task
								{taskList.taskCount !== 1 ? "s" : ""}
							</span>
							{completedCount > 0 && (
								<span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 font-medium text-green-600 text-xs dark:text-green-400">
									<CheckCircle2 className="h-3 w-3" />
									{completedCount} done
								</span>
							)}
							{hasOverdue && (
								<span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive text-xs">
									<AlertCircle className="h-3 w-3" />
									Overdue
								</span>
							)}
							{taskList.sourceUrl && (
								<span
									className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 font-medium text-blue-600 text-xs dark:text-blue-400"
									title={
										taskList.lastSyncedAt
											? `Subscribed to ${taskList.sourceUrl}. Last synced ${formatDistanceToNow(new Date(taskList.lastSyncedAt), { addSuffix: true, locale: enUS })}`
											: `Subscribed to ${taskList.sourceUrl}`
									}
								>
									<Globe className="h-3 w-3" />
									Subscribed
								</span>
							)}
						</CardDescription>
					</div>

					{/* Actions Menu - hide in selection mode */}
					{!selectionMode && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
								<Button
									variant="ghost"
									size="icon"
									className={cn(
										"absolute top-2 right-2 h-10 min-h-[44px] w-10 sm:h-8 sm:min-h-0 sm:w-8",
										isMobile
											? "opacity-100"
											: "opacity-0 transition-opacity group-hover:opacity-100",
									)}
									aria-label="Task list actions"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										onOpen();
									}}
								>
									<ExternalLink className="mr-2 h-4 w-4" />
									Open
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										onEdit();
									}}
									disabled={isUpdating}
								>
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										onDelete();
									}}
									disabled={isDeleting}
									className="text-destructive focus:text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</CardHeader>

			<CardContent className="pt-0 pl-5">
				{/* Upcoming tasks preview - like calendar events */}
				{upcomingTasks.length > 0 ? (
					<div className="space-y-1">
						{upcomingTasks.map((task, index) => {
							const dateInfo = task.dueDate
								? formatCardDate(task.dueDate)
								: null;
							return (
								<div
									key={task.id}
									className={cn(
										"flex items-center gap-2 text-xs",
										index === 0 ? "text-foreground" : "text-muted-foreground",
									)}
								>
									{dateInfo ? (
										<span
											className={cn(
												"w-14 shrink-0 text-right font-medium",
												dateInfo.isOverdue && "text-destructive",
												dateInfo.isToday && "text-primary",
											)}
										>
											{dateInfo.label}
										</span>
									) : (
										<span className="w-14 shrink-0 text-right text-muted-foreground/50">
											—
										</span>
									)}
									<span
										className="h-1 w-1 shrink-0 rounded-full"
										style={{ backgroundColor: taskList.color || "#22c55e" }}
									/>
									<span className="truncate">{task.title}</span>
								</div>
							);
						})}
						{taskList.taskCount > 3 && (
							<p className="mt-1 text-muted-foreground/60 text-xs">
								+{taskList.taskCount - 3} others
							</p>
						)}
					</div>
				) : taskList.taskCount > 0 ? (
					<div className="flex items-center gap-2 text-muted-foreground/60 text-xs">
						<CheckCircle2 className="h-3 w-3" />
						<span>All tasks completed</span>
					</div>
				) : (
					<p className="py-2 text-center text-muted-foreground/50 text-xs italic">
						No tasks yet
					</p>
				)}
			</CardContent>
		</Card>
	);
}
