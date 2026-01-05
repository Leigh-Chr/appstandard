/**
 * BreakdownChart - Dashboard breakdown visualization
 * Displays data distribution with progress bars and percentages
 */

import type { LucideIcon } from "lucide-react";
import { PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";

// Default colors for chart items
export const CHART_COLORS = [
	"#6366f1", // indigo
	"#8b5cf6", // violet
	"#ec4899", // pink
	"#f43f5e", // rose
	"#f97316", // orange
	"#eab308", // yellow
	"#22c55e", // green
	"#14b8a6", // teal
	"#06b6d4", // cyan
	"#3b82f6", // blue
] as const;

export interface BreakdownItem {
	id: string;
	label: string;
	value: number;
	percentage: number;
	color?: string | undefined;
	sublabel?: string | undefined;
}

export interface BreakdownChartProps {
	title: string;
	icon?: LucideIcon | undefined;
	items: BreakdownItem[];
	emptyMessage?: string | undefined;
	tip?: string | undefined;
	maxItems?: number | undefined;
	valueFormatter?: ((value: number) => string) | undefined;
}

function BreakdownRow({
	label,
	value,
	percentage,
	color,
	sublabel,
	valueFormatter,
}: {
	label: string;
	value: number;
	percentage: number;
	color: string;
	sublabel?: string | undefined;
	valueFormatter?: ((value: number) => string) | undefined;
}) {
	const formattedValue = valueFormatter ? valueFormatter(value) : String(value);

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div
						className="h-3 w-3 rounded-full"
						style={{ backgroundColor: color }}
					/>
					<span className="text-sm">{label}</span>
					{sublabel && (
						<span className="text-muted-foreground text-xs">({sublabel})</span>
					)}
				</div>
				<span className="font-medium text-sm">{formattedValue}</span>
			</div>
			<div className="flex items-center gap-2">
				<div className="h-2 flex-1 rounded-full bg-muted">
					<div
						className="h-2 rounded-full transition-all"
						style={{ width: `${percentage}%`, backgroundColor: color }}
					/>
				</div>
				<span className="w-12 text-right text-muted-foreground text-xs">
					{percentage}%
				</span>
			</div>
		</div>
	);
}

export function BreakdownChart({
	title,
	icon: Icon = PieChart,
	items,
	emptyMessage = "No data available for this period.",
	tip,
	maxItems = 6,
	valueFormatter,
}: BreakdownChartProps) {
	if (items.length === 0) {
		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Icon className="h-5 w-5" />
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="py-6 text-center">
						<p className="text-muted-foreground text-sm">{emptyMessage}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-lg">
					<Icon className="h-5 w-5" />
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{items.slice(0, maxItems).map((item, index) => (
					<BreakdownRow
						key={item.id}
						label={item.label}
						value={item.value}
						percentage={item.percentage}
						sublabel={item.sublabel}
						color={
							item.color ||
							CHART_COLORS[index % CHART_COLORS.length] ||
							"#6366f1"
						}
						valueFormatter={valueFormatter}
					/>
				))}

				{tip && <p className="text-muted-foreground text-xs">{tip}</p>}
			</CardContent>
		</Card>
	);
}

/**
 * Simple horizontal bar chart for status/category distribution
 */
export interface StatusBarItem {
	id: string;
	label: string;
	count: number;
	color: string;
}

export interface StatusBarChartProps {
	items: StatusBarItem[];
	total: number;
}

export function StatusBarChart({ items, total }: StatusBarChartProps) {
	if (total === 0) {
		return <div className="h-3 w-full rounded-full bg-muted" />;
	}

	return (
		<div className="space-y-2">
			<div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
				{items.map((item) => {
					const width = (item.count / total) * 100;
					if (width === 0) return null;
					return (
						<div
							key={item.id}
							className="h-full transition-all"
							style={{
								width: `${width}%`,
								backgroundColor: item.color,
							}}
							title={`${item.label}: ${item.count}`}
						/>
					);
				})}
			</div>
			<div className="flex flex-wrap gap-x-4 gap-y-1">
				{items.map((item) => (
					<div key={item.id} className="flex items-center gap-1.5 text-xs">
						<div
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: item.color }}
						/>
						<span className="text-muted-foreground">{item.label}</span>
						<span className="font-medium">{item.count}</span>
					</div>
				))}
			</div>
		</div>
	);
}
