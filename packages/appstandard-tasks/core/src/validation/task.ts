/**
 * Task validation functions
 */

import { FIELD_LIMITS } from "../constants/field-limits";
import {
	isValidAlarmAction,
	isValidPercentComplete,
	isValidPriority,
	isValidTaskStatus,
} from "../constants/todo-enums";
import type {
	AlarmData,
	AttendeeData,
	ValidationError,
	ValidationResult,
} from "../types/shared";
import type { TaskFormData } from "../types/task";

/**
 * Validate required field
 */
function validateRequired(
	value: string | undefined,
	fieldName: string,
): ValidationError | null {
	if (!value || value.trim().length === 0) {
		return { field: fieldName, message: `${fieldName} is required` };
	}
	return null;
}

/**
 * Validate field length
 */
function validateLength(
	value: string | undefined,
	maxLength: number,
	fieldName: string,
): ValidationError | null {
	if (value && value.length > maxLength) {
		return {
			field: fieldName,
			message: `${fieldName} must be ${maxLength} characters or less`,
		};
	}
	return null;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Validate hex color format
 */
function isValidHexColor(color: string): boolean {
	const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
	return hexRegex.test(color);
}

/**
 * Validate attendee
 */
function validateAttendee(
	attendee: AttendeeData,
	index: number,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!attendee.email || !isValidEmail(attendee.email)) {
		errors.push({
			field: `attendees[${index}].email`,
			message: "Invalid email format",
		});
	}

	if (attendee.name && attendee.name.length > FIELD_LIMITS.NAME) {
		errors.push({
			field: `attendees[${index}].name`,
			message: `Name must be ${FIELD_LIMITS.NAME} characters or less`,
		});
	}

	return errors;
}

/**
 * Validate alarm
 */
function validateAlarm(alarm: AlarmData, index: number): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!alarm.trigger) {
		errors.push({
			field: `alarms[${index}].trigger`,
			message: "Alarm trigger is required",
		});
	}

	if (!alarm.action || !isValidAlarmAction(alarm.action)) {
		errors.push({
			field: `alarms[${index}].action`,
			message: "Invalid alarm action",
		});
	}

	// RFC 5545: DISPLAY alarms require summary
	if (alarm.action === "DISPLAY" && !alarm.summary) {
		errors.push({
			field: `alarms[${index}].summary`,
			message: "DISPLAY alarms require a summary",
		});
	}

	// RFC 5545: EMAIL alarms require summary and description
	if (alarm.action === "EMAIL") {
		if (!alarm.summary) {
			errors.push({
				field: `alarms[${index}].summary`,
				message: "EMAIL alarms require a summary",
			});
		}
		if (!alarm.description) {
			errors.push({
				field: `alarms[${index}].description`,
				message: "EMAIL alarms require a description",
			});
		}
	}

	return errors;
}

/**
 * Validate task form data
 */
export function validateTaskForm(data: TaskFormData): ValidationResult {
	const errors: ValidationError[] = [];

	// Required fields
	const titleError = validateRequired(data.title, "Title");
	if (titleError) errors.push(titleError);

	// Field lengths
	const lengthChecks = [
		{ value: data.title, max: FIELD_LIMITS.TITLE, field: "Title" },
		{
			value: data.description,
			max: FIELD_LIMITS.DESCRIPTION,
			field: "Description",
		},
		{ value: data.location, max: FIELD_LIMITS.LOCATION, field: "Location" },
		{ value: data.url, max: FIELD_LIMITS.URL, field: "URL" },
		{ value: data.uid, max: FIELD_LIMITS.UID, field: "UID" },
		{
			value: data.organizerName,
			max: FIELD_LIMITS.NAME,
			field: "Organizer Name",
		},
		{
			value: data.organizerEmail,
			max: FIELD_LIMITS.EMAIL,
			field: "Organizer Email",
		},
		{ value: data.comment, max: FIELD_LIMITS.COMMENT, field: "Comment" },
		{ value: data.contact, max: FIELD_LIMITS.CONTACT, field: "Contact" },
		{ value: data.rrule, max: FIELD_LIMITS.RRULE, field: "RRULE" },
	];

	for (const check of lengthChecks) {
		const error = validateLength(check.value, check.max, check.field);
		if (error) errors.push(error);
	}

	// Status validation
	if (data.status && !isValidTaskStatus(data.status)) {
		errors.push({ field: "status", message: "Invalid task status" });
	}

	// Priority validation (0-9)
	if (data.priority !== undefined && !isValidPriority(data.priority)) {
		errors.push({
			field: "priority",
			message: "Priority must be between 0 and 9",
		});
	}

	// Percent complete validation (0-100)
	if (
		data.percentComplete !== undefined &&
		!isValidPercentComplete(data.percentComplete)
	) {
		errors.push({
			field: "percentComplete",
			message: "Percent complete must be between 0 and 100",
		});
	}

	// URL validation
	if (data.url?.trim() && !isValidUrl(data.url)) {
		errors.push({ field: "url", message: "Invalid URL format" });
	}

	// Email validation
	if (data.organizerEmail?.trim()) {
		if (!isValidEmail(data.organizerEmail)) {
			errors.push({ field: "organizerEmail", message: "Invalid email format" });
		}
	}

	// Color validation
	if (data.color?.trim() && !isValidHexColor(data.color)) {
		errors.push({
			field: "color",
			message: "Invalid color format (use #RGB or #RRGGBB)",
		});
	}

	// Date validation
	if (data.startDate && data.dueDate) {
		const start = new Date(data.startDate);
		const due = new Date(data.dueDate);
		if (due < start) {
			errors.push({
				field: "dueDate",
				message: "Due date must be after start date",
			});
		}
	}

	// Geo coordinates validation (both or neither)
	const hasLat = data.geoLatitude !== undefined && data.geoLatitude !== null;
	const hasLon = data.geoLongitude !== undefined && data.geoLongitude !== null;
	if (hasLat !== hasLon) {
		errors.push({
			field: "geoLongitude",
			message: "Both latitude and longitude must be provided together",
		});
	}

	// Attendee validation
	if (data.attendees && Array.isArray(data.attendees)) {
		data.attendees.forEach((attendee, index) => {
			errors.push(...validateAttendee(attendee, index));
		});
	}

	// Alarm validation
	if (data.alarms && Array.isArray(data.alarms)) {
		data.alarms.forEach((alarm, index) => {
			errors.push(...validateAlarm(alarm, index));
		});
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Get error for a specific field
 */
export function getFieldError(
	result: ValidationResult,
	field: string,
): string | undefined {
	const error = result.errors.find((e) => e.field === field);
	return error?.message;
}

/**
 * Check if validation result has any errors
 */
export function hasErrors(result: ValidationResult): boolean {
	return !result.valid;
}
