import { cn } from "@appstandard/react-utils";
import { Card, CardContent } from "@appstandard/ui";
import {
	ArrowDown,
	ArrowUp,
	Cake,
	Mail,
	Minus,
	Phone,
	Users,
} from "lucide-react";

interface HeroMetricsProps {
	totalContacts: number;
	contactsAddedPeriod: number;
	contactsAddedPreviousPeriod: number;
	contactsWithEmail: number;
	contactsWithPhone: number;
	upcomingBirthdays: number;
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
}: {
	current: number;
	previous: number;
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

	return (
		<span
			className={cn(
				"inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium text-xs",
				direction === "up"
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
	highlight,
}: {
	title: string;
	value: string | number;
	subtitle?: string;
	icon: React.ComponentType<{ className?: string }>;
	variation?: { current: number; previous: number };
	highlight?: "warning" | "success" | "info";
}) {
	return (
		<Card
			className={cn(
				"relative overflow-hidden",
				highlight === "warning" && "border-amber-500/50",
				highlight === "success" && "border-emerald-500/50",
				highlight === "info" && "border-blue-500/50",
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
								highlight === "info" && "text-blue-600 dark:text-blue-400",
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
									: highlight === "info"
										? "bg-blue-500/10"
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
										: highlight === "info"
											? "text-blue-600 dark:text-blue-400"
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
	totalContacts,
	contactsAddedPeriod,
	contactsAddedPreviousPeriod,
	contactsWithEmail,
	contactsWithPhone,
	upcomingBirthdays,
	periodLabel,
}: HeroMetricsProps) {
	const emailPercentage =
		totalContacts > 0
			? Math.round((contactsWithEmail / totalContacts) * 100)
			: 0;
	const phonePercentage =
		totalContacts > 0
			? Math.round((contactsWithPhone / totalContacts) * 100)
			: 0;

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<MetricCard
				title="Total Contacts"
				value={totalContacts}
				subtitle={`+${contactsAddedPeriod} this ${periodLabel}`}
				icon={Users}
				variation={{
					current: contactsAddedPeriod,
					previous: contactsAddedPreviousPeriod,
				}}
			/>
			<MetricCard
				title="With Email"
				value={contactsWithEmail}
				subtitle={`${emailPercentage}% of contacts`}
				icon={Mail}
				highlight={emailPercentage >= 80 ? "success" : undefined}
			/>
			<MetricCard
				title="With Phone"
				value={contactsWithPhone}
				subtitle={`${phonePercentage}% of contacts`}
				icon={Phone}
				highlight={phonePercentage >= 80 ? "success" : undefined}
			/>
			<MetricCard
				title="Upcoming Birthdays"
				value={upcomingBirthdays}
				subtitle="Next 30 days"
				icon={Cake}
				highlight={upcomingBirthdays > 0 ? "info" : undefined}
			/>
		</div>
	);
}
