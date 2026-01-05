/**
 * Parse ICS file content and extract VTODO components
 * Based on RFC 5545 specification
 */

import ical from "ical.js";
import type {
	ParsedAlarm,
	ParsedAttachment,
	ParsedAttendee,
	ParsedRequestStatus,
	ParsedTask,
	ParseResult,
	RelationType,
	TaskStatus,
} from "../types";

/**
 * Extract timestamp-related properties
 */
function extractTimestamps(vtodo: ical.Component) {
	const dtstampProp = vtodo.getFirstPropertyValue("dtstamp");
	const dtstamp =
		dtstampProp instanceof ical.Time ? dtstampProp.toJSDate() : undefined;

	const createdProp = vtodo.getFirstPropertyValue("created");
	const created =
		createdProp instanceof ical.Time ? createdProp.toJSDate() : undefined;

	const lastModifiedProp = vtodo.getFirstPropertyValue("last-modified");
	const lastModified =
		lastModifiedProp instanceof ical.Time
			? lastModifiedProp.toJSDate()
			: undefined;

	const dtstartProp = vtodo.getFirstPropertyValue("dtstart");
	const dtstart =
		dtstartProp instanceof ical.Time ? dtstartProp.toJSDate() : undefined;

	const dueProp = vtodo.getFirstPropertyValue("due");
	const due = dueProp instanceof ical.Time ? dueProp.toJSDate() : undefined;

	const completedProp = vtodo.getFirstPropertyValue("completed");
	const completed =
		completedProp instanceof ical.Time ? completedProp.toJSDate() : undefined;

	return { dtstamp, created, lastModified, dtstart, due, completed };
}

/**
 * Extract basic task metadata
 */
function extractBasicMetadata(vtodo: ical.Component) {
	const summary =
		(vtodo.getFirstPropertyValue("summary") as string) || "Untitled Task";
	const description = vtodo.getFirstPropertyValue("description") as
		| string
		| undefined;
	const location = vtodo.getFirstPropertyValue("location") as
		| string
		| undefined;
	const url = vtodo.getFirstPropertyValue("url") as string | undefined;

	const statusProp = vtodo.getFirstPropertyValue("status");
	const status = statusProp
		? (String(statusProp).toUpperCase() as TaskStatus)
		: undefined;

	const priorityProp = vtodo.getFirstPropertyValue("priority");
	const priority =
		priorityProp !== null && priorityProp !== undefined
			? Number(priorityProp)
			: undefined;

	const percentCompleteProp = vtodo.getFirstPropertyValue("percent-complete");
	const percentComplete =
		percentCompleteProp !== null && percentCompleteProp !== undefined
			? Number(percentCompleteProp)
			: undefined;

	const classProp = vtodo.getFirstPropertyValue("class");
	const classValue = classProp ? String(classProp).toUpperCase() : undefined;

	const comment = vtodo.getFirstPropertyValue("comment") as string | undefined;
	const contact = vtodo.getFirstPropertyValue("contact") as string | undefined;

	const sequenceProp = vtodo.getFirstPropertyValue("sequence");
	const sequence =
		sequenceProp !== null && sequenceProp !== undefined
			? Number(sequenceProp)
			: undefined;

	return {
		summary,
		description,
		location,
		url,
		status,
		priority,
		percentComplete,
		classValue,
		comment,
		contact,
		sequence,
	};
}

/**
 * Extract array-based properties (categories, resources)
 */
function extractArrayProperty(value: unknown): string[] | undefined {
	if (!value) return undefined;

	if (Array.isArray(value)) {
		return value.map((c) => String(c));
	}
	return String(value)
		.split(",")
		.map((c) => c.trim());
}

/**
 * Extract ATTACH properties (RFC 5545 Section 3.8.1.1)
 */
function extractAttachments(vtodo: ical.Component): ParsedAttachment[] {
	const attachProps = vtodo.getAllProperties("attach");
	const attachments: ParsedAttachment[] = [];

	for (const prop of attachProps) {
		const value = prop.getFirstValue();
		if (!value) continue;

		const attachment: ParsedAttachment = {};

		// Check if it's a URI or binary data
		const encoding = prop.getParameter("encoding");
		if (encoding === "BASE64") {
			attachment.value = String(value);
		} else {
			attachment.uri = String(value);
		}

		// Get FMTTYPE (MIME type)
		const fmttype = prop.getParameter("fmttype");
		if (fmttype) {
			attachment.fmttype = String(fmttype);
		}

		// Get X-FILENAME if present
		const filename = prop.getParameter("x-filename");
		if (filename) {
			attachment.filename = String(filename);
		}

		attachments.push(attachment);
	}

	return attachments;
}

/**
 * Extract REQUEST-STATUS properties (RFC 5545 Section 3.8.8.3)
 */
function extractRequestStatus(vtodo: ical.Component): ParsedRequestStatus[] {
	const statusProps = vtodo.getAllProperties("request-status");
	const statuses: ParsedRequestStatus[] = [];

	for (const prop of statusProps) {
		const value = prop.getFirstValue();
		if (!value) continue;

		const parts = String(value).split(";");
		const code = parts[0];
		const description = parts[1];
		if (code && description) {
			statuses.push({
				code,
				description,
				extData: parts[2] || undefined,
			});
		}
	}

	return statuses;
}

/**
 * Extract RELATED-TO with RELTYPE parameter (RFC 5545 Section 3.8.4.5)
 */
function extractRelatedTo(vtodo: ical.Component): {
	relatedTo: string | undefined;
	relationType: RelationType | undefined;
} {
	const prop = vtodo.getFirstProperty("related-to");
	if (!prop) return { relatedTo: undefined, relationType: undefined };

	const value = prop.getFirstValue();
	const reltype = prop.getParameter("reltype");

	return {
		relatedTo: value ? String(value) : undefined,
		relationType: reltype
			? (String(reltype).toUpperCase() as RelationType)
			: undefined,
	};
}

/**
 * Extract RECURRENCE-ID property (RFC 5545 Section 3.8.4.4)
 */
function extractRecurrenceId(vtodo: ical.Component): string | undefined {
	const prop = vtodo.getFirstPropertyValue("recurrence-id");
	if (!prop) return undefined;

	if (prop instanceof ical.Time) {
		return prop.toICALString();
	}
	return String(prop);
}

/**
 * Parse RRULE value from various formats
 */
function parseRRuleValue(rruleValue: unknown): string | undefined {
	if (!rruleValue) return undefined;

	if (rruleValue instanceof ical.Recur) {
		return rruleValue.toString();
	}

	if (typeof rruleValue === "object") {
		try {
			const recur = new ical.Recur(
				rruleValue as unknown as Record<string, string | number>,
			);
			return recur.toString();
		} catch {
			return String(rruleValue);
		}
	}

	return String(rruleValue);
}

/**
 * Extract RRULE from vtodo
 */
function extractRRule(vtodo: ical.Component): string | undefined {
	const rruleProp = vtodo.getFirstProperty("rrule");
	if (!rruleProp) return undefined;

	return parseRRuleValue(rruleProp.getFirstValue());
}

/**
 * Parse a date value that could be ical.Time or an array of ical.Time
 */
function parseDateValue(value: unknown): Date[] {
	if (!value) return [];

	if (value instanceof ical.Time) {
		return [value.toJSDate()];
	}

	if (Array.isArray(value)) {
		return value
			.filter((dt): dt is ical.Time => dt instanceof ical.Time)
			.map((dt) => dt.toJSDate());
	}

	return [];
}

/**
 * Extract a list of dates from a property (RDATE or EXDATE)
 */
function extractDateList(
	vtodo: ical.Component,
	propertyName: string,
): Date[] | undefined {
	const props = vtodo.getAllProperties(propertyName);
	const dates: Date[] = [];

	for (const prop of props) {
		const parsedDates = parseDateValue(prop.getFirstValue());
		dates.push(...parsedDates);
	}

	return dates.length > 0 ? dates : undefined;
}

/**
 * Extract recurrence data (RRULE, RDATE, EXDATE)
 */
function extractRecurrenceData(vtodo: ical.Component) {
	const durationProp = vtodo.getFirstPropertyValue("duration");
	let duration: string | undefined;

	if (durationProp) {
		duration =
			durationProp instanceof ical.Duration
				? durationProp.toString()
				: String(durationProp);
	}

	return {
		rrule: extractRRule(vtodo),
		rdate: extractDateList(vtodo, "rdate"),
		exdate: extractDateList(vtodo, "exdate"),
		duration,
	};
}

/**
 * Extract geolocation data
 */
function extractGeolocation(vtodo: ical.Component) {
	const geoProp = vtodo.getFirstPropertyValue("geo");
	let geoLatitude: number | undefined;
	let geoLongitude: number | undefined;

	if (geoProp) {
		if (typeof geoProp === "object" && "lat" in geoProp && "lon" in geoProp) {
			const geoObject = geoProp as {
				lat: number | string;
				lon: number | string;
			};
			geoLatitude = Number(geoObject.lat);
			geoLongitude = Number(geoObject.lon);
		} else if (typeof geoProp === "string") {
			const parts = geoProp.split(";");
			if (parts.length === 2) {
				geoLatitude = Number(parts[0]);
				geoLongitude = Number(parts[1]);
			}
		}
	}

	return { geoLatitude, geoLongitude };
}

/**
 * Extract organizer information
 */
function extractOrganizer(vtodo: ical.Component) {
	const organizerProp = vtodo.getFirstProperty("organizer");
	let organizerName: string | undefined;
	let organizerEmail: string | undefined;

	if (organizerProp) {
		const organizerValue = organizerProp.getFirstValue();
		if (typeof organizerValue === "string") {
			const match = organizerValue.match(/CN=([^:]+):mailto:(.+)/);
			if (match) {
				organizerName = match[1];
				organizerEmail = match[2];
			} else if (organizerValue.startsWith("mailto:")) {
				organizerEmail = organizerValue.replace("mailto:", "");
			} else {
				organizerEmail = organizerValue;
			}
		}
		const cnParam = organizerProp.getParameter("cn");
		if (cnParam) {
			organizerName = String(cnParam);
		}
	}

	return { organizerName, organizerEmail };
}

/**
 * Parse email and name from attendee value string
 */
function parseAttendeeEmailAndName(value: string): {
	email: string | undefined;
	name: string | undefined;
} {
	const match = value.match(/CN=([^:]+):mailto:(.+)/);
	if (match?.[2]) {
		return { name: match[1], email: match[2] };
	}

	if (value.startsWith("mailto:")) {
		return { email: value.replace("mailto:", ""), name: undefined };
	}

	return { email: value, name: undefined };
}

/**
 * Parse RSVP parameter value
 */
function parseRsvpParam(rsvpParam: unknown): boolean {
	if (rsvpParam === null || rsvpParam === undefined) return false;
	if (typeof rsvpParam === "boolean") return rsvpParam;
	if (typeof rsvpParam === "string") return rsvpParam.toUpperCase() === "TRUE";
	return false;
}

/**
 * Parse a single attendee property
 */
function parseAttendeeProp(attendeeProp: ical.Property): ParsedAttendee | null {
	const attendeeValue = attendeeProp.getFirstValue();
	if (typeof attendeeValue !== "string") return null;

	const { email, name: parsedName } = parseAttendeeEmailAndName(attendeeValue);
	if (!email) return null;

	const cnParam = attendeeProp.getParameter("cn");
	const name = parsedName ?? (cnParam ? String(cnParam) : undefined);

	const roleParam = attendeeProp.getParameter("role");
	const role = roleParam ? String(roleParam) : undefined;

	const partstatParam = attendeeProp.getParameter("partstat");
	const status = partstatParam ? String(partstatParam) : undefined;

	const rsvp = parseRsvpParam(attendeeProp.getParameter("rsvp"));

	return { name, email, role, status, rsvp };
}

/**
 * Extract attendees
 */
function extractAttendees(
	vtodo: ical.Component,
	summary: string,
	errors: string[],
): ParsedAttendee[] {
	const attendeeProps = vtodo.getAllProperties("attendee");
	const attendees: ParsedAttendee[] = [];

	for (const attendeeProp of attendeeProps) {
		try {
			const attendee = parseAttendeeProp(attendeeProp);
			if (attendee) {
				attendees.push(attendee);
			}
		} catch (err) {
			errors.push(
				`Failed to parse attendee in task "${summary}": ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	return attendees;
}

/**
 * Parse alarm trigger value from various formats
 */
function parseAlarmTrigger(triggerValue: unknown): string {
	if (triggerValue instanceof ical.Duration) {
		return triggerValue.toString();
	}
	if (typeof triggerValue === "string") {
		return triggerValue;
	}
	if (triggerValue instanceof ical.Time) {
		return triggerValue.toICALString();
	}
	return "";
}

/**
 * Parse duration value from various formats
 */
function parseDurationValue(durationProp: unknown): string | undefined {
	if (!durationProp) return undefined;
	return durationProp instanceof ical.Duration
		? durationProp.toString()
		: String(durationProp);
}

/**
 * Parse a single alarm component
 */
function parseAlarmComponent(alarmComp: ical.Component): ParsedAlarm | null {
	const triggerProp = alarmComp.getFirstProperty("trigger");
	const actionProp = alarmComp.getFirstPropertyValue("action");

	if (!triggerProp || !actionProp) return null;

	const trigger = parseAlarmTrigger(triggerProp.getFirstValue());
	if (!trigger) return null;

	const repeatProp = alarmComp.getFirstPropertyValue("repeat");

	return {
		trigger,
		action: String(actionProp),
		summary: alarmComp.getFirstPropertyValue("summary") as string | undefined,
		description: alarmComp.getFirstPropertyValue("description") as
			| string
			| undefined,
		duration: parseDurationValue(alarmComp.getFirstPropertyValue("duration")),
		repeat:
			repeatProp !== null && repeatProp !== undefined
				? Number(repeatProp)
				: undefined,
	};
}

/**
 * Extract alarms (VALARM)
 */
function extractAlarms(
	vtodo: ical.Component,
	summary: string,
	errors: string[],
): ParsedAlarm[] {
	const alarmComponents = vtodo.getAllSubcomponents("valarm");
	const alarms: ParsedAlarm[] = [];

	for (const alarmComp of alarmComponents) {
		try {
			const alarm = parseAlarmComponent(alarmComp);
			if (alarm) {
				alarms.push(alarm);
			}
		} catch (err) {
			errors.push(
				`Failed to parse alarm in task "${summary}": ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	return alarms;
}

/**
 * Build a ParsedTask from all extracted properties
 * Complete RFC 5545 VTODO coverage
 */
function buildParsedTask(
	uid: string | undefined,
	timestamps: ReturnType<typeof extractTimestamps>,
	metadata: ReturnType<typeof extractBasicMetadata>,
	recurrence: ReturnType<typeof extractRecurrenceData>,
	geo: ReturnType<typeof extractGeolocation>,
	organizer: ReturnType<typeof extractOrganizer>,
	categories: string[] | undefined,
	resources: string[] | undefined,
	relatedTo: ReturnType<typeof extractRelatedTo>,
	recurrenceId: string | undefined,
	attendees: ParsedAttendee[],
	alarms: ParsedAlarm[],
	attachments: ParsedAttachment[],
	requestStatus: ParsedRequestStatus[],
): ParsedTask {
	return {
		// Required
		uid,
		summary: metadata.summary,

		// Timestamps
		dtstamp: timestamps.dtstamp,
		dtstart: timestamps.dtstart,
		due: timestamps.due,
		completed: timestamps.completed,
		created: timestamps.created,
		lastModified: timestamps.lastModified,

		// Status and progress
		status: metadata.status,
		percentComplete: metadata.percentComplete,
		priority: metadata.priority,

		// Content
		description: metadata.description,
		location: metadata.location,
		url: metadata.url,
		comment: metadata.comment,
		contact: metadata.contact,

		// Classification
		class: metadata.classValue,

		// Geolocation
		geoLatitude: geo.geoLatitude,
		geoLongitude: geo.geoLongitude,

		// Organizer
		organizerName: organizer.organizerName,
		organizerEmail: organizer.organizerEmail,

		// Recurrence
		rrule: recurrence.rrule,
		rdate: recurrence.rdate,
		exdate: recurrence.exdate,
		duration: recurrence.duration,
		recurrenceId,

		// Relations
		relatedTo: relatedTo.relatedTo,
		relationType: relatedTo.relationType,
		sequence: metadata.sequence,

		// Multi-value properties
		categories,
		resources,
		attendees: attendees.length > 0 ? attendees : undefined,
		alarms: alarms.length > 0 ? alarms : undefined,
		attachments: attachments.length > 0 ? attachments : undefined,
		requestStatus: requestStatus.length > 0 ? requestStatus : undefined,
	};
}

/**
 * Parse a single vtodo component into a ParsedTask
 * Complete RFC 5545 VTODO coverage
 */
function parseVTodo(
	vtodo: ical.Component,
	errors: string[],
): ParsedTask | null {
	const uid = vtodo.getFirstPropertyValue("uid") as string | undefined;
	const metadata = extractBasicMetadata(vtodo);

	// Extract multi-value properties
	const categories = extractArrayProperty(
		vtodo.getFirstPropertyValue("categories"),
	);
	const resources = extractArrayProperty(
		vtodo.getFirstPropertyValue("resources"),
	);

	// Extract relation and recurrence properties
	const relatedTo = extractRelatedTo(vtodo);
	const recurrenceId = extractRecurrenceId(vtodo);

	// Extract complex properties
	const attachments = extractAttachments(vtodo);
	const requestStatus = extractRequestStatus(vtodo);

	return buildParsedTask(
		uid,
		extractTimestamps(vtodo),
		metadata,
		extractRecurrenceData(vtodo),
		extractGeolocation(vtodo),
		extractOrganizer(vtodo),
		categories,
		resources,
		relatedTo,
		recurrenceId,
		extractAttendees(vtodo, metadata.summary, errors),
		extractAlarms(vtodo, metadata.summary, errors),
		attachments,
		requestStatus,
	);
}

/**
 * Parse an ICS file content and extract VTODO components
 * @param fileContent - Raw ICS file content
 * @returns Parsed tasks and any parsing errors
 */
export function parseTodoFile(fileContent: string): ParseResult {
	const tasks: ParsedTask[] = [];
	const errors: string[] = [];

	try {
		const jcalData = ical.parse(fileContent);
		const comp = new ical.Component(jcalData);
		const vtodos = comp.getAllSubcomponents("vtodo");

		for (const vtodo of vtodos) {
			try {
				const parsedTask = parseVTodo(vtodo, errors);
				if (parsedTask) {
					tasks.push(parsedTask);
				}
			} catch (error) {
				errors.push(
					`Failed to parse task: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}

		if (vtodos.length === 0) {
			errors.push("No tasks found in the ICS file.");
		}
	} catch (error) {
		errors.push(
			`Failed to parse ICS file: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	return { tasks, errors };
}
