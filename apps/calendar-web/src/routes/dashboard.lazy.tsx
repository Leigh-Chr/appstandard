import { Skeleton } from "@appstandard/ui";
import { useQuery } from "@tanstack/react-query";
import {
	createLazyFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import {
	AlarmsInsight,
	BreakdownChart,
	CalendarsTable,
	CollaborationInsight,
	ConflictAlerts,
	DataHealth,
	EmptyState,
	EventStatusInsight,
	HeroMetrics,
	PeriodSelector,
	QuickActions,
	RecurrenceInsight,
	SharingStats,
	TimeGauge,
	TimeHeatmap,
	UpcomingAgenda,
} from "@/components/dashboard";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/dashboard")({
	component: DashboardPage,
});

/**
 * UX-007: Skeleton that matches the real dashboard layout
 * Structure mirrors HeroMetrics, UpcomingAgenda, TimeGauge, etc.
 */
function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header skeleton - matches real header */}
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Skeleton className="mb-2 h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="flex flex-wrap items-center gap-3">
					{/* Period selector */}
					<Skeleton className="h-9 w-[160px]" />
					{/* Quick actions */}
					<Skeleton className="h-9 w-9 rounded-md" />
				</div>
			</div>

			{/* Hero metrics skeleton - 4 cards like real component */}
			<div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
				<Skeleton className="h-32 rounded-xl" />
				<Skeleton className="h-32 rounded-xl" />
				<Skeleton className="h-32 rounded-xl" />
				<Skeleton className="h-32 rounded-xl" />
			</div>

			{/* Main content grid - mirrors lg:grid-cols-2 layout */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Left column - Upcoming, TimeGauge, Breakdown */}
				<div className="space-y-6">
					{/* UpcomingAgenda skeleton */}
					<Skeleton className="h-80 rounded-xl" />
					{/* TimeGauge skeleton */}
					<Skeleton className="h-32 rounded-xl" />
					{/* BreakdownChart skeleton */}
					<Skeleton className="h-64 rounded-xl" />
				</div>

				{/* Right column - Heatmap, 4 insights */}
				<div className="space-y-6">
					{/* TimeHeatmap skeleton */}
					<Skeleton className="h-48 rounded-xl" />
					{/* Insights grid - 2x2 like real component */}
					<div className="grid gap-4 sm:grid-cols-2">
						<Skeleton className="h-36 rounded-xl" />
						<Skeleton className="h-36 rounded-xl" />
						<Skeleton className="h-36 rounded-xl" />
						<Skeleton className="h-36 rounded-xl" />
					</div>
				</div>
			</div>

			{/* Full width sections at bottom */}
			<div className="mt-6 space-y-6">
				{/* CalendarsTable skeleton */}
				<Skeleton className="h-64 rounded-xl" />
				{/* DataHealth skeleton */}
				<Skeleton className="h-48 rounded-xl" />
				{/* SharingStats skeleton */}
				<Skeleton className="h-32 rounded-xl" />
			</div>
		</div>
	);
}

function DashboardPage() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/dashboard" });
	const period = search.period || "week";

	const statsQuery = useQuery({
		...trpc.dashboard.getStats.queryOptions({ period }),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const handlePeriodChange = (newPeriod: string) => {
		navigate({
			to: "/dashboard",
			search: { period: newPeriod as typeof period },
			replace: true,
		});
	};

	if (statsQuery.isLoading) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="gradient-mesh absolute inset-0 opacity-40" />
				</div>
				<div className="container mx-auto max-w-7xl px-4 py-6 sm:py-10">
					<DashboardSkeleton />
				</div>
			</div>
		);
	}

	if (statsQuery.isError) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="gradient-mesh absolute inset-0 opacity-40" />
				</div>
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

	const stats = statsQuery.data;

	// Check if user has no calendars
	if (stats?.calendars.length === 0) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="gradient-mesh absolute inset-0 opacity-40" />
				</div>
				<div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
					<div className="mb-8">
						<h1 className="mb-2 text-heading-1">Dashboard</h1>
						<p className="text-muted-foreground">
							Overview of your calendar activity and insights.
						</p>
					</div>
					<EmptyState type="no-calendars" />
				</div>
			</div>
		);
	}

	return (
		<div className="relative min-h-[calc(100vh-4rem)]">
			{/* Subtle background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="gradient-mesh absolute inset-0 opacity-40" />
			</div>

			<div className="container mx-auto max-w-7xl px-4 py-6 sm:py-10">
				{/* Header */}
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="mb-2 text-heading-1">Dashboard</h1>
						<p className="text-muted-foreground">
							Overview of your calendar activity and insights.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<PeriodSelector value={period} onChange={handlePeriodChange} />
						<QuickActions />
					</div>
				</div>

				{/* Conflict alerts */}
				{stats && stats.conflicts.length > 0 && (
					<div className="mb-6">
						<ConflictAlerts conflicts={stats.conflicts} />
					</div>
				)}

				{/* Hero Metrics */}
				{stats && (
					<div className="mb-6">
						<HeroMetrics
							eventsToday={stats.hero.eventsToday}
							eventsPeriod={stats.hero.eventsPeriod}
							eventsPreviousPeriod={stats.hero.eventsPreviousPeriod}
							hoursOccupied={stats.hero.hoursOccupied}
							hoursPreviousPeriod={stats.hero.hoursPreviousPeriod}
							avgDuration={stats.hero.avgDuration}
							nextEvent={stats.hero.nextEvent}
							pendingInvitations={stats.hero.pendingInvitations}
							periodLabel={period}
						/>
					</div>
				)}

				{/* Main content grid */}
				{stats && (
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Left column */}
						<div className="space-y-6">
							<UpcomingAgenda upcoming={stats.upcoming} />
							<TimeGauge
								hoursOccupied={stats.timeLoad.hoursOccupied}
								hoursAvailable={stats.timeLoad.hoursAvailable}
								percentageOccupied={stats.timeLoad.percentageOccupied}
							/>
							<BreakdownChart
								byCategory={stats.breakdown.byCategory}
								byCalendar={stats.breakdown.byCalendar}
								hasCategories={stats.breakdown.hasCategories}
							/>
						</div>

						{/* Right column */}
						<div className="space-y-6">
							<TimeHeatmap heatmap={stats.timeLoad.heatmap} />

							{/* Insights grid */}
							<div className="grid gap-4 sm:grid-cols-2">
								<RecurrenceInsight
									totalRecurring={stats.insights.recurrence.totalRecurring}
									totalEvents={stats.insights.recurrence.totalEvents}
									percentage={stats.insights.recurrence.percentage}
									byFrequency={stats.insights.recurrence.byFrequency}
								/>
								<AlarmsInsight
									eventsWithAlarms={stats.insights.alarms.eventsWithAlarms}
									totalEvents={stats.insights.alarms.totalEvents}
									percentage={stats.insights.alarms.percentage}
									mostCommonTrigger={stats.insights.alarms.mostCommonTrigger}
								/>
								<CollaborationInsight
									eventsWithAttendees={
										stats.insights.collaboration.eventsWithAttendees
									}
									uniqueContacts={stats.insights.collaboration.uniqueContacts}
									topContacts={stats.insights.collaboration.topContacts}
									rsvpStatus={stats.insights.collaboration.rsvpStatus}
								/>
								<EventStatusInsight
									confirmed={stats.insights.eventStatus.confirmed}
									tentative={stats.insights.eventStatus.tentative}
									cancelled={stats.insights.eventStatus.cancelled}
								/>
							</div>
						</div>
					</div>
				)}

				{/* Full width sections */}
				{stats && (
					<div className="mt-6 space-y-6">
						<CalendarsTable calendars={stats.calendars} periodLabel={period} />
						<DataHealth
							eventsWithoutTitle={stats.health.eventsWithoutTitle}
							eventsWithoutDescription={stats.health.eventsWithoutDescription}
							tentativeEvents={stats.health.tentativeEvents}
							cancelledEvents={stats.health.cancelledEvents}
							oldEvents={stats.health.oldEvents}
							emptyCalendars={stats.health.emptyCalendars}
							potentialDuplicates={stats.health.potentialDuplicates}
							expiredShareLinks={stats.health.expiredShareLinks}
						/>
						<SharingStats
							activeLinks={stats.sharing.activeLinks}
							linkAccessThisMonth={stats.sharing.linkAccessThisMonth}
							activeBundles={stats.sharing.activeBundles}
							bundleAccessThisMonth={stats.sharing.bundleAccessThisMonth}
							sharedGroups={stats.sharing.sharedGroups}
							groupMembers={stats.sharing.groupMembers}
							pendingInvitations={stats.sharing.pendingInvitations}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
