/**
 * QR Code Event Button
 * Generates a QR code with ICS data for a single event
 */

import { generateIcsFile } from "@appstandard/ics-utils";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	QRCodeDisplay,
} from "@appstandard/ui";
import { QrCode } from "lucide-react";
import { useMemo, useState } from "react";

// Maximum size for QR code data (in bytes) to ensure readability
const MAX_QR_DATA_SIZE = 2500;

interface EventData {
	id: string;
	title: string;
	startDate: Date | string;
	endDate: Date | string;
	description?: string | null;
	location?: string | null;
	uid?: string | null;
	status?: string | null;
	priority?: number | null;
	url?: string | null;
	organizerName?: string | null;
	organizerEmail?: string | null;
	rrule?: string | null;
	geoLatitude?: number | null;
	geoLongitude?: number | null;
	color?: string | null;
}

interface QRCodeEventButtonProps {
	event: EventData;
	calendarName?: string;
	className?: string;
}

export function QRCodeEventButton({
	event,
	calendarName = "Calendar",
	className,
}: QRCodeEventButtonProps) {
	const [open, setOpen] = useState(false);

	// Generate ICS content for the event
	const { icsContent, isTooLarge } = useMemo(() => {
		const eventInput = {
			uid: event.uid || `${event.id}@appstandard`,
			title: event.title,
			startDate: new Date(event.startDate),
			endDate: new Date(event.endDate),
			description: event.description || undefined,
			location: event.location || undefined,
			status: event.status || undefined,
			priority: event.priority ?? undefined,
			url: event.url || undefined,
			organizerName: event.organizerName || undefined,
			organizerEmail: event.organizerEmail || undefined,
			rrule: event.rrule || undefined,
			geoLatitude: event.geoLatitude ?? undefined,
			geoLongitude: event.geoLongitude ?? undefined,
			color: event.color || undefined,
		};

		const content = generateIcsFile({
			calendarName,
			events: [eventInput],
		});

		return {
			icsContent: content,
			isTooLarge: new Blob([content]).size > MAX_QR_DATA_SIZE,
		};
	}, [event, calendarName]);

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
							Event QR Code
						</DialogTitle>
						<DialogDescription>
							{isTooLarge
								? "This event has too much data for a QR code. Try removing some details or use the calendar share feature instead."
								: "Scan this QR code to add this event to your calendar"}
						</DialogDescription>
					</DialogHeader>

					{isTooLarge ? (
						<div className="py-8 text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
								<QrCode className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-muted-foreground text-sm">
								Event data exceeds QR code capacity.
								<br />
								Use calendar sharing for complex events.
							</p>
						</div>
					) : (
						<QRCodeDisplay
							value={icsContent}
							size={200}
							title={event.title}
							description="Scan to add to calendar"
							downloadFilename={`${event.title.replace(/\s+/g, "-").toLowerCase()}-event`}
							showCopyButton={false}
							showDownloadButton
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
