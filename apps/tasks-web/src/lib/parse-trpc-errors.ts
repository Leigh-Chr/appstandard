/**
 * Utility functions to parse TRPC validation errors and convert them to ValidationErrors
 */

/**
 * Validation errors type for task forms
 */
interface ValidationErrors {
	title?: string;
	description?: string;
	dueDate?: string;
	startDate?: string;
	completedDate?: string;
	priority?: string;
	status?: string;
	percentComplete?: string;
	url?: string;
	location?: string;
	uid?: string;
	subtasks?: Record<
		number,
		{
			title?: string;
			completed?: string;
		}
	>;
	reminders?: Record<
		number,
		{
			trigger?: string;
			action?: string;
		}
	>;
}

interface ZodErrorIssue {
	code: string;
	path: (string | number)[];
	message: string;
}

/**
 * TRPC client error interface
 */
interface TRPCClientError {
	message: string;
	data?: unknown;
}

/**
 * Check if error is a TRPC client error
 */
export function isTRPCClientError(error: unknown): error is TRPCClientError {
	return (
		error !== null &&
		typeof error === "object" &&
		"data" in error &&
		"message" in error
	);
}

/**
 * Parse TRPC error message that contains JSON stringified Zod errors
 */
function parseTrpcErrorMessage(message: string): ZodErrorIssue[] {
	try {
		// Try to parse as JSON first
		const parsed = JSON.parse(message);
		if (Array.isArray(parsed)) {
			return parsed as ZodErrorIssue[];
		}
	} catch {
		// If parsing fails, return empty array
	}
	return [];
}

/**
 * Handle subtask validation errors from TRPC
 */
function handleSubtaskError(
	errors: ValidationErrors,
	_path: (string | number)[],
	message: string,
) {
	const index = _path[1];
	if (typeof index === "number") {
		const field = _path[2];
		if (!errors.subtasks) {
			errors.subtasks = {};
		}
		if (!errors.subtasks[index]) {
			errors.subtasks[index] = {};
		}
		if (field === "title" || field === "completed") {
			errors.subtasks[index][field] = message;
		}
	}
}

/**
 * Handle reminder validation errors from TRPC
 */
function handleReminderError(
	errors: ValidationErrors,
	_path: (string | number)[],
	message: string,
) {
	const index = _path[1];
	if (typeof index === "number") {
		const field = _path[2];
		if (!errors.reminders) {
			errors.reminders = {};
		}
		if (!errors.reminders[index]) {
			errors.reminders[index] = {};
		}
		if (field === "trigger" || field === "action") {
			errors.reminders[index][field] = message;
		}
	}
}

/**
 * Handle top-level validation errors from TRPC
 */
function handleTopLevelError(
	errors: ValidationErrors,
	path: (string | number)[],
	message: string,
) {
	const field = path[0];
	const errorMap: Record<string, keyof ValidationErrors> = {
		title: "title",
		description: "description",
		dueDate: "dueDate",
		startDate: "startDate",
		completedDate: "completedDate",
		priority: "priority",
		status: "status",
		percentComplete: "percentComplete",
		url: "url",
		location: "location",
		uid: "uid",
	};

	if (typeof field === "string") {
		const errorKey = errorMap[field];
		if (errorKey) {
			errors[errorKey] = message;
		}
	}
}

/**
 * Convert TRPC validation errors to ValidationErrors format
 * @param error - TRPC error object
 * @returns ValidationErrors object or null if error cannot be parsed
 */
export function parseTrpcValidationErrors(
	error: TRPCClientError,
): ValidationErrors | null {
	const message = error.message;
	if (!message) return null;

	// Parse the JSON stringified error message
	const issues = parseTrpcErrorMessage(message);
	if (issues.length === 0) {
		// Check if it's a BAD_REQUEST error (validation errors are usually BAD_REQUEST)
		// but message is not JSON - might be a different format
		return null;
	}

	const errors: ValidationErrors = {};

	for (const issue of issues) {
		const path = issue.path;

		if (path.length === 0) continue;

		// Handle nested errors (subtasks, reminders)
		if (path[0] === "subtasks") {
			handleSubtaskError(errors, path, issue.message);
		} else if (path[0] === "reminders") {
			handleReminderError(errors, path, issue.message);
		} else {
			// Handle top-level errors
			handleTopLevelError(errors, path, issue.message);
		}
	}

	return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Extract error from nested subtask errors
 */
function getFirstSubtaskError(
	subtasks: ValidationErrors["subtasks"],
): string | undefined {
	if (!subtasks) return undefined;
	const firstSubtaskError = Object.values(subtasks)[0];
	return firstSubtaskError?.title || firstSubtaskError?.completed;
}

/**
 * Extract error from nested reminder errors
 */
function getFirstReminderError(
	reminders: ValidationErrors["reminders"],
): string | undefined {
	if (!reminders) return undefined;
	const firstReminderError = Object.values(reminders)[0];
	return firstReminderError?.trigger || firstReminderError?.action;
}

/**
 * Extract the first validation error message for display in toast
 * @param errors - ValidationErrors object
 * @returns First error message or fallback message
 */
export function getFirstValidationError(
	errors: ValidationErrors,
	fallback = "Please correct the errors in the form",
): string {
	// Priority order for error display (top-level first)
	const priorityFields: Array<keyof ValidationErrors> = [
		"title",
		"description",
		"dueDate",
		"startDate",
		"completedDate",
		"priority",
		"status",
		"percentComplete",
		"url",
		"location",
		"uid",
	];

	for (const field of priorityFields) {
		const error = errors[field];
		if (typeof error === "string" && error) return error;
	}

	// Check nested errors
	const subtaskError = getFirstSubtaskError(errors.subtasks);
	if (subtaskError) return subtaskError;

	const reminderError = getFirstReminderError(errors.reminders);
	if (reminderError) return reminderError;

	return fallback;
}

/**
 * Handle TRPC mutation error with validation error parsing
 * @param error - Unknown error from mutation
 * @param options - Options for error handling
 * @returns ValidationErrors if validation error, null otherwise
 */
export function handleTRPCMutationError(
	error: unknown,
	options?: {
		onValidationError?: (errors: ValidationErrors) => void;
		onGenericError?: (message: string) => void;
	},
): ValidationErrors | null {
	const { onValidationError, onGenericError } = options || {};

	if (!isTRPCClientError(error)) {
		const message =
			error instanceof Error ? error.message : "An error occurred";
		onGenericError?.(message);
		return null;
	}

	const validationErrors = parseTrpcValidationErrors(error);

	if (validationErrors) {
		onValidationError?.(validationErrors);
		return validationErrors;
	}

	// Fallback to generic error
	const message = error.message || "An error occurred";
	onGenericError?.(message);
	return null;
}
