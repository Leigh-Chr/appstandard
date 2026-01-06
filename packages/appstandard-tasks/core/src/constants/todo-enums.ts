/**
 * VTODO enumeration constants and validators
 * Based on RFC 5545 specifications
 */

// ----- Task Status (RFC 5545 Section 3.8.1.11) -----

export const TASK_STATUS_VALUES = [
	"NEEDS_ACTION", // NEEDS-ACTION in RFC 5545
	"IN_PROCESS", // IN-PROCESS in RFC 5545
	"COMPLETED",
	"CANCELLED",
] as const;
export type TaskStatusValue = (typeof TASK_STATUS_VALUES)[number];

export function isValidTaskStatus(value: string): value is TaskStatusValue {
	return TASK_STATUS_VALUES.includes(value.toUpperCase() as TaskStatusValue);
}

// ----- Task Class (RFC 5545 Section 3.8.1.3) -----

export const TASK_CLASS_VALUES = ["PUBLIC", "PRIVATE", "CONFIDENTIAL"] as const;
export type TaskClassValue = (typeof TASK_CLASS_VALUES)[number];

export function isValidTaskClass(value: string): value is TaskClassValue {
	return TASK_CLASS_VALUES.includes(value.toUpperCase() as TaskClassValue);
}

// ----- Attendee Role (RFC 5545 Section 3.2.16) -----

export const ATTENDEE_ROLE_VALUES = [
	"CHAIR",
	"REQ_PARTICIPANT", // REQ-PARTICIPANT in RFC 5545
	"OPT_PARTICIPANT", // OPT-PARTICIPANT in RFC 5545
	"NON_PARTICIPANT", // NON-PARTICIPANT in RFC 5545
] as const;
export type AttendeeRoleValue = (typeof ATTENDEE_ROLE_VALUES)[number];

export function isValidAttendeeRole(value: string): value is AttendeeRoleValue {
	return ATTENDEE_ROLE_VALUES.includes(
		value.toUpperCase() as AttendeeRoleValue,
	);
}

// ----- Attendee Status (RFC 5545 Section 3.2.12 - VTODO specific) -----

export const ATTENDEE_STATUS_VALUES = [
	"NEEDS_ACTION", // NEEDS-ACTION in RFC 5545
	"ACCEPTED",
	"DECLINED",
	"TENTATIVE",
	"DELEGATED",
	"COMPLETED", // VTODO specific
	"IN_PROCESS", // IN-PROCESS in RFC 5545 (VTODO specific)
] as const;
export type AttendeeStatusValue = (typeof ATTENDEE_STATUS_VALUES)[number];

export function isValidAttendeeStatus(
	value: string,
): value is AttendeeStatusValue {
	return ATTENDEE_STATUS_VALUES.includes(
		value.toUpperCase() as AttendeeStatusValue,
	);
}

// ----- Alarm Action (RFC 5545 Section 3.8.6.1) -----

export const ALARM_ACTION_VALUES = ["DISPLAY", "EMAIL", "AUDIO"] as const;
export type AlarmActionValue = (typeof ALARM_ACTION_VALUES)[number];

export function isValidAlarmAction(value: string): value is AlarmActionValue {
	return ALARM_ACTION_VALUES.includes(value.toUpperCase() as AlarmActionValue);
}

// ----- Priority (RFC 5545 Section 3.8.1.9) -----

export const PRIORITY_VALUES = {
	UNDEFINED: 0,
	HIGH: 1,
	MEDIUM: 5,
	LOW: 9,
} as const;

export function isValidPriority(value: number): boolean {
	return Number.isInteger(value) && value >= 0 && value <= 9;
}

// ----- Percent Complete (RFC 5545 Section 3.8.1.8) -----

export function isValidPercentComplete(value: number): boolean {
	return Number.isInteger(value) && value >= 0 && value <= 100;
}

// ----- Request Status (RFC 5545 Section 3.8.8.3) -----
// Format: statcode ";" statdesc [";" extdata]
// Example: "2.0;Success" or "3.1;Invalid property value;DTSTART:96-Apr-01"

export const REQUEST_STATUS_CODES = {
	// 1.x - Preliminary success
	PENDING: "1.0",
	// 2.x - Successful
	SUCCESS: "2.0",
	SUCCESS_FALLBACK: "2.1", // Request accepted with fallback
	SUCCESS_IGNORED: "2.2", // Request accepted, child ignored
	// 3.x - Client Error
	INVALID_PROP_NAME: "3.0",
	INVALID_PROP_VALUE: "3.1",
	INVALID_PARAM: "3.2",
	INVALID_PARAM_VALUE: "3.3",
	INVALID_CALENDAR_USER: "3.4",
	INVALID_DATE_TIME: "3.5",
	INVALID_RULE: "3.6",
	INVALID_CU_TYPE: "3.7",
	NO_AUTHORITY: "3.8",
	UNSUPPORTED_VERSION: "3.9",
	TRANSP_NOT_SUPPORTED: "3.10",
	INVALID_CALENDAR: "3.11",
	UNKNOWN_CALENDAR_USER: "3.12",
	// 4.x - Scheduling Error
	EVENT_CONFLICT: "4.0",
	// 5.x - Request Error
	REQUEST_NOT_SUPPORTED: "5.0",
	SERVICE_UNAVAILABLE: "5.1",
	INVALID_SERVICE: "5.2",
	NO_SCHEDULING_FOR_USER: "5.3",
} as const;

export type RequestStatusCode =
	(typeof REQUEST_STATUS_CODES)[keyof typeof REQUEST_STATUS_CODES];

export function isValidRequestStatusCode(value: string): boolean {
	const parts = value.split(";");
	if (parts.length < 2) return false;
	const code = parts[0] ?? "";
	// Valid codes are X.Y format where X is 1-5
	return /^[1-5]\.\d+$/.test(code);
}

// ----- Relation Type (RFC 5545 Section 3.2.15) -----

export const RELATION_TYPE_VALUES = ["PARENT", "CHILD", "SIBLING"] as const;
export type RelationTypeValue = (typeof RELATION_TYPE_VALUES)[number];

export function isValidRelationType(value: string): value is RelationTypeValue {
	return RELATION_TYPE_VALUES.includes(
		value.toUpperCase() as RelationTypeValue,
	);
}
