/**
 * Task details component
 * Displays secondary information like location, categories, url, organizer, etc.
 */

import { cn, useIsMobile } from "@appstandard/react-utils";
import { isPast, isToday } from "date-fns";
import {
	Bell,
	Calendar,
	Link as LinkIcon,
	ListTodo,
	MapPin,
	Tag,
	User,
	Users,
} from "lucide-react";
import type { Task } from "./types";
import { formatCategories } from "./types";

interface TaskDetailsProps {
	task: Task;
}

/** Progress bar display */
export function TaskProgressBar({ task }: TaskDetailsProps) {
	if (task.percentComplete == null || task.percentComplete <= 0) return null;

	return (
		<div className="flex items-center gap-2">
			<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-all"
					style={{ width: `${task.percentComplete}%` }}
				/>
			</div>
			<span className="text-muted-foreground text-xs">
				{task.percentComplete}%
			</span>
		</div>
	);
}

/** Date display (start date, due date) */
export function TaskDateDisplay({ task }: TaskDetailsProps) {
	const dueDate = task.dueDate ? new Date(task.dueDate) : null;
	const startDate = task.startDate ? new Date(task.startDate) : null;

	if (!startDate && !dueDate) return null;

	const isOverdue =
		dueDate &&
		isPast(dueDate) &&
		task.status !== "COMPLETED" &&
		!isToday(dueDate);

	return (
		<div
			className={cn(
				"flex items-center gap-2 text-sm",
				isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
			)}
		>
			<Calendar className="h-4 w-4 shrink-0" />
			{startDate && dueDate ? (
				<span>
					{startDate.toLocaleDateString()} → {dueDate.toLocaleDateString()}
				</span>
			) : dueDate ? (
				<span>Due {dueDate.toLocaleDateString()}</span>
			) : startDate ? (
				<span>Starts {startDate.toLocaleDateString()}</span>
			) : null}
		</div>
	);
}

/** Secondary info grid (location, categories, url, organizer, attendees, alarms, subtasks) */
export function TaskSecondaryInfo({ task }: TaskDetailsProps) {
	const isMobile = useIsMobile();
	const categoriesStr = formatCategories(task.categories);
	const hasSecondaryInfo =
		task.location ||
		categoriesStr ||
		task.url ||
		task.organizerName ||
		task.organizerEmail ||
		(task.attendeeCount && task.attendeeCount > 0) ||
		(task.alarmCount && task.alarmCount > 0) ||
		(task.subtaskCount && task.subtaskCount > 0);

	if (!hasSecondaryInfo) return null;

	return (
		<div className="flex flex-col gap-2 border-border/40 border-t pt-2 text-muted-foreground text-sm md:grid md:grid-cols-2 md:gap-x-4 md:gap-y-2">
			{task.location && (
				<div className="flex items-center gap-2">
					<MapPin className="h-4 w-4 shrink-0" />
					<span className="truncate">{task.location}</span>
				</div>
			)}
			{categoriesStr && (
				<div className="flex items-center gap-2">
					<Tag className="h-4 w-4 shrink-0" />
					<span className="truncate">{categoriesStr}</span>
				</div>
			)}
			{!isMobile && (
				<>
					{task.url && (
						<div className="flex items-center gap-2">
							<LinkIcon className="h-4 w-4 shrink-0" />
							<a
								href={task.url}
								target="_blank"
								rel="noopener noreferrer"
								className="truncate text-primary hover:underline"
								onClick={(e) => e.stopPropagation()}
							>
								{task.url}
							</a>
						</div>
					)}
					{(task.organizerName || task.organizerEmail) && (
						<div className="flex items-center gap-2">
							<User className="h-4 w-4 shrink-0" />
							<span className="truncate">
								{task.organizerName || task.organizerEmail}
							</span>
						</div>
					)}
					{task.attendeeCount != null && task.attendeeCount > 0 && (
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4 shrink-0" />
							<span>
								{task.attendeeCount} participant
								{task.attendeeCount > 1 ? "s" : ""}
							</span>
						</div>
					)}
					{task.alarmCount != null && task.alarmCount > 0 && (
						<div className="flex items-center gap-2">
							<Bell className="h-4 w-4 shrink-0" />
							<span>
								{task.alarmCount} reminder
								{task.alarmCount > 1 ? "s" : ""}
							</span>
						</div>
					)}
					{task.subtaskCount != null && task.subtaskCount > 0 && (
						<div className="flex items-center gap-2">
							<ListTodo className="h-4 w-4 shrink-0" />
							<span>
								{task.subtaskCount} subtask
								{task.subtaskCount > 1 ? "s" : ""}
							</span>
						</div>
					)}
				</>
			)}
		</div>
	);
}

/** Task description preview */
export function TaskDescription({ task }: TaskDetailsProps) {
	if (!task.description) return null;

	return (
		<p className="line-clamp-2 pt-1 text-muted-foreground text-sm">
			{task.description}
		</p>
	);
}
