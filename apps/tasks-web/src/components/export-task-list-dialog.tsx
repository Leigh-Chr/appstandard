/**
 * Export Task List Dialog - Export with optional filters
 * Allows exporting task list as ICS with status/priority/date filters
 */

import { cn } from "@appstandard/react-utils";
import {
	Badge,
	Button,
	Calendar,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@appstandard/ui";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
	Calendar as CalendarIcon,
	Download,
	Filter,
	Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";

interface ExportTaskListDialogProps {
	taskListId: string;
	taskListName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type DateRange = {
	from?: Date;
	to?: Date;
};

const STATUS_OPTIONS: Array<{
	value: "NEEDS_ACTION" | "IN_PROCESS" | "COMPLETED" | "CANCELLED";
	label: string;
}> = [
	{ value: "NEEDS_ACTION", label: "To Do" },
	{ value: "IN_PROCESS", label: "In Progress" },
	{ value: "COMPLETED", label: "Completed" },
	{ value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS: Array<{
	value: "high" | "medium" | "low";
	label: string;
}> = [
	{ value: "high", label: "High (1-3)" },
	{ value: "medium", label: "Medium (4-6)" },
	{ value: "low", label: "Low (7-9)" },
];

export function ExportTaskListDialog({
	taskListId,
	taskListName,
	open,
	onOpenChange,
}: ExportTaskListDialogProps) {
	const [isExporting, setIsExporting] = useState(false);
	const [dateRange, setDateRange] = useState<DateRange>({});
	const [selectedStatuses, setSelectedStatuses] = useState<
		Set<"NEEDS_ACTION" | "IN_PROCESS" | "COMPLETED" | "CANCELLED">
	>(new Set());
	const [selectedPriorities, setSelectedPriorities] = useState<
		Set<"high" | "medium" | "low">
	>(new Set());
	const [completedOnly, setCompletedOnly] = useState(false);
	const [incompleteOnly, setIncompleteOnly] = useState(false);

	// Toggle status selection
	const toggleStatus = (
		status: "NEEDS_ACTION" | "IN_PROCESS" | "COMPLETED" | "CANCELLED",
	) => {
		setSelectedStatuses((prev) => {
			const next = new Set(prev);
			if (next.has(status)) {
				next.delete(status);
			} else {
				next.add(status);
			}
			return next;
		});
	};

	// Toggle priority selection
	const togglePriority = (priority: "high" | "medium" | "low") => {
		setSelectedPriorities((prev) => {
			const next = new Set(prev);
			if (next.has(priority)) {
				next.delete(priority);
			} else {
				next.add(priority);
			}
			return next;
		});
	};

	// Export handler
	const handleExport = async () => {
		setIsExporting(true);
		try {
			const data = await trpcClient.taskList.exportIcs.query({
				id: taskListId,
				dueDateFrom: dateRange.from?.toISOString(),
				dueDateTo: dateRange.to?.toISOString(),
				statuses:
					selectedStatuses.size > 0 ? Array.from(selectedStatuses) : undefined,
				priorities:
					selectedPriorities.size > 0
						? Array.from(selectedPriorities)
						: undefined,
				completedOnly: completedOnly || undefined,
				incompleteOnly: incompleteOnly || undefined,
			});

			// Download the ICS file
			const blob = new Blob([data.icsContent], { type: "text/calendar" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;

			// Build filename with filters info
			let filename = data.taskListName;
			if (completedOnly) filename += "_completed";
			if (incompleteOnly) filename += "_incomplete";
			if (dateRange.from || dateRange.to) filename += "_filtered";
			filename += ".ics";

			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success("Task list exported successfully");
			onOpenChange(false);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Error during export";
			toast.error(message);
		} finally {
			setIsExporting(false);
		}
	};

	// Quick export (no filters)
	const handleQuickExport = async () => {
		setIsExporting(true);
		try {
			const data = await trpcClient.taskList.exportIcs.query({
				id: taskListId,
			});

			const blob = new Blob([data.icsContent], { type: "text/calendar" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${data.taskListName}.ics`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success("Task list exported successfully");
			onOpenChange(false);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Error during export";
			toast.error(message);
		} finally {
			setIsExporting(false);
		}
	};

	// Clear all filters
	const clearFilters = () => {
		setDateRange({});
		setSelectedStatuses(new Set());
		setSelectedPriorities(new Set());
		setCompletedOnly(false);
		setIncompleteOnly(false);
	};

	const hasFilters =
		dateRange.from ||
		dateRange.to ||
		selectedStatuses.size > 0 ||
		selectedPriorities.size > 0 ||
		completedOnly ||
		incompleteOnly;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Download className="h-5 w-5" />
						Export "{taskListName}"
					</DialogTitle>
					<DialogDescription>
						Export the entire task list or apply filters to export only specific
						tasks.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Quick export button */}
					<Button
						variant="outline"
						className="w-full justify-start"
						onClick={handleQuickExport}
						disabled={isExporting}
					>
						{isExporting ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Export all tasks
					</Button>

					<div className="flex items-center gap-2">
						<div className="h-px flex-1 bg-border" />
						<span className="text-muted-foreground text-xs">or</span>
						<div className="h-px flex-1 bg-border" />
					</div>

					{/* Filters section */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label className="flex items-center gap-2 font-medium text-sm">
								<Filter className="h-4 w-4" />
								Filters
							</Label>
							{hasFilters && (
								<Button
									variant="ghost"
									size="sm"
									onClick={clearFilters}
									className="h-auto px-2 py-1 text-xs"
								>
									Clear filters
								</Button>
							)}
						</div>

						{/* Completion filters */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Checkbox
									id="incomplete-only"
									checked={incompleteOnly}
									onCheckedChange={(checked) => {
										setIncompleteOnly(checked === true);
										if (checked) setCompletedOnly(false);
									}}
								/>
								<Label htmlFor="incomplete-only" className="text-sm">
									Incomplete tasks only
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox
									id="completed-only"
									checked={completedOnly}
									onCheckedChange={(checked) => {
										setCompletedOnly(checked === true);
										if (checked) setIncompleteOnly(false);
									}}
								/>
								<Label htmlFor="completed-only" className="text-sm">
									Completed tasks only
								</Label>
							</div>
						</div>

						{/* Due date range picker */}
						<div className="space-y-2">
							<Label className="text-sm">Due date range</Label>
							<div className="flex gap-2">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"flex-1 justify-start text-left font-normal",
												!dateRange.from && "text-muted-foreground",
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{dateRange.from
												? format(dateRange.from, "d MMM yyyy", {
														locale: enUS,
													})
												: "Start date"}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-[calc(100vw-2rem)] max-w-sm p-0 sm:w-auto"
										align="start"
									>
										<Calendar
											mode="single"
											selected={dateRange.from}
											onSelect={(date) =>
												setDateRange((prev) => ({ ...prev, from: date }))
											}
											locale={enUS}
										/>
									</PopoverContent>
								</Popover>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"flex-1 justify-start text-left font-normal",
												!dateRange.to && "text-muted-foreground",
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{dateRange.to
												? format(dateRange.to, "d MMM yyyy", { locale: enUS })
												: "End date"}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-[calc(100vw-2rem)] max-w-sm p-0 sm:w-auto"
										align="start"
									>
										<Calendar
											mode="single"
											selected={dateRange.to}
											onSelect={(date) =>
												setDateRange((prev) => ({ ...prev, to: date }))
											}
											locale={enUS}
										/>
									</PopoverContent>
								</Popover>
							</div>
						</div>

						{/* Status filter */}
						<div className="space-y-2">
							<Label className="text-sm">Status</Label>
							<div className="flex flex-wrap gap-2">
								{STATUS_OPTIONS.map((status) => (
									<Badge
										key={status.value}
										variant={
											selectedStatuses.has(status.value) ? "default" : "outline"
										}
										className="min-h-[44px] cursor-pointer px-3 py-2 sm:min-h-0 sm:px-2 sm:py-0.5"
										onClick={() => toggleStatus(status.value)}
									>
										{status.label}
									</Badge>
								))}
							</div>
						</div>

						{/* Priority filter */}
						<div className="space-y-2">
							<Label className="text-sm">Priority</Label>
							<div className="flex flex-wrap gap-2">
								{PRIORITY_OPTIONS.map((priority) => (
									<Badge
										key={priority.value}
										variant={
											selectedPriorities.has(priority.value)
												? "default"
												: "outline"
										}
										className="min-h-[44px] cursor-pointer px-3 py-2 sm:min-h-0 sm:px-2 sm:py-0.5"
										onClick={() => togglePriority(priority.value)}
									>
										{priority.label}
									</Badge>
								))}
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleExport} disabled={isExporting || !hasFilters}>
						{isExporting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Exporting...
							</>
						) : (
							<>
								<Download className="mr-2 h-4 w-4" />
								Export with filters
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
