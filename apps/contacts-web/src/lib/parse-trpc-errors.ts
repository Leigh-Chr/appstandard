/**
 * Utility functions to parse TRPC validation errors and convert them to ValidationErrors
 */

import type { ValidationErrors } from "@appstandard-contacts/schemas";

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
 * Handle address validation errors from TRPC
 */
function handleAddressError(
	errors: ValidationErrors,
	_path: (string | number)[],
	message: string,
) {
	const index = _path[1];
	if (typeof index === "number") {
		const field = _path[2];
		if (!errors.addresses) {
			errors.addresses = {};
		}
		if (!errors.addresses[index]) {
			errors.addresses[index] = {};
		}
		if (
			field === "street" ||
			field === "city" ||
			field === "postalCode" ||
			field === "country" ||
			field === "region"
		) {
			errors.addresses[index][field] = message;
		}
	}
}

/**
 * Handle email validation errors from TRPC
 */
function handleEmailError(
	errors: ValidationErrors,
	_path: (string | number)[],
	message: string,
) {
	const index = _path[1];
	if (typeof index === "number") {
		if (!errors.emails) {
			errors.emails = {};
		}
		errors.emails[index] = message;
	}
}

/**
 * Handle phone number validation errors from TRPC
 */
function handlePhoneError(
	errors: ValidationErrors,
	_path: (string | number)[],
	message: string,
) {
	const index = _path[1];
	if (typeof index === "number") {
		if (!errors.phoneNumbers) {
			errors.phoneNumbers = {};
		}
		errors.phoneNumbers[index] = message;
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
		displayName: "displayName",
		firstName: "firstName",
		lastName: "lastName",
		nickname: "nickname",
		organization: "organization",
		title: "title",
		note: "note",
		birthday: "birthday",
		photo: "photo",
		url: "url",
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

		// Handle nested errors (addresses, emails, phoneNumbers)
		if (path[0] === "addresses") {
			handleAddressError(errors, path, issue.message);
		} else if (path[0] === "emails") {
			handleEmailError(errors, path, issue.message);
		} else if (path[0] === "phoneNumbers") {
			handlePhoneError(errors, path, issue.message);
		} else {
			// Handle top-level errors
			handleTopLevelError(errors, path, issue.message);
		}
	}

	return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Extract error from nested address errors
 */
function getFirstAddressError(
	addresses: ValidationErrors["addresses"],
): string | undefined {
	if (!addresses) return undefined;
	const firstAddressError = Object.values(addresses)[0];
	return (
		firstAddressError?.street ||
		firstAddressError?.city ||
		firstAddressError?.postalCode ||
		firstAddressError?.country ||
		firstAddressError?.region
	);
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
		"displayName",
		"firstName",
		"lastName",
		"nickname",
		"organization",
		"title",
		"birthday",
		"photo",
		"url",
		"note",
		"uid",
	];

	for (const field of priorityFields) {
		const error = errors[field];
		if (typeof error === "string" && error) return error;
	}

	// Check nested errors
	const addressError = getFirstAddressError(errors.addresses);
	if (addressError) return addressError;

	if (errors.emails) {
		const firstEmailError = Object.values(errors.emails)[0];
		if (firstEmailError) return firstEmailError;
	}

	if (errors.phoneNumbers) {
		const firstPhoneError = Object.values(errors.phoneNumbers)[0];
		if (firstPhoneError) return firstPhoneError;
	}

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
