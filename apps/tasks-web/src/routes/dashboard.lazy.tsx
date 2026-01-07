import { Button, Skeleton } from "@appstandard/ui";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { ListTodo, Plus } from "lucide-react";
import { useState } from "react";
import {
	HealthInsights,
	HeroMetrics,
	OverdueTasks,
	PeriodSelector,
	PriorityBreakdown,
	QuickActions,
	SharingStats,
	StatusBreakdown,
	TaskListStats,
	UpcomingTasks,
} from "@/components/dashboard";
import { useDashboard } from "@/hooks/use-dashboard";

export const Route = createLazyFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header skeleton */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Skeleton className="mb-2 h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-9 w-[140px]" />
				</div>
			</div>

			{/* Hero metrics skeleton */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<Skeleton className="h-32" />
				<Skeleton className="h-32" />
				<Skeleton className="h-32" />
				<Skeleton className="h-32" />
			</div>

			{/* Content skeleton */}
			<div className="grid gap-6 lg:grid-cols-2">
				<Skeleton className="h-96" />
				<Skeleton className="h-96" />
			</div>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="rounded-lg border border-dashed p-8 text-center">
			<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
				<ListTodo className="h-6 w-6 text-primary" />
			</div>
			<h3 className="mb-2 font-semibold text-lg">No task lists yet</h3>
			<p className="mb-4 text-muted-foreground text-sm">
				Create your first task list to start tracking your tasks.
			</p>
			<Button asChild>
				<Link to="/tasks/new">
					<Plus className="mr-2 h-4 w-4" />
					Create Task List
				</Link>
			</Button>
		</div>
	);
}

type Period = "today" | "week" | "month" | "year";

function DashboardPage() {
	const [period, setPeriod] = useState<Period>("week");
	const { stats, isLoading, isError } = useDashboard(period);

	const handlePeriodChange = (newPeriod: string) => {
		setPeriod(newPeriod as Period);
	};

	if (isLoading) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="container mx-auto max-w-7xl px-4 py-6 sm:py-10">
					<DashboardSkeleton />
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="container mx-auto max-w-7xl px-4 py-6 sm:py-10">
					<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
						<p className="text-destructive">
							Failed to load dashboard data. Please try again.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Check if user has no task lists
	if (stats?.taskLists.length === 0) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
					<div className="mb-8">
						<h1 className="mb-2 font-bold text-3xl tracking-tight">
							Dashboard
						</h1>
						<p className="text-muted-foreground">
							Overview of your tasks and productivity.
						</p>
					</div>
					<EmptyState />
				</div>
			</div>
		);
	}

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			<div className="container mx-auto max-w-7xl px-4 py-6 sm:py-10">
				{/* Header */}
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="mb-2 font-bold text-3xl tracking-tight">
							Dashboard
						</h1>
						<p className="text-muted-foreground">
							Overview of your tasks and productivity.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<PeriodSelector value={period} onChange={handlePeriodChange} />
						<QuickActions />
					</div>
				</div>

				{/* Hero Metrics */}
				{stats && (
					<div className="mb-6">
						<HeroMetrics
							tasksDueToday={stats.hero.tasksDueToday}
							tasksDuePeriod={stats.hero.tasksDuePeriod}
							completedPeriod={stats.hero.completedPeriod}
							completedPreviousPeriod={stats.hero.completedPreviousPeriod}
							overdueCount={stats.hero.overdueCount}
							completionRate={stats.hero.completionRate}
							periodLabel={period}
						/>
					</div>
				)}

				{/* Overdue tasks alert */}
				{stats && stats.overdue.length > 0 && (
					<div className="mb-6">
						<OverdueTasks overdue={stats.overdue} />
					</div>
				)}

				{/* Main content grid */}
				{stats && (
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Left column */}
						<div className="space-y-6">
							<UpcomingTasks upcoming={stats.upcoming} />
							<StatusBreakdown statusBreakdown={stats.statusBreakdown} />
						</div>

						{/* Right column */}
						<div className="space-y-6">
							<PriorityBreakdown priorityBreakdown={stats.priorityBreakdown} />
							<TaskListStats byTaskList={stats.byTaskList} />
						</div>
					</div>
				)}

				{/* Full width sections */}
				{stats && (
					<div className="mt-6 grid gap-6 lg:grid-cols-2">
						<HealthInsights health={stats.health} />
						<SharingStats sharing={stats.sharing} />
					</div>
				)}
			</div>
		</div>
	);
}
