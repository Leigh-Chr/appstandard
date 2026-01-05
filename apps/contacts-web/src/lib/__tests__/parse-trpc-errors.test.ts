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

	it("should parse displayName validation error", () => {
		const issues = [
			{
				code: "invalid_type",
				path: ["displayName"],
				message: "Display name is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.displayName).toBe("Display name is required");
	});

	it("should parse firstName validation error", () => {
		const issues = [
			{
				code: "invalid_type",
				path: ["firstName"],
				message: "First name is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.firstName).toBe("First name is required");
	});

	it("should parse organization validation error", () => {
		const issues = [
			{
				code: "too_big",
				path: ["organization"],
				message: "Organization is too long",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.organization).toBe("Organization is too long");
	});

	it("should parse URL validation error", () => {
		const issues = [
			{ code: "invalid_url", path: ["url"], message: "Invalid URL format" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.url).toBe("Invalid URL format");
	});

	it("should parse address validation error", () => {
		const issues = [
			{
				code: "invalid_string",
				path: ["addresses", 0, "street"],
				message: "Street is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.addresses?.[0]?.street).toBe("Street is required");
	});

	it("should parse multiple address validation errors", () => {
		const issues = [
			{
				code: "invalid_string",
				path: ["addresses", 0, "city"],
				message: "City is required",
			},
			{
				code: "invalid_string",
				path: ["addresses", 1, "postalCode"],
				message: "Postal code is invalid",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.addresses?.[0]?.city).toBe("City is required");
		expect(result?.addresses?.[1]?.postalCode).toBe("Postal code is invalid");
	});

	it("should parse email validation error", () => {
		const issues = [
			{
				code: "invalid_email",
				path: ["emails", 0],
				message: "Invalid email format",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.emails?.[0]).toBe("Invalid email format");
	});

	it("should parse phone validation error", () => {
		const issues = [
			{
				code: "invalid_string",
				path: ["phoneNumbers", 0],
				message: "Invalid phone number",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.phoneNumbers?.[0]).toBe("Invalid phone number");
	});

	it("should parse multiple field errors", () => {
		const issues = [
			{
				code: "invalid_type",
				path: ["firstName"],
				message: "First name is required",
			},
			{ code: "invalid_url", path: ["url"], message: "Invalid URL" },
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.firstName).toBe("First name is required");
		expect(result?.url).toBe("Invalid URL");
	});

	it("should skip issues with empty path", () => {
		const issues = [
			{ code: "invalid", path: [], message: "General error" },
			{
				code: "invalid_type",
				path: ["displayName"],
				message: "Name is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = parseTrpcValidationErrors(error);

		expect(result?.displayName).toBe("Name is required");
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
	it("should return displayName error first", () => {
		const errors = {
			displayName: "Name is required",
			firstName: "First name is required",
		};

		expect(getFirstValidationError(errors)).toBe("Name is required");
	});

	it("should return firstName error if no displayName error", () => {
		const errors = {
			firstName: "First name is required",
			organization: "Organization too long",
		};

		expect(getFirstValidationError(errors)).toBe("First name is required");
	});

	it("should return URL error", () => {
		const errors = {
			url: "Invalid URL format",
		};

		expect(getFirstValidationError(errors)).toBe("Invalid URL format");
	});

	it("should return address error if no top-level errors", () => {
		const errors = {
			addresses: {
				0: {
					street: "Street is required",
				},
			},
		};

		expect(getFirstValidationError(errors)).toBe("Street is required");
	});

	it("should return email error if no top-level or address errors", () => {
		const errors = {
			emails: {
				0: "Invalid email",
			},
		};

		expect(getFirstValidationError(errors)).toBe("Invalid email");
	});

	it("should return phone error if no other errors", () => {
		const errors = {
			phoneNumbers: {
				0: "Invalid phone",
			},
		};

		expect(getFirstValidationError(errors)).toBe("Invalid phone");
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

	it("should prioritize top-level over address errors", () => {
		const errors = {
			url: "Invalid URL",
			addresses: {
				0: {
					street: "Street is required",
				},
			},
		};

		expect(getFirstValidationError(errors)).toBe("Invalid URL");
	});
});

describe("handleTRPCMutationError", () => {
	it("should call onValidationError for validation errors", () => {
		const issues = [
			{
				code: "invalid_type",
				path: ["displayName"],
				message: "Name is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };
		let validationErrors = null;

		handleTRPCMutationError(error, {
			onValidationError: (errors) => {
				validationErrors = errors;
			},
		});

		expect(validationErrors).not.toBeNull();
		expect((validationErrors as any).displayName).toBe("Name is required");
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
			{
				code: "invalid_type",
				path: ["displayName"],
				message: "Name is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		const result = handleTRPCMutationError(error);

		expect(result?.displayName).toBe("Name is required");
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
			{
				code: "invalid_type",
				path: ["displayName"],
				message: "Name is required",
			},
		];
		const error = { message: JSON.stringify(issues), data: null };

		// Should not throw
		const result = handleTRPCMutationError(error);

		expect(result?.displayName).toBe("Name is required");
	});
});
