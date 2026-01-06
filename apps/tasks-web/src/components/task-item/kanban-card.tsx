/**
 * Compact task card for Kanban view
 * Shows essential task information in a condensed format
 */

import { cn } from "@appstandard/react-utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@appstandard/ui";
import { isPast, isToday } from "date-fns";
import {
	AlertTriangle,
	ArrowRight,
	Bell,
	Calendar,
	Check,
	Clock,
	Copy,
	Edit2,
	Flag,
	ListTodo,
	Lock,
	MapPin,
	MoreHorizontal,
	Repeat,
	Tag,
	Trash2,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import type { KanbanCardProps } from "./types";
import { getPriorityInfo } from "./types";

export function KanbanCard({
	task,
	taskListColor,
	onToggle,
	onEdit,
	onDuplicate,
	onMove,
	onDelete,
	isDuplicating,
}: KanbanCardProps) {
	const priorityInfo = getPriorityInfo(task.priority);
	const dueDate = task.dueDate ? new Date(task.dueDate) : null;
	const isOverdue =
		dueDate &&
		isPast(dueDate) &&
		task.status !== "COMPLETED" &&
		!isToday(dueDate);
	const isDueToday = dueDate && isToday(dueDate);
	const isCancelled = task.status === "CANCELLED";
	const accentColor = task.color || taskListColor || "#3b82f6";

	const hasIndicators =
		task.rrule || (task.class && task.class !== "PUBLIC") || priorityInfo;

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className={cn(
				"group relative flex overflow-hidden rounded-md border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md",
				isCancelled && "opacity-60",
			)}
		>
			{/* Color accent bar */}
			<div
				className="w-1 shrink-0 transition-all group-hover:w-1.5"
				style={{ backgroundColor: accentColor }}
			/>

			<div className="flex-1 p-3">
				{/* Title row */}
				<div className="mb-2 flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-1.5">
							<p
								className={cn(
									"line-clamp-2 font-medium text-sm",
									isCancelled && "text-muted-foreground line-through",
								)}
							>
								{task.title}
							</p>
							{/* Inline indicators */}
							{hasIndicators && (
								<div className="flex shrink-0 items-center gap-1">
									{task.rrule && (
										<span title="Recurring">
											<Repeat className="h-3 w-3 text-muted-foreground" />
										</span>
									)}
									{task.class && task.class !== "PUBLIC" && (
										<span title={task.class}>
											<Lock className="h-3 w-3 text-muted-foreground" />
										</span>
									)}
								</div>
							)}
						</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
							>
								<MoreHorizontal className="h-3.5 w-3.5" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(task.id)}>
								<Edit2 className="mr-2 h-4 w-4" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onToggle(task.id, task.status)}>
								<Check className="mr-2 h-4 w-4" />
								Toggle status
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => onDuplicate(task.id)}
								disabled={isDuplicating}
							>
								<Copy className="mr-2 h-4 w-4" />
								Duplicate
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onMove(task.id)}>
								<ArrowRight className="mr-2 h-4 w-4" />
								Move to list...
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => onDelete(task.id, task.title)}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Progress bar (compact) */}
				{task.percentComplete != null && task.percentComplete > 0 && (
					<div className="mb-2 flex items-center gap-1.5">
						<div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-primary"
								style={{ width: `${task.percentComplete}%` }}
							/>
						</div>
						<span className="text-[10px] text-muted-foreground">
							{task.percentComplete}%
						</span>
					</div>
				)}

				{/* Location (compact) */}
				{task.location && (
					<div className="mb-2 flex items-center gap-1 text-muted-foreground text-xs">
						<MapPin className="h-3 w-3 shrink-0" />
						<span className="truncate">{task.location}</span>
					</div>
				)}

				{/* Badges row */}
				<div className="flex flex-wrap gap-1">
					{priorityInfo && (
						<span
							className={cn(
								"inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-xs",
								priorityInfo.color,
							)}
						>
							<Flag className="h-2.5 w-2.5" />
							{priorityInfo.label}
						</span>
					)}
					{isOverdue && (
						<span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1 py-0.5 text-red-700 text-xs dark:bg-red-900/30 dark:text-red-400">
							<AlertTriangle className="h-2.5 w-2.5" />
							Overdue
						</span>
					)}
					{isDueToday && !isOverdue && (
						<span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
							<Clock className="h-2.5 w-2.5" />
							Today
						</span>
					)}
					{dueDate && !isOverdue && !isDueToday && (
						<span className="inline-flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-muted-foreground text-xs">
							<Calendar className="h-2.5 w-2.5" />
							{dueDate.toLocaleDateString()}
						</span>
					)}
					{task.subtaskCount != null && task.subtaskCount > 0 && (
						<span className="inline-flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-muted-foreground text-xs">
							<ListTodo className="h-2.5 w-2.5" />
							{task.subtaskCount}
						</span>
					)}
					{task.attendeeCount != null && task.attendeeCount > 0 && (
						<span className="inline-flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-muted-foreground text-xs">
							<Users className="h-2.5 w-2.5" />
							{task.attendeeCount}
						</span>
					)}
					{task.alarmCount != null && task.alarmCount > 0 && (
						<span className="inline-flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-muted-foreground text-xs">
							<Bell className="h-2.5 w-2.5" />
							{task.alarmCount}
						</span>
					)}
				</div>

				{/* Categories (compact) */}
				{task.categories && task.categories.length > 0 && (
					<div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
						<Tag className="h-3 w-3 shrink-0" />
						<span className="line-clamp-1">
							{task.categories.map((c) => c.category).join(", ")}
						</span>
					</div>
				)}
			</div>
		</motion.div>
	);
}
