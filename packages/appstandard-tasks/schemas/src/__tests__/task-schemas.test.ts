/**
 * Tests for task Zod validation schemas
 */
import { describe, expect, it } from "vitest";
import {
	geoCoordinatesSchema,
	taskCreateSchema,
	taskListCreateSchema,
	taskListUpdateSchema,
	taskUpdateSchema,
} from "../task-schemas";

describe("taskCreateSchema", () => {
	const validTask = {
		taskListId: "list-123",
		title: "Complete project",
	};

	describe("required fields", () => {
		it("should validate with minimal required fields", () => {
			const result = taskCreateSchema.safeParse(validTask);

			expect(result.success).toBe(true);
		});

		it("should require taskListId", () => {
			const result = taskCreateSchema.safeParse({
				title: "Test",
			});

			expect(result.success).toBe(false);
		});

		it("should require title", () => {
			const result = taskCreateSchema.safeParse({
				taskListId: "list-123",
			});

			expect(result.success).toBe(false);
		});

		it("should reject empty title", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				title: "",
			});

			expect(result.success).toBe(false);
		});
	});

	describe("status validation", () => {
		it("should accept valid status values", () => {
			const statuses = ["NEEDS_ACTION", "IN_PROCESS", "COMPLETED", "CANCELLED"];

			for (const status of statuses) {
				const result = taskCreateSchema.safeParse({ ...validTask, status });
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid status", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				status: "INVALID",
			});

			expect(result.success).toBe(false);
		});

		it("should default to NEEDS_ACTION", () => {
			const result = taskCreateSchema.safeParse(validTask);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.status).toBe("NEEDS_ACTION");
			}
		});
	});

	describe("priority validation", () => {
		it("should accept priority values 0-9", () => {
			for (let priority = 0; priority <= 9; priority++) {
				const result = taskCreateSchema.safeParse({ ...validTask, priority });
				expect(result.success).toBe(true);
			}
		});

		it("should reject negative priority", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				priority: -1,
			});

			expect(result.success).toBe(false);
		});

		it("should reject priority > 9", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				priority: 10,
			});

			expect(result.success).toBe(false);
		});
	});

	describe("percentComplete validation", () => {
		it("should accept values 0-100", () => {
			const values = [0, 25, 50, 75, 100];

			for (const percentComplete of values) {
				const result = taskCreateSchema.safeParse({
					...validTask,
					percentComplete,
				});
				expect(result.success).toBe(true);
			}
		});

		it("should reject negative values", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				percentComplete: -1,
			});

			expect(result.success).toBe(false);
		});

		it("should reject values > 100", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				percentComplete: 101,
			});

			expect(result.success).toBe(false);
		});
	});

	describe("date validation", () => {
		it("should accept valid dates", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				startDate: "2024-01-15T10:00:00Z",
				dueDate: "2024-01-16T10:00:00Z",
			});

			expect(result.success).toBe(true);
		});

		it("should reject due date before start date", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				startDate: "2024-01-16T10:00:00Z",
				dueDate: "2024-01-15T10:00:00Z",
			});

			expect(result.success).toBe(false);
		});

		it("should allow same start and due date", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				startDate: "2024-01-15T10:00:00Z",
				dueDate: "2024-01-15T10:00:00Z",
			});

			expect(result.success).toBe(true);
		});

		it("should allow only start date", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				startDate: "2024-01-15T10:00:00Z",
			});

			expect(result.success).toBe(true);
		});

		it("should allow only due date", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				dueDate: "2024-01-15T10:00:00Z",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("geo coordinates validation", () => {
		it("should accept valid coordinates", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				geoLatitude: 40.7128,
				geoLongitude: -74.006,
			});

			expect(result.success).toBe(true);
		});

		it("should reject only latitude", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				geoLatitude: 40.7128,
			});

			expect(result.success).toBe(false);
		});

		it("should reject only longitude", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				geoLongitude: -74.006,
			});

			expect(result.success).toBe(false);
		});

		it("should reject invalid latitude range", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				geoLatitude: 91,
				geoLongitude: 0,
			});

			expect(result.success).toBe(false);
		});

		it("should reject invalid longitude range", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				geoLatitude: 0,
				geoLongitude: 181,
			});

			expect(result.success).toBe(false);
		});
	});

	describe("attendees validation", () => {
		it("should accept valid attendees", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				attendees: [
					{ email: "john@example.com", name: "John" },
					{ email: "jane@example.com" },
				],
			});

			expect(result.success).toBe(true);
		});

		it("should reject invalid attendee email", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				attendees: [{ email: "not-an-email" }],
			});

			expect(result.success).toBe(false);
		});
	});

	describe("alarms validation", () => {
		it("should accept valid DISPLAY alarm", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				alarms: [
					{
						trigger: "-PT15M",
						action: "DISPLAY",
						summary: "Task reminder",
					},
				],
			});

			expect(result.success).toBe(true);
		});

		it("should accept valid AUDIO alarm", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				alarms: [
					{
						trigger: "-PT15M",
						action: "AUDIO",
					},
				],
			});

			expect(result.success).toBe(true);
		});

		it("should accept valid EMAIL alarm", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				alarms: [
					{
						trigger: "-PT15M",
						action: "EMAIL",
						summary: "Task reminder",
						description: "Your task is due soon",
					},
				],
			});

			expect(result.success).toBe(true);
		});

		it("should reject DISPLAY alarm without summary", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				alarms: [
					{
						trigger: "-PT15M",
						action: "DISPLAY",
					},
				],
			});

			expect(result.success).toBe(false);
		});

		it("should reject EMAIL alarm without summary", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				alarms: [
					{
						trigger: "-PT15M",
						action: "EMAIL",
						description: "Description",
					},
				],
			});

			expect(result.success).toBe(false);
		});

		it("should reject EMAIL alarm without description", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				alarms: [
					{
						trigger: "-PT15M",
						action: "EMAIL",
						summary: "Summary",
					},
				],
			});

			expect(result.success).toBe(false);
		});
	});

	describe("RRULE validation", () => {
		it("should accept valid RRULE", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				rrule: "FREQ=DAILY;COUNT=10",
			});

			expect(result.success).toBe(true);
		});

		it("should reject RRULE without FREQ", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				rrule: "COUNT=10",
			});

			expect(result.success).toBe(false);
		});

		it("should reject RRULE with both UNTIL and COUNT", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				rrule: "FREQ=DAILY;UNTIL=20240131;COUNT=10",
			});

			expect(result.success).toBe(false);
		});
	});

	describe("color validation", () => {
		it("should accept valid hex color", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				color: "#FF0000",
			});

			expect(result.success).toBe(true);
		});

		it("should reject invalid color format", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				color: "red",
			});

			expect(result.success).toBe(false);
		});
	});

	describe("class validation", () => {
		it("should accept valid class values", () => {
			const classes = ["PUBLIC", "PRIVATE", "CONFIDENTIAL"];

			for (const cls of classes) {
				const result = taskCreateSchema.safeParse({ ...validTask, class: cls });
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid class", () => {
			const result = taskCreateSchema.safeParse({
				...validTask,
				class: "INVALID",
			});

			expect(result.success).toBe(false);
		});
	});
});

describe("taskUpdateSchema", () => {
	it("should require id", () => {
		const result = taskUpdateSchema.safeParse({
			title: "Updated title",
		});

		expect(result.success).toBe(false);
	});

	it("should validate with only id", () => {
		const result = taskUpdateSchema.safeParse({
			id: "task-123",
		});

		expect(result.success).toBe(true);
	});

	it("should allow partial updates", () => {
		const result = taskUpdateSchema.safeParse({
			id: "task-123",
			status: "COMPLETED",
		});

		expect(result.success).toBe(true);
	});

	it("should not include taskListId", () => {
		const result = taskUpdateSchema.safeParse({
			id: "task-123",
			taskListId: "list-123",
		});

		// taskListId should be stripped
		expect(result.success).toBe(true);
		if (result.success) {
			expect((result.data as any).taskListId).toBeUndefined();
		}
	});
});

describe("taskListCreateSchema", () => {
	it("should validate with required fields", () => {
		const result = taskListCreateSchema.safeParse({
			name: "My Tasks",
		});

		expect(result.success).toBe(true);
	});

	it("should require name", () => {
		const result = taskListCreateSchema.safeParse({});

		expect(result.success).toBe(false);
	});

	it("should reject empty name", () => {
		const result = taskListCreateSchema.safeParse({
			name: "",
		});

		expect(result.success).toBe(false);
	});

	it("should accept optional color", () => {
		const result = taskListCreateSchema.safeParse({
			name: "My Tasks",
			color: "#00FF00",
		});

		expect(result.success).toBe(true);
	});

	it("should accept optional sourceUrl", () => {
		const result = taskListCreateSchema.safeParse({
			name: "My Tasks",
			sourceUrl: "https://example.com/tasks.ics",
		});

		expect(result.success).toBe(true);
	});

	it("should reject invalid sourceUrl", () => {
		const result = taskListCreateSchema.safeParse({
			name: "My Tasks",
			sourceUrl: "not-a-url",
		});

		expect(result.success).toBe(false);
	});
});

describe("taskListUpdateSchema", () => {
	it("should require id", () => {
		const result = taskListUpdateSchema.safeParse({
			name: "Updated",
		});

		expect(result.success).toBe(false);
	});

	it("should validate with only id", () => {
		const result = taskListUpdateSchema.safeParse({
			id: "list-123",
		});

		expect(result.success).toBe(true);
	});

	it("should allow partial updates", () => {
		const result = taskListUpdateSchema.safeParse({
			id: "list-123",
			color: "#0000FF",
		});

		expect(result.success).toBe(true);
	});
});

describe("geoCoordinatesSchema", () => {
	it("should accept valid coordinates", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: 40.7128,
			geoLongitude: -74.006,
		});

		expect(result.success).toBe(true);
	});

	it("should accept both null", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: null,
			geoLongitude: null,
		});

		expect(result.success).toBe(true);
	});

	it("should accept both undefined", () => {
		const result = geoCoordinatesSchema.safeParse({});

		expect(result.success).toBe(true);
	});

	it("should reject only latitude", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: 40.7128,
		});

		expect(result.success).toBe(false);
	});

	it("should reject only longitude", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLongitude: -74.006,
		});

		expect(result.success).toBe(false);
	});

	it("should accept boundary values", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: 90,
			geoLongitude: 180,
		});

		expect(result.success).toBe(true);
	});

	it("should accept negative boundary values", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: -90,
			geoLongitude: -180,
		});

		expect(result.success).toBe(true);
	});
});
