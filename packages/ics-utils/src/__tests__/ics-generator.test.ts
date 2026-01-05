/**
 * Tests for ICS generator
 */
import { describe, expect, it } from "vitest";
import { escapeIcsText, generateIcsFile, unescapeIcsText } from "../generator";
import { parseIcsFile } from "../parser";
import type { EventInput } from "../types";

describe("escapeIcsText", () => {
	it("should escape backslashes", () => {
		expect(escapeIcsText("path\\to\\file")).toBe("path\\\\to\\\\file");
	});

	it("should escape semicolons", () => {
		expect(escapeIcsText("item1;item2")).toBe("item1\\;item2");
	});

	it("should escape commas", () => {
		expect(escapeIcsText("a,b,c")).toBe("a\\,b\\,c");
	});

	it("should escape newlines", () => {
		expect(escapeIcsText("line1\nline2")).toBe("line1\\nline2");
	});

	it("should remove carriage returns", () => {
		expect(escapeIcsText("line1\r\nline2")).toBe("line1\\nline2");
	});

	it("should handle multiple special characters", () => {
		expect(escapeIcsText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
	});

	it("should handle empty string", () => {
		expect(escapeIcsText("")).toBe("");
	});
});

describe("unescapeIcsText", () => {
	it("should unescape backslashes", () => {
		expect(unescapeIcsText("path\\\\to\\\\file")).toBe("path\\to\\file");
	});

	it("should unescape semicolons", () => {
		expect(unescapeIcsText("item1\\;item2")).toBe("item1;item2");
	});

	it("should unescape commas", () => {
		expect(unescapeIcsText("a\\,b\\,c")).toBe("a,b,c");
	});

	it("should unescape newlines", () => {
		expect(unescapeIcsText("line1\\nline2")).toBe("line1\nline2");
	});

	it("should handle empty string", () => {
		expect(unescapeIcsText("")).toBe("");
	});

	it("should be inverse of escapeIcsText", () => {
		const original = "Test: a\\b;c,d\ne";
		const escaped = escapeIcsText(original);
		const unescaped = unescapeIcsText(escaped);
		// Note: carriage returns are removed during escape
		expect(unescaped).toBe(original.replace(/\r/g, ""));
	});
});

describe("generateIcsFile", () => {
	const baseEvent: EventInput = {
		uid: "test-uid@example.com",
		title: "Test Event",
		startDate: new Date("2024-01-15T10:00:00Z"),
		endDate: new Date("2024-01-15T11:00:00Z"),
	};

	describe("basic generation", () => {
		it("should generate valid ICS header", () => {
			const result = generateIcsFile({
				calendarName: "Test Calendar",
				events: [],
			});

			expect(result).toContain("BEGIN:VCALENDAR");
			expect(result).toContain("VERSION:2.0");
			expect(result).toContain("PRODID:");
			expect(result).toContain("CALSCALE:GREGORIAN");
			expect(result).toContain("METHOD:PUBLISH");
			expect(result).toContain("X-WR-CALNAME:Test Calendar");
			expect(result).toContain("END:VCALENDAR");
		});

		it("should generate event with basic properties", () => {
			const result = generateIcsFile({
				calendarName: "Test Calendar",
				events: [baseEvent],
			});

			expect(result).toContain("BEGIN:VEVENT");
			expect(result).toContain("UID:test-uid@example.com");
			expect(result).toContain("DTSTART:20240115T100000Z");
			expect(result).toContain("DTEND:20240115T110000Z");
			expect(result).toContain("SUMMARY:Test Event");
			expect(result).toContain("END:VEVENT");
		});

		it("should generate unique UID if not provided", () => {
			const event: EventInput = {
				title: "No UID Event",
				startDate: new Date("2024-01-15T10:00:00Z"),
				endDate: new Date("2024-01-15T11:00:00Z"),
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toMatch(/UID:.+@appstandard/);
		});

		it("should include DTSTAMP", () => {
			const result = generateIcsFile({
				calendarName: "Test",
				events: [baseEvent],
			});

			expect(result).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
		});
	});

	describe("metadata generation", () => {
		it("should generate description and location", () => {
			const event: EventInput = {
				...baseEvent,
				description: "Event description",
				location: "Conference Room",
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("DESCRIPTION:Event description");
			expect(result).toContain("LOCATION:Conference Room");
		});

		it("should generate status and priority", () => {
			const event: EventInput = {
				...baseEvent,
				status: "confirmed",
				priority: 1,
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("STATUS:CONFIRMED");
			expect(result).toContain("PRIORITY:1");
		});

		it("should generate categories", () => {
			const event: EventInput = {
				...baseEvent,
				categories: ["Work", "Meeting"],
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("CATEGORIES:Work,Meeting");
		});

		it("should generate URL and class", () => {
			const event: EventInput = {
				...baseEvent,
				url: "https://example.com/meeting",
				class: "private",
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("URL:https://example.com/meeting");
			expect(result).toContain("CLASS:PRIVATE");
		});
	});

	describe("recurrence generation", () => {
		it("should generate RRULE", () => {
			const event: EventInput = {
				...baseEvent,
				rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10",
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10");
		});
	});

	describe("geolocation generation", () => {
		it("should generate GEO property", () => {
			const event: EventInput = {
				...baseEvent,
				geoLatitude: 48.8566,
				geoLongitude: 2.3522,
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("GEO:48.8566;2.3522");
		});

		it("should not generate GEO if only latitude is provided", () => {
			const event: EventInput = {
				...baseEvent,
				geoLatitude: 48.8566,
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).not.toContain("GEO:");
		});
	});

	describe("organizer generation", () => {
		it("should generate organizer with CN", () => {
			const event: EventInput = {
				...baseEvent,
				organizerEmail: "john@example.com",
				organizerName: "John Doe",
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("ORGANIZER;CN=John Doe:mailto:john@example.com");
		});

		it("should generate organizer without CN", () => {
			const event: EventInput = {
				...baseEvent,
				organizerEmail: "john@example.com",
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("ORGANIZER:mailto:john@example.com");
		});
	});

	describe("attendee generation", () => {
		it("should generate attendees with all parameters", () => {
			const event: EventInput = {
				...baseEvent,
				attendees: [
					{
						email: "alice@example.com",
						name: "Alice",
						role: "req-participant",
						status: "accepted",
						rsvp: true,
					},
				],
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain(
				"ATTENDEE;CN=Alice;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE:mailto:alice@example.com",
			);
		});

		it("should generate multiple attendees", () => {
			const event: EventInput = {
				...baseEvent,
				attendees: [
					{ email: "alice@example.com" },
					{ email: "bob@example.com" },
				],
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("ATTENDEE:mailto:alice@example.com");
			expect(result).toContain("ATTENDEE:mailto:bob@example.com");
		});
	});

	describe("alarm generation", () => {
		it("should generate VALARM with relative trigger", () => {
			const event: EventInput = {
				...baseEvent,
				alarms: [
					{
						trigger: "-PT15M",
						action: "display",
						summary: "Reminder",
					},
				],
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("BEGIN:VALARM");
			expect(result).toContain("TRIGGER:-PT15M");
			expect(result).toContain("ACTION:DISPLAY");
			expect(result).toContain("SUMMARY:Reminder");
			expect(result).toContain("END:VALARM");
		});

		it("should generate VALARM with absolute trigger", () => {
			const event: EventInput = {
				...baseEvent,
				alarms: [
					{
						trigger: "20240115T093000Z",
						action: "display",
					},
				],
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("TRIGGER;VALUE=DATE-TIME:20240115T093000Z");
		});

		it("should generate EMAIL alarm with description", () => {
			const event: EventInput = {
				...baseEvent,
				alarms: [
					{
						trigger: "-PT1H",
						action: "email",
						summary: "Meeting Soon",
						description: "Your meeting starts in 1 hour",
					},
				],
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("ACTION:EMAIL");
			expect(result).toContain("SUMMARY:Meeting Soon");
			expect(result).toContain("DESCRIPTION:Your meeting starts in 1 hour");
		});

		it("should generate alarm with repeat and duration", () => {
			const event: EventInput = {
				...baseEvent,
				alarms: [
					{
						trigger: "-PT15M",
						action: "display",
						repeat: 3,
						duration: "PT5M",
					},
				],
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("REPEAT:3");
			expect(result).toContain("DURATION:PT5M");
		});
	});

	describe("color generation", () => {
		it("should generate COLOR property", () => {
			const event: EventInput = {
				...baseEvent,
				color: "#FF5733",
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("COLOR:#FF5733");
		});
	});

	describe("escaping in generated content", () => {
		it("should escape special characters in summary", () => {
			const event: EventInput = {
				...baseEvent,
				title: "Meeting; Important, Notes\\here",
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("SUMMARY:Meeting\\; Important\\, Notes\\\\here");
		});

		it("should escape newlines in description", () => {
			const event: EventInput = {
				...baseEvent,
				description: "Line 1\nLine 2\nLine 3",
			};

			const result = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			expect(result).toContain("DESCRIPTION:Line 1\\nLine 2\\nLine 3");
		});
	});

	describe("round-trip parsing", () => {
		it("should generate ICS that can be parsed back", () => {
			const event: EventInput = {
				uid: "roundtrip@example.com",
				title: "Round Trip Event",
				startDate: new Date("2024-01-15T10:00:00Z"),
				endDate: new Date("2024-01-15T11:00:00Z"),
				description: "Test description",
				location: "Test location",
				status: "confirmed",
				priority: 5,
				categories: ["Work", "Test"],
			};

			const generated = generateIcsFile({
				calendarName: "Test Calendar",
				events: [event],
			});

			const parsed = parseIcsFile(generated);

			expect(parsed.errors).toHaveLength(0);
			expect(parsed.events).toHaveLength(1);
			expect(parsed.events[0].uid).toBe("roundtrip@example.com");
			expect(parsed.events[0].title).toBe("Round Trip Event");
			expect(parsed.events[0].description).toBe("Test description");
			expect(parsed.events[0].location).toBe("Test location");
			expect(parsed.events[0].status).toBe("CONFIRMED");
			expect(parsed.events[0].priority).toBe(5);
			// Categories should contain at least the first category
			expect(parsed.events[0].categories).toBeDefined();
			expect(parsed.events[0].categories).toContain("Work");
		});

		it("should preserve attendees through round-trip", () => {
			const event: EventInput = {
				uid: "attendee-roundtrip@example.com",
				title: "Meeting",
				startDate: new Date("2024-01-15T10:00:00Z"),
				endDate: new Date("2024-01-15T11:00:00Z"),
				attendees: [
					{
						email: "alice@example.com",
						name: "Alice",
						role: "req-participant",
						status: "accepted",
					},
				],
			};

			const generated = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			const parsed = parseIcsFile(generated);

			expect(parsed.events[0].attendees).toHaveLength(1);
			expect(parsed.events[0].attendees?.[0].email).toBe("alice@example.com");
			expect(parsed.events[0].attendees?.[0].name).toBe("Alice");
		});

		it("should preserve alarms through round-trip", () => {
			const event: EventInput = {
				uid: "alarm-roundtrip@example.com",
				title: "Event with Alarm",
				startDate: new Date("2024-01-15T10:00:00Z"),
				endDate: new Date("2024-01-15T11:00:00Z"),
				alarms: [
					{
						trigger: "-PT30M",
						action: "display",
						summary: "Reminder",
					},
				],
			};

			const generated = generateIcsFile({
				calendarName: "Test",
				events: [event],
			});

			const parsed = parseIcsFile(generated);

			expect(parsed.events[0].alarms).toHaveLength(1);
			expect(parsed.events[0].alarms?.[0].trigger).toBe("-PT30M");
			expect(parsed.events[0].alarms?.[0].action).toBe("DISPLAY");
		});
	});

	describe("custom PRODID", () => {
		it("should use custom PRODID when provided", () => {
			const result = generateIcsFile({
				calendarName: "Test",
				events: [],
				prodId: "-//Custom//Custom Product//EN",
			});

			expect(result).toContain("PRODID:-//Custom//Custom Product//EN");
		});
	});

	describe("multiple events", () => {
		it("should generate multiple events in one calendar", () => {
			const events: EventInput[] = [
				{
					uid: "event1@example.com",
					title: "Event 1",
					startDate: new Date("2024-01-15T10:00:00Z"),
					endDate: new Date("2024-01-15T11:00:00Z"),
				},
				{
					uid: "event2@example.com",
					title: "Event 2",
					startDate: new Date("2024-01-16T14:00:00Z"),
					endDate: new Date("2024-01-16T15:00:00Z"),
				},
			];

			const result = generateIcsFile({
				calendarName: "Test",
				events,
			});

			expect((result.match(/BEGIN:VEVENT/g) || []).length).toBe(2);
			expect((result.match(/END:VEVENT/g) || []).length).toBe(2);
			expect(result).toContain("SUMMARY:Event 1");
			expect(result).toContain("SUMMARY:Event 2");
		});
	});
});
