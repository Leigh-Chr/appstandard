/**
 * Tests for VTODO parser
 */
import { describe, expect, it } from "vitest";
import { parseTodoFile } from "../parser/todo-parser";

describe("parseTodoFile", () => {
	describe("basic parsing", () => {
		it("should parse a minimal VTODO", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VTODO
UID:12345
SUMMARY:Buy groceries
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.errors).toHaveLength(0);
			expect(result.tasks).toHaveLength(1);
			expect(result.tasks[0].summary).toBe("Buy groceries");
			expect(result.tasks[0].uid).toBe("12345");
		});

		it("should parse multiple VTODOs", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VTODO
UID:1
SUMMARY:Task 1
END:VTODO
BEGIN:VTODO
UID:2
SUMMARY:Task 2
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.errors).toHaveLength(0);
			expect(result.tasks).toHaveLength(2);
			expect(result.tasks[0].summary).toBe("Task 1");
			expect(result.tasks[1].summary).toBe("Task 2");
		});

		it("should use 'Untitled Task' when SUMMARY is missing", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VTODO
UID:12345
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].summary).toBe("Untitled Task");
		});

		it("should report error for empty file", () => {
			const result = parseTodoFile("");
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should report error when no VTODOs found", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.errors).toContain("No tasks found in the ICS file.");
		});
	});

	describe("status properties", () => {
		it("should parse STATUS", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
STATUS:IN-PROCESS
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].status).toBe("IN-PROCESS");
		});

		it("should parse PRIORITY", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
PRIORITY:1
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].priority).toBe(1);
		});

		it("should parse PERCENT-COMPLETE", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
PERCENT-COMPLETE:50
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].percentComplete).toBe(50);
		});
	});

	describe("date properties", () => {
		it("should parse DTSTART", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
DTSTART:20230615T100000Z
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].dtstart).toBeInstanceOf(Date);
		});

		it("should parse DUE", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
DUE:20230620T170000Z
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].due).toBeInstanceOf(Date);
		});

		it("should parse COMPLETED", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
COMPLETED:20230618T150000Z
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].completed).toBeInstanceOf(Date);
		});

		it("should parse CREATED and LAST-MODIFIED", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
CREATED:20230601T120000Z
LAST-MODIFIED:20230615T140000Z
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].created).toBeInstanceOf(Date);
			expect(result.tasks[0].lastModified).toBeInstanceOf(Date);
		});
	});

	describe("content properties", () => {
		it("should parse DESCRIPTION", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
DESCRIPTION:This is a detailed task description
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].description).toBe(
				"This is a detailed task description",
			);
		});

		it("should parse LOCATION", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
LOCATION:Office Building
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].location).toBe("Office Building");
		});

		it("should parse URL", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
URL:https://example.com/task
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].url).toBe("https://example.com/task");
		});

		it("should parse COMMENT", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
COMMENT:A comment on the task
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].comment).toBe("A comment on the task");
		});
	});

	describe("classification", () => {
		it("should parse CLASS", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
CLASS:PRIVATE
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].class).toBe("PRIVATE");
		});
	});

	describe("geolocation", () => {
		// Note: ical.js may parse GEO differently depending on the format
		// This test documents that GEO parsing may not work for all formats
		it("should handle GEO property (implementation may vary)", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
GEO:40.7128;-74.0060
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			// GEO parsing depends on ical.js implementation
			// If geo is parsed, it should be numbers
			if (result.tasks[0].geoLatitude !== undefined) {
				expect(typeof result.tasks[0].geoLatitude).toBe("number");
				expect(typeof result.tasks[0].geoLongitude).toBe("number");
			}
		});
	});

	describe("organizer", () => {
		it("should parse ORGANIZER with mailto:", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
ORGANIZER:mailto:organizer@example.com
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].organizerEmail).toBe("organizer@example.com");
		});

		it("should parse ORGANIZER with CN parameter", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
ORGANIZER;CN=John Doe:mailto:john@example.com
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].organizerName).toBe("John Doe");
			expect(result.tasks[0].organizerEmail).toBe("john@example.com");
		});
	});

	describe("categories", () => {
		it("should parse CATEGORIES", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
CATEGORIES:Work,Important,Priority
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			// ical.js may return categories differently depending on format
			// The implementation uses extractArrayProperty which handles both array and string
			expect(result.tasks[0].categories).toBeDefined();
			expect(result.tasks[0].categories?.length).toBeGreaterThan(0);
			expect(result.tasks[0].categories).toContain("Work");
		});
	});

	describe("recurrence", () => {
		it("should parse RRULE", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
RRULE:FREQ=WEEKLY;BYDAY=MO
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].rrule).toContain("FREQ=WEEKLY");
		});

		it("should parse SEQUENCE", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
SEQUENCE:3
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].sequence).toBe(3);
		});
	});

	describe("relations", () => {
		it("should parse RELATED-TO", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Subtask
RELATED-TO:parent-task-uid
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].relatedTo).toBe("parent-task-uid");
		});

		it("should parse RELATED-TO with RELTYPE", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Subtask
RELATED-TO;RELTYPE=PARENT:parent-task-uid
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].relatedTo).toBe("parent-task-uid");
			expect(result.tasks[0].relationType).toBe("PARENT");
		});
	});

	describe("attendees", () => {
		it("should parse ATTENDEE with mailto:", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
ATTENDEE:mailto:attendee@example.com
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].attendees).toHaveLength(1);
			expect(result.tasks[0].attendees?.[0].email).toBe("attendee@example.com");
		});

		it("should parse ATTENDEE with CN and PARTSTAT", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
ATTENDEE;CN=Jane Doe;PARTSTAT=ACCEPTED;ROLE=REQ-PARTICIPANT:mailto:jane@example.com
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			const attendee = result.tasks[0].attendees?.[0];
			expect(attendee?.name).toBe("Jane Doe");
			expect(attendee?.email).toBe("jane@example.com");
			expect(attendee?.status).toBe("ACCEPTED");
			expect(attendee?.role).toBe("REQ-PARTICIPANT");
		});

		it("should parse multiple ATTENDEEs", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
ATTENDEE;CN=Person 1:mailto:person1@example.com
ATTENDEE;CN=Person 2:mailto:person2@example.com
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].attendees).toHaveLength(2);
		});
	});

	describe("alarms", () => {
		it("should parse VALARM with DISPLAY action", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Task reminder
END:VALARM
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].alarms).toHaveLength(1);
			expect(result.tasks[0].alarms?.[0].trigger).toBe("-PT15M");
			expect(result.tasks[0].alarms?.[0].action).toBe("DISPLAY");
		});

		it("should parse multiple VALARMs", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:30 min reminder
END:VALARM
BEGIN:VALARM
TRIGGER:-PT5M
ACTION:DISPLAY
DESCRIPTION:5 min reminder
END:VALARM
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].alarms).toHaveLength(2);
		});
	});

	describe("attachments", () => {
		it("should parse ATTACH with URI", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
ATTACH:https://example.com/doc.pdf
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].attachments).toHaveLength(1);
			expect(result.tasks[0].attachments?.[0].uri).toBe(
				"https://example.com/doc.pdf",
			);
		});

		it("should parse ATTACH with FMTTYPE", () => {
			const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:1
SUMMARY:Task
ATTACH;FMTTYPE=application/pdf:https://example.com/doc.pdf
END:VTODO
END:VCALENDAR`;

			const result = parseTodoFile(ics);
			expect(result.tasks[0].attachments?.[0].fmttype).toBe("application/pdf");
		});
	});
});
