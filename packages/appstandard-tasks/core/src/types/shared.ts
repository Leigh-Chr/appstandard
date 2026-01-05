/**
 * Shared types used across AppStandard Tasks
 * Based on RFC 5545 VTODO component specifications
 */

/**
 * Attendee data structure (RFC 5545 Section 3.8.4.1)
 */
export interface AttendeeData {
	name?: string | null;
	email: string;
	role?: string | null; // CHAIR, REQ-PARTICIPANT, OPT-PARTICIPANT, NON-PARTICIPANT
	status?: string | null; // NEEDS-ACTION, ACCEPTED, DECLINED, TENTATIVE, DELEGATED, COMPLETED, IN-PROCESS
	rsvp?: boolean;
}

/**
 * Alarm data structure (RFC 5545 Section 3.6.6)
 */
export interface AlarmData {
	trigger: string; // TRIGGER - duration or absolute time
	action: string; // ACTION - DISPLAY, EMAIL, AUDIO
	summary?: string | null; // SUMMARY - for EMAIL action
	description?: string | null; // DESCRIPTION - for EMAIL/DISPLAY action
	duration?: string | null; // DURATION - for repeating alarms
	repeat?: number | null; // REPEAT - number of repetitions
	attachUri?: string | null; // ATTACH - URI for AUDIO action
}

/**
 * Attachment data structure (RFC 5545 Section 3.8.1.1)
 * Can be either a URI or inline binary data
 */
export interface AttachmentData {
	uri?: string | null; // URI to the attachment
	value?: string | null; // Inline binary data (base64 encoded)
	fmttype?: string | null; // FMTTYPE parameter (MIME type)
	filename?: string | null; // X-FILENAME parameter (optional)
}

/**
 * Request status data structure (RFC 5545 Section 3.8.8.3)
 * Format: statcode ";" statdesc [";" extdata]
 */
export interface RequestStatusData {
	code: string; // Status code (e.g., "2.0", "3.1")
	description: string; // Status description
	extData?: string | null; // Extended data
}

/**
 * Validation result
 */
export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
	field: string;
	message: string;
}
