/**
 * Tests for TRPC error parsing utilities
 */
import { describe, expect, it } from "vitest";
import {
	getFirstValidationError,
	handleTRPCMutationError,
	isTRPCClientError,
	parseTrpcValidationErrors,
} from "../parse-trpc-errors";

describe("isTRPCClientError", () => {
	it("should return true for valid TRPC error structure", () => {
		const error = {
			message: "Error message",
			data: { code: "BAD_REQUEST" },
		};

		expect(isTRPCClientError(error)).toBe(true);
	});

	it("should return true for error with null data", () => {
		const error = {
			message: "Error message",
			data: null,
		};

		expect(isTRPCClientError(error)).toBe(true);
	});

	it("should return false for null", () => {
		expect(isTRPCClientError(null)).toBe(false);
	});

	it("should return false for undefined", () => {
		expect(isTRPCClientError(undefined)).toBe(false);
	});

	it("should return false for object without data", () => {
		const error = { message: "Error message" };

		expect(isTRPCClientError(error)).toBe(false);
	});

	it("should return false for object without message", () => {
		const error = { data: { code: "BAD_REQUEST" } };

		expect(isTRPCClientError(error)).toBe(false);
	});

	it("should return false for primitive types", () => {
		expect(isTRPCClientError("error")).toBe(false);
		expect(isTRPCClientError(123)).toBe(false);
		expect(isTRPCClientError(true)).toBe(false);
	});
});

describe("parseTrpcValidationErrors", () => {
	it("should return null for empty message", () => {
		const error = { message: "", data: null };

		expect(parseTrpcValidationErrors(error)).toBeNull();
	});

	it("should return null for non-JSON message", () => {
		const error = { message: "Something went wrong", data: null };

		expect(parseTrpcValidationErrors(error)).toBeNull();
	});

	it("should parse title validation error", () => {
		const issues = [
			{ code: "invalid_type", path: ["title"], message: "Title is required" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.title).toBe("Title is required");
	});

	it("should parse startDate validation error", () => {
		const issues = [
			{
				code: "invalid_date",
				path: ["startDate"],
				message: "Invalid start date",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.startDate).toBe("Invalid start date");
	});

	it("should parse endDate validation error", () => {
		const issues = [
			{
				code: "invalid_date",
				path: ["endDate"],
				message: "End date must be after start date",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.endDate).toBe("End date must be after start date");
	});

	it("should parse URL validation error", () => {
		const issues = [
			{ code: "invalid_url", path: ["url"], message: "Invalid URL format" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.url).toBe("Invalid URL format");
	});

	it("should parse organizer email validation error", () => {
		const issues = [
			{
				code: "invalid_email",
				path: ["organizerEmail"],
				message: "Invalid email format",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.organizerEmail).toBe("Invalid email format");
	});

	it("should parse geo coordinates validation errors", () => {
		const issues = [
			{
				code: "invalid_number",
				path: ["geoLatitude"],
				message: "Invalid latitude",
			},
			{
				code: "invalid_number",
				path: ["geoLongitude"],
				message: "Invalid longitude",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.geoLatitude).toBe("Invalid latitude");
		expect(result?.geoLongitude).toBe("Invalid longitude");
	});

	it("should parse attendee email validation error", () => {
		const issues = [
			{
				code: "invalid_email",
				path: ["attendees", 0, "email"],
				message: "Invalid attendee email",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.attendeeEmails?.[0]).toBe("Invalid attendee email");
	});

	it("should parse multiple attendee validation errors", () => {
		const issues = [
			{
				code: "invalid_email",
				path: ["attendees", 0, "email"],
				message: "First attendee email invalid",
			},
			{
				code: "invalid_email",
				path: ["attendees", 2, "email"],
				message: "Third attendee email invalid",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.attendeeEmails?.[0]).toBe("First attendee email invalid");
		expect(result?.attendeeEmails?.[2]).toBe("Third attendee email invalid");
	});

	it("should parse alarm validation errors", () => {
		const issues = [
			{
				code: "invalid_string",
				path: ["alarms", 0, "trigger"],
				message: "Trigger is required",
			},
			{
				code: "invalid_string",
				path: ["alarms", 0, "summary"],
				message: "Summary is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.alarms?.[0]?.trigger).toBe("Trigger is required");
		expect(result?.alarms?.[0]?.summary).toBe("Summary is required");
	});

	it("should parse alarm description validation error", () => {
		const issues = [
			{
				code: "invalid_string",
				path: ["alarms", 1, "description"],
				message: "Description is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.alarms?.[1]?.description).toBe("Description is required");
	});

	it("should parse multiple field errors", () => {
		const issues = [
			{ code: "invalid_type", path: ["title"], message: "Title is required" },
			{ code: "invalid_date", path: ["endDate"], message: "Invalid end date" },
			{ code: "invalid_url", path: ["url"], message: "Invalid URL" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.title).toBe("Title is required");
		expect(result?.endDate).toBe("Invalid end date");
		expect(result?.url).toBe("Invalid URL");
	});

	it("should skip issues with empty path", () => {
		const issues = [
			{ code: "invalid", path: [], message: "General error" },
			{ code: "invalid_type", path: ["title"], message: "Title is required" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.title).toBe("Title is required");
		expect(Object.keys(result || {}).length).toBe(1);
	});

	it("should return null for empty issues array", () => {
		const error = { message: JSON.stringify([]), data: null };

		expect(parseTrpcValidationErrors(error)).toBeNull();
	});

	it("should ignore unknown field names", () => {
		const issues = [
			{ code: "invalid", path: ["unknownField"], message: "Unknown error" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result).toBeNull();
	});
});

describe("getFirstValidationError", () => {
	it("should return title error first", () => {
		const errors = {
			title: "Title is required",
			endDate: "End date is required",
		};

		expect(getFirstValidationError(errors)).toBe("Title is required");
	});

	it("should return endDate error if no title error", () => {
		const errors = {
			endDate: "End date is required",
			startDate: "Start date is required",
		};

		expect(getFirstValidationError(errors)).toBe("End date is required");
	});

	it("should return startDate error in priority order", () => {
		const errors = {
			startDate: "Start date is required",
			url: "Invalid URL",
		};

		expect(getFirstValidationError(errors)).toBe("Start date is required");
	});

	it("should return URL error", () => {
		const errors = {
			url: "Invalid URL format",
		};

		expect(getFirstValidationError(errors)).toBe("Invalid URL format");
	});

	it("should return organizer email error", () => {
		const errors = {
			organizerEmail: "Invalid email format",
		};

		expect(getFirstValidationError(errors)).toBe("Invalid email format");
	});

	it("should return alarm error if no top-level errors", () => {
		const errors = {
			alarms: {
				0: {
					summary: "Summary is required",
				},
			},
		};

		expect(getFirstValidationError(errors)).toBe("Summary is required");
	});

	it("should return alarm description error", () => {
		const errors = {
			alarms: {
				0: {
					description: "Description is required",
				},
			},
		};

		expect(getFirstValidationError(errors)).toBe("Description is required");
	});

	it("should return alarm trigger error", () => {
		const errors = {
			alarms: {
				0: {
					trigger: "Trigger is required",
				},
			},
		};

		expect(getFirstValidationError(errors)).toBe("Trigger is required");
	});

	it("should return attendee error if no top-level or alarm errors", () => {
		const errors = {
			attendeeEmails: {
				0: "Invalid attendee email",
			},
		};

		expect(getFirstValidationError(errors)).toBe("Invalid attendee email");
	});

	it("should return fallback for empty errors", () => {
		expect(getFirstValidationError({})).toBe(
			"Please correct the errors in the form",
		);
	});

	it("should return custom fallback", () => {
		expect(getFirstValidationError({}, "Custom fallback")).toBe(
			"Custom fallback",
		);
	});

	it("should prioritize top-level over alarm errors", () => {
		const errors = {
			url: "Invalid URL",
			alarms: {
				0: {
					summary: "Summary is required",
				},
			},
		};

		expect(getFirstValidationError(errors)).toBe("Invalid URL");
	});
});

describe("handleTRPCMutationError", () => {
	it("should call onValidationError for validation errors", () => {
		const issues = [
			{ code: "invalid_type", path: ["title"], message: "Title is required" },
		];
		const error = { message: JSON.stringify(issues), data: null };
		let validationErrors = null;

		handleTRPCMutationError(error, {
			onValidationError: (errors) => {
				validationErrors = errors;
			},
		});

		expect(validationErrors).not.toBeNull();
		expect((validationErrors as any).title).toBe("Title is required");
	});

	it("should call onGenericError for non-validation TRPC errors", () => {
		const error = { message: "Internal server error", data: null };
		let genericError = null;

		handleTRPCMutationError(error, {
			onGenericError: (message) => {
				genericError = message;
			},
		});

		expect(genericError).toBe("Internal server error");
	});

	it("should call onGenericError for non-TRPC errors", () => {
		const error = new Error("Network error");
		let genericError = null;

		handleTRPCMutationError(error, {
			onGenericError: (message) => {
				genericError = message;
			},
		});

		expect(genericError).toBe("Network error");
	});

	it("should return validation errors", () => {
		const issues = [
			{ code: "invalid_type", path: ["title"], message: "Title is required" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = handleTRPCMutationError(error);

		expect(result?.title).toBe("Title is required");
	});

	it("should return null for non-validation errors", () => {
		const error = { message: "Internal server error", data: null };

		const result = handleTRPCMutationError(error);

		expect(result).toBeNull();
	});

	it("should return null for non-TRPC errors", () => {
		const error = new Error("Network error");

		const result = handleTRPCMutationError(error);

		expect(result).toBeNull();
	});

	it("should handle unknown error types", () => {
		let genericError = null;

		handleTRPCMutationError("string error", {
			onGenericError: (message) => {
				genericError = message;
			},
		});

		expect(genericError).toBe("An error occurred");
	});

	it("should work without options", () => {
		const issues = [
			{ code: "invalid_type", path: ["title"], message: "Title is required" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		// Should not throw
		const result = handleTRPCMutationError(error);

		expect(result?.title).toBe("Title is required");
	});
});
