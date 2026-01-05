/**
 * Tests for pure validation functions
 */
import { describe, expect, it } from "vitest";
import { FIELD_LIMITS } from "../../constants/field-limits";
import type { AlarmData, AttendeeData, EventFormData } from "../../types/event";
import {
	getFieldError,
	hasErrors,
	isValidEmail,
	isValidHexColor,
	isValidUrl,
	validateAlarm,
	validateAttendee,
	validateEventForm,
	validateLength,
	validateRequired,
} from "../event";

describe("isValidEmail", () => {
	it("should validate correct email formats", () => {
		expect(isValidEmail("test@example.com")).toBe(true);
		expect(isValidEmail("user.name@domain.org")).toBe(true);
		expect(isValidEmail("user+tag@subdomain.example.com")).toBe(true);
	});

	it("should reject invalid email formats", () => {
		expect(isValidEmail("")).toBe(false);
		expect(isValidEmail("invalid")).toBe(false);
		expect(isValidEmail("no-at-sign.com")).toBe(false);
		expect(isValidEmail("@no-local-part.com")).toBe(false);
		expect(isValidEmail("no-domain@")).toBe(false);
		expect(isValidEmail("spaces in@email.com")).toBe(false);
	});
});

describe("isValidUrl", () => {
	it("should validate correct URL formats", () => {
		expect(isValidUrl("https://example.com")).toBe(true);
		expect(isValidUrl("http://localhost:3000")).toBe(true);
		expect(isValidUrl("https://example.com/path?query=1")).toBe(true);
		expect(isValidUrl("ftp://files.example.com")).toBe(true);
	});

	it("should reject invalid URL formats", () => {
		expect(isValidUrl("")).toBe(false);
		expect(isValidUrl("not-a-url")).toBe(false);
		expect(isValidUrl("example.com")).toBe(false);
		expect(isValidUrl("//missing-protocol.com")).toBe(false);
	});
});

describe("isValidHexColor", () => {
	it("should validate 6-digit hex colors", () => {
		expect(isValidHexColor("#FF5733")).toBe(true);
		expect(isValidHexColor("#000000")).toBe(true);
		expect(isValidHexColor("#ffffff")).toBe(true);
		expect(isValidHexColor("#aAbBcC")).toBe(true);
	});

	it("should validate 3-digit hex colors", () => {
		expect(isValidHexColor("#F53")).toBe(true);
		expect(isValidHexColor("#000")).toBe(true);
		expect(isValidHexColor("#fff")).toBe(true);
	});

	it("should reject invalid hex colors", () => {
		expect(isValidHexColor("")).toBe(false);
		expect(isValidHexColor("FF5733")).toBe(false); // Missing #
		expect(isValidHexColor("#FF573")).toBe(false); // 5 digits
		expect(isValidHexColor("#FF57334")).toBe(false); // 7 digits
		expect(isValidHexColor("#GGGGGG")).toBe(false); // Invalid hex chars
		expect(isValidHexColor("red")).toBe(false); // Color name
	});
});

describe("validateLength", () => {
	it("should return null for valid length", () => {
		expect(validateLength("short", 10, "field")).toBe(null);
		expect(validateLength("exactly10c", 10, "field")).toBe(null);
		expect(validateLength(undefined, 10, "field")).toBe(null);
	});

	it("should return error for exceeding length", () => {
		const result = validateLength("this is too long", 5, "title");
		expect(result).not.toBe(null);
		expect(result?.field).toBe("title");
		expect(result?.message).toContain("5");
	});
});

describe("validateRequired", () => {
	it("should return null for non-empty values", () => {
		expect(validateRequired("value", "field")).toBe(null);
		expect(validateRequired("  trimmed  ", "field")).toBe(null);
	});

	it("should return error for empty/missing values", () => {
		expect(validateRequired("", "title")).not.toBe(null);
		expect(validateRequired("   ", "title")).not.toBe(null);
		expect(validateRequired(undefined, "title")).not.toBe(null);
	});

	it("should include field name in error", () => {
		const result = validateRequired("", "title");
		expect(result?.field).toBe("title");
		expect(result?.message).toContain("required");
	});
});

describe("validateAttendee", () => {
	it("should validate a valid attendee", () => {
		const attendee: AttendeeData = {
			email: "test@example.com",
			name: "John Doe",
		};
		const errors = validateAttendee(attendee, 0);
		expect(errors).toHaveLength(0);
	});

	it("should require email", () => {
		const attendee: AttendeeData = {
			email: "",
			name: "John",
		};
		const errors = validateAttendee(attendee, 0);
		expect(errors.some((e) => e.field.includes("email"))).toBe(true);
	});

	it("should validate email format", () => {
		const attendee: AttendeeData = {
			email: "invalid-email",
			name: "John",
		};
		const errors = validateAttendee(attendee, 1);
		expect(errors.some((e) => e.message.includes("Invalid email"))).toBe(true);
		expect(errors[0].field).toBe("attendees[1].email");
	});

	it("should validate name length", () => {
		const attendee: AttendeeData = {
			email: "test@example.com",
			name: "A".repeat(FIELD_LIMITS.NAME + 1),
		};
		const errors = validateAttendee(attendee, 0);
		expect(errors.some((e) => e.field.includes("name"))).toBe(true);
	});
});

describe("validateAlarm", () => {
	it("should validate a valid alarm", () => {
		const alarm: AlarmData = {
			trigger: "-PT15M",
			action: "DISPLAY",
			summary: "Reminder",
		};
		const errors = validateAlarm(alarm, 0);
		expect(errors).toHaveLength(0);
	});

	it("should require trigger", () => {
		const alarm: AlarmData = {
			trigger: "",
			action: "DISPLAY",
		};
		const errors = validateAlarm(alarm, 0);
		expect(errors.some((e) => e.field.includes("trigger"))).toBe(true);
	});

	it("should require action", () => {
		const alarm: AlarmData = {
			trigger: "-PT15M",
			action: "",
		};
		const errors = validateAlarm(alarm, 1);
		expect(errors.some((e) => e.field.includes("action"))).toBe(true);
		expect(errors[0].field).toBe("alarms[1].action");
	});

	it("should validate summary length", () => {
		const alarm: AlarmData = {
			trigger: "-PT15M",
			action: "DISPLAY",
			summary: "A".repeat(FIELD_LIMITS.ALARM_SUMMARY + 1),
		};
		const errors = validateAlarm(alarm, 0);
		expect(errors.some((e) => e.field.includes("summary"))).toBe(true);
	});
});

describe("validateEventForm", () => {
	const validEvent: EventFormData = {
		title: "Test Event",
		startDate: "2024-01-15T10:00:00Z",
		endDate: "2024-01-15T11:00:00Z",
	};

	describe("required fields", () => {
		it("should validate a minimal valid event", () => {
			const result = validateEventForm(validEvent);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should require title", () => {
			const result = validateEventForm({
				...validEvent,
				title: "",
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "title")).toBe(true);
		});

		it("should require startDate", () => {
			const result = validateEventForm({
				...validEvent,
				startDate: "",
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "startDate")).toBe(true);
		});

		it("should require endDate", () => {
			const result = validateEventForm({
				...validEvent,
				endDate: "",
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "endDate")).toBe(true);
		});
	});

	describe("field length validation", () => {
		it("should validate title length", () => {
			const result = validateEventForm({
				...validEvent,
				title: "A".repeat(FIELD_LIMITS.TITLE + 1),
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "title")).toBe(true);
		});

		it("should validate location length", () => {
			const result = validateEventForm({
				...validEvent,
				location: "A".repeat(FIELD_LIMITS.LOCATION + 1),
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "location")).toBe(true);
		});

		it("should validate description length", () => {
			const result = validateEventForm({
				...validEvent,
				description: "A".repeat(FIELD_LIMITS.DESCRIPTION + 1),
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "description")).toBe(true);
		});
	});

	describe("date validation", () => {
		it("should reject endDate before startDate", () => {
			const result = validateEventForm({
				...validEvent,
				startDate: "2024-01-15T11:00:00Z",
				endDate: "2024-01-15T10:00:00Z",
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "endDate")).toBe(true);
			expect(result.errors.some((e) => e.message.includes("after"))).toBe(true);
		});

		it("should allow same day events", () => {
			const result = validateEventForm({
				...validEvent,
				startDate: "2024-01-15T10:00:00Z",
				endDate: "2024-01-15T10:30:00Z",
			});
			expect(result.valid).toBe(true);
		});
	});

	describe("format validation", () => {
		it("should validate URL format", () => {
			const result = validateEventForm({
				...validEvent,
				url: "not-a-url",
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "url")).toBe(true);
		});

		it("should accept valid URL", () => {
			const result = validateEventForm({
				...validEvent,
				url: "https://example.com/meeting",
			});
			expect(result.valid).toBe(true);
		});

		it("should validate organizer email format", () => {
			const result = validateEventForm({
				...validEvent,
				organizerEmail: "not-an-email",
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "organizerEmail")).toBe(
				true,
			);
		});

		it("should validate color format", () => {
			const result = validateEventForm({
				...validEvent,
				color: "red",
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "color")).toBe(true);
		});

		it("should accept valid hex color", () => {
			const result = validateEventForm({
				...validEvent,
				color: "#FF5733",
			});
			expect(result.valid).toBe(true);
		});

		it("should validate priority range", () => {
			const result1 = validateEventForm({
				...validEvent,
				priority: -1,
			});
			expect(result1.valid).toBe(false);
			expect(result1.errors.some((e) => e.field === "priority")).toBe(true);

			const result2 = validateEventForm({
				...validEvent,
				priority: 10,
			});
			expect(result2.valid).toBe(false);
		});

		it("should accept valid priority", () => {
			const result = validateEventForm({
				...validEvent,
				priority: 5,
			});
			expect(result.valid).toBe(true);
		});
	});

	describe("nested validation", () => {
		it("should validate attendees", () => {
			const result = validateEventForm({
				...validEvent,
				attendees: [{ email: "invalid-email" }],
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field.includes("attendees"))).toBe(
				true,
			);
		});

		it("should validate alarms", () => {
			const result = validateEventForm({
				...validEvent,
				alarms: [{ trigger: "", action: "DISPLAY" }],
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field.includes("alarms"))).toBe(true);
		});

		it("should validate multiple attendees", () => {
			const result = validateEventForm({
				...validEvent,
				attendees: [
					{ email: "valid@example.com" },
					{ email: "invalid" },
					{ email: "also-valid@example.com" },
				],
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "attendees[1].email")).toBe(
				true,
			);
		});
	});

	describe("complete event validation", () => {
		it("should validate a fully populated valid event", () => {
			const fullEvent: EventFormData = {
				title: "Complete Meeting",
				startDate: "2024-01-15T10:00:00Z",
				endDate: "2024-01-15T11:00:00Z",
				description: "A complete test meeting",
				location: "Conference Room A",
				status: "CONFIRMED",
				priority: 5,
				url: "https://example.com/meeting",
				class: "PRIVATE",
				organizerName: "John Doe",
				organizerEmail: "john@example.com",
				color: "#FF5733",
				attendees: [
					{ email: "alice@example.com", name: "Alice", rsvp: true },
					{ email: "bob@example.com", name: "Bob" },
				],
				alarms: [{ trigger: "-PT15M", action: "DISPLAY", summary: "Reminder" }],
			};
			const result = validateEventForm(fullEvent);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});
	});
});

describe("getFieldError", () => {
	it("should return error message for existing field", () => {
		const result = {
			valid: false,
			errors: [
				{ field: "title", message: "Title is required" },
				{ field: "endDate", message: "End date must be after start date" },
			],
		};
		expect(getFieldError(result, "title")).toBe("Title is required");
		expect(getFieldError(result, "endDate")).toBe(
			"End date must be after start date",
		);
	});

	it("should return undefined for non-existing field", () => {
		const result = {
			valid: false,
			errors: [{ field: "title", message: "Title is required" }],
		};
		expect(getFieldError(result, "location")).toBeUndefined();
	});
});

describe("hasErrors", () => {
	it("should return true when there are errors", () => {
		const result = {
			valid: false,
			errors: [{ field: "title", message: "Required" }],
		};
		expect(hasErrors(result)).toBe(true);
	});

	it("should return false when valid", () => {
		const result = {
			valid: true,
			errors: [],
		};
		expect(hasErrors(result)).toBe(false);
	});
});
