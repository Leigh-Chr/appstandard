/**
 * Kanban column component
 * Groups tasks by status in a vertical column
 */

import { cn } from "@appstandard/react-utils";
import { Badge } from "@appstandard/ui";
import { AnimatePresence } from "motion/react";
import { KanbanCard } from "./kanban-card";
import type { KanbanColumnProps } from "./types";

export function KanbanColumn({
	title,
	icon,
	color,
	bgColor,
	tasks,
	taskListColor,
	onToggle,
	onEdit,
	onDuplicate,
	onMove,
	onDelete,
	isToggling,
	isDuplicating,
}: KanbanColumnProps) {
	return (
		<div className="flex flex-col rounded-lg border bg-muted/30">
			{/* Column header */}
			<div
				className={cn(
					"flex items-center gap-2 rounded-t-lg px-3 py-2",
					bgColor,
				)}
			>
				<span className={color}>{icon}</span>
				<span className={cn("font-medium text-sm", color)}>{title}</span>
				<Badge variant="secondary" className="ml-auto">
					{tasks.length}
				</Badge>
			</div>

			{/* Tasks */}
			<div className="flex flex-1 flex-col gap-2 p-2">
				<AnimatePresence mode="popLayout">
					{tasks.map((task) => (
						<KanbanCard
							key={task.id}
							task={task}
							taskListColor={taskListColor}
							onToggle={onToggle}
							onEdit={onEdit}
							onDuplicate={onDuplicate}
							onMove={onMove}
							onDelete={onDelete}
							isToggling={isToggling}
							isDuplicating={isDuplicating}
						/>
					))}
				</AnimatePresence>
				{tasks.length === 0 && (
					<div className="flex flex-1 items-center justify-center py-8 text-muted-foreground text-sm">
						No tasks
					</div>
				)}
			</div>
		</div>
	);
}
