/**
 * MetricCard - Dashboard metric card with variation indicator
 * Reusable card for displaying key metrics with trend comparison
 */

import { cn } from "@appstandard/react-utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Card, CardContent } from "../card";

export interface VariationData {
	current: number;
	previous: number;
}

export function formatVariation(
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

export interface VariationBadgeProps {
	current: number;
	previous: number;
	positiveIsGood?: boolean | undefined;
}

export function VariationBadge({
	current,
	previous,
	positiveIsGood = true,
}: VariationBadgeProps) {
	const { percentage, direction } = formatVariation(current, previous);

	if (direction === "neutral" || percentage === 0) {
		return (
			<span className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 font-medium text-muted-foreground text-xs">
				<Minus className="h-3 w-3" />
				0%
			</span>
		);
	}

	const isGood = positiveIsGood ? direction === "up" : direction === "down";

	return (
		<span
			className={cn(
				"inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium text-xs",
				isGood
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

export interface MetricCardProps {
	title: string;
	value: string | number;
	subtitle?: string | undefined;
	icon: ComponentType<{ className?: string }>;
	variation?: VariationData | undefined;
	positiveIsGood?: boolean | undefined;
	alert?:
		| {
				message: string;
				variant: "warning" | "error" | "success";
		  }
		| undefined;
	className?: string | undefined;
}

export function MetricCard({
	title,
	value,
	subtitle,
	icon: Icon,
	variation,
	positiveIsGood = true,
	alert,
	className,
}: MetricCardProps) {
	return (
		<Card className={cn("relative overflow-hidden", className)}>
			<CardContent className="p-4 sm:p-6">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<p className="text-muted-foreground text-sm">{title}</p>
						<p className="font-bold text-2xl tracking-tight sm:text-3xl">
							{value}
						</p>
						{subtitle && (
							<p className="text-muted-foreground text-xs">{subtitle}</p>
						)}
					</div>
					<div className="rounded-lg bg-primary/10 p-2">
						<Icon className="h-5 w-5 text-primary" />
					</div>
				</div>
				{variation && (
					<div className="mt-3">
						<VariationBadge
							current={variation.current}
							previous={variation.previous}
							positiveIsGood={positiveIsGood}
						/>
						<span className="ml-1.5 text-muted-foreground text-xs">
							vs previous
						</span>
					</div>
				)}
				{alert && (
					<div
						className={cn(
							"mt-2 text-xs",
							alert.variant === "warning" &&
								"text-amber-600 dark:text-amber-400",
							alert.variant === "error" && "text-red-600 dark:text-red-400",
							alert.variant === "success" &&
								"text-emerald-600 dark:text-emerald-400",
						)}
					>
						{alert.message}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export interface NextItemCardProps {
	title: string;
	itemTitle?: string | undefined;
	itemSubtitle?: string | undefined;
	itemColor?: string | null | undefined;
	emptyMessage?: string | undefined;
	badge?: ReactNode | undefined;
}

export function NextItemCard({
	title,
	itemTitle,
	itemSubtitle,
	itemColor,
	emptyMessage = "No upcoming items",
	badge,
}: NextItemCardProps) {
	return (
		<Card className="relative overflow-hidden">
			<CardContent className="p-4 sm:p-6">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<p className="text-muted-foreground text-sm">{title}</p>
						{itemTitle ? (
							<>
								<p className="line-clamp-1 font-bold text-lg tracking-tight">
									{itemTitle}
								</p>
								{itemSubtitle && (
									<p className="text-muted-foreground text-xs">
										{itemSubtitle}
									</p>
								)}
								{badge}
							</>
						) : (
							<p className="text-muted-foreground text-sm">{emptyMessage}</p>
						)}
					</div>
					{itemColor && (
						<div
							className="h-3 w-3 rounded-full"
							style={{ backgroundColor: itemColor }}
						/>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
