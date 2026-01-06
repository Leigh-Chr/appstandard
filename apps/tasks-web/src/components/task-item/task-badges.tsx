/**
 * Task status badges component
 * Displays status indicators like overdue, due today, in progress, priority
 */

import { cn } from "@appstandard/react-utils";
import { isPast, isToday } from "date-fns";
import { AlertTriangle, Clock, Flag, Lock, Repeat } from "lucide-react";
import type { Task } from "./types";
import { getPriorityInfo } from "./types";

interface TaskBadgesProps {
	task: Task;
	/** Show inline indicators (recurrence, privacy, priority) next to title */
	variant?: "inline" | "row";
}

/** Inline indicators shown next to task title */
export function TaskInlineIndicators({ task }: { task: Task }) {
	const priorityInfo = getPriorityInfo(task.priority);
	const hasIndicators =
		task.rrule || (task.class && task.class !== "PUBLIC") || priorityInfo;

	if (!hasIndicators) return null;

	return (
		<div className="flex items-center gap-1.5">
			{task.rrule && (
				<span className="text-muted-foreground" title="Recurring task">
					<Repeat className="h-3.5 w-3.5" />
				</span>
			)}
			{task.class && task.class !== "PUBLIC" && (
				<span
					className="text-muted-foreground"
					title={task.class === "PRIVATE" ? "Private" : "Confidential"}
				>
					<Lock className="h-3.5 w-3.5" />
				</span>
			)}
			{priorityInfo && (
				<span
					className={cn(
						"inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs",
						priorityInfo.color,
					)}
				>
					<Flag className="h-2.5 w-2.5" />
					{priorityInfo.label}
				</span>
			)}
		</div>
	);
}

/** Status badges row (cancelled, overdue, due today, in progress) */
export function TaskStatusBadges({ task }: TaskBadgesProps) {
	const dueDate = task.dueDate ? new Date(task.dueDate) : null;
	const isOverdue =
		dueDate &&
		isPast(dueDate) &&
		task.status !== "COMPLETED" &&
		!isToday(dueDate);
	const isDueToday = dueDate && isToday(dueDate);

	return (
		<div className="flex flex-wrap items-center gap-2">
			{task.status === "CANCELLED" && (
				<span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-red-700 text-xs dark:bg-red-900/30 dark:text-red-400">
					<span className="h-1.5 w-1.5 rounded-full bg-red-500" />
					Cancelled
				</span>
			)}
			{isOverdue && (
				<span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-red-700 text-xs dark:bg-red-900/30 dark:text-red-400">
					<AlertTriangle className="h-2.5 w-2.5" />
					Overdue
				</span>
			)}
			{isDueToday && !isOverdue && (
				<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
					<Clock className="h-2.5 w-2.5" />
					Due today
				</span>
			)}
			{task.status === "IN_PROCESS" && (
				<span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400">
					<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
					In progress
				</span>
			)}
		</div>
	);
}
