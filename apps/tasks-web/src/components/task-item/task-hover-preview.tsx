/**
 * Task hover preview component
 * Shows detailed task information in a hover card
 */

import { cn } from "@appstandard/react-utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@appstandard/ui";
import { isPast, isToday } from "date-fns";
import {
	AlertCircle,
	Bell,
	Calendar,
	CheckCircle2,
	CircleDot,
	Link as LinkIcon,
	ListTodo,
	Lock,
	MapPin,
	PlayCircle,
	Repeat,
	Tag,
	User,
	Users,
	XCircle,
} from "lucide-react";
import type { Task } from "./types";
import { formatCategories, getPriorityInfo } from "./types";

interface TaskHoverPreviewProps {
	task: Task;
	children: React.ReactNode;
	taskListColor?: string | null;
}

type TaskStatus = "NEEDS_ACTION" | "IN_PROCESS" | "COMPLETED" | "CANCELLED";

const statusConfig: Record<
	TaskStatus,
	{
		icon: typeof CircleDot;
		label: string;
		color: string;
	}
> = {
	NEEDS_ACTION: {
		icon: CircleDot,
		label: "Needs Action",
		color: "text-muted-foreground",
	},
	IN_PROCESS: {
		icon: PlayCircle,
		label: "In Progress",
		color: "text-blue-600 dark:text-blue-400",
	},
	COMPLETED: {
		icon: CheckCircle2,
		label: "Completed",
		color: "text-green-600 dark:text-green-400",
	},
	CANCELLED: {
		icon: XCircle,
		label: "Cancelled",
		color: "text-muted-foreground",
	},
};

/** Helper to render date display text */
function formatDateDisplay(
	startDate: Date | null,
	dueDate: Date | null,
	isOverdue: boolean,
	isDueToday: boolean,
): string | null {
	if (startDate && dueDate) {
		return `${startDate.toLocaleDateString()} - ${dueDate.toLocaleDateString()}`;
	}
	if (dueDate) {
		let text = `Due ${dueDate.toLocaleDateString()}`;
		if (isOverdue) text += " (Overdue)";
		if (isDueToday) text += " (Today)";
		return text;
	}
	if (startDate) {
		return `Starts ${startDate.toLocaleDateString()}`;
	}
	return null;
}

export function TaskHoverPreview({
	task,
	children,
	taskListColor,
}: TaskHoverPreviewProps) {
	const accentColor = taskListColor || "#3b82f6";
	const statusKey = (task.status as TaskStatus) || "NEEDS_ACTION";
	const status = statusConfig[statusKey] || statusConfig.NEEDS_ACTION;
	const StatusIcon = status.icon;
	const priorityInfo = getPriorityInfo(task.priority);
	const categoriesStr = formatCategories(task.categories);

	const dueDate = task.dueDate ? new Date(task.dueDate) : null;
	const startDate = task.startDate ? new Date(task.startDate) : null;
	const isOverdue = Boolean(
		dueDate &&
			isPast(dueDate) &&
			task.status !== "COMPLETED" &&
			!isToday(dueDate),
	);
	const isDueToday = Boolean(dueDate && isToday(dueDate));

	return (
		<HoverCard openDelay={400} closeDelay={100}>
			<HoverCardTrigger asChild>{children}</HoverCardTrigger>
			<HoverCardContent
				side="right"
				align="start"
				className="w-80 max-w-[calc(100vw-2rem)]"
			>
				<div className="space-y-3">
					{/* Header with color accent */}
					<div className="flex items-start gap-3">
						<div
							className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
							style={{ backgroundColor: accentColor }}
						/>
						<div className="min-w-0 flex-1">
							<h4 className="line-clamp-2 font-semibold text-sm leading-tight">
								{task.title}
							</h4>
						</div>
					</div>

					{/* Status and priority */}
					<div className="flex flex-wrap gap-2">
						<span
							className={cn(
								"flex items-center gap-1 font-medium text-xs",
								status.color,
							)}
						>
							<StatusIcon className="h-3.5 w-3.5" />
							{status.label}
						</span>
						{priorityInfo && (
							<span className="flex items-center gap-1 font-medium text-amber-600 text-xs dark:text-amber-400">
								<AlertCircle className="h-3.5 w-3.5" />
								{priorityInfo.label} Priority
							</span>
						)}
					</div>

					{/* Progress bar */}
					{task.percentComplete != null && task.percentComplete > 0 && (
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
					)}

					{/* Dates */}
					{(startDate || dueDate) && (
						<div
							className={cn(
								"flex items-center gap-2 text-xs",
								isOverdue
									? "text-red-600 dark:text-red-400"
									: isDueToday
										? "text-amber-600 dark:text-amber-400"
										: "text-muted-foreground",
							)}
						>
							<Calendar className="h-3.5 w-3.5 shrink-0" />
							<span>
								{formatDateDisplay(startDate, dueDate, isOverdue, isDueToday)}
							</span>
						</div>
					)}

					{/* Description preview */}
					{task.description && (
						<p className="line-clamp-3 text-muted-foreground text-xs">
							{task.description}
						</p>
					)}

					{/* Metadata grid */}
					<div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-border/40 border-t pt-3 text-muted-foreground text-xs">
						{task.location && (
							<div className="flex items-center gap-1.5">
								<MapPin className="h-3 w-3 shrink-0" />
								<span className="truncate">{task.location}</span>
							</div>
						)}
						{categoriesStr && (
							<div className="flex items-center gap-1.5">
								<Tag className="h-3 w-3 shrink-0" />
								<span className="truncate">{categoriesStr}</span>
							</div>
						)}
						{task.url && (
							<div className="flex items-center gap-1.5">
								<LinkIcon className="h-3 w-3 shrink-0" />
								<span className="truncate">Link attached</span>
							</div>
						)}
						{(task.organizerName || task.organizerEmail) && (
							<div className="flex items-center gap-1.5">
								<User className="h-3 w-3 shrink-0" />
								<span className="truncate">
									{task.organizerName || task.organizerEmail}
								</span>
							</div>
						)}
						{task.attendeeCount != null && task.attendeeCount > 0 && (
							<div className="flex items-center gap-1.5">
								<Users className="h-3 w-3 shrink-0" />
								<span>
									{task.attendeeCount} attendee
									{task.attendeeCount > 1 ? "s" : ""}
								</span>
							</div>
						)}
						{task.alarmCount != null && task.alarmCount > 0 && (
							<div className="flex items-center gap-1.5">
								<Bell className="h-3 w-3 shrink-0" />
								<span>
									{task.alarmCount} reminder{task.alarmCount > 1 ? "s" : ""}
								</span>
							</div>
						)}
						{task.subtaskCount != null && task.subtaskCount > 0 && (
							<div className="flex items-center gap-1.5">
								<ListTodo className="h-3 w-3 shrink-0" />
								<span>
									{task.subtaskCount} subtask{task.subtaskCount > 1 ? "s" : ""}
								</span>
							</div>
						)}
					</div>

					{/* Badges */}
					{(task.rrule || (task.class && task.class !== "PUBLIC")) && (
						<div className="flex flex-wrap gap-1.5">
							{task.rrule && (
								<span className="flex items-center gap-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
									<Repeat className="h-2.5 w-2.5" />
									Recurring
								</span>
							)}
							{task.class && task.class !== "PUBLIC" && (
								<span className="flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
									<Lock className="h-2.5 w-2.5" />
									{task.class}
								</span>
							)}
						</div>
					)}
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
