/**
 * Tests for event validation schemas
 */
import { describe, expect, it } from "vitest";
import {
	alarmSchema,
	attendeeSchema,
	colorSchema,
	eventCreateSchema,
	geoCoordinatesSchema,
	recurrenceIdSchema,
	rruleSchema,
	uidSchema,
} from "../event-schemas";

describe("attendeeSchema", () => {
	it("should validate a valid attendee with all fields", () => {
		const result = attendeeSchema.safeParse({
			name: "John Doe",
			email: "john@example.com",
			role: "REQ_PARTICIPANT",
			status: "ACCEPTED",
			rsvp: true,
		});
		expect(result.success).toBe(true);
	});

	it("should validate attendee with only email", () => {
		const result = attendeeSchema.safeParse({
			email: "john@example.com",
		});
		expect(result.success).toBe(true);
	});

	it("should reject invalid email", () => {
		const result = attendeeSchema.safeParse({
			email: "not-an-email",
		});
		expect(result.success).toBe(false);
	});

	it("should reject invalid role", () => {
		const result = attendeeSchema.safeParse({
			email: "john@example.com",
			role: "INVALID_ROLE",
		});
		expect(result.success).toBe(false);
	});

	it("should reject invalid status", () => {
		const result = attendeeSchema.safeParse({
			email: "john@example.com",
			status: "INVALID_STATUS",
		});
		expect(result.success).toBe(false);
	});

	it("should allow null for optional fields", () => {
		const result = attendeeSchema.safeParse({
			name: null,
			email: "john@example.com",
			role: null,
			status: null,
		});
		expect(result.success).toBe(true);
	});
});

describe("alarmSchema", () => {
	describe("DISPLAY action", () => {
		it("should validate DISPLAY alarm with summary", () => {
			const result = alarmSchema.safeParse({
				trigger: "-PT15M",
				action: "DISPLAY",
				summary: "Reminder",
			});
			expect(result.success).toBe(true);
		});

		it("should reject DISPLAY alarm without summary", () => {
			const result = alarmSchema.safeParse({
				trigger: "-PT15M",
				action: "DISPLAY",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((i) => i.path.includes("summary")),
				).toBe(true);
			}
		});

		it("should reject DISPLAY alarm with empty summary", () => {
			const result = alarmSchema.safeParse({
				trigger: "-PT15M",
				action: "DISPLAY",
				summary: "   ",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("EMAIL action", () => {
		it("should validate EMAIL alarm with summary and description", () => {
			const result = alarmSchema.safeParse({
				trigger: "-PT1H",
				action: "EMAIL",
				summary: "Meeting Reminder",
				description: "Your meeting starts soon",
			});
			expect(result.success).toBe(true);
		});

		it("should reject EMAIL alarm without description", () => {
			const result = alarmSchema.safeParse({
				trigger: "-PT1H",
				action: "EMAIL",
				summary: "Meeting Reminder",
			});
			expect(result.success).toBe(false);
		});

		it("should reject EMAIL alarm without summary", () => {
			const result = alarmSchema.safeParse({
				trigger: "-PT1H",
				action: "EMAIL",
				description: "Your meeting starts soon",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("AUDIO action", () => {
		it("should validate AUDIO alarm without summary/description", () => {
			const result = alarmSchema.safeParse({
				trigger: "-PT5M",
				action: "AUDIO",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("trigger validation", () => {
		it("should validate negative duration trigger", () => {
			const result = alarmSchema.safeParse({
				trigger: "-PT15M",
				action: "DISPLAY",
				summary: "Test",
			});
			expect(result.success).toBe(true);
		});

		it("should validate absolute datetime trigger", () => {
			const result = alarmSchema.safeParse({
				trigger: "20240115T093000Z",
				action: "DISPLAY",
				summary: "Test",
			});
			expect(result.success).toBe(true);
		});

		it("should reject empty trigger", () => {
			const result = alarmSchema.safeParse({
				trigger: "",
				action: "DISPLAY",
				summary: "Test",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("repeat and duration", () => {
		it("should validate alarm with repeat and duration", () => {
			const result = alarmSchema.safeParse({
				trigger: "-PT15M",
				action: "DISPLAY",
				summary: "Test",
				repeat: 3,
				duration: "PT5M",
			});
			expect(result.success).toBe(true);
		});

		it("should reject negative repeat", () => {
			const result = alarmSchema.safeParse({
				trigger: "-PT15M",
				action: "DISPLAY",
				summary: "Test",
				repeat: -1,
			});
			expect(result.success).toBe(false);
		});
	});
});

describe("rruleSchema", () => {
	describe("valid RRULE patterns", () => {
		it("should validate daily recurrence", () => {
			const result = rruleSchema.safeParse("FREQ=DAILY");
			expect(result.success).toBe(true);
		});

		it("should validate weekly recurrence with BYDAY", () => {
			const result = rruleSchema.safeParse("FREQ=WEEKLY;BYDAY=MO,WE,FR");
			expect(result.success).toBe(true);
		});

		it("should validate monthly recurrence", () => {
			const result = rruleSchema.safeParse("FREQ=MONTHLY;BYMONTHDAY=15");
			expect(result.success).toBe(true);
		});

		it("should validate yearly recurrence", () => {
			const result = rruleSchema.safeParse(
				"FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1",
			);
			expect(result.success).toBe(true);
		});

		it("should validate recurrence with COUNT", () => {
			const result = rruleSchema.safeParse("FREQ=DAILY;COUNT=10");
			expect(result.success).toBe(true);
		});

		it("should validate recurrence with UNTIL", () => {
			const result = rruleSchema.safeParse("FREQ=DAILY;UNTIL=20241231T235959Z");
			expect(result.success).toBe(true);
		});

		it("should validate recurrence with INTERVAL", () => {
			const result = rruleSchema.safeParse("FREQ=WEEKLY;INTERVAL=2");
			expect(result.success).toBe(true);
		});

		it("should allow null and empty string", () => {
			expect(rruleSchema.safeParse(null).success).toBe(true);
			expect(rruleSchema.safeParse("").success).toBe(true);
		});
	});

	describe("invalid RRULE patterns", () => {
		it("should reject RRULE without FREQ", () => {
			const result = rruleSchema.safeParse("BYDAY=MO,WE,FR");
			expect(result.success).toBe(false);
		});

		it("should reject invalid FREQ value", () => {
			const result = rruleSchema.safeParse("FREQ=INVALID");
			expect(result.success).toBe(false);
		});

		it("should reject UNTIL and COUNT together", () => {
			const result = rruleSchema.safeParse(
				"FREQ=DAILY;UNTIL=20241231T235959Z;COUNT=10",
			);
			expect(result.success).toBe(false);
		});

		it("should reject invalid COUNT (zero)", () => {
			const result = rruleSchema.safeParse("FREQ=DAILY;COUNT=0");
			expect(result.success).toBe(false);
		});

		it("should reject invalid INTERVAL (zero)", () => {
			const result = rruleSchema.safeParse("FREQ=DAILY;INTERVAL=0");
			expect(result.success).toBe(false);
		});
	});
});

describe("geoCoordinatesSchema", () => {
	it("should validate both coordinates provided", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: 48.8566,
			geoLongitude: 2.3522,
		});
		expect(result.success).toBe(true);
	});

	it("should validate neither coordinate provided", () => {
		const result = geoCoordinatesSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("should validate null coordinates", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: null,
			geoLongitude: null,
		});
		expect(result.success).toBe(true);
	});

	it("should reject only latitude provided", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: 48.8566,
		});
		expect(result.success).toBe(false);
	});

	it("should reject only longitude provided", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLongitude: 2.3522,
		});
		expect(result.success).toBe(false);
	});

	it("should reject latitude out of range", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: 100,
			geoLongitude: 2.3522,
		});
		expect(result.success).toBe(false);
	});

	it("should reject longitude out of range", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: 48.8566,
			geoLongitude: 200,
		});
		expect(result.success).toBe(false);
	});

	it("should validate edge values", () => {
		expect(
			geoCoordinatesSchema.safeParse({
				geoLatitude: -90,
				geoLongitude: -180,
			}).success,
		).toBe(true);
		expect(
			geoCoordinatesSchema.safeParse({
				geoLatitude: 90,
				geoLongitude: 180,
			}).success,
		).toBe(true);
	});
});

describe("recurrenceIdSchema", () => {
	it("should validate datetime format with Z", () => {
		const result = recurrenceIdSchema.safeParse("20240115T100000Z");
		expect(result.success).toBe(true);
	});

	it("should validate datetime format without Z", () => {
		const result = recurrenceIdSchema.safeParse("20240115T100000");
		expect(result.success).toBe(true);
	});

	it("should validate date-only format", () => {
		const result = recurrenceIdSchema.safeParse("20240115");
		expect(result.success).toBe(true);
	});

	it("should allow empty string (transforms to null)", () => {
		const result = recurrenceIdSchema.safeParse("");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe(null);
		}
	});

	it("should allow null", () => {
		const result = recurrenceIdSchema.safeParse(null);
		expect(result.success).toBe(true);
	});

	it("should reject invalid format", () => {
		const result = recurrenceIdSchema.safeParse("2024-01-15T10:00:00Z");
		expect(result.success).toBe(false);
	});
});

describe("uidSchema", () => {
	it("should validate UID without spaces", () => {
		const result = uidSchema.safeParse("event-123@example.com");
		expect(result.success).toBe(true);
	});

	it("should reject UID with spaces", () => {
		const result = uidSchema.safeParse("event 123");
		expect(result.success).toBe(false);
	});

	it("should allow empty string (transforms to null)", () => {
		const result = uidSchema.safeParse("");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe(null);
		}
	});

	it("should allow null", () => {
		const result = uidSchema.safeParse(null);
		expect(result.success).toBe(true);
	});

	it("should trim whitespace", () => {
		const result = uidSchema.safeParse("  uid-123  ");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe("uid-123");
		}
	});
});

describe("colorSchema", () => {
	it("should validate valid hex color", () => {
		const result = colorSchema.safeParse("#FF5733");
		expect(result.success).toBe(true);
	});

	it("should validate lowercase hex color", () => {
		const result = colorSchema.safeParse("#ff5733");
		expect(result.success).toBe(true);
	});

	it("should reject 3-digit hex color", () => {
		const result = colorSchema.safeParse("#F53");
		expect(result.success).toBe(false);
	});

	it("should reject color without hash", () => {
		const result = colorSchema.safeParse("FF5733");
		expect(result.success).toBe(false);
	});

	it("should reject invalid hex characters", () => {
		const result = colorSchema.safeParse("#GGGGGG");
		expect(result.success).toBe(false);
	});

	it("should allow null", () => {
		const result = colorSchema.safeParse(null);
		expect(result.success).toBe(true);
	});

	it("should reject empty string (regex requires hex format)", () => {
		const result = colorSchema.safeParse("");
		expect(result.success).toBe(false);
	});
});

describe("eventCreateSchema", () => {
	const validEvent = {
		calendarId: "cal-123",
		title: "Test Event",
		startDate: new Date("2024-01-15T10:00:00Z"),
		endDate: new Date("2024-01-15T11:00:00Z"),
	};

	describe("basic validation", () => {
		it("should validate a minimal valid event", () => {
			const result = eventCreateSchema.safeParse(validEvent);
			expect(result.success).toBe(true);
		});

		it("should reject event without title", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				title: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject event without calendarId", () => {
			const result = eventCreateSchema.safeParse({
				title: "Test",
				startDate: new Date("2024-01-15T10:00:00Z"),
				endDate: new Date("2024-01-15T11:00:00Z"),
			});
			expect(result.success).toBe(false);
		});
	});

	describe("date validation", () => {
		it("should reject endDate before startDate", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				startDate: new Date("2024-01-15T11:00:00Z"),
				endDate: new Date("2024-01-15T10:00:00Z"),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((i) => i.path.includes("endDate")),
				).toBe(true);
			}
		});

		it("should reject same start and end date", () => {
			const sameDate = new Date("2024-01-15T10:00:00Z");
			const result = eventCreateSchema.safeParse({
				...validEvent,
				startDate: sameDate,
				endDate: sameDate,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("geo coordinates validation", () => {
		it("should validate event with both coordinates", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				geoLatitude: 48.8566,
				geoLongitude: 2.3522,
			});
			expect(result.success).toBe(true);
		});

		it("should reject event with only latitude", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				geoLatitude: 48.8566,
			});
			expect(result.success).toBe(false);
		});

		it("should reject event with only longitude", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				geoLongitude: 2.3522,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("recurrenceId validation", () => {
		it("should validate event with rrule and recurrenceId", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				rrule: "FREQ=WEEKLY;BYDAY=MO",
				recurrenceId: "20240122T100000Z",
			});
			expect(result.success).toBe(true);
		});

		it("should reject recurrenceId without rrule", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				recurrenceId: "20240122T100000Z",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((i) => i.path.includes("recurrenceId")),
				).toBe(true);
			}
		});
	});

	describe("metadata validation", () => {
		it("should validate all status values", () => {
			for (const status of ["CONFIRMED", "TENTATIVE", "CANCELLED"]) {
				const result = eventCreateSchema.safeParse({
					...validEvent,
					status,
				});
				expect(result.success).toBe(true);
			}
		});

		it("should validate all class values", () => {
			for (const cls of ["PUBLIC", "PRIVATE", "CONFIDENTIAL"]) {
				const result = eventCreateSchema.safeParse({
					...validEvent,
					class: cls,
				});
				expect(result.success).toBe(true);
			}
		});

		it("should validate priority range", () => {
			for (const priority of [0, 1, 5, 9]) {
				const result = eventCreateSchema.safeParse({
					...validEvent,
					priority,
				});
				expect(result.success).toBe(true);
			}
		});

		it("should reject priority out of range", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				priority: 10,
			});
			expect(result.success).toBe(false);
		});

		it("should validate transp values", () => {
			for (const transp of ["OPAQUE", "TRANSPARENT"]) {
				const result = eventCreateSchema.safeParse({
					...validEvent,
					transp,
				});
				expect(result.success).toBe(true);
			}
		});
	});

	describe("attendees validation", () => {
		it("should validate event with attendees", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				attendees: [
					{
						email: "alice@example.com",
						name: "Alice",
						role: "REQ_PARTICIPANT",
						status: "ACCEPTED",
					},
					{
						email: "bob@example.com",
					},
				],
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid attendee", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				attendees: [
					{
						email: "not-valid-email",
					},
				],
			});
			expect(result.success).toBe(false);
		});
	});

	describe("alarms validation", () => {
		it("should validate event with alarms", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				alarms: [
					{
						trigger: "-PT15M",
						action: "DISPLAY",
						summary: "Reminder",
					},
				],
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid alarm", () => {
			const result = eventCreateSchema.safeParse({
				...validEvent,
				alarms: [
					{
						trigger: "-PT15M",
						action: "DISPLAY",
						// Missing required summary for DISPLAY
					},
				],
			});
			expect(result.success).toBe(false);
		});
	});
});
