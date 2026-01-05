import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Progress,
} from "@appstandard/ui";
import { Link } from "@tanstack/react-router";
import { List } from "lucide-react";

interface TaskListStat {
	taskListId: string;
	taskListName: string;
	taskListColor: string | null;
	taskCount: number;
}

interface TaskListStatsProps {
	byTaskList: TaskListStat[];
}

export function TaskListStats({ byTaskList }: TaskListStatsProps) {
	if (byTaskList.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<List className="h-4 w-4" />
						Tasks by List
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						No task lists yet
					</p>
				</CardContent>
			</Card>
		);
	}

	const maxCount = Math.max(...byTaskList.map((tl) => tl.taskCount), 1);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<List className="h-4 w-4" />
					Tasks by List
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{byTaskList.slice(0, 8).map((taskList) => (
					<Link
						key={taskList.taskListId}
						to="/tasks/$taskListId"
						params={{ taskListId: taskList.taskListId }}
						className="block rounded-lg p-2 transition-colors hover:bg-muted/50"
					>
						<div className="mb-1.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div
									className="h-3 w-3 rounded-full"
									style={{
										backgroundColor: taskList.taskListColor || "#6b7280",
									}}
								/>
								<span className="font-medium text-sm">
									{taskList.taskListName}
								</span>
							</div>
							<span className="font-medium text-sm">{taskList.taskCount}</span>
						</div>
						<Progress
							value={(taskList.taskCount / maxCount) * 100}
							className="h-1.5"
						/>
					</Link>
				))}
				{byTaskList.length > 8 && (
					<p className="pt-1 text-center text-muted-foreground text-xs">
						And {byTaskList.length - 8} more lists...
					</p>
				)}
			</CardContent>
		</Card>
	);
}
