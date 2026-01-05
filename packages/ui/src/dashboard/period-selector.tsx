/**
 * PeriodSelector - Dashboard time period selector
 * Allows users to filter dashboard data by time period
 */

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../select";

export const PERIOD_OPTIONS = [
	{ value: "today", label: "Today" },
	{ value: "week", label: "This week" },
	{ value: "month", label: "This month" },
	{ value: "year", label: "This year" },
] as const;

export type Period = (typeof PERIOD_OPTIONS)[number]["value"];

export interface PeriodSelectorProps {
	value: Period;
	onChange: (value: Period) => void;
	className?: string | undefined;
}

export function PeriodSelector({
	value,
	onChange,
	className,
}: PeriodSelectorProps) {
	return (
		<Select value={value} onValueChange={(v) => onChange(v as Period)}>
			<SelectTrigger className={className || "w-[160px]"}>
				<SelectValue placeholder="Select period" />
			</SelectTrigger>
			<SelectContent>
				{PERIOD_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
