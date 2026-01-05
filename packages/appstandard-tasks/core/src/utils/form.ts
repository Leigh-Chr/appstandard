/**
 * Form utility functions for AppStandard Tasks
 */

import { isValidAlarmAction, isValidTaskStatus } from "../constants/todo-enums";
import type { AlarmData, AttendeeData } from "../types/shared";
import type { TaskFormData } from "../types/task";

/**
 * Initialize task form data with defaults
 */
export function initializeFormData(
	initialData?: Partial<TaskFormData>,
): TaskFormData {
	return {
		title: "",
		description: "",
		status: "NEEDS-ACTION",
		priority: undefined,
		percentComplete: undefined,
		startDate: "",
		dueDate: "",
		location: "",
		geoLatitude: undefined,
		geoLongitude: undefined,
		organizerName: "",
		organizerEmail: "",
		uid: "",
		class: "PRIVATE",
		url: "",
		rrule: "",
		rdate: "",
		exdate: "",
		recurrenceId: "",
		relatedTo: "",
		comment: "",
		contact: "",
		sequence: 0,
		color: "",
		categories: "",
		attendees: [],
		alarms: [],
		...initialData,
	};
}

/**
 * Transform optional string field - returns trimmed value or null
 */
function transformStringField(value: string | undefined): string | null {
	return value?.trim() || null;
}

/**
 * Transform optional number field - returns value or null
 */
function transformNumberField(value: number | undefined | null): number | null {
	return value !== undefined && value !== null ? value : null;
}

/**
 * Transform date field - returns Date object or undefined
 */
function transformDateField(value: string | undefined): Date | undefined {
	return value ? new Date(value) : undefined;
}

/**
 * Transform categories string to array
 */
function transformCategories(categories: string | undefined): string[] {
	if (!categories?.trim()) return [];
	return categories
		.split(",")
		.map((c) => c.trim())
		.filter((c) => c.length > 0);
}

/**
 * Transform attendees array
 */
function transformAttendees(
	attendees: AttendeeData[] | undefined,
): AttendeeData[] | undefined {
	if (!attendees || !Array.isArray(attendees)) return undefined;
	return attendees.map((a) => ({
		name: a.name || null,
		email: a.email,
		role: a.role || null,
		status: a.status || null,
		rsvp: a.rsvp ?? false,
	}));
}

/**
 * Transform alarms array
 */
function transformAlarms(alarms: AlarmData[] | undefined): AlarmData[] {
	if (!alarms || !Array.isArray(alarms)) return [];
	return alarms
		.filter((a) => a.trigger && a.action)
		.map((a) => ({
			trigger: a.trigger,
			action: isValidAlarmAction(a.action) ? a.action : "DISPLAY",
			summary: a.summary || null,
			description: a.description || null,
			duration: a.duration || null,
			repeat: a.repeat ?? null,
		}));
}

/**
 * Transform task form data to API format
 */
export function transformTaskFormData(
	data: TaskFormData,
	taskListId?: string,
): Record<string, unknown> {
	const transformed: Record<string, unknown> = {
		title: data.title.trim(),
	};

	if (taskListId) {
		transformed["taskListId"] = taskListId;
	}

	// Dates
	const startDate = transformDateField(data.startDate);
	const dueDate = transformDateField(data.dueDate);
	if (startDate) transformed["startDate"] = startDate;
	if (dueDate) transformed["dueDate"] = dueDate;

	// Status
	if (data.status && isValidTaskStatus(data.status)) {
		transformed["status"] = data.status;
	}

	// String fields
	const stringFields = [
		"description",
		"location",
		"organizerName",
		"organizerEmail",
		"uid",
		"class",
		"url",
		"rrule",
		"recurrenceId",
		"relatedTo",
		"comment",
		"contact",
		"color",
	] as const;

	for (const field of stringFields) {
		transformed[field] = transformStringField(data[field]);
	}

	// Number fields
	transformed["priority"] = transformNumberField(data["priority"]);
	transformed["percentComplete"] = transformNumberField(
		data["percentComplete"],
	);
	if (data["sequence"] !== undefined) {
		transformed["sequence"] = data["sequence"];
	}

	// Geo coordinates (both or neither)
	const hasGeo =
		data["geoLatitude"] !== undefined && data["geoLongitude"] !== undefined;
	transformed["geoLatitude"] = hasGeo ? data["geoLatitude"] : null;
	transformed["geoLongitude"] = hasGeo ? data["geoLongitude"] : null;

	// Categories
	transformed["categories"] = transformCategories(data["categories"]);

	// Attendees
	const attendees = transformAttendees(data["attendees"]);
	if (attendees) transformed["attendees"] = attendees;

	// Alarms
	transformed["alarms"] = transformAlarms(data["alarms"]);

	return transformed;
}
