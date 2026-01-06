/**
 * Task form validation using Zod schemas
 */

import type { ValidationErrors } from "@appstandard/react-utils";

export interface TaskFormData {
	title: string;
	description?: string;
	status: "NEEDS_ACTION" | "IN_PROCESS" | "COMPLETED" | "CANCELLED";
	priority?: number;
	percentComplete: number;
	dueDate?: string;
	startDate?: string;
	location?: string;
	url?: string;
	categories?: string;
	color?: string;
	rrule?: string;
	attendees?: Array<{
		email: string;
		name?: string;
		role?: string;
		status?: string;
		rsvp?: boolean;
	}>;
	alarms?: Array<{ trigger: string; action: string }>;
	attachments?: Array<{ uri?: string; filename?: string }>;
	relatedTo?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/;

/**
 * Validate title field
 */
export function validateTitle(title: string): string | undefined {
	if (!title.trim()) {
		return "Title is required";
	}
	if (title.length > 255) {
		return "Title must be less than 255 characters";
	}
	return undefined;
}

/**
 * Validate dates - due date should be after start date if both set
 */
export function validateDates(
	startDate?: string,
	dueDate?: string,
): { startDate?: string; dueDate?: string } {
	const errors: { startDate?: string; dueDate?: string } = {};

	if (startDate && dueDate) {
		const start = new Date(startDate);
		const due = new Date(dueDate);
		if (due < start) {
			errors.dueDate = "Due date must be after start date";
		}
	}

	return errors;
}

/**
 * Validate URL format
 */
export function validateUrl(url?: string): string | undefined {
	if (url?.trim() && !URL_REGEX.test(url)) {
		return "Invalid URL format (must start with http:// or https://)";
	}
	return undefined;
}

/**
 * Validate percent complete
 */
export function validatePercentComplete(value: number): string | undefined {
	if (value < 0 || value > 100) {
		return "Progress must be between 0 and 100";
	}
	return undefined;
}

/**
 * Validate attendee email
 */
export function validateAttendeeEmail(email: string): string | undefined {
	if (!email.trim()) {
		return "Email is required";
	}
	if (!EMAIL_REGEX.test(email)) {
		return "Invalid email format";
	}
	return undefined;
}

/**
 * Validate entire task form
 */
export function validateTaskForm(data: TaskFormData): ValidationErrors {
	const errors: ValidationErrors = {};

	// Title validation
	const titleError = validateTitle(data.title);
	if (titleError) {
		errors["title"] = titleError;
	}

	// Date validation
	const dateErrors = validateDates(data.startDate, data.dueDate);
	if (dateErrors.startDate) errors["startDate"] = dateErrors.startDate;
	if (dateErrors.dueDate) errors["dueDate"] = dateErrors.dueDate;

	// URL validation
	const urlError = validateUrl(data.url);
	if (urlError) {
		errors["url"] = urlError;
	}

	// Percent complete validation
	const percentError = validatePercentComplete(data.percentComplete);
	if (percentError) {
		errors["percentComplete"] = percentError;
	}

	// Attendee email validation
	if (data.attendees) {
		const attendeeErrors: Record<string, string> = {};
		data.attendees.forEach((attendee, index) => {
			const emailError = validateAttendeeEmail(attendee.email);
			if (emailError) {
				attendeeErrors[index] = emailError;
			}
		});
		if (Object.keys(attendeeErrors).length > 0) {
			errors["attendeeEmails"] = "Please correct invalid attendee emails";
		}
	}

	return errors;
}

/**
 * Check if validation errors object has any errors
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
	return Object.values(errors).some((error) => error !== undefined);
}
