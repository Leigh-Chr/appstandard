/**
 * InsightCard - Dashboard insight card components
 * Reusable card components for displaying dashboard metrics and insights
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";

export interface InsightCardProps {
	title: string;
	icon: LucideIcon;
	children: ReactNode;
	className?: string | undefined;
}

export function InsightCard({
	title,
	icon: Icon,
	children,
	className,
}: InsightCardProps) {
	return (
		<Card className={className}>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<Icon className="h-4 w-4 text-primary" />
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

export interface InsightStatProps {
	value: string | number;
	label: string;
	sublabel?: string | undefined;
	trend?:
		| {
				value: number;
				isPositive: boolean;
		  }
		| undefined;
}

export function InsightStat({
	value,
	label,
	sublabel,
	trend,
}: InsightStatProps) {
	return (
		<div className="space-y-1">
			<div className="flex items-baseline gap-2">
				<p className="font-bold text-2xl">{value}</p>
				{trend && (
					<span
						className={`text-sm ${trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
					>
						{trend.isPositive ? "+" : ""}
						{trend.value}%
					</span>
				)}
			</div>
			<p className="text-muted-foreground text-sm">{label}</p>
			{sublabel && <p className="text-muted-foreground text-xs">{sublabel}</p>}
		</div>
	);
}

export interface InsightListItem {
	label: string;
	value: string | number;
	color?: string | undefined;
}

export interface InsightListProps {
	items: InsightListItem[];
}

export function InsightList({ items }: InsightListProps) {
	return (
		<ul className="space-y-1.5">
			{items.map((item) => (
				<li
					key={item.label}
					className="flex items-center justify-between text-sm"
				>
					<div className="flex items-center gap-2">
						{item.color && (
							<div
								className="h-2.5 w-2.5 rounded-full"
								style={{ backgroundColor: item.color }}
							/>
						)}
						<span className="text-muted-foreground">{item.label}</span>
					</div>
					<span className="font-medium">{item.value}</span>
				</li>
			))}
		</ul>
	);
}

export interface InsightProgressProps {
	label: string;
	value: number;
	max: number;
	color?: string | undefined;
	showPercentage?: boolean | undefined;
}

export function InsightProgress({
	label,
	value,
	max,
	color = "#6366f1",
	showPercentage = true,
}: InsightProgressProps) {
	const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<span className="text-sm">{label}</span>
				<span className="font-medium text-sm">
					{value}
					{showPercentage && (
						<span className="text-muted-foreground">/{max}</span>
					)}
				</span>
			</div>
			<div className="flex items-center gap-2">
				<div className="h-2 flex-1 rounded-full bg-muted">
					<div
						className="h-2 rounded-full transition-all"
						style={{ width: `${percentage}%`, backgroundColor: color }}
					/>
				</div>
				{showPercentage && (
					<span className="w-12 text-right text-muted-foreground text-xs">
						{percentage}%
					</span>
				)}
			</div>
		</div>
	);
}
