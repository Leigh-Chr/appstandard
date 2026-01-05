import { cn } from "@appstandard/react-utils";
import { Card, CardContent } from "@appstandard/ui";
import {
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	CheckCircle2,
	ListTodo,
	Minus,
	TrendingUp,
} from "lucide-react";

interface HeroMetricsProps {
	tasksDueToday: number;
	tasksDuePeriod: number;
	completedPeriod: number;
	completedPreviousPeriod: number;
	overdueCount: number;
	completionRate: number;
	periodLabel: string;
}

function formatVariation(
	current: number,
	previous: number,
): {
	percentage: number;
	direction: "up" | "down" | "neutral";
} {
	if (previous === 0) {
		return {
			percentage: current > 0 ? 100 : 0,
			direction: current > 0 ? "up" : "neutral",
		};
	}
	const diff = ((current - previous) / previous) * 100;
	return {
		percentage: Math.abs(Math.round(diff)),
		direction: diff > 0 ? "up" : diff < 0 ? "down" : "neutral",
	};
}

function VariationBadge({
	current,
	previous,
	inverted = false,
}: {
	current: number;
	previous: number;
	inverted?: boolean;
}) {
	const { percentage, direction } = formatVariation(current, previous);

	if (direction === "neutral" || percentage === 0) {
		return (
			<span className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 font-medium text-muted-foreground text-xs">
				<Minus className="h-3 w-3" />
				0%
			</span>
		);
	}

	const isPositive = inverted ? direction === "down" : direction === "up";

	return (
		<span
			className={cn(
				"inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium text-xs",
				isPositive
					? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
					: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
			)}
		>
			{direction === "up" ? (
				<ArrowUp className="h-3 w-3" />
			) : (
				<ArrowDown className="h-3 w-3" />
			)}
			{percentage}%
		</span>
	);
}

function MetricCard({
	title,
	value,
	subtitle,
	icon: Icon,
	variation,
	inverted,
	highlight,
}: {
	title: string;
	value: string | number;
	subtitle?: string;
	icon: React.ComponentType<{ className?: string }>;
	variation?: { current: number; previous: number };
	inverted?: boolean;
	highlight?: "warning" | "success";
}) {
	return (
		<Card
			className={cn(
				"relative overflow-hidden",
				highlight === "warning" && "border-amber-500/50",
				highlight === "success" && "border-emerald-500/50",
			)}
		>
			<CardContent className="p-4 sm:p-6">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<p className="text-muted-foreground text-sm">{title}</p>
						<p
							className={cn(
								"font-bold text-2xl tracking-tight sm:text-3xl",
								highlight === "warning" && "text-amber-600 dark:text-amber-400",
								highlight === "success" &&
									"text-emerald-600 dark:text-emerald-400",
							)}
						>
							{value}
						</p>
						{subtitle && (
							<p className="text-muted-foreground text-xs">{subtitle}</p>
						)}
					</div>
					<div
						className={cn(
							"rounded-lg p-2",
							highlight === "warning"
								? "bg-amber-500/10"
								: highlight === "success"
									? "bg-emerald-500/10"
									: "bg-primary/10",
						)}
					>
						<Icon
							className={cn(
								"h-5 w-5",
								highlight === "warning"
									? "text-amber-600 dark:text-amber-400"
									: highlight === "success"
										? "text-emerald-600 dark:text-emerald-400"
										: "text-primary",
							)}
						/>
					</div>
				</div>
				{variation && (
					<div className="mt-3">
						<VariationBadge
							current={variation.current}
							previous={variation.previous}
							inverted={inverted}
						/>
						<span className="ml-1.5 text-muted-foreground text-xs">
							vs previous
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export function HeroMetrics({
	tasksDueToday,
	tasksDuePeriod,
	completedPeriod,
	completedPreviousPeriod,
	overdueCount,
	completionRate,
	periodLabel,
}: HeroMetricsProps) {
	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<MetricCard
				title="Due today"
				value={tasksDueToday}
				subtitle={tasksDueToday === 1 ? "task" : "tasks"}
				icon={ListTodo}
			/>
			<MetricCard
				title={`Due this ${periodLabel}`}
				value={tasksDuePeriod}
				subtitle={tasksDuePeriod === 1 ? "task" : "tasks"}
				icon={TrendingUp}
			/>
			<MetricCard
				title="Overdue"
				value={overdueCount}
				subtitle={overdueCount === 1 ? "task" : "tasks"}
				icon={AlertTriangle}
				highlight={overdueCount > 0 ? "warning" : undefined}
			/>
			<MetricCard
				title="Completed"
				value={completedPeriod}
				subtitle={`${completionRate}% completion rate`}
				icon={CheckCircle2}
				variation={{
					current: completedPeriod,
					previous: completedPreviousPeriod,
				}}
				highlight={completionRate >= 80 ? "success" : undefined}
			/>
		</div>
	);
}
