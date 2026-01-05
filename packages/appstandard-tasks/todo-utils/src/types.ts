/**
 * Types for VTODO parsing and generation
 * Based on RFC 5545 Section 3.6.2
 */

/**
 * Task status values per RFC 5545 Section 3.8.1.11
 */
export type TaskStatus =
	| "NEEDS-ACTION"
	| "IN-PROCESS"
	| "COMPLETED"
	| "CANCELLED";

/**
 * Task priority (0-9, where 0=undefined, 1=highest, 5=medium, 9=lowest)
 * RFC 5545 Section 3.8.1.9
 */
export type TaskPriority = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Task class values per RFC 5545 Section 3.8.1.3
 */
export type TaskClass = "PUBLIC" | "PRIVATE" | "CONFIDENTIAL";

/**
 * Relation type values per RFC 5545 Section 3.2.15
 */
export type RelationType = "PARENT" | "CHILD" | "SIBLING";

/**
 * Parsed alarm from VALARM component (RFC 5545 Section 3.6.6)
 */
export interface ParsedAlarm {
	trigger: string; // TRIGGER
	action: string; // ACTION (DISPLAY, EMAIL, AUDIO)
	summary?: string | undefined; // SUMMARY
	description?: string | undefined; // DESCRIPTION
	duration?: string | undefined; // DURATION (for repeat)
	repeat?: number | undefined; // REPEAT
	attachUri?: string | undefined; // ATTACH (for AUDIO action)
}

/**
 * Parsed attendee from ATTENDEE property (RFC 5545 Section 3.8.4.1)
 */
export interface ParsedAttendee {
	name?: string | undefined; // CN parameter
	email: string; // CAL-ADDRESS (mailto:)
	role?: string | undefined; // ROLE parameter
	status?: string | undefined; // PARTSTAT parameter
	rsvp?: boolean | undefined; // RSVP parameter
}

/**
 * Parsed attachment from ATTACH property (RFC 5545 Section 3.8.1.1)
 */
export interface ParsedAttachment {
	uri?: string | undefined; // URI value
	value?: string | undefined; // Inline binary data (base64)
	fmttype?: string | undefined; // FMTTYPE parameter (MIME type)
	filename?: string | undefined; // X-FILENAME parameter
}

/**
 * Parsed request status (RFC 5545 Section 3.8.8.3)
 */
export interface ParsedRequestStatus {
	code: string; // Status code (e.g., "2.0")
	description: string; // Status description
	extData?: string | undefined; // Extended data
}

/**
 * Parsed VTODO component - Complete RFC 5545 coverage
 */
export interface ParsedTask {
	// ----- Required (RFC 5545 Section 3.6.2) -----
	uid?: string | undefined; // UID
	summary: string; // SUMMARY

	// ----- Timestamps -----
	dtstamp?: Date | undefined; // DTSTAMP (required per RFC)
	dtstart?: Date | undefined; // DTSTART
	due?: Date | undefined; // DUE
	completed?: Date | undefined; // COMPLETED
	created?: Date | undefined; // CREATED
	lastModified?: Date | undefined; // LAST-MODIFIED

	// ----- Status and progress -----
	status?: TaskStatus | undefined; // STATUS
	percentComplete?: number | undefined; // PERCENT-COMPLETE (0-100)
	priority?: number | undefined; // PRIORITY (0-9)

	// ----- Content -----
	description?: string | undefined; // DESCRIPTION
	location?: string | undefined; // LOCATION
	url?: string | undefined; // URL
	comment?: string | undefined; // COMMENT
	contact?: string | undefined; // CONTACT

	// ----- Classification -----
	class?: TaskClass | string | undefined; // CLASS

	// ----- Geolocation (RFC 5545 Section 3.8.1.6) -----
	geoLatitude?: number | undefined;
	geoLongitude?: number | undefined;

	// ----- Organizer (RFC 5545 Section 3.8.4.3) -----
	organizerName?: string | undefined;
	organizerEmail?: string | undefined;

	// ----- Recurrence (RFC 5545 Section 3.8.5) -----
	rrule?: string | undefined; // RRULE
	rdate?: Date[] | undefined; // RDATE
	exdate?: Date[] | undefined; // EXDATE
	duration?: string | undefined; // DURATION (alternative to DUE)
	recurrenceId?: string | undefined; // RECURRENCE-ID

	// ----- Relations (RFC 5545 Section 3.8.4.5) -----
	relatedTo?: string | undefined; // RELATED-TO
	relationType?: RelationType | undefined; // RELTYPE parameter
	sequence?: number | undefined; // SEQUENCE

	// ----- Multi-value properties -----
	categories?: string[] | undefined; // CATEGORIES
	resources?: string[] | undefined; // RESOURCES (RFC 5545 Section 3.8.1.10)
	attendees?: ParsedAttendee[] | undefined; // ATTENDEE
	alarms?: ParsedAlarm[] | undefined; // VALARM
	attachments?: ParsedAttachment[] | undefined; // ATTACH (RFC 5545 Section 3.8.1.1)
	requestStatus?: ParsedRequestStatus[] | undefined; // REQUEST-STATUS (RFC 5545 Section 3.8.8.3)

	// ----- Extensions -----
	color?: string | undefined; // COLOR (RFC 7986)
}

/**
 * Input for generating a VTODO - Complete RFC 5545 coverage
 */
export interface TaskInput {
	// ----- Required -----
	summary: string; // SUMMARY

	// ----- Optional UID (will be generated if not provided) -----
	uid?: string | undefined;

	// ----- Dates -----
	dtstart?: Date | undefined; // DTSTART
	due?: Date | undefined; // DUE
	completed?: Date | undefined; // COMPLETED
	created?: Date | undefined; // CREATED
	lastModified?: Date | undefined; // LAST-MODIFIED

	// ----- Status and progress -----
	status?: TaskStatus | undefined; // STATUS
	percentComplete?: number | undefined; // PERCENT-COMPLETE
	priority?: number | undefined; // PRIORITY

	// ----- Content -----
	description?: string | undefined; // DESCRIPTION
	location?: string | undefined; // LOCATION
	url?: string | undefined; // URL
	comment?: string | undefined; // COMMENT
	contact?: string | undefined; // CONTACT

	// ----- Classification -----
	class?: TaskClass | string | undefined; // CLASS

	// ----- Geolocation -----
	geoLatitude?: number | undefined;
	geoLongitude?: number | undefined;

	// ----- Organizer -----
	organizerName?: string | undefined;
	organizerEmail?: string | undefined;

	// ----- Recurrence -----
	rrule?: string | undefined; // RRULE
	rdate?: Date[] | undefined; // RDATE
	exdate?: Date[] | undefined; // EXDATE
	duration?: string | undefined; // DURATION
	recurrenceId?: string | undefined; // RECURRENCE-ID

	// ----- Relations -----
	relatedTo?: string | undefined; // RELATED-TO
	relationType?: RelationType | undefined; // RELTYPE parameter
	sequence?: number | undefined; // SEQUENCE

	// ----- Multi-value properties -----
	categories?: string[] | undefined; // CATEGORIES
	resources?: string[] | undefined; // RESOURCES

	// ----- Attendees -----
	attendees?: ParsedAttendee[] | undefined;

	// ----- Alarms -----
	alarms?:
		| Array<{
				trigger: string;
				action?: string | undefined;
				description?: string | undefined;
				summary?: string | undefined;
				duration?: string | undefined;
				repeat?: number | undefined;
				attachUri?: string | undefined;
		  }>
		| undefined;

	// ----- Attachments -----
	attachments?: ParsedAttachment[] | undefined;

	// ----- Extensions -----
	color?: string | undefined; // COLOR (RFC 7986)
}

/**
 * Result of parsing VTODO file
 */
export interface ParseResult {
	tasks: ParsedTask[];
	errors: string[];
}

/**
 * Options for ICS generation
 */
export interface GeneratorOptions {
	calendarName?: string | undefined;
	prodId?: string | undefined;
}
