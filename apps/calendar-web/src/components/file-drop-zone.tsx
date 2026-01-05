/**
 * FileDropZone - ICS file drag & drop zone with preview
 * Uses the generic FileDropZone from @appstandard/ui with ICS-specific configuration
 */

import {
	FileDropZone as BaseFileDropZone,
	Button,
	type FileValidationResult,
} from "@appstandard/ui";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Calendar, CheckCircle2, X } from "lucide-react";
import { useState } from "react";

interface ParsedEvent {
	title: string;
	startDate: Date;
	endDate: Date;
	location?: string | undefined;
}

interface FileDropZoneProps {
	accept?: string | undefined;
	maxSizeMB?: number | undefined;
	onFileSelect: (file: File) => void;
	onPreviewParsed?: ((events: ParsedEvent[]) => void) | undefined;
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

// Parse a single ICS line and update the event object
function parseIcsEventLine(line: string, event: Partial<ParsedEvent>): void {
	if (line.startsWith("SUMMARY:")) {
		event.title = line.substring(8);
	} else if (line.startsWith("LOCATION:")) {
		event.location = line.substring(9);
	} else if (line.startsWith("DTSTART")) {
		const dateStr = line.split(":")[1];
		if (dateStr) {
			event.startDate = parseIcsDateString(dateStr);
		}
	} else if (line.startsWith("DTEND")) {
		const dateStr = line.split(":")[1];
		if (dateStr) {
			event.endDate = parseIcsDateString(dateStr);
		}
	}
}

// Check if event has required fields
function isCompleteEvent(event: Partial<ParsedEvent>): event is ParsedEvent {
	return Boolean(event.title && event.startDate);
}

// Parse ICS content for preview
function parseIcsContent(content: string): ParsedEvent[] {
	const events: ParsedEvent[] = [];
	const lines = content.split("\n");
	let currentEvent: Partial<ParsedEvent> | null = null;

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed === "BEGIN:VEVENT") {
			currentEvent = {};
		} else if (trimmed === "END:VEVENT" && currentEvent) {
			if (isCompleteEvent(currentEvent)) {
				events.push({
					title: currentEvent.title,
					startDate: currentEvent.startDate,
					endDate: currentEvent.endDate || currentEvent.startDate,
					location: currentEvent.location,
				});
			}
			currentEvent = null;
		} else if (currentEvent) {
			parseIcsEventLine(trimmed, currentEvent);
		}
	}

	return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

function validateIcsFile(file: File): FileValidationResult {
	const extension = file.name.split(".").pop()?.toLowerCase();
	if (extension !== "ics") {
		return { valid: false, error: "File must be in .ics format" };
	}
	return { valid: true };
}

function EventPreviewItem({ event }: { event: ParsedEvent }) {
	return (
		<div className="flex items-start gap-3 px-4 py-3">
			<Calendar className="h-4 w-4 shrink-0 text-primary" />
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium">{event.title}</p>
				<p className="text-muted-foreground text-sm">
					{format(event.startDate, "EEEE d MMMM yyyy", { locale: enUS })}
					{" - "}
					{format(event.startDate, "HH:mm")} - {format(event.endDate, "HH:mm")}
				</p>
				{event.location && (
					<p className="truncate text-muted-foreground text-xs">
						{event.location}
					</p>
				)}
			</div>
		</div>
	);
}

function EventsPreview({ events }: { events: ParsedEvent[] }) {
	if (events.length === 0) return null;

	return (
		<div className="rounded-lg border bg-card">
			<div className="border-b px-4 py-3">
				<h3 className="font-medium">Event preview</h3>
			</div>
			<div className="max-h-64 divide-y overflow-y-auto">
				{events.slice(0, 10).map((event, index) => (
					<EventPreviewItem key={`${event.title}-${index}`} event={event} />
				))}
				{events.length > 10 && (
					<div className="px-4 py-3 text-center text-muted-foreground text-sm">
						+ {events.length - 10} more events
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
	onPreviewParsed,
	disabled = false,
	className,
}: FileDropZoneProps) {
	const [previewEvents, setPreviewEvents] = useState<ParsedEvent[]>([]);

	const handleFileContent = (content: string) => {
		const events = parseIcsContent(content);
		setPreviewEvents(events);
		onPreviewParsed?.(events);
	};

	const handleReset = () => {
		setPreviewEvents([]);
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
						{previewEvents.length} event{previewEvents.length !== 1 ? "s" : ""}{" "}
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
			previewContent={<EventsPreview events={previewEvents} />}
			disabled={disabled}
			className={className}
		/>
	);
}
