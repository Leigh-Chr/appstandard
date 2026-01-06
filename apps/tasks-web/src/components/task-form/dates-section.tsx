/**
 * Dates section for task form
 * Start date, due date with time inputs
 */

import { Input, Label } from "@appstandard/ui";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

interface DatesSectionProps {
	startDate: string;
	startTime: string;
	dueDate: string;
	dueTime: string;
	onStartDateChange: (value: string) => void;
	onStartTimeChange: (value: string) => void;
	onDueDateChange: (value: string) => void;
	onDueTimeChange: (value: string) => void;
	validationErrors?: { startDate?: string; dueDate?: string };
	isSubmitting: boolean;
}

export function DatesSection({
	startDate,
	startTime,
	dueDate,
	dueTime,
	onStartDateChange,
	onStartTimeChange,
	onDueDateChange,
	onDueTimeChange,
	validationErrors,
	isSubmitting,
}: DatesSectionProps) {
	return (
		<div className="space-y-4">
			{/* Start Date/Time */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="startDate" className="flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						Start Date
					</Label>
					<Input
						id="startDate"
						type="date"
						value={startDate}
						onChange={(e) => onStartDateChange(e.target.value)}
						disabled={isSubmitting}
						className={validationErrors?.startDate ? "border-destructive" : ""}
					/>
					{validationErrors?.startDate && (
						<p className="text-destructive text-sm">
							{validationErrors.startDate}
						</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="startTime" className="flex items-center gap-2">
						<Clock className="h-4 w-4" />
						Start Time
					</Label>
					<Input
						id="startTime"
						type="time"
						value={startTime}
						onChange={(e) => onStartTimeChange(e.target.value)}
						disabled={isSubmitting || !startDate}
					/>
				</div>
			</div>

			{/* Due Date/Time */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="dueDate" className="flex items-center gap-2">
						<Calendar className="h-4 w-4 text-destructive" />
						Due Date
					</Label>
					<Input
						id="dueDate"
						type="date"
						value={dueDate}
						onChange={(e) => onDueDateChange(e.target.value)}
						disabled={isSubmitting}
						className={validationErrors?.dueDate ? "border-destructive" : ""}
					/>
					{validationErrors?.dueDate && (
						<p className="text-destructive text-sm">
							{validationErrors.dueDate}
						</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="dueTime" className="flex items-center gap-2">
						<Clock className="h-4 w-4 text-destructive" />
						Due Time
					</Label>
					<Input
						id="dueTime"
						type="time"
						value={dueTime}
						onChange={(e) => onDueTimeChange(e.target.value)}
						disabled={isSubmitting || !dueDate}
					/>
				</div>
			</div>

			{/* Due date summary */}
			{dueDate && (
				<div className="rounded-lg border bg-muted/50 p-3">
					<p className="text-sm">
						Due:{" "}
						<span className="font-medium">
							{format(new Date(dueDate), "EEEE, MMMM d, yyyy")}
							{dueTime && ` at ${dueTime}`}
						</span>
					</p>
				</div>
			)}
		</div>
	);
}
