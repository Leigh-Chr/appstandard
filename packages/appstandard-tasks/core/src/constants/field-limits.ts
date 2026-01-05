/**
 * Field length limits for AppStandard Tasks
 * Based on RFC 5545 VTODO component
 * Used in validation schemas
 */

export const FIELD_LIMITS = {
	// ----- Basic info -----
	TITLE: 255, // SUMMARY
	LOCATION: 500, // LOCATION
	DESCRIPTION: 10000, // DESCRIPTION

	// ----- URLs and identifiers -----
	URL: 2083, // URL (maximum URL length)
	UID: 255, // UID

	// ----- Organizer and attendee -----
	NAME: 200, // CN parameter
	EMAIL: 200, // MAILTO value (RFC 5321 max is 254)

	// ----- Alarm fields (VALARM) -----
	ALARM_SUMMARY: 255,
	ALARM_DESCRIPTION: 1000,
	ALARM_DURATION: 50,
	ALARM_TRIGGER: 100,
	ALARM_ATTACH: 2083, // ATTACH URI in VALARM

	// ----- Recurrence -----
	RRULE: 500, // RRULE
	DURATION: 50, // DURATION (e.g., "PT1H30M")

	// ----- Categories and resources (RFC 5545 Section 3.8.1.2, 3.8.1.10) -----
	CATEGORY: 100, // Single category
	TAG: 100, // Alias for CATEGORY
	CATEGORIES_STRING: 500, // Comma-separated CATEGORIES
	RESOURCE: 100, // Single resource
	RESOURCES_STRING: 500, // Comma-separated RESOURCES

	// ----- Other text fields -----
	COMMENT: 1000, // COMMENT
	CONTACT: 500, // CONTACT
	RECURRENCE_ID: 500, // RECURRENCE-ID
	RELATED_TO: 500, // RELATED-TO

	// ----- Attachments (RFC 5545 Section 3.8.1.1) -----
	ATTACH_URI: 2083, // ATTACH as URI
	ATTACH_FILENAME: 255, // X-FILENAME parameter

	// ----- Request Status (RFC 5545 Section 3.8.8.3) -----
	REQUEST_STATUS: 1000, // REQUEST-STATUS (statcode;statdesc;extdata)

	// ----- Extensions -----
	COLOR: 7, // #RRGGBB (RFC 7986)
} as const;

export type FieldLimitKey = keyof typeof FIELD_LIMITS;
