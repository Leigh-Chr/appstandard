/**
 * Tests for error helper functions
 */
import { describe, expect, it } from "vitest";
import {
	createAppError,
	formatErrorForLog,
	getErrorCode,
	getErrorMessage,
	getErrorSeverity,
	isNetworkError,
	isTimeoutError,
} from "../error/helpers";

describe("createAppError", () => {
	it("should create error with code and message", () => {
		const error = createAppError("TEST_ERROR", "Test message");
		expect(error.code).toBe("TEST_ERROR");
		expect(error.message).toBe("Test message");
		expect(error.timestamp).toBeInstanceOf(Date);
		expect(error.details).toBeUndefined();
	});

	it("should create error with details", () => {
		const details = { field: "email", value: "invalid" };
		const error = createAppError("VALIDATION_ERROR", "Invalid field", details);
		expect(error.details).toEqual(details);
	});
});

describe("isNetworkError", () => {
	it("should detect network errors", () => {
		expect(isNetworkError(new Error("Network request failed"))).toBe(true);
		expect(isNetworkError(new Error("fetch error"))).toBe(true);
		expect(isNetworkError(new Error("Connection refused"))).toBe(true);
		expect(isNetworkError(new Error("You are offline"))).toBe(true);
	});

	it("should not detect non-network errors", () => {
		expect(isNetworkError(new Error("Some other error"))).toBe(false);
		expect(isNetworkError(new Error("Type error"))).toBe(false);
	});

	it("should handle non-Error objects", () => {
		expect(isNetworkError("string error")).toBe(false);
		expect(isNetworkError({ message: "network" })).toBe(false);
		expect(isNetworkError(null)).toBe(false);
		expect(isNetworkError(undefined)).toBe(false);
	});
});

describe("isTimeoutError", () => {
	it("should detect timeout errors", () => {
		expect(isTimeoutError(new Error("Request timeout"))).toBe(true);
		// Note: "timed out" doesn't contain "timeout" as a substring
		expect(isTimeoutError(new Error("timeout exceeded"))).toBe(true);
	});

	it("should detect AbortError", () => {
		const abortError = new Error("Aborted");
		abortError.name = "AbortError";
		expect(isTimeoutError(abortError)).toBe(true);
	});

	it("should not detect non-timeout errors", () => {
		expect(isTimeoutError(new Error("Some other error"))).toBe(false);
	});

	it("should handle non-Error objects", () => {
		expect(isTimeoutError("timeout")).toBe(false);
		expect(isTimeoutError(null)).toBe(false);
	});
});

describe("getErrorMessage", () => {
	it("should extract message from Error", () => {
		expect(getErrorMessage(new Error("Test error"))).toBe("Test error");
	});

	it("should return string directly", () => {
		expect(getErrorMessage("Direct string")).toBe("Direct string");
	});

	it("should extract message from object with message property", () => {
		expect(getErrorMessage({ message: "Object message" })).toBe(
			"Object message",
		);
	});

	it("should return default for unknown types", () => {
		expect(getErrorMessage(null)).toBe("An unknown error occurred");
		expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
		expect(getErrorMessage(123)).toBe("An unknown error occurred");
		expect(getErrorMessage({})).toBe("An unknown error occurred");
	});
});

describe("getErrorCode", () => {
	it("should extract code from object with code property", () => {
		expect(getErrorCode({ code: "ERROR_CODE" })).toBe("ERROR_CODE");
	});

	it("should extract code from nested data.code", () => {
		expect(getErrorCode({ data: { code: "NESTED_CODE" } })).toBe("NESTED_CODE");
	});

	it("should return undefined for objects without code", () => {
		expect(getErrorCode({ message: "No code" })).toBeUndefined();
		expect(getErrorCode({})).toBeUndefined();
	});

	it("should return undefined for non-objects", () => {
		expect(getErrorCode("string")).toBeUndefined();
		expect(getErrorCode(null)).toBeUndefined();
		expect(getErrorCode(undefined)).toBeUndefined();
		expect(getErrorCode(123)).toBeUndefined();
	});
});

describe("getErrorSeverity", () => {
	it("should return warning for AUTH_ errors", () => {
		expect(getErrorSeverity({ code: "AUTH_INVALID" })).toBe("warning");
		expect(getErrorSeverity({ code: "AUTH_EXPIRED" })).toBe("warning");
	});

	it("should return info for VALIDATION_ errors", () => {
		expect(getErrorSeverity({ code: "VALIDATION_FAILED" })).toBe("info");
		expect(getErrorSeverity({ code: "VALIDATION_EMAIL" })).toBe("info");
	});

	it("should return critical for INTERNAL_SERVER_ERROR", () => {
		expect(getErrorSeverity({ code: "INTERNAL_SERVER_ERROR" })).toBe(
			"critical",
		);
	});

	it("should return error for network errors", () => {
		expect(getErrorSeverity(new Error("Network failed"))).toBe("error");
	});

	it("should return warning for timeout errors", () => {
		expect(getErrorSeverity(new Error("Request timeout"))).toBe("warning");
	});

	it("should return error as default", () => {
		expect(getErrorSeverity(new Error("Some error"))).toBe("error");
		expect(getErrorSeverity({})).toBe("error");
	});
});

describe("formatErrorForLog", () => {
	it("should format basic error", () => {
		const error = new Error("Test error");
		const log = formatErrorForLog(error);
		expect(log).toContain("[ERROR]");
		expect(log).toContain("Test error");
	});

	it("should include error code", () => {
		const error = { code: "TEST_CODE", message: "Test" };
		const log = formatErrorForLog(error);
		expect(log).toContain("(TEST_CODE)");
	});

	it("should include context source", () => {
		const log = formatErrorForLog(new Error("Test"), { source: "component" });
		expect(log).toContain("Source: component");
	});

	it("should include context action", () => {
		const log = formatErrorForLog(new Error("Test"), { action: "submit" });
		expect(log).toContain("Action: submit");
	});

	it("should format with full context", () => {
		const error = { code: "API_ERROR", message: "Request failed" };
		const context = { source: "UserForm", action: "save" };
		const log = formatErrorForLog(error, context);
		expect(log).toContain("[ERROR]");
		expect(log).toContain("(API_ERROR)");
		expect(log).toContain("Request failed");
		expect(log).toContain("Source: UserForm");
		expect(log).toContain("Action: save");
	});

	it("should format auth errors as warning", () => {
		const error = { code: "AUTH_EXPIRED", message: "Session expired" };
		const log = formatErrorForLog(error);
		expect(log).toContain("[WARNING]");
	});

	it("should format validation errors as info", () => {
		const error = { code: "VALIDATION_FAILED", message: "Invalid input" };
		const log = formatErrorForLog(error);
		expect(log).toContain("[INFO]");
	});
});
