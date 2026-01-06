/**
 * Recurrence section for task form
 * Build RRULE for repeating tasks
 */

import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@appstandard/ui";
import { Repeat, X } from "lucide-react";
import { useEffect, useState } from "react";

interface RecurrenceSectionProps {
	rrule: string;
	onRruleChange: (value: string) => void;
	isSubmitting: boolean;
}

const FREQUENCY_OPTIONS = [
	{ value: "DAILY", label: "Daily" },
	{ value: "WEEKLY", label: "Weekly" },
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "YEARLY", label: "Yearly" },
] as const;

const WEEKDAY_OPTIONS = [
	{ value: "MO", label: "Mon" },
	{ value: "TU", label: "Tue" },
	{ value: "WE", label: "Wed" },
	{ value: "TH", label: "Thu" },
	{ value: "FR", label: "Fri" },
	{ value: "SA", label: "Sat" },
	{ value: "SU", label: "Sun" },
] as const;

interface RruleState {
	frequency: string;
	interval: number;
	count?: number;
	until?: string;
	byDay: string[];
}

function parseRrule(rrule: string): RruleState {
	const state: RruleState = {
		frequency: "WEEKLY",
		interval: 1,
		byDay: [],
	};

	if (!rrule) return state;

	const parts = rrule.replace("RRULE:", "").split(";");
	for (const part of parts) {
		const [key, value] = part.split("=");
		switch (key) {
			case "FREQ":
				state.frequency = value || "WEEKLY";
				break;
			case "INTERVAL":
				state.interval = Number.parseInt(value || "1", 10);
				break;
			case "COUNT":
				state.count = Number.parseInt(value || "0", 10);
				break;
			case "UNTIL":
				// Convert YYYYMMDD to YYYY-MM-DD
				if (value && value.length >= 8) {
					state.until = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
				}
				break;
			case "BYDAY":
				state.byDay = value ? value.split(",") : [];
				break;
		}
	}

	return state;
}

function buildRrule(state: RruleState): string {
	const parts: string[] = [`FREQ=${state.frequency}`];

	if (state.interval > 1) {
		parts.push(`INTERVAL=${state.interval}`);
	}

	if (state.byDay.length > 0 && state.frequency === "WEEKLY") {
		parts.push(`BYDAY=${state.byDay.join(",")}`);
	}

	if (state.count && state.count > 0) {
		parts.push(`COUNT=${state.count}`);
	} else if (state.until) {
		// Convert YYYY-MM-DD to YYYYMMDD
		parts.push(`UNTIL=${state.until.replace(/-/g, "")}`);
	}

	return `RRULE:${parts.join(";")}`;
}

export function RecurrenceSection({
	rrule,
	onRruleChange,
	isSubmitting,
}: RecurrenceSectionProps) {
	const [isEnabled, setIsEnabled] = useState(!!rrule);
	const [state, setState] = useState<RruleState>(() => parseRrule(rrule));

	// Update rrule when state changes
	useEffect(() => {
		if (isEnabled) {
			onRruleChange(buildRrule(state));
		}
	}, [state, isEnabled, onRruleChange]);

	const handleEnable = () => {
		setIsEnabled(true);
		setState({
			frequency: "WEEKLY",
			interval: 1,
			byDay: [],
		});
	};

	const handleDisable = () => {
		setIsEnabled(false);
		onRruleChange("");
	};

	const toggleWeekday = (day: string) => {
		setState((prev) => ({
			...prev,
			byDay: prev.byDay.includes(day)
				? prev.byDay.filter((d) => d !== day)
				: [...prev.byDay, day],
		}));
	};

	if (!isEnabled) {
		return (
			<div className="space-y-4">
				<p className="text-muted-foreground text-sm">
					This task does not repeat.
				</p>
				<Button
					type="button"
					variant="outline"
					onClick={handleEnable}
					disabled={isSubmitting}
					className="w-full"
				>
					<Repeat className="mr-2 h-4 w-4" />
					Make Repeating
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header with disable button */}
			<div className="flex items-center justify-between">
				<span className="flex items-center gap-2 font-medium text-sm">
					<Repeat className="h-4 w-4" />
					Repeating Task
				</span>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleDisable}
					disabled={isSubmitting}
					className="h-8 text-muted-foreground hover:text-destructive"
				>
					<X className="mr-1 h-4 w-4" />
					Remove
				</Button>
			</div>

			{/* Frequency */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="rrule-freq">Repeat</Label>
					<Select
						value={state.frequency}
						onValueChange={(value) =>
							setState((s) => ({ ...s, frequency: value }))
						}
						disabled={isSubmitting}
					>
						<SelectTrigger id="rrule-freq">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{FREQUENCY_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="rrule-interval">Every</Label>
					<Input
						id="rrule-interval"
						type="number"
						min={1}
						max={99}
						value={state.interval}
						onChange={(e) =>
							setState((s) => ({
								...s,
								interval: Number.parseInt(e.target.value, 10) || 1,
							}))
						}
						disabled={isSubmitting}
					/>
				</div>
			</div>

			{/* Weekdays (for weekly) */}
			{state.frequency === "WEEKLY" && (
				<div className="space-y-2">
					<Label>On days</Label>
					<div className="flex flex-wrap gap-2">
						{WEEKDAY_OPTIONS.map((day) => (
							<Button
								key={day.value}
								type="button"
								variant={
									state.byDay.includes(day.value) ? "default" : "outline"
								}
								size="sm"
								onClick={() => toggleWeekday(day.value)}
								disabled={isSubmitting}
								className="w-12"
							>
								{day.label}
							</Button>
						))}
					</div>
				</div>
			)}

			{/* End condition */}
			<div className="space-y-2">
				<Label>Ends</Label>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label
							htmlFor="rrule-count"
							className="text-muted-foreground text-xs"
						>
							After N occurrences
						</Label>
						<Input
							id="rrule-count"
							type="number"
							min={0}
							placeholder="Never"
							value={state.count || ""}
							onChange={(e) =>
								setState((s) => ({
									...s,
									count: e.target.value
										? Number.parseInt(e.target.value, 10)
										: undefined,
									until: undefined,
								}))
							}
							disabled={isSubmitting}
						/>
					</div>
					<div className="space-y-2">
						<Label
							htmlFor="rrule-until"
							className="text-muted-foreground text-xs"
						>
							Or until date
						</Label>
						<Input
							id="rrule-until"
							type="date"
							value={state.until || ""}
							onChange={(e) =>
								setState((s) => ({
									...s,
									until: e.target.value || undefined,
									count: undefined,
								}))
							}
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</div>

			{/* Preview */}
			<div className="rounded-lg border bg-muted/50 p-3">
				<p className="break-all font-mono text-muted-foreground text-xs">
					{buildRrule(state)}
				</p>
			</div>
		</div>
	);
}
