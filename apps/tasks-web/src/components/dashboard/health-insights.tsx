import { cn } from "@appstandard/react-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@appstandard/ui";
import {
	AlertCircle,
	Calendar,
	Clock,
	Copy,
	FolderX,
	Stethoscope,
} from "lucide-react";

interface HealthInsightsProps {
	health: {
		tasksWithoutDueDate: number;
		tasksWithoutDescription: number;
		oldTasks: number;
		emptyTaskLists: number;
		potentialDuplicates: number;
	};
}

export function HealthInsights({ health }: HealthInsightsProps) {
	const issues = [
		{
			label: "Tasks without due date",
			count: health.tasksWithoutDueDate,
			icon: Calendar,
			severity: health.tasksWithoutDueDate > 10 ? "warning" : "info",
		},
		{
			label: "Tasks without description",
			count: health.tasksWithoutDescription,
			icon: AlertCircle,
			severity: "info" as const,
		},
		{
			label: "Old tasks (6+ months)",
			count: health.oldTasks,
			icon: Clock,
			severity: health.oldTasks > 5 ? "warning" : "info",
		},
		{
			label: "Empty task lists",
			count: health.emptyTaskLists,
			icon: FolderX,
			severity: health.emptyTaskLists > 0 ? "warning" : "info",
		},
		{
			label: "Potential duplicates",
			count: health.potentialDuplicates,
			icon: Copy,
			severity: health.potentialDuplicates > 0 ? "warning" : "info",
		},
	];

	const hasIssues = issues.some((i) => i.count > 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Stethoscope className="h-4 w-4" />
					Data Health
				</CardTitle>
			</CardHeader>
			<CardContent>
				{hasIssues ? (
					<div className="space-y-2">
						{issues.map((issue) => {
							if (issue.count === 0) return null;
							return (
								<div
									key={issue.label}
									className={cn(
										"flex items-center justify-between rounded-lg p-3",
										issue.severity === "warning"
											? "bg-amber-500/10"
											: "bg-muted/50",
									)}
								>
									<div className="flex items-center gap-2">
										<issue.icon
											className={cn(
												"h-4 w-4",
												issue.severity === "warning"
													? "text-amber-600 dark:text-amber-400"
													: "text-muted-foreground",
											)}
										/>
										<span className="text-sm">{issue.label}</span>
									</div>
									<span
										className={cn(
											"font-bold text-sm",
											issue.severity === "warning"
												? "text-amber-600 dark:text-amber-400"
												: "text-muted-foreground",
										)}
									>
										{issue.count}
									</span>
								</div>
							);
						})}
					</div>
				) : (
					<div className="rounded-lg bg-emerald-500/10 p-4 text-center">
						<p className="font-medium text-emerald-600 text-sm dark:text-emerald-400">
							All tasks are healthy!
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							No issues detected in your task data.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
