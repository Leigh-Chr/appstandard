/**
 * Tests for VTODO generator
 */
import { describe, expect, it } from "vitest";
import {
	generateSingleTodo,
	generateTodoFile,
} from "../generator/todo-generator";
import type { TaskInput } from "../types";

describe("generateTodoFile", () => {
	describe("basic generation", () => {
		it("should generate a minimal VTODO", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Buy groceries",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("BEGIN:VCALENDAR");
			expect(result).toContain("VERSION:2.0");
			expect(result).toContain("BEGIN:VTODO");
			expect(result).toContain("SUMMARY:Buy groceries");
			expect(result).toContain("END:VTODO");
			expect(result).toContain("END:VCALENDAR");
		});

		it("should generate multiple VTODOs", () => {
			const tasks: TaskInput[] = [{ summary: "Task 1" }, { summary: "Task 2" }];

			const result = generateTodoFile(tasks);
			expect(result.match(/BEGIN:VTODO/g)).toHaveLength(2);
			expect(result.match(/END:VTODO/g)).toHaveLength(2);
		});

		it("should include custom PRODID", () => {
			const tasks: TaskInput[] = [{ summary: "Task" }];
			const result = generateTodoFile(tasks, {
				prodId: "-//Custom App//Tasks//EN",
			});
			expect(result).toContain("PRODID:-//Custom App//Tasks//EN");
		});

		it("should include custom calendar name", () => {
			const tasks: TaskInput[] = [{ summary: "Task" }];
			const result = generateTodoFile(tasks, {
				calendarName: "My Tasks",
			});
			expect(result).toContain("X-WR-CALNAME:My Tasks");
		});

		it("should include UID", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					uid: "custom-uid-12345",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("UID:custom-uid-12345");
		});

		it("should generate UID if not provided", () => {
			const tasks: TaskInput[] = [{ summary: "Task" }];
			const result = generateTodoFile(tasks);
			expect(result).toMatch(/UID:[a-f0-9-]+/);
		});

		it("should include DTSTAMP", () => {
			const tasks: TaskInput[] = [{ summary: "Task" }];
			const result = generateTodoFile(tasks);
			expect(result).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
		});
	});

	describe("status properties", () => {
		it("should generate STATUS", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					status: "IN-PROCESS",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("STATUS:IN-PROCESS");
		});

		it("should generate PRIORITY", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					priority: 1,
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("PRIORITY:1");
		});

		it("should bound PRIORITY to 0-9", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					priority: 15,
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("PRIORITY:9");
		});

		it("should generate PERCENT-COMPLETE", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					percentComplete: 75,
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("PERCENT-COMPLETE:75");
		});

		it("should bound PERCENT-COMPLETE to 0-100", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					percentComplete: 150,
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("PERCENT-COMPLETE:100");
		});
	});

	describe("date properties", () => {
		it("should generate DTSTART", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					dtstart: new Date("2023-06-15T10:00:00Z"),
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("DTSTART:20230615T100000Z");
		});

		it("should generate DUE", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					due: new Date("2023-06-20T17:00:00Z"),
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("DUE:20230620T170000Z");
		});

		it("should generate COMPLETED", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					completed: new Date("2023-06-18T15:00:00Z"),
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("COMPLETED:20230618T150000Z");
		});

		it("should generate CREATED and LAST-MODIFIED", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					created: new Date("2023-06-01T12:00:00Z"),
					lastModified: new Date("2023-06-15T14:00:00Z"),
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("CREATED:20230601T120000Z");
			expect(result).toContain("LAST-MODIFIED:20230615T140000Z");
		});
	});

	describe("content properties", () => {
		it("should generate DESCRIPTION with escaping", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					description: "Line 1\nLine 2; with semicolon",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("DESCRIPTION:Line 1\\nLine 2\\; with semicolon");
		});

		it("should generate LOCATION", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					location: "Conference Room A",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("LOCATION:Conference Room A");
		});

		it("should generate URL", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					url: "https://example.com/task",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("URL:https://example.com/task");
		});

		it("should generate COMMENT", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					comment: "This is a comment",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("COMMENT:This is a comment");
		});
	});

	describe("classification", () => {
		it("should generate CLASS", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					class: "PRIVATE",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("CLASS:PRIVATE");
		});

		it("should uppercase CLASS value", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					class: "confidential",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("CLASS:CONFIDENTIAL");
		});
	});

	describe("geolocation", () => {
		it("should generate GEO", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					geoLatitude: 40.7128,
					geoLongitude: -74.006,
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("GEO:40.7128;-74.006");
		});

		it("should not generate GEO if only latitude is provided", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					geoLatitude: 40.7128,
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).not.toContain("GEO:");
		});
	});

	describe("organizer", () => {
		it("should generate ORGANIZER with email only", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					organizerEmail: "organizer@example.com",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("ORGANIZER:mailto:organizer@example.com");
		});

		it("should generate ORGANIZER with CN", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					organizerEmail: "organizer@example.com",
					organizerName: "John Doe",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain(
				"ORGANIZER;CN=John Doe:mailto:organizer@example.com",
			);
		});
	});

	describe("categories", () => {
		it("should generate CATEGORIES", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					categories: ["Work", "Important", "Priority"],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("CATEGORIES:Work,Important,Priority");
		});

		it("should escape special characters in CATEGORIES", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					categories: ["Work; Office", "Home, Personal"],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("Work\\; Office");
			expect(result).toContain("Home\\, Personal");
		});
	});

	describe("resources", () => {
		it("should generate RESOURCES", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					resources: ["Computer", "Projector"],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("RESOURCES:Computer,Projector");
		});
	});

	describe("recurrence", () => {
		it("should generate RRULE", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					rrule: "FREQ=WEEKLY;BYDAY=MO",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO");
		});

		it("should generate RDATE", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					rdate: [
						new Date("2023-06-15T10:00:00Z"),
						new Date("2023-06-20T10:00:00Z"),
					],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("RDATE:");
		});

		it("should generate EXDATE", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					exdate: [new Date("2023-06-17T10:00:00Z")],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("EXDATE:");
		});

		it("should generate DURATION", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					duration: "PT1H30M",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("DURATION:PT1H30M");
		});

		it("should generate SEQUENCE", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					sequence: 3,
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("SEQUENCE:3");
		});

		it("should generate RECURRENCE-ID", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					recurrenceId: "20230615T100000Z",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("RECURRENCE-ID:20230615T100000Z");
		});
	});

	describe("relations", () => {
		it("should generate RELATED-TO", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Subtask",
					relatedTo: "parent-uid",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("RELATED-TO:parent-uid");
		});

		it("should generate RELATED-TO with RELTYPE", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Subtask",
					relatedTo: "parent-uid",
					relationType: "PARENT",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("RELATED-TO;RELTYPE=PARENT:parent-uid");
		});
	});

	describe("attendees", () => {
		it("should generate ATTENDEE", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					attendees: [{ email: "attendee@example.com" }],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("ATTENDEE:mailto:attendee@example.com");
		});

		it("should generate ATTENDEE with CN and parameters", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					attendees: [
						{
							email: "jane@example.com",
							name: "Jane Doe",
							role: "REQ-PARTICIPANT",
							status: "ACCEPTED",
							rsvp: true,
						},
					],
				},
			];

			const result = generateTodoFile(tasks);
			// The line may be folded, so check for parts instead
			expect(result).toContain(
				"ATTENDEE;CN=Jane Doe;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE:mailt",
			);
			expect(result).toContain("o:jane@example.com");
		});

		it("should generate multiple ATTENDEEs", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					attendees: [
						{ email: "person1@example.com" },
						{ email: "person2@example.com" },
					],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result.match(/ATTENDEE/g)?.length).toBe(2);
		});
	});

	describe("alarms", () => {
		it("should generate VALARM", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					alarms: [
						{
							trigger: "-PT15M",
							action: "DISPLAY",
							description: "Reminder",
						},
					],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("BEGIN:VALARM");
			expect(result).toContain("TRIGGER:-PT15M");
			expect(result).toContain("ACTION:DISPLAY");
			expect(result).toContain("DESCRIPTION:Reminder");
			expect(result).toContain("END:VALARM");
		});

		it("should use DISPLAY as default action", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					alarms: [
						{
							trigger: "-PT10M",
						},
					],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("ACTION:DISPLAY");
		});

		it("should use task summary as fallback description", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Important Task",
					alarms: [
						{
							trigger: "-PT10M",
						},
					],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("DESCRIPTION:Important Task");
		});

		it("should generate multiple VALARMs", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					alarms: [{ trigger: "-PT30M" }, { trigger: "-PT5M" }],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result.match(/BEGIN:VALARM/g)?.length).toBe(2);
			expect(result.match(/END:VALARM/g)?.length).toBe(2);
		});
	});

	describe("attachments", () => {
		it("should generate ATTACH with URI", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					attachments: [{ uri: "https://example.com/doc.pdf" }],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("ATTACH:https://example.com/doc.pdf");
		});

		it("should generate ATTACH with FMTTYPE", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					attachments: [
						{
							uri: "https://example.com/doc.pdf",
							fmttype: "application/pdf",
						},
					],
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("ATTACH;FMTTYPE=application/pdf:");
		});
	});

	describe("extensions", () => {
		it("should generate COLOR", () => {
			const tasks: TaskInput[] = [
				{
					summary: "Task",
					color: "crimson",
				},
			];

			const result = generateTodoFile(tasks);
			expect(result).toContain("COLOR:crimson");
		});
	});
});

describe("generateSingleTodo", () => {
	it("should generate a single VTODO without VCALENDAR wrapper", () => {
		const task: TaskInput = {
			summary: "Single Task",
		};

		const result = generateSingleTodo(task);
		expect(result).toContain("BEGIN:VTODO");
		expect(result).toContain("SUMMARY:Single Task");
		expect(result).toContain("END:VTODO");
		expect(result).not.toContain("BEGIN:VCALENDAR");
		expect(result).not.toContain("END:VCALENDAR");
	});
});
