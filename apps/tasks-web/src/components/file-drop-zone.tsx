/**
 * FileDropZone - ICS/Todo file drag & drop zone with preview
 * Uses the generic FileDropZone from @appstandard/ui with ICS-specific configuration
 */

import {
	FileDropZone as BaseFileDropZone,
	Button,
	type FileValidationResult,
} from "@appstandard/ui";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { CheckCircle, CheckCircle2, Circle, X } from "lucide-react";
import { useState } from "react";

interface ParsedTask {
	title: string;
	dueDate?: Date | undefined;
	priority?: number | undefined;
	completed: boolean;
	categories?: string[] | undefined;
}

interface FileDropZoneProps {
	accept?: string | undefined;
	maxSizeMB?: number | undefined;
	onFileSelect: (file: File) => void;
	onFileContent?: ((content: string) => void) | undefined;
	onPreviewParsed?: ((tasks: ParsedTask[]) => void) | undefined;
	disabled?: boolean | undefined;
	className?: string | undefined;
}

// Parse ICS date format (e.g., 20240115T140000Z or 20240115)
function parseIcsDateString(dateStr: string): Date {
	const clean = dateStr.replace(/[^0-9T]/g, "");
	if (clean.length >= 8) {
		const year = Number.parseInt(clean.substring(0, 4), 10);
		const month = Number.parseInt(clean.substring(4, 6), 10) - 1;
		const day = Number.parseInt(clean.substring(6, 8), 10);
		const hours =
			clean.length >= 11 ? Number.parseInt(clean.substring(9, 11), 10) : 0;
		const minutes =
			clean.length >= 13 ? Number.parseInt(clean.substring(11, 13), 10) : 0;
		return new Date(year, month, day, hours, minutes);
	}
	return new Date();
}

// Parse a single ICS line and update the task object
function parseIcsTodoLine(line: string, task: Partial<ParsedTask>): void {
	if (line.startsWith("SUMMARY:")) {
		task.title = line.substring(8);
	} else if (line.startsWith("DUE")) {
		const dateStr = line.split(":")[1];
		if (dateStr) {
			task.dueDate = parseIcsDateString(dateStr);
		}
	} else if (line.startsWith("PRIORITY:")) {
		const priority = Number.parseInt(line.substring(9), 10);
		if (!Number.isNaN(priority)) {
			task.priority = priority;
		}
	} else if (line.startsWith("STATUS:")) {
		const status = line.substring(7).toUpperCase();
		task.completed = status === "COMPLETED";
	} else if (line.startsWith("CATEGORIES:")) {
		task.categories = line
			.substring(11)
			.split(",")
			.map((c) => c.trim());
	}
}

// Check if task has required fields
function isCompleteTask(task: Partial<ParsedTask>): task is ParsedTask {
	return Boolean(task.title);
}

// Parse ICS content for VTODO preview
function parseIcsContent(content: string): ParsedTask[] {
	const tasks: ParsedTask[] = [];
	const lines = content.split("\n");
	let currentTask: Partial<ParsedTask> | null = null;

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed === "BEGIN:VTODO") {
			currentTask = { completed: false };
		} else if (trimmed === "END:VTODO" && currentTask) {
			if (isCompleteTask(currentTask)) {
				tasks.push({
					title: currentTask.title,
					dueDate: currentTask.dueDate,
					priority: currentTask.priority,
					completed: currentTask.completed,
					categories: currentTask.categories,
				});
			}
			currentTask = null;
		} else if (currentTask) {
			parseIcsTodoLine(trimmed, currentTask);
		}
	}

	// Sort by: incomplete first, then by due date, then by priority
	return tasks.sort((a, b) => {
		// Incomplete tasks first
		if (a.completed !== b.completed) {
			return a.completed ? 1 : -1;
		}
		// Then by due date (tasks with due dates first)
		if (a.dueDate && b.dueDate) {
			return a.dueDate.getTime() - b.dueDate.getTime();
		}
		if (a.dueDate) return -1;
		if (b.dueDate) return 1;
		// Then by priority (lower number = higher priority)
		if (a.priority !== undefined && b.priority !== undefined) {
			return a.priority - b.priority;
		}
		return 0;
	});
}

function validateIcsFile(file: File): FileValidationResult {
	const extension = file.name.split(".").pop()?.toLowerCase();
	if (extension !== "ics") {
		return { valid: false, error: "File must be in .ics format" };
	}
	return { valid: true };
}

function getPriorityLabel(priority: number): string {
	if (priority <= 4) return "High";
	if (priority === 5) return "Medium";
	return "Low";
}

function getPriorityColor(priority: number): string {
	if (priority <= 4) return "text-red-500";
	if (priority === 5) return "text-yellow-500";
	return "text-blue-500";
}

function TaskPreviewItem({ task }: { task: ParsedTask }) {
	return (
		<div className="flex items-start gap-3 px-4 py-3">
			{task.completed ? (
				<CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
			) : (
				<Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
			)}
			<div className="min-w-0 flex-1">
				<p
					className={`truncate font-medium ${task.completed ? "text-muted-foreground line-through" : ""}`}
				>
					{task.title}
				</p>
				<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
					{task.dueDate && (
						<span>
							Due: {format(task.dueDate, "MMM d, yyyy", { locale: enUS })}
						</span>
					)}
					{task.priority !== undefined && (
						<span className={getPriorityColor(task.priority)}>
							{getPriorityLabel(task.priority)}
						</span>
					)}
				</div>
				{task.categories && task.categories.length > 0 && (
					<div className="mt-1 flex flex-wrap gap-1">
						{task.categories.slice(0, 3).map((category) => (
							<span
								key={category}
								className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs"
							>
								{category}
							</span>
						))}
						{task.categories.length > 3 && (
							<span className="text-muted-foreground text-xs">
								+{task.categories.length - 3}
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function TasksPreview({ tasks }: { tasks: ParsedTask[] }) {
	if (tasks.length === 0) return null;

	const completedCount = tasks.filter((t) => t.completed).length;
	const pendingCount = tasks.length - completedCount;

	return (
		<div className="rounded-lg border bg-card">
			<div className="border-b px-4 py-3">
				<h3 className="font-medium">Task preview</h3>
				<p className="text-muted-foreground text-sm">
					{pendingCount} pending, {completedCount} completed
				</p>
			</div>
			<div className="max-h-64 divide-y overflow-y-auto">
				{tasks.slice(0, 10).map((task, index) => (
					<TaskPreviewItem key={`${task.title}-${index}`} task={task} />
				))}
				{tasks.length > 10 && (
					<div className="px-4 py-3 text-center text-muted-foreground text-sm">
						+ {tasks.length - 10} more tasks
					</div>
				)}
			</div>
		</div>
	);
}

export function FileDropZone({
	accept = ".ics",
	maxSizeMB = 5,
	onFileSelect,
	onFileContent,
	onPreviewParsed,
	disabled = false,
	className,
}: FileDropZoneProps) {
	const [previewTasks, setPreviewTasks] = useState<ParsedTask[]>([]);

	const handleFileContent = (content: string) => {
		const tasks = parseIcsContent(content);
		setPreviewTasks(tasks);
		onPreviewParsed?.(tasks);
		onFileContent?.(content);
	};

	const handleReset = () => {
		setPreviewTasks([]);
	};

	return (
		<BaseFileDropZone
			accept={accept}
			maxSizeMB={maxSizeMB}
			idleText="Drag your .ics file here"
			onFileSelect={onFileSelect}
			onFileContent={handleFileContent}
			validateFile={validateIcsFile}
			successContent={({ file, onReset }) => (
				<>
					<CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
					<p className="font-medium text-body-large">{file.name}</p>
					<p className="mt-1 text-muted-foreground text-sm">
						{previewTasks.length} task{previewTasks.length !== 1 ? "s" : ""}{" "}
						detected
					</p>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							handleReset();
							onReset();
						}}
						className="mt-4"
					>
						<X className="mr-2 h-4 w-4" />
						Change file
					</Button>
				</>
			)}
			previewContent={<TasksPreview tasks={previewTasks} />}
			disabled={disabled}
			className={className}
		/>
	);
}
