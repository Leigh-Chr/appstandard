/**
 * QR Code Task Button
 * Generates a QR code with ICS VTODO data for a single task
 */

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	QRCodeDisplay,
} from "@appstandard/ui";
import {
	generateTodoFile,
	type TaskStatus,
} from "@appstandard-tasks/todo-utils";
import { QrCode } from "lucide-react";
import { useMemo, useState } from "react";

// Maximum size for QR code data (in bytes) to ensure readability
const MAX_QR_DATA_SIZE = 2500;

interface TaskData {
	id: string;
	title: string;
	description?: string | null;
	status?: string | null;
	priority?: number | null;
	percentComplete?: number | null;
	dueDate?: Date | string | null;
	startDate?: Date | string | null;
	completedAt?: Date | string | null;
	location?: string | null;
	url?: string | null;
	uid?: string | null;
	rrule?: string | null;
	geoLatitude?: number | null;
	geoLongitude?: number | null;
	color?: string | null;
	organizerName?: string | null;
	organizerEmail?: string | null;
}

interface QRCodeTaskButtonProps {
	task: TaskData;
	taskListName?: string;
	className?: string;
}

export function QRCodeTaskButton({
	task,
	taskListName = "Tasks",
	className,
}: QRCodeTaskButtonProps) {
	const [open, setOpen] = useState(false);

	// Generate ICS VTODO content for the task
	const { icsContent, isTooLarge } = useMemo(() => {
		const taskInput = {
			uid: task.uid || `${task.id}@appstandard`,
			summary: task.title,
			description: task.description || undefined,
			status: (task.status as TaskStatus) || undefined,
			priority: task.priority ?? undefined,
			percentComplete: task.percentComplete ?? undefined,
			due: task.dueDate ? new Date(task.dueDate) : undefined,
			dtstart: task.startDate ? new Date(task.startDate) : undefined,
			completed: task.completedAt ? new Date(task.completedAt) : undefined,
			location: task.location || undefined,
			url: task.url || undefined,
			rrule: task.rrule || undefined,
			geoLatitude: task.geoLatitude ?? undefined,
			geoLongitude: task.geoLongitude ?? undefined,
			color: task.color || undefined,
			organizerName: task.organizerName || undefined,
			organizerEmail: task.organizerEmail || undefined,
		};

		const content = generateTodoFile([taskInput], {
			calendarName: taskListName,
		});

		return {
			icsContent: content,
			isTooLarge: new Blob([content]).size > MAX_QR_DATA_SIZE,
		};
	}, [task, taskListName]);

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setOpen(true)}
				className={className}
			>
				<QrCode className="mr-2 h-4 w-4" />
				QR Code
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<QrCode className="h-5 w-5" />
							Task QR Code
						</DialogTitle>
						<DialogDescription>
							{isTooLarge
								? "This task has too much data for a QR code. Try removing some details or use the task list share feature instead."
								: "Scan this QR code to add this task to your task manager"}
						</DialogDescription>
					</DialogHeader>

					{isTooLarge ? (
						<div className="py-8 text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
								<QrCode className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-muted-foreground text-sm">
								Task data exceeds QR code capacity.
								<br />
								Use task list sharing for complex tasks.
							</p>
						</div>
					) : (
						<QRCodeDisplay
							value={icsContent}
							size={200}
							title={task.title}
							description="Scan to add to tasks"
							downloadFilename={`${task.title.replace(/\s+/g, "-").toLowerCase()}-task`}
							showCopyButton={false}
							showDownloadButton
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
