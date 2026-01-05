/**
 * Field length limits for AppStandard Tasks validation
 * Shared between frontend and backend
 */
export const FIELD_LIMITS = {
	// Basic info
	TITLE: 255,
	DESCRIPTION: 10000,
	LOCATION: 500,

	// URLs and identifiers
	URL: 2083,
	UID: 255,

	// Organizer and attendee
	NAME: 200,
	EMAIL: 200,

	// Alarm fields
	ALARM_SUMMARY: 255,
	ALARM_DESCRIPTION: 1000,
	ALARM_DURATION: 50,
	ALARM_TRIGGER: 100,

	// Recurrence
	RRULE: 500,
	RECURRENCE_ID: 500,

	// Categories and tags
	CATEGORY: 100,
	TAG: 100,
	CATEGORIES_STRING: 500,

	// Other text fields
	COMMENT: 1000,
	RELATED_TO: 500,

	// Task list
	LIST_NAME: 100,
} as const;
