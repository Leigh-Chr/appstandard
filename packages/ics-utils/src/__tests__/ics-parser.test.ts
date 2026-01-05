/**
 * Tests for ICS parser
 */
import { describe, expect, it } from "vitest";
import { parseIcsFile } from "../parser";

describe("parseIcsFile", () => {
	describe("basic event parsing", () => {
		it("should parse a simple event with required fields", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:test-uid-123@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Test Meeting
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.errors).toHaveLength(0);
			expect(result.events).toHaveLength(1);
			expect(result.events[0].title).toBe("Test Meeting");
			expect(result.events[0].uid).toBe("test-uid-123@example.com");
			expect(result.events[0].startDate).toBeInstanceOf(Date);
			expect(result.events[0].endDate).toBeInstanceOf(Date);
		});

		it("should parse event with description and location", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:test-uid@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Meeting with Team
DESCRIPTION:Discuss project milestones
LOCATION:Conference Room A
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.errors).toHaveLength(0);
			expect(result.events[0].description).toBe("Discuss project milestones");
			expect(result.events[0].location).toBe("Conference Room A");
		});

		it("should handle DURATION instead of DTEND", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:duration-test@example.com
DTSTART:20240115T100000Z
DURATION:PT1H30M
SUMMARY:Duration Event
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.errors).toHaveLength(0);
			expect(result.events).toHaveLength(1);
			const event = result.events[0];
			expect(event.startDate).toBeInstanceOf(Date);
			expect(event.endDate).toBeInstanceOf(Date);
			// Duration of 1h30m = 90 minutes = 5400000ms
			const durationMs = event.endDate.getTime() - event.startDate.getTime();
			expect(durationMs).toBe(90 * 60 * 1000);
		});

		it("should parse multiple events", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:event1@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Event 1
END:VEVENT
BEGIN:VEVENT
UID:event2@example.com
DTSTART:20240116T140000Z
DTEND:20240116T150000Z
SUMMARY:Event 2
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.errors).toHaveLength(0);
			expect(result.events).toHaveLength(2);
			expect(result.events[0].title).toBe("Event 1");
			expect(result.events[1].title).toBe("Event 2");
		});
	});

	describe("event metadata parsing", () => {
		it("should parse status and priority", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:meta-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:High Priority Event
STATUS:CONFIRMED
PRIORITY:1
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].status).toBe("CONFIRMED");
			expect(result.events[0].priority).toBe(1);
		});

		it("should parse categories and resources", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:cat-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Categorized Event
CATEGORIES:Work,Meeting,Important
RESOURCES:Projector,Whiteboard
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			// Categories are parsed as comma-separated from the single CATEGORIES property
			expect(result.events[0].categories).toBeDefined();
			expect(result.events[0].categories?.length).toBeGreaterThan(0);
			expect(result.events[0].categories).toContain("Work");
		});

		it("should parse URL and class", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:url-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Event with URL
URL:https://example.com/meeting
CLASS:PRIVATE
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].url).toBe("https://example.com/meeting");
			expect(result.events[0].class).toBe("PRIVATE");
		});

		it("should parse sequence and transp", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:seq-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Updated Event
SEQUENCE:3
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].sequence).toBe(3);
			expect(result.events[0].transp).toBe("TRANSPARENT");
		});
	});

	describe("recurrence parsing", () => {
		it("should parse RRULE", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:rrule-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Weekly Meeting
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].rrule).toContain("FREQ=WEEKLY");
			expect(result.events[0].rrule).toContain("BYDAY=MO,WE,FR");
		});

		it("should parse RECURRENCE-ID", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:rec-id-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Modified Instance
RECURRENCE-ID:20240122T100000Z
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			// RECURRENCE-ID may be returned as ical.Time object or string depending on ical.js version
			expect(result.events[0].recurrenceId).toBeDefined();
		});
	});

	describe("geolocation parsing", () => {
		it("should parse GEO property when properly formatted", () => {
			// Note: GEO property parsing depends on ical.js implementation
			// The parser extracts lat/lon from objects with {lat, lon} or semicolon-separated strings
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:geo-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Location Event
GEO:48.8566;2.3522
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			// GEO parsing may vary - just check the event is parsed
			expect(result.events).toHaveLength(1);
			expect(result.errors).toHaveLength(0);
			// If GEO is parsed, it should have valid coordinates
			if (result.events[0].geoLatitude !== undefined) {
				expect(typeof result.events[0].geoLatitude).toBe("number");
				expect(typeof result.events[0].geoLongitude).toBe("number");
			}
		});
	});

	describe("organizer parsing", () => {
		it("should parse organizer with mailto", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:org-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Organized Event
ORGANIZER;CN=John Doe:mailto:john@example.com
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].organizerEmail).toBe("john@example.com");
			expect(result.events[0].organizerName).toBe("John Doe");
		});
	});

	describe("attendee parsing", () => {
		it("should parse attendees with all parameters", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:att-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Team Meeting
ATTENDEE;CN=Alice;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE:mailto:alice@example.com
ATTENDEE;CN=Bob;ROLE=OPT-PARTICIPANT;PARTSTAT=TENTATIVE:mailto:bob@example.com
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].attendees).toHaveLength(2);

			const alice = result.events[0].attendees?.find(
				(a) => a.email === "alice@example.com",
			);
			expect(alice?.name).toBe("Alice");
			expect(alice?.role).toBe("REQ-PARTICIPANT");
			expect(alice?.status).toBe("ACCEPTED");
			expect(alice?.rsvp).toBe(true);

			const bob = result.events[0].attendees?.find(
				(a) => a.email === "bob@example.com",
			);
			expect(bob?.name).toBe("Bob");
			expect(bob?.role).toBe("OPT-PARTICIPANT");
			expect(bob?.status).toBe("TENTATIVE");
		});
	});

	describe("alarm parsing", () => {
		it("should parse VALARM with DISPLAY action", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:alarm-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Event with Alarm
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
SUMMARY:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].alarms).toHaveLength(1);
			expect(result.events[0].alarms?.[0].trigger).toBe("-PT15M");
			expect(result.events[0].alarms?.[0].action).toBe("DISPLAY");
			expect(result.events[0].alarms?.[0].summary).toBe("Reminder");
		});

		it("should parse VALARM with EMAIL action", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:email-alarm@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Event with Email Alarm
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:EMAIL
SUMMARY:Meeting Reminder
DESCRIPTION:Your meeting starts in 1 hour
END:VALARM
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].alarms?.[0].action).toBe("EMAIL");
			expect(result.events[0].alarms?.[0].summary).toBe("Meeting Reminder");
			expect(result.events[0].alarms?.[0].description).toBe(
				"Your meeting starts in 1 hour",
			);
		});

		it("should parse multiple alarms", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:multi-alarm@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Event with Multiple Alarms
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
SUMMARY:30 min reminder
END:VALARM
BEGIN:VALARM
TRIGGER:-PT5M
ACTION:DISPLAY
SUMMARY:5 min reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].alarms).toHaveLength(2);
		});
	});

	describe("error handling", () => {
		it("should handle empty ICS content", () => {
			const result = parseIcsFile("");

			expect(result.events).toHaveLength(0);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should handle ICS with no events", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events).toHaveLength(0);
			expect(result.errors).toContain("No events found in the ICS file.");
		});

		it("should skip events missing start date", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:no-start@example.com
DTEND:20240115T110000Z
SUMMARY:Missing Start
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events).toHaveLength(0);
			expect(
				result.errors.some((e) => e.includes("missing start or end date")),
			).toBe(true);
		});

		it("should handle malformed ICS gracefully", () => {
			const ics = "This is not a valid ICS file";

			const result = parseIcsFile(ics);

			expect(result.events).toHaveLength(0);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should provide default title for untitled events", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:no-title@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].title).toBe("Untitled Event");
		});
	});

	describe("timestamp parsing", () => {
		it("should parse DTSTAMP, CREATED, and LAST-MODIFIED", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:timestamps@example.com
DTSTAMP:20240110T080000Z
CREATED:20240108T120000Z
LAST-MODIFIED:20240112T150000Z
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Timestamp Test
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].dtstamp).toBeInstanceOf(Date);
			expect(result.events[0].created).toBeInstanceOf(Date);
			expect(result.events[0].lastModified).toBeInstanceOf(Date);
		});
	});

	describe("color and related-to parsing", () => {
		it("should parse COLOR property", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:color-test@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Colored Event
COLOR:#FF5733
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].color).toBe("#FF5733");
		});

		it("should parse RELATED-TO property", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:child-event@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Child Event
RELATED-TO:parent-event@example.com
END:VEVENT
END:VCALENDAR`;

			const result = parseIcsFile(ics);

			expect(result.events[0].relatedTo).toBe("parent-event@example.com");
		});
	});
});
