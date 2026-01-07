import { Button, Skeleton } from "@appstandard/ui";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { BookUser, Plus } from "lucide-react";
import { useState } from "react";
import {
	AddressBookStats,
	CategoryBreakdown,
	CompletenessChart,
	HealthInsights,
	HeroMetrics,
	OrganizationStats,
	PeriodSelector,
	QuickActions,
	RecentlyAdded,
	SharingStats,
	UpcomingBirthdays,
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
				<BookUser className="h-6 w-6 text-primary" />
			</div>
			<h3 className="mb-2 font-semibold text-lg">No address books yet</h3>
			<p className="mb-4 text-muted-foreground text-sm">
				Create your first address book to start managing contacts.
			</p>
			<Button asChild>
				<Link to="/contacts/new">
					<Plus className="mr-2 h-4 w-4" />
					Create Address Book
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

	// Check if user has no address books
	if (stats?.addressBooks.length === 0) {
		return (
			<div className="relative min-h-[calc(100vh-4rem)]">
				<div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
					<div className="mb-8">
						<h1 className="mb-2 font-bold text-3xl tracking-tight">
							Dashboard
						</h1>
						<p className="text-muted-foreground">
							Overview of your contacts and address books.
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
							Overview of your contacts and address books.
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
							totalContacts={stats.hero.totalContacts}
							contactsAddedPeriod={stats.hero.contactsAddedPeriod}
							contactsAddedPreviousPeriod={
								stats.hero.contactsAddedPreviousPeriod
							}
							contactsWithEmail={stats.hero.contactsWithEmail}
							contactsWithPhone={stats.hero.contactsWithPhone}
							upcomingBirthdays={stats.hero.upcomingBirthdays}
							periodLabel={period}
						/>
					</div>
				)}

				{/* Main content grid */}
				{stats && (
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Left column */}
						<div className="space-y-6">
							<UpcomingBirthdays
								birthdays={stats.birthdays.map(
									(b: {
										id: string;
										formattedName: string;
										birthday: string | null;
										addressBookName: string;
									}) => {
										const now = new Date();
										const birthday = b.birthday ? new Date(b.birthday) : null;
										let daysUntil = 0;
										if (birthday) {
											const thisYearBirthday = new Date(
												now.getFullYear(),
												birthday.getMonth(),
												birthday.getDate(),
											);
											if (thisYearBirthday < now) {
												thisYearBirthday.setFullYear(now.getFullYear() + 1);
											}
											daysUntil = Math.ceil(
												(thisYearBirthday.getTime() - now.getTime()) /
													(1000 * 60 * 60 * 24),
											);
										}
										return {
											id: b.id,
											name: b.formattedName,
											birthday: birthday?.toISOString() || "",
											daysUntil,
											addressBookName: b.addressBookName,
										};
									},
								)}
							/>
							<RecentlyAdded
								contacts={stats.recentlyAdded.map(
									(c: {
										id: string;
										formattedName: string;
										email: string | null;
										addressBookName: string;
										createdAt: string;
									}) => ({
										id: c.id,
										name: c.formattedName,
										email: c.email,
										addressBookName: c.addressBookName,
										createdAt: c.createdAt,
									}),
								)}
							/>
							<CategoryBreakdown
								categories={stats.byCategory.map(
									(c: { category: string; count: number }) => ({
										name: c.category,
										count: c.count,
									}),
								)}
							/>
						</div>

						{/* Right column */}
						<div className="space-y-6">
							<CompletenessChart
								completeness={{
									withEmail: stats.completeness.withEmail,
									withPhone: stats.completeness.withPhone,
									withAddress: stats.completeness.withAddress,
									withPhoto: stats.completeness.withPhoto,
									total: stats.hero.totalContacts,
								}}
							/>
							<AddressBookStats addressBooks={stats.addressBooks} />
							<OrganizationStats
								organizations={stats.byOrganization.map(
									(o: { organization: string; count: number }) => ({
										name: o.organization,
										count: o.count,
									}),
								)}
							/>
						</div>
					</div>
				)}

				{/* Full width sections */}
				{stats && (
					<div className="mt-6 grid gap-6 lg:grid-cols-2">
						<HealthInsights
							health={{
								withoutEmail: stats.health.contactsWithoutEmail,
								withoutPhone: stats.health.contactsWithoutPhone,
								potentialDuplicates: stats.health.potentialDuplicates,
								emptyAddressBooks: stats.health.emptyAddressBooks,
							}}
						/>
						<SharingStats
							sharing={{
								activeLinks: stats.sharing.activeLinks,
								totalBundles: stats.sharing.activeBundles,
								sharedGroups: stats.sharing.sharedGroups,
							}}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
