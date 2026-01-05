import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Progress,
} from "@appstandard/ui";
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";

interface StatusBreakdownProps {
	statusBreakdown: {
		needsAction: number;
		inProcess: number;
		completed: number;
		cancelled: number;
	};
}

export function StatusBreakdown({ statusBreakdown }: StatusBreakdownProps) {
	const total =
		statusBreakdown.needsAction +
		statusBreakdown.inProcess +
		statusBreakdown.completed +
		statusBreakdown.cancelled;

	if (total === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Status Breakdown</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						No tasks yet
					</p>
				</CardContent>
			</Card>
		);
	}

	const statuses = [
		{
			label: "To Do",
			count: statusBreakdown.needsAction,
			icon: Circle,
			color: "bg-slate-500",
			textColor: "text-slate-600 dark:text-slate-400",
		},
		{
			label: "In Progress",
			count: statusBreakdown.inProcess,
			icon: Clock,
			color: "bg-blue-500",
			textColor: "text-blue-600 dark:text-blue-400",
		},
		{
			label: "Completed",
			count: statusBreakdown.completed,
			icon: CheckCircle2,
			color: "bg-emerald-500",
			textColor: "text-emerald-600 dark:text-emerald-400",
		},
		{
			label: "Cancelled",
			count: statusBreakdown.cancelled,
			icon: XCircle,
			color: "bg-rose-500",
			textColor: "text-rose-600 dark:text-rose-400",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Status Breakdown</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{statuses.map((status) => {
					const percentage = total > 0 ? (status.count / total) * 100 : 0;
					return (
						<div key={status.label} className="space-y-1.5">
							<div className="flex items-center justify-between text-sm">
								<div className="flex items-center gap-2">
									<status.icon className={`h-4 w-4 ${status.textColor}`} />
									<span>{status.label}</span>
								</div>
								<span className="font-medium">
									{status.count}{" "}
									<span className="text-muted-foreground">
										({percentage.toFixed(0)}%)
									</span>
								</span>
							</div>
							<Progress
								value={percentage}
								className="h-2"
								style={
									{
										"--progress-color": status.color.replace("bg-", ""),
									} as React.CSSProperties
								}
							/>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
