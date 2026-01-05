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

	it("should parse dueDate validation error", () => {
		const issues = [
			{
				code: "invalid_date",
				path: ["dueDate"],
				message: "Invalid due date",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.dueDate).toBe("Invalid due date");
	});

	it("should parse priority validation error", () => {
		const issues = [
			{
				code: "invalid_enum",
				path: ["priority"],
				message: "Invalid priority",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.priority).toBe("Invalid priority");
	});

	it("should parse status validation error", () => {
		const issues = [
			{
				code: "invalid_enum",
				path: ["status"],
				message: "Invalid status",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.status).toBe("Invalid status");
	});

	it("should parse URL validation error", () => {
		const issues = [
			{ code: "invalid_url", path: ["url"], message: "Invalid URL format" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.url).toBe("Invalid URL format");
	});

	it("should parse subtask validation error", () => {
		const issues = [
			{
				code: "invalid_string",
				path: ["subtasks", 0, "title"],
				message: "Subtask title is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.subtasks?.[0]?.title).toBe("Subtask title is required");
	});

	it("should parse multiple subtask validation errors", () => {
		const issues = [
			{
				code: "invalid_string",
				path: ["subtasks", 0, "title"],
				message: "First subtask title is required",
			},
			{
				code: "invalid_string",
				path: ["subtasks", 2, "completed"],
				message: "Completed must be boolean",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.subtasks?.[0]?.title).toBe(
			"First subtask title is required",
		);
		expect(result?.subtasks?.[2]?.completed).toBe("Completed must be boolean");
	});

	it("should parse reminder validation error", () => {
		const issues = [
			{
				code: "invalid_string",
				path: ["reminders", 0, "trigger"],
				message: "Trigger is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.reminders?.[0]?.trigger).toBe("Trigger is required");
	});

	it("should parse multiple field errors", () => {
		const issues = [
			{ code: "invalid_type", path: ["title"], message: "Title is required" },
			{ code: "invalid_date", path: ["dueDate"], message: "Invalid due date" },
			{ code: "invalid_url", path: ["url"], message: "Invalid URL" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.title).toBe("Title is required");
		expect(result?.dueDate).toBe("Invalid due date");
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
			dueDate: "Due date is required",
		};

		expect(getFirstValidationError(errors)).toBe("Title is required");
	});

	it("should return dueDate error if no title error", () => {
		const errors = {
			dueDate: "Due date is required",
			status: "Invalid status",
		};

		expect(getFirstValidationError(errors)).toBe("Due date is required");
	});

	it("should return URL error", () => {
		const errors = {
			url: "Invalid URL format",
		};

		expect(getFirstValidationError(errors)).toBe("Invalid URL format");
	});

	it("should return subtask error if no top-level errors", () => {
		const errors = {
			subtasks: {
				0: {
					title: "Subtask title is required",
				},
			},
		};

		expect(getFirstValidationError(errors)).toBe("Subtask title is required");
	});

	it("should return reminder error if no top-level or subtask errors", () => {
		const errors = {
			reminders: {
				0: {
					trigger: "Trigger is required",
				},
			},
		};

		expect(getFirstValidationError(errors)).toBe("Trigger is required");
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

	it("should prioritize top-level over subtask errors", () => {
		const errors = {
			url: "Invalid URL",
			subtasks: {
				0: {
					title: "Subtask title is required",
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
