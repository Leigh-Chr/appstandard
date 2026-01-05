import { Card, CardContent, CardHeader, CardTitle } from "@appstandard/ui";
import { Tag } from "lucide-react";

interface CategoryBreakdownProps {
	categories: {
		name: string;
		count: number;
	}[];
}

const DEFAULT_COLOR = {
	bg: "bg-blue-500",
	light: "bg-blue-500/10",
	text: "text-blue-600 dark:text-blue-400",
};

const CATEGORY_COLORS = [
	DEFAULT_COLOR,
	{
		bg: "bg-emerald-500",
		light: "bg-emerald-500/10",
		text: "text-emerald-600 dark:text-emerald-400",
	},
	{
		bg: "bg-purple-500",
		light: "bg-purple-500/10",
		text: "text-purple-600 dark:text-purple-400",
	},
	{
		bg: "bg-amber-500",
		light: "bg-amber-500/10",
		text: "text-amber-600 dark:text-amber-400",
	},
	{
		bg: "bg-rose-500",
		light: "bg-rose-500/10",
		text: "text-rose-600 dark:text-rose-400",
	},
	{
		bg: "bg-cyan-500",
		light: "bg-cyan-500/10",
		text: "text-cyan-600 dark:text-cyan-400",
	},
	{
		bg: "bg-slate-400",
		light: "bg-slate-500/10",
		text: "text-muted-foreground",
	},
];

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
	const total = categories.reduce((sum, cat) => sum + cat.count, 0);

	if (total === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Tag className="h-4 w-4" />
						Categories
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						No categorized contacts
					</p>
				</CardContent>
			</Card>
		);
	}

	const sortedCategories = [...categories]
		.sort((a, b) => b.count - a.count)
		.slice(0, 6);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Tag className="h-4 w-4" />
					Categories
				</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Bar chart */}
				<div className="mb-4 flex h-4 overflow-hidden rounded-full">
					{sortedCategories.map((category, index) => {
						const percentage = (category.count / total) * 100;
						if (percentage === 0) return null;
						const colorIndex = index % CATEGORY_COLORS.length;
						const color = CATEGORY_COLORS[colorIndex] ?? DEFAULT_COLOR;
						return (
							<div
								key={category.name}
								className={color.bg}
								style={{ width: `${percentage}%` }}
								title={`${category.name}: ${category.count} (${percentage.toFixed(0)}%)`}
							/>
						);
					})}
				</div>

				{/* Legend */}
				<div className="grid grid-cols-2 gap-2">
					{sortedCategories.map((category, index) => {
						const colorIndex = index % CATEGORY_COLORS.length;
						const color = CATEGORY_COLORS[colorIndex] ?? DEFAULT_COLOR;
						return (
							<div
								key={category.name}
								className={`flex items-center justify-between rounded-lg p-2 ${color.light}`}
							>
								<span className={`truncate font-medium text-sm ${color.text}`}>
									{category.name}
								</span>
								<span className={`ml-2 font-bold text-sm ${color.text}`}>
									{category.count}
								</span>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
