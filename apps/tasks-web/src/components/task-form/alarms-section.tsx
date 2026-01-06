/**
 * Alarms/Reminders section for task form
 * Add/remove alarms with trigger time and action type
 */

import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@appstandard/ui";
import { Bell, Plus, Trash2 } from "lucide-react";

interface AlarmData {
	trigger: string;
	action: string;
}

const ACTION_OPTIONS = [
	{ value: "DISPLAY", label: "Display notification" },
	{ value: "EMAIL", label: "Send email" },
	{ value: "AUDIO", label: "Play sound" },
] as const;

const PRESET_TRIGGERS = [
	{ value: "-PT15M", label: "15 minutes before" },
	{ value: "-PT30M", label: "30 minutes before" },
	{ value: "-PT1H", label: "1 hour before" },
	{ value: "-PT2H", label: "2 hours before" },
	{ value: "-P1D", label: "1 day before" },
	{ value: "-P2D", label: "2 days before" },
	{ value: "-P1W", label: "1 week before" },
] as const;

interface AlarmsSectionProps {
	alarms: AlarmData[];
	onAddAlarm: () => void;
	onRemoveAlarm: (index: number) => void;
	onUpdateAlarm: (index: number, data: Partial<AlarmData>) => void;
	isSubmitting: boolean;
}

export function AlarmsSection({
	alarms,
	onAddAlarm,
	onRemoveAlarm,
	onUpdateAlarm,
	isSubmitting,
}: AlarmsSectionProps) {
	return (
		<div className="space-y-4">
			{alarms.length === 0 ? (
				<p className="text-muted-foreground text-sm">No reminders set.</p>
			) : (
				<div className="space-y-3">
					{alarms.map((alarm, index) => (
						<div
							key={index}
							className="flex items-center gap-3 rounded-lg border bg-card p-3"
						>
							<Bell className="h-4 w-4 shrink-0 text-muted-foreground" />

							{/* Trigger select */}
							<Select
								value={alarm.trigger}
								onValueChange={(value) =>
									onUpdateAlarm(index, { trigger: value })
								}
								disabled={isSubmitting}
							>
								<SelectTrigger className="flex-1">
									<SelectValue placeholder="When to remind" />
								</SelectTrigger>
								<SelectContent>
									{PRESET_TRIGGERS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Action select */}
							<Select
								value={alarm.action}
								onValueChange={(value) =>
									onUpdateAlarm(index, { action: value })
								}
								disabled={isSubmitting}
							>
								<SelectTrigger className="w-40">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{ACTION_OPTIONS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Remove button */}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => onRemoveAlarm(index)}
								disabled={isSubmitting}
								className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			)}

			{/* Add button */}
			<Button
				type="button"
				variant="outline"
				onClick={onAddAlarm}
				disabled={isSubmitting}
				className="w-full"
			>
				<Plus className="mr-2 h-4 w-4" />
				Add Reminder
			</Button>
		</div>
	);
}
