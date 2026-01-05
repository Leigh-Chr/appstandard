/**
 * Generate ICS file content with VTODO components
 * Based on RFC 5545 specification
 * Complete RFC 5545 VTODO coverage
 */

import type {
	GeneratorOptions,
	ParsedAttachment,
	ParsedRequestStatus,
	TaskInput,
} from "../types";
import {
	escapeIcsText,
	foldLine,
	formatDateToICS,
	generateUID,
} from "../utils/escape";

/**
 * Add a date property if it exists
 */
function addDateProperty(
	lines: string[],
	name: string,
	date: Date | undefined,
): void {
	if (date) {
		lines.push(`${name}:${formatDateToICS(date)}`);
	}
}

/**
 * Add a simple text property if it exists
 */
function addTextProperty(
	lines: string[],
	name: string,
	value: string | undefined,
	fold = false,
): void {
	if (value) {
		const line = `${name}:${escapeIcsText(value)}`;
		lines.push(fold ? foldLine(line) : line);
	}
}

/**
 * Add a raw string property (no escaping) if it exists
 */
function addRawProperty(
	lines: string[],
	name: string,
	value: string | undefined,
): void {
	if (value) {
		lines.push(`${name}:${value}`);
	}
}

/**
 * Add a bounded number property if defined
 */
function addBoundedNumberProperty(
	lines: string[],
	name: string,
	value: number | undefined,
	min: number,
	max: number,
): void {
	if (value !== undefined) {
		lines.push(`${name}:${Math.min(max, Math.max(min, value))}`);
	}
}

/**
 * Add GEO property if both latitude and longitude are defined
 */
function addGeoProperty(
	lines: string[],
	latitude: number | undefined,
	longitude: number | undefined,
): void {
	if (latitude !== undefined && longitude !== undefined) {
		lines.push(`GEO:${latitude};${longitude}`);
	}
}

/**
 * Add ORGANIZER property with optional CN parameter
 */
function addOrganizerProperty(
	lines: string[],
	email: string | undefined,
	name: string | undefined,
): void {
	if (!email) return;
	if (name) {
		lines.push(`ORGANIZER;CN=${escapeIcsText(name)}:mailto:${email}`);
	} else {
		lines.push(`ORGANIZER:mailto:${email}`);
	}
}

/**
 * Add CATEGORIES property if array is non-empty
 */
function addCategoriesProperty(
	lines: string[],
	categories: string[] | undefined,
): void {
	if (categories && categories.length > 0) {
		lines.push(`CATEGORIES:${categories.map(escapeIcsText).join(",")}`);
	}
}

/**
 * Add RESOURCES property if array is non-empty (RFC 5545 Section 3.8.1.10)
 */
function addResourcesProperty(
	lines: string[],
	resources: string[] | undefined,
): void {
	if (resources && resources.length > 0) {
		lines.push(`RESOURCES:${resources.map(escapeIcsText).join(",")}`);
	}
}

/**
 * Add RDATE property for specific recurrence dates
 */
function addRdateProperty(lines: string[], rdate: Date[] | undefined): void {
	if (rdate && rdate.length > 0) {
		const dates = rdate.map((d) => formatDateToICS(d)).join(",");
		lines.push(`RDATE:${dates}`);
	}
}

/**
 * Add EXDATE property for exception dates
 */
function addExdateProperty(lines: string[], exdate: Date[] | undefined): void {
	if (exdate && exdate.length > 0) {
		const dates = exdate.map((d) => formatDateToICS(d)).join(",");
		lines.push(`EXDATE:${dates}`);
	}
}

/**
 * Add ATTACH properties (RFC 5545 Section 3.8.1.1)
 */
function addAttachmentsProperties(
	lines: string[],
	attachments: ParsedAttachment[] | undefined,
): void {
	if (!attachments || attachments.length === 0) return;

	for (const attach of attachments) {
		const parts = ["ATTACH"];

		if (attach.fmttype) {
			parts.push(`FMTTYPE=${attach.fmttype}`);
		}

		if (attach.filename) {
			parts.push(`X-FILENAME=${escapeIcsText(attach.filename)}`);
		}

		if (attach.value) {
			// Binary data (base64 encoded)
			parts.push("ENCODING=BASE64");
			parts.push("VALUE=BINARY");
			lines.push(foldLine(`${parts.join(";")}:${attach.value}`));
		} else if (attach.uri) {
			// URI attachment
			lines.push(foldLine(`${parts.join(";")}:${attach.uri}`));
		}
	}
}

/**
 * Add SEQUENCE property
 */
function addSequenceProperty(
	lines: string[],
	sequence: number | undefined,
): void {
	if (sequence !== undefined && sequence >= 0) {
		lines.push(`SEQUENCE:${sequence}`);
	}
}

/**
 * Add RECURRENCE-ID property
 */
function addRecurrenceIdProperty(
	lines: string[],
	recurrenceId: string | undefined,
): void {
	if (recurrenceId) {
		lines.push(`RECURRENCE-ID:${recurrenceId}`);
	}
}

/**
 * Add RELATED-TO property with optional RELTYPE
 */
function addRelatedToProperty(
	lines: string[],
	relatedTo: string | undefined,
	relationType: string | undefined,
): void {
	if (!relatedTo) return;

	if (relationType) {
		lines.push(`RELATED-TO;RELTYPE=${relationType}:${relatedTo}`);
	} else {
		lines.push(`RELATED-TO:${relatedTo}`);
	}
}

/**
 * Add CLASS property with uppercase value
 */
function addClassProperty(
	lines: string[],
	classValue: string | undefined,
): void {
	if (classValue) {
		lines.push(`CLASS:${classValue.toUpperCase()}`);
	}
}

/**
 * Generate ATTENDEE lines from attendee array
 */
function addAttendeesProperties(
	lines: string[],
	attendees: TaskInput["attendees"],
): void {
	if (!attendees || attendees.length === 0) return;

	for (const attendee of attendees) {
		const parts = ["ATTENDEE"];
		if (attendee.name) parts.push(`CN=${escapeIcsText(attendee.name)}`);
		if (attendee.role) parts.push(`ROLE=${attendee.role}`);
		if (attendee.status) parts.push(`PARTSTAT=${attendee.status}`);
		if (attendee.rsvp) parts.push("RSVP=TRUE");

		const attendeeLine = `${parts.join(";")}:mailto:${attendee.email}`;
		lines.push(foldLine(attendeeLine));
	}
}

/**
 * Generate VALARM components from alarm array
 */
function addAlarmsProperties(
	lines: string[],
	alarms: TaskInput["alarms"],
	summaryFallback: string,
): void {
	if (!alarms || alarms.length === 0) return;

	for (const alarm of alarms) {
		lines.push("BEGIN:VALARM");
		lines.push(`TRIGGER:${alarm.trigger}`);
		lines.push(`ACTION:${alarm.action || "DISPLAY"}`);
		const description = alarm.description || summaryFallback;
		lines.push(foldLine(`DESCRIPTION:${escapeIcsText(description)}`));
		lines.push("END:VALARM");
	}
}

/**
 * Generate REQUEST-STATUS properties (RFC 5545 Section 3.8.8.3)
 * Format: statcode;statdesc[;extdata]
 */
function addRequestStatusProperties(
	lines: string[],
	requestStatus: ParsedRequestStatus[] | undefined,
): void {
	if (!requestStatus || requestStatus.length === 0) return;

	for (const status of requestStatus) {
		let value = `${status.code};${escapeIcsText(status.description)}`;
		if (status.extData) {
			value += `;${escapeIcsText(status.extData)}`;
		}
		lines.push(foldLine(`REQUEST-STATUS:${value}`));
	}
}

/**
 * Generate a single VTODO component
 * Complete RFC 5545 VTODO coverage
 */
function generateVTodo(task: TaskInput): string {
	const lines: string[] = [];
	lines.push("BEGIN:VTODO");

	// ----- Required properties (RFC 5545 Section 3.6.2) -----
	lines.push(`UID:${task.uid || generateUID()}`);
	lines.push(`DTSTAMP:${formatDateToICS(new Date())}`);
	lines.push(foldLine(`SUMMARY:${escapeIcsText(task.summary)}`));

	// ----- Date properties -----
	addDateProperty(lines, "DTSTART", task.dtstart);
	addDateProperty(lines, "DUE", task.due);
	addDateProperty(lines, "COMPLETED", task.completed);
	addDateProperty(lines, "CREATED", task.created);
	addDateProperty(lines, "LAST-MODIFIED", task.lastModified);

	// ----- Status and progress -----
	addRawProperty(lines, "STATUS", task.status);
	addBoundedNumberProperty(
		lines,
		"PERCENT-COMPLETE",
		task.percentComplete,
		0,
		100,
	);
	addBoundedNumberProperty(lines, "PRIORITY", task.priority, 0, 9);

	// ----- Text properties -----
	addTextProperty(lines, "DESCRIPTION", task.description, true);
	addTextProperty(lines, "LOCATION", task.location, true);
	addTextProperty(lines, "COMMENT", task.comment, true);
	addTextProperty(lines, "CONTACT", task.contact, true);
	addRawProperty(lines, "URL", task.url);

	// ----- Classification -----
	addClassProperty(lines, task.class);

	// ----- Geolocation -----
	addGeoProperty(lines, task.geoLatitude, task.geoLongitude);

	// ----- Organizer -----
	addOrganizerProperty(lines, task.organizerEmail, task.organizerName);

	// ----- Recurrence (RFC 5545 Section 3.8.5) -----
	addRawProperty(lines, "RRULE", task.rrule);
	addRdateProperty(lines, task.rdate);
	addExdateProperty(lines, task.exdate);
	addRawProperty(lines, "DURATION", task.duration);
	addRecurrenceIdProperty(lines, task.recurrenceId);

	// ----- Relations -----
	addRelatedToProperty(lines, task.relatedTo, task.relationType);
	addSequenceProperty(lines, task.sequence);

	// ----- Multi-value properties -----
	addCategoriesProperty(lines, task.categories);
	addResourcesProperty(lines, task.resources);
	addAttachmentsProperties(lines, task.attachments);

	// ----- Complex properties -----
	addAttendeesProperties(lines, task.attendees);
	addAlarmsProperties(lines, task.alarms, task.summary);
	addRequestStatusProperties(lines, task.requestStatus);

	// ----- Extensions -----
	addRawProperty(lines, "COLOR", task.color);

	lines.push("END:VTODO");
	return lines.join("\r\n");
}

/**
 * Generate an ICS file containing VTODO components
 * @param tasks - Array of tasks to include
 * @param options - Optional calendar settings
 * @returns ICS file content as string
 */
export function generateTodoFile(
	tasks: TaskInput[],
	options?: GeneratorOptions,
): string {
	const calendarName = options?.calendarName || "AppStandard Tasks";
	const prodId =
		options?.prodId || "-//AppStandard Tasks//AppStandard Tasks//EN";

	const lines: string[] = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		`PRODID:${prodId}`,
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		`X-WR-CALNAME:${escapeIcsText(calendarName)}`,
	];

	for (const task of tasks) {
		lines.push(generateVTodo(task));
	}

	lines.push("END:VCALENDAR");

	return lines.join("\r\n");
}

/**
 * Generate a single VTODO component (without VCALENDAR wrapper)
 * Useful for CalDAV PUT operations
 */
export function generateSingleTodo(task: TaskInput): string {
	return generateVTodo(task);
}
