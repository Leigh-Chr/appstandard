import { Card, CardContent, CardHeader, CardTitle } from "@appstandard/ui";
import { Flag } from "lucide-react";

interface PriorityBreakdownProps {
	priorityBreakdown: {
		high: number;
		medium: number;
		low: number;
		none: number;
	};
}

export function PriorityBreakdown({
	priorityBreakdown,
}: PriorityBreakdownProps) {
	const total =
		priorityBreakdown.high +
		priorityBreakdown.medium +
		priorityBreakdown.low +
		priorityBreakdown.none;

	if (total === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Flag className="h-4 w-4" />
						Priority Distribution
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						No tasks yet
					</p>
				</CardContent>
			</Card>
		);
	}

	const priorities = [
		{
			label: "High",
			count: priorityBreakdown.high,
			color: "bg-red-500",
			bgColor: "bg-red-500/10",
			textColor: "text-red-600 dark:text-red-400",
		},
		{
			label: "Medium",
			count: priorityBreakdown.medium,
			color: "bg-amber-500",
			bgColor: "bg-amber-500/10",
			textColor: "text-amber-600 dark:text-amber-400",
		},
		{
			label: "Low",
			count: priorityBreakdown.low,
			color: "bg-blue-500",
			bgColor: "bg-blue-500/10",
			textColor: "text-blue-600 dark:text-blue-400",
		},
		{
			label: "None",
			count: priorityBreakdown.none,
			color: "bg-slate-400",
			bgColor: "bg-slate-500/10",
			textColor: "text-muted-foreground",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Flag className="h-4 w-4" />
					Priority Distribution
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="mb-4 flex h-4 overflow-hidden rounded-full">
					{priorities.map((priority) => {
						const percentage = total > 0 ? (priority.count / total) * 100 : 0;
						if (percentage === 0) return null;
						return (
							<div
								key={priority.label}
								className={priority.color}
								style={{ width: `${percentage}%` }}
								title={`${priority.label}: ${priority.count} (${percentage.toFixed(0)}%)`}
							/>
						);
					})}
				</div>
				<div className="grid grid-cols-2 gap-3">
					{priorities.map((priority) => (
						<div
							key={priority.label}
							className={`flex items-center justify-between rounded-lg p-2 ${priority.bgColor}`}
						>
							<span className={`font-medium text-sm ${priority.textColor}`}>
								{priority.label}
							</span>
							<span className={`font-bold text-sm ${priority.textColor}`}>
								{priority.count}
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
