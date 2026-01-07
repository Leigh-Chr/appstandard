import { z } from "zod";
import {
	colorSchema,
	emailSchema,
	nullableEmailSchema,
	nullableTrimmedStringSchema,
	optionalCoercedDateSchema,
	optionalDateStringSchema,
	urlSchema,
} from "./common-schemas";
import { FIELD_LIMITS } from "./field-limits";

/**
 * Task status values (RFC 5545 VTODO)
 */
const taskStatusSchema = z.enum([
	"NEEDS_ACTION",
	"IN_PROCESS",
	"COMPLETED",
	"CANCELLED",
]);

/**
 * Task class values (RFC 5545)
 */
const taskClassSchema = z.enum(["PUBLIC", "PRIVATE", "CONFIDENTIAL"]);

/**
 * Attendee schema with RFC 5545 validation
 */
const attendeeSchema = z.object({
	name: nullableTrimmedStringSchema(FIELD_LIMITS.NAME),
	email: emailSchema,
	role: z
		.enum(["CHAIR", "REQ_PARTICIPANT", "OPT_PARTICIPANT", "NON_PARTICIPANT"])
		.optional()
		.nullable(),
	status: z
		.enum(["NEEDS_ACTION", "ACCEPTED", "DECLINED", "TENTATIVE", "DELEGATED"])
		.optional()
		.nullable(),
	rsvp: z.boolean().optional().default(false),
});

/**
 * Alarm schema with RFC 5545 validation
 */
const alarmSchema = z
	.object({
		trigger: z
			.string()
			.trim()
			.min(1, "Trigger is required")
			.max(FIELD_LIMITS.ALARM_TRIGGER)
			.transform((val) => val.trim()),
		action: z.enum(["DISPLAY", "EMAIL", "AUDIO"]),
		summary: nullableTrimmedStringSchema(FIELD_LIMITS.ALARM_SUMMARY),
		description: nullableTrimmedStringSchema(FIELD_LIMITS.ALARM_DESCRIPTION),
		duration: nullableTrimmedStringSchema(FIELD_LIMITS.ALARM_DURATION),
		repeat: z.number().int().min(0).max(1000).optional().nullable(),
	})
	.refine(
		(data) => {
			if (data.action === "DISPLAY") {
				return data.summary && data.summary.trim().length > 0;
			}
			return true;
		},
		{
			message: "DISPLAY alarms require a summary",
			path: ["summary"],
		},
	)
	.refine(
		(data) => {
			if (data.action === "EMAIL") {
				return (
					data.description &&
					data.description.trim().length > 0 &&
					data.summary &&
					data.summary.trim().length > 0
				);
			}
			return true;
		},
		{
			message: "EMAIL alarms require both summary and description",
			path: ["description"],
		},
	);

/**
 * Validate RRULE structure
 */
function validateRRULE(val: string): boolean {
	if (!val || val.trim() === "") return true;

	const parts = val.split(";");

	if (!parts.some((p) => p.trim().startsWith("FREQ="))) {
		return false;
	}

	const validFreq = [
		"SECONDLY",
		"MINUTELY",
		"HOURLY",
		"DAILY",
		"WEEKLY",
		"MONTHLY",
		"YEARLY",
	];
	const freqPart = parts.find((p) => p.trim().startsWith("FREQ="));
	if (freqPart) {
		const freqValue = freqPart.split("=")[1]?.trim();
		if (!validFreq.includes(freqValue || "")) return false;
	}

	// UNTIL and COUNT are mutually exclusive
	const hasUntil = parts.some((p) => p.trim().startsWith("UNTIL="));
	const hasCount = parts.some((p) => p.trim().startsWith("COUNT="));
	if (hasUntil && hasCount) return false;

	return true;
}

/**
 * RRULE schema
 */
const rruleSchema = z
	.string()
	.max(FIELD_LIMITS.RRULE)
	.refine(validateRRULE, {
		message: "Invalid RRULE format",
	})
	.optional()
	.nullable();

/**
 * UID schema
 */
const uidSchema = z
	.string()
	.trim()
	.max(FIELD_LIMITS.UID)
	.refine(
		(val) => {
			if (!val || val.trim() === "") return true;
			return !/\s/.test(val.trim());
		},
		{ message: "UID cannot contain spaces" },
	)
	.transform((val) => (val === "" ? null : val?.trim()))
	.nullable()
	.optional();

/**
 * Geographic coordinates schema
 */
export const geoCoordinatesSchema = z
	.object({
		geoLatitude: z.number().min(-90).max(90).optional().nullable(),
		geoLongitude: z.number().min(-180).max(180).optional().nullable(),
	})
	.refine(
		(data) => {
			const hasLat =
				data.geoLatitude !== null && data.geoLatitude !== undefined;
			const hasLon =
				data.geoLongitude !== null && data.geoLongitude !== undefined;
			return hasLat === hasLon;
		},
		{
			message: "Both latitude and longitude must be provided together",
			path: ["geoLongitude"],
		},
	);

/**
 * Percent complete schema (0-100)
 */
const percentCompleteSchema = z
	.number()
	.int()
	.min(0)
	.max(100)
	.optional()
	.nullable();

/**
 * Priority schema (0-9)
 */
const prioritySchema = z.number().int().min(0).max(9).optional().nullable();

/**
 * Refinement functions for task validation
 */
const taskDateRefinement = (data: {
	startDate?: Date | null;
	dueDate?: Date | null;
}) => {
	if (data.startDate && data.dueDate) {
		return data.dueDate >= data.startDate;
	}
	return true;
};

const geoRefinement = (data: {
	geoLatitude?: number | null;
	geoLongitude?: number | null;
}) => {
	const hasLat = data.geoLatitude !== null && data.geoLatitude !== undefined;
	const hasLon = data.geoLongitude !== null && data.geoLongitude !== undefined;
	return hasLat === hasLon;
};

const taskDateRefinementMessage = {
	message: "Due date must be on or after start date",
	path: ["dueDate"],
};

const geoRefinementMessage = {
	message: "Both latitude and longitude must be provided together",
	path: ["geoLongitude"],
};

/**
 * Base task schema without refinements (for composition)
 */
const taskBaseSchema = z.object({
	taskListId: z.string(),
	title: z
		.string()
		.trim()
		.min(1, "Title is required")
		.max(FIELD_LIMITS.TITLE)
		.transform((val) => val.trim()),
	description: nullableTrimmedStringSchema(FIELD_LIMITS.DESCRIPTION),
	status: taskStatusSchema.optional().default("NEEDS_ACTION"),
	priority: prioritySchema,
	percentComplete: percentCompleteSchema,

	// Dates (RFC 5545: DTSTART and DUE are optional for VTODO)
	startDate: optionalCoercedDateSchema,
	dueDate: optionalCoercedDateSchema,
	completedAt: optionalCoercedDateSchema,

	// Location
	location: nullableTrimmedStringSchema(FIELD_LIMITS.LOCATION),
	geoLatitude: z.number().min(-90).max(90).optional().nullable(),
	geoLongitude: z.number().min(-180).max(180).optional().nullable(),

	// Organizer
	organizerName: nullableTrimmedStringSchema(FIELD_LIMITS.NAME),
	organizerEmail: nullableEmailSchema,

	// RFC 5545 properties
	uid: uidSchema,
	class: taskClassSchema.optional().nullable(),
	url: urlSchema,
	comment: nullableTrimmedStringSchema(FIELD_LIMITS.COMMENT),
	rrule: rruleSchema,
	recurrenceId: nullableTrimmedStringSchema(FIELD_LIMITS.RECURRENCE_ID),
	relatedTo: nullableTrimmedStringSchema(FIELD_LIMITS.RELATED_TO),

	// Extensions
	color: colorSchema,

	// Categories (comma-separated string)
	categories: nullableTrimmedStringSchema(FIELD_LIMITS.CATEGORIES_STRING),

	// Relations
	attendees: z.array(attendeeSchema).optional(),
	alarms: z.array(alarmSchema).optional(),
});

/**
 * Complete task schema for create operations
 */
export const taskCreateSchema = taskBaseSchema
	.refine(taskDateRefinement, taskDateRefinementMessage)
	.refine(geoRefinement, geoRefinementMessage);

/**
 * Schema for task update operations
 */
export const taskUpdateSchema = taskBaseSchema
	.omit({ taskListId: true })
	.extend({
		id: z.string(),
		title: z
			.string()
			.trim()
			.min(1)
			.max(FIELD_LIMITS.TITLE)
			.transform((val) => val.trim())
			.optional(),
	})
	.refine(taskDateRefinement, taskDateRefinementMessage)
	.refine(geoRefinement, geoRefinementMessage);

/**
 * Schema for task form data (frontend format)
 */
const taskFormDataSchema = z
	.object({
		title: z
			.string()
			.trim()
			.min(1, "Title is required")
			.max(FIELD_LIMITS.TITLE)
			.transform((val) => val.trim()),
		description: nullableTrimmedStringSchema(FIELD_LIMITS.DESCRIPTION),
		status: taskStatusSchema.optional().default("NEEDS_ACTION"),
		priority: prioritySchema,
		percentComplete: percentCompleteSchema,

		// Dates as strings
		startDate: optionalDateStringSchema,
		dueDate: optionalDateStringSchema,

		// Location
		location: nullableTrimmedStringSchema(FIELD_LIMITS.LOCATION),
		geoLatitude: z.number().min(-90).max(90).optional().nullable(),
		geoLongitude: z.number().min(-180).max(180).optional().nullable(),

		// Organizer
		organizerName: nullableTrimmedStringSchema(FIELD_LIMITS.NAME),
		organizerEmail: nullableEmailSchema,

		// RFC 5545 properties
		uid: uidSchema,
		class: taskClassSchema.optional().nullable(),
		url: urlSchema,
		comment: nullableTrimmedStringSchema(FIELD_LIMITS.COMMENT),
		rrule: rruleSchema,
		relatedTo: nullableTrimmedStringSchema(FIELD_LIMITS.RELATED_TO),

		// Extensions
		color: colorSchema,

		// Categories
		categories: nullableTrimmedStringSchema(FIELD_LIMITS.CATEGORIES_STRING),

		// Relations
		attendees: z.array(attendeeSchema).optional(),
		alarms: z.array(alarmSchema).optional(),
	})
	.refine(
		(data) => {
			if (data.startDate && data.dueDate) {
				const start = new Date(data.startDate);
				const due = new Date(data.dueDate);
				return due >= start;
			}
			return true;
		},
		{
			message: "Due date must be on or after start date",
			path: ["dueDate"],
		},
	)
	.refine(
		(data) => {
			const hasLat =
				data.geoLatitude !== null && data.geoLatitude !== undefined;
			const hasLon =
				data.geoLongitude !== null && data.geoLongitude !== undefined;
			return hasLat === hasLon;
		},
		{
			message: "Both latitude and longitude must be provided together",
			path: ["geoLongitude"],
		},
	);

/**
 * Task list create schema
 */
export const taskListCreateSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(FIELD_LIMITS.LIST_NAME)
		.transform((val) => val.trim()),
	color: colorSchema,
	sourceUrl: urlSchema,
});

/**
 * Task list update schema
 */
export const taskListUpdateSchema = z.object({
	id: z.string(),
	name: z
		.string()
		.trim()
		.min(1)
		.max(FIELD_LIMITS.LIST_NAME)
		.transform((val) => val.trim())
		.optional(),
	color: colorSchema,
	sourceUrl: urlSchema,
});

// Type exports
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskClass = z.infer<typeof taskClassSchema>;
export type TaskAttendee = z.infer<typeof attendeeSchema>;
export type TaskAlarm = z.infer<typeof alarmSchema>;
export type TaskCreate = z.infer<typeof taskCreateSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
export type TaskFormData = z.infer<typeof taskFormDataSchema>;
export type TaskListCreate = z.infer<typeof taskListCreateSchema>;
export type TaskListUpdate = z.infer<typeof taskListUpdateSchema>;
