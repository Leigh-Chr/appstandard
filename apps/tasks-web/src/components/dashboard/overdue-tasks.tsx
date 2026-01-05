import { cn } from "@appstandard/react-utils";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@appstandard/ui";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface OverdueTask {
	id: string;
	title: string;
	dueDate: Date | string | null;
	priority: number | null;
	taskListName: string;
	taskListColor: string | null;
}

interface OverdueTasksProps {
	overdue: OverdueTask[];
}

function getPriorityLabel(priority: number | null): string | null {
	if (!priority) return null;
	if (priority >= 1 && priority <= 3) return "High";
	if (priority >= 4 && priority <= 6) return "Medium";
	if (priority >= 7 && priority <= 9) return "Low";
	return null;
}

function getPriorityColor(priority: number | null): string {
	if (!priority) return "bg-muted text-muted-foreground";
	if (priority >= 1 && priority <= 3)
		return "bg-red-500/10 text-red-600 dark:text-red-400";
	if (priority >= 4 && priority <= 6)
		return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
	if (priority >= 7 && priority <= 9)
		return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
	return "bg-muted text-muted-foreground";
}

export function OverdueTasks({ overdue }: OverdueTasksProps) {
	if (overdue.length === 0) {
		return null;
	}

	return (
		<Card className="border-amber-500/50">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-amber-600 text-base dark:text-amber-400">
					<AlertTriangle className="h-4 w-4" />
					Overdue Tasks ({overdue.length})
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{overdue.slice(0, 10).map((task) => (
					<Link
						key={task.id}
						to="/tasks"
						className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 transition-colors hover:bg-amber-500/10"
					>
						<div
							className="h-2 w-2 shrink-0 rounded-full"
							style={{
								backgroundColor: task.taskListColor || "#6b7280",
							}}
						/>
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-sm">{task.title}</p>
							<p className="truncate text-muted-foreground text-xs">
								{task.taskListName}
								{task.dueDate && (
									<>
										{" "}
										&middot; Due{" "}
										{formatDistanceToNow(new Date(task.dueDate), {
											addSuffix: true,
										})}
									</>
								)}
							</p>
						</div>
						{getPriorityLabel(task.priority) && (
							<Badge
								variant="secondary"
								className={cn("shrink-0", getPriorityColor(task.priority))}
							>
								{getPriorityLabel(task.priority)}
							</Badge>
						)}
						<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
					</Link>
				))}
				{overdue.length > 10 && (
					<p className="pt-2 text-center text-muted-foreground text-sm">
						And {overdue.length - 10} more overdue tasks...
					</p>
				)}
			</CardContent>
		</Card>
	);
}
