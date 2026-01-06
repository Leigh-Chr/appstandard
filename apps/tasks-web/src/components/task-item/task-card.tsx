/**
 * Task card component with smooth animations
 * Supports list view with detailed information display
 */

import { cn } from "@appstandard/react-utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@appstandard/ui";
import {
	ArrowRight,
	Check,
	Circle,
	Copy,
	Edit2,
	MoreHorizontal,
	Play,
	Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { TaskInlineIndicators, TaskStatusBadges } from "./task-badges";
import {
	TaskDateDisplay,
	TaskDescription,
	TaskProgressBar,
	TaskSecondaryInfo,
} from "./task-details";
import type { TaskCardProps } from "./types";

export function TaskCard({
	task,
	taskListColor,
	onToggle,
	onEdit,
	onDuplicate,
	onMove,
	onDelete,
	isToggling,
	isDuplicating,
}: TaskCardProps) {
	const isCancelled = task.status === "CANCELLED";
	const accentColor = task.color || taskListColor || "#3b82f6";

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className={cn(
				"group relative flex overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md",
				isCancelled && "opacity-60",
			)}
		>
			{/* Color accent bar */}
			<div
				className="w-1 shrink-0 transition-all group-hover:w-1.5"
				style={{ backgroundColor: accentColor }}
			/>

			{/* Main content */}
			<div className="flex min-w-0 flex-1 items-start gap-3 p-4">
				{/* Status button */}
				<button
					type="button"
					onClick={() => onToggle(task.id, task.status)}
					disabled={isToggling}
					className={cn(
						"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-50",
						task.status === "IN_PROCESS"
							? "border-blue-500 bg-blue-500/20 text-blue-600"
							: task.status === "COMPLETED"
								? "border-green-500 bg-green-500/20 text-green-600"
								: "border-muted-foreground/50 text-muted-foreground hover:border-primary hover:text-primary",
					)}
				>
					{task.status === "IN_PROCESS" ? (
						<Play className="h-2.5 w-2.5" />
					) : task.status === "COMPLETED" ? (
						<Check className="h-3 w-3" />
					) : (
						<Circle className="h-3 w-3" />
					)}
				</button>

				{/* Content */}
				<div className="min-w-0 flex-1 space-y-2">
					{/* Title row with inline indicators */}
					<div className="flex flex-wrap items-center gap-2">
						<h3
							className={cn(
								"font-medium",
								isCancelled && "text-muted-foreground line-through",
							)}
						>
							{task.title}
						</h3>
						<TaskInlineIndicators task={task} />
					</div>

					{/* Status badges row */}
					<TaskStatusBadges task={task} />

					{/* Progress bar */}
					<TaskProgressBar task={task} />

					{/* Due date display */}
					<TaskDateDisplay task={task} />

					{/* Secondary info */}
					<TaskSecondaryInfo task={task} />

					{/* Description */}
					<TaskDescription task={task} />
				</div>

				{/* Actions */}
				<div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					<button
						type="button"
						onClick={() => onEdit(task.id)}
						className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						<Edit2 className="h-4 w-4" />
					</button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="rounded p-1.5 text-muted-foreground hover:bg-muted"
							>
								<MoreHorizontal className="h-4 w-4" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(task.id)}>
								<Edit2 className="mr-2 h-4 w-4" />
								Edit
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
			</div>
		</motion.div>
	);
}
