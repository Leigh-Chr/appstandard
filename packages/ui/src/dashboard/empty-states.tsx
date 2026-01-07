/**
 * Dashboard Empty States - Empty state components for dashboard sections
 */

import type { LucideIcon } from "lucide-react";
import { Calendar, CheckSquare, Contact, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../button";
import { Card, CardContent } from "../card";

export interface DashboardEmptyStateAction {
	label: string;
	href: string;
	icon?: LucideIcon | undefined;
	variant?: "default" | "outline" | undefined;
}

export interface DashboardEmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	actions?: DashboardEmptyStateAction[] | undefined;
	renderLink: (props: { href: string; children: ReactNode }) => ReactNode;
}

export function DashboardEmptyState({
	icon: Icon,
	title,
	description,
	actions,
	renderLink,
}: DashboardEmptyStateProps) {
	return (
		<Card>
			<CardContent className="flex flex-col items-center justify-center py-12 text-center">
				<div className="mb-4 rounded-full bg-primary/10 p-4">
					<Icon className="h-8 w-8 text-primary" />
				</div>
				<p className="mb-2 font-semibold text-lg">{title}</p>
				<p className="mb-6 max-w-md text-muted-foreground text-sm">
					{description}
				</p>
				{actions && actions.length > 0 && (
					<div className="flex flex-wrap justify-center gap-2">
						{actions.map((action) => (
							<Button
								key={action.href}
								variant={action.variant || "default"}
								asChild
							>
								{renderLink({
									href: action.href,
									children: (
										<>
											{action.icon && (
												<action.icon className="mr-1.5 h-4 w-4" />
											)}
											{action.label}
										</>
									),
								})}
							</Button>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

/**
 * Small empty state for list sections
 */
export interface SmallEmptyStateProps {
	icon: LucideIcon;
	title: string;
	description?: string | undefined;
}

export function SmallEmptyState({
	icon: Icon,
	title,
	description,
}: SmallEmptyStateProps) {
	return (
		<Card>
			<CardContent className="flex flex-col items-center justify-center py-8 text-center">
				<div className="mb-3 rounded-full bg-muted p-3">
					<Icon className="h-6 w-6 text-muted-foreground" />
				</div>
				<p className="mb-1 font-medium">{title}</p>
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
			</CardContent>
		</Card>
	);
}

/**
 * No data message for inline use
 */
export interface NoDataMessageProps {
	message: string;
}

export function NoDataMessage({ message }: NoDataMessageProps) {
	return (
		<div className="py-6 text-center">
			<p className="text-muted-foreground text-sm">{message}</p>
		</div>
	);
}

/**
 * Positive message (e.g., "Free day!")
 */
export interface PositiveMessageProps {
	message: string;
	icon?: LucideIcon | undefined;
}

export function PositiveMessage({
	message,
	icon: Icon = Sparkles,
}: PositiveMessageProps) {
	return (
		<div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-emerald-700 dark:text-emerald-400">
			<Icon className="h-5 w-5" />
			<span className="font-medium text-sm">{message}</span>
		</div>
	);
}

/**
 * Warning message (e.g., "5 overdue tasks")
 */
export interface WarningMessageProps {
	message: string;
	icon?: LucideIcon | undefined;
}

export function WarningMessage({ message, icon: Icon }: WarningMessageProps) {
	return (
		<div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-400">
			{Icon && <Icon className="h-5 w-5" />}
			<span className="font-medium text-sm">{message}</span>
		</div>
	);
}

/**
 * Pre-configured empty states for each app type
 */
export const EMPTY_STATE_CONFIGS = {
	calendar: {
		icon: Calendar,
		title: "Welcome to your Dashboard",
		description:
			"Create your first calendar to start tracking your events and see analytics about your schedule.",
	},
	contacts: {
		icon: Contact,
		title: "Welcome to your Dashboard",
		description:
			"Create your first address book to start managing your contacts and see insights about your network.",
	},
	tasks: {
		icon: CheckSquare,
		title: "Welcome to your Dashboard",
		description:
			"Create your first task list to start tracking your tasks and see analytics about your productivity.",
	},
} as const;
