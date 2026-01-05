/**
 * Task entity and form data types
 * Based on RFC 5545 VTODO component
 * All properties per RFC 5545 Section 3.6.2
 */

import type { TaskClassValue, TaskStatusValue } from "../constants/todo-enums";
import type {
	AlarmData,
	AttachmentData,
	AttendeeData,
	RequestStatusData,
} from "./shared";

/**
 * Task entity - Database representation
 * Complete RFC 5545 VTODO property coverage
 */
export interface TaskEntity {
	id: string;
	taskListId: string;

	// ----- Core properties -----
	title: string; // SUMMARY (required)
	description?: string | null; // DESCRIPTION
	status: TaskStatusValue; // STATUS
	priority?: number | null; // PRIORITY (0-9)
	percentComplete?: number | null; // PERCENT-COMPLETE (0-100)

	// ----- Dates (RFC 5545 Section 3.8.2) -----
	startDate?: Date | null; // DTSTART
	dueDate?: Date | null; // DUE
	completedAt?: Date | null; // COMPLETED
	duration?: string | null; // DURATION (alternative to DUE)

	// ----- Location (RFC 5545 Section 3.8.1.7, 3.8.1.6) -----
	location?: string | null; // LOCATION
	geoLatitude?: number | null; // GEO latitude
	geoLongitude?: number | null; // GEO longitude

	// ----- Organizer (RFC 5545 Section 3.8.4.3) -----
	organizerName?: string | null;
	organizerEmail?: string | null;

	// ----- RFC 5545 Metadata -----
	uid?: string | null; // UID (required per RFC)
	dtstamp?: Date | null; // DTSTAMP (required per RFC)
	created?: Date | null; // CREATED
	lastModified?: Date | null; // LAST-MODIFIED
	sequence: number; // SEQUENCE
	class?: TaskClassValue | null; // CLASS
	url?: string | null; // URL

	// ----- Recurrence (RFC 5545 Section 3.8.5) -----
	rrule?: string | null; // RRULE
	recurrenceId?: string | null; // RECURRENCE-ID

	// ----- Relations (RFC 5545 Section 3.8.4.5) -----
	relatedTo?: string | null; // RELATED-TO (parent task UID)

	// ----- Text properties (RFC 5545 Section 3.8.1) -----
	comment?: string | null; // COMMENT
	contact?: string | null; // CONTACT

	// ----- Multi-value properties -----
	attendees?: AttendeeData[]; // ATTENDEE
	alarms?: AlarmData[]; // VALARM
	categories?: string[]; // CATEGORIES
	resources?: string[]; // RESOURCES (RFC 5545 Section 3.8.1.10)
	attachments?: AttachmentData[]; // ATTACH (RFC 5545 Section 3.8.1.1)
	requestStatus?: RequestStatusData[]; // REQUEST-STATUS (RFC 5545 Section 3.8.8.3)

	// ----- Extensions -----
	color?: string | null; // COLOR (RFC 7986)

	// ----- Database timestamps -----
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Task form data - For UI forms (string dates)
 * Complete RFC 5545 VTODO property coverage
 */
export interface TaskFormData {
	// ----- Required -----
	title: string; // SUMMARY

	// ----- Core metadata -----
	description?: string | undefined; // DESCRIPTION
	status?: string | undefined; // STATUS
	priority?: number | undefined; // PRIORITY (0-9)
	percentComplete?: number | undefined; // PERCENT-COMPLETE (0-100)

	// ----- Dates (string format for forms) -----
	startDate?: string | undefined; // DTSTART
	dueDate?: string | undefined; // DUE
	duration?: string | undefined; // DURATION (alternative to DUE)

	// ----- Location -----
	location?: string | undefined; // LOCATION
	geoLatitude?: number | undefined; // GEO latitude
	geoLongitude?: number | undefined; // GEO longitude

	// ----- Organizer -----
	organizerName?: string | undefined;
	organizerEmail?: string | undefined;

	// ----- RFC 5545 Metadata -----
	uid?: string | undefined; // UID
	class?: string | undefined; // CLASS
	url?: string | undefined; // URL
	sequence?: number | undefined; // SEQUENCE

	// ----- Recurrence -----
	rrule?: string | undefined; // RRULE
	rdate?: string | undefined; // RDATE (JSON array)
	exdate?: string | undefined; // EXDATE (JSON array)
	recurrenceId?: string | undefined; // RECURRENCE-ID

	// ----- Relations -----
	relatedTo?: string | undefined; // RELATED-TO

	// ----- Text properties -----
	comment?: string | undefined; // COMMENT
	contact?: string | undefined; // CONTACT

	// ----- Multi-value (string format) -----
	categories?: string | undefined; // CATEGORIES (comma-separated)
	resources?: string | undefined; // RESOURCES (comma-separated)

	// ----- Extensions -----
	color?: string | undefined; // COLOR (RFC 7986)

	// ----- Complex relations -----
	attendees?: AttendeeData[] | undefined; // ATTENDEE
	alarms?: AlarmData[] | undefined; // VALARM
	attachments?: AttachmentData[] | undefined; // ATTACH
}

/**
 * Task summary - Lightweight task info
 */
export interface TaskSummary {
	id: string;
	title: string;
	status: TaskStatusValue;
	priority?: number | null;
	percentComplete?: number | null;
	dueDate?: Date | null;
	taskListId: string;
}
