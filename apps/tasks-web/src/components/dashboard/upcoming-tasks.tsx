import { cn } from "@appstandard/react-utils";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@appstandard/ui";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, ChevronRight } from "lucide-react";

interface UpcomingDay {
	date: string;
	dayLabel: string;
	tasks: Array<{
		id: string;
		title: string;
		dueDate: Date | string | null;
		priority: number | null;
		status: string;
		percentComplete: number | null;
		taskListId: string;
		taskListName: string;
		taskListColor: string | null;
	}>;
}

interface UpcomingTasksProps {
	upcoming: UpcomingDay[];
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

export function UpcomingTasks({ upcoming }: UpcomingTasksProps) {
	if (upcoming.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Calendar className="h-4 w-4" />
						Upcoming Tasks
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						No upcoming tasks in the next 7 days
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Calendar className="h-4 w-4" />
					Upcoming Tasks
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{upcoming.map((day) => (
					<div key={day.date}>
						<h4 className="mb-2 font-medium text-muted-foreground text-sm">
							{day.dayLabel}
						</h4>
						<div className="space-y-2">
							{day.tasks.map((task) => (
								<Link
									key={task.id}
									to="/tasks/$taskListId"
									params={{ taskListId: task.taskListId }}
									className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
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
													&middot; {format(new Date(task.dueDate), "h:mm a")}
												</>
											)}
										</p>
									</div>
									{getPriorityLabel(task.priority) && (
										<Badge
											variant="secondary"
											className={cn(
												"shrink-0",
												getPriorityColor(task.priority),
											)}
										>
											{getPriorityLabel(task.priority)}
										</Badge>
									)}
									<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
								</Link>
							))}
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
