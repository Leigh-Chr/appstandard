/**
 * Tests for task validation functions
 */
import { describe, expect, it } from "vitest";
import { FIELD_LIMITS } from "../../constants/field-limits";
import type { TaskFormData } from "../../types/task";
import { getFieldError, hasErrors, validateTaskForm } from "../task";

// Helper to create a minimal valid task
function createTask(overrides: Partial<TaskFormData> = {}): TaskFormData {
	return {
		title: "Test Task",
		...overrides,
	};
}

describe("validateTaskForm", () => {
	describe("required fields", () => {
		it("should require title", () => {
			const result = validateTaskForm({} as TaskFormData);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Title")).toBe("Title is required");
		});

		it("should reject empty title", () => {
			const result = validateTaskForm(createTask({ title: "" }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Title")).toBe("Title is required");
		});

		it("should reject whitespace-only title", () => {
			const result = validateTaskForm(createTask({ title: "   " }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Title")).toBe("Title is required");
		});

		it("should accept valid title", () => {
			const result = validateTaskForm(
				createTask({ title: "Complete project" }),
			);

			expect(result.valid).toBe(true);
		});
	});

	describe("field length validation", () => {
		it("should reject title exceeding max length", () => {
			const result = validateTaskForm(
				createTask({ title: "A".repeat(FIELD_LIMITS.TITLE + 1) }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Title")).toContain("characters or less");
		});

		it("should reject description exceeding max length", () => {
			const result = validateTaskForm(
				createTask({ description: "A".repeat(FIELD_LIMITS.DESCRIPTION + 1) }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Description")).toContain(
				"characters or less",
			);
		});

		it("should reject location exceeding max length", () => {
			const result = validateTaskForm(
				createTask({ location: "A".repeat(FIELD_LIMITS.LOCATION + 1) }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Location")).toContain("characters or less");
		});

		it("should reject comment exceeding max length", () => {
			const result = validateTaskForm(
				createTask({ comment: "A".repeat(FIELD_LIMITS.COMMENT + 1) }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Comment")).toContain("characters or less");
		});

		it("should accept fields at max length", () => {
			const result = validateTaskForm(
				createTask({ title: "A".repeat(FIELD_LIMITS.TITLE) }),
			);

			expect(result.valid).toBe(true);
		});
	});

	describe("status validation", () => {
		it("should accept valid task statuses", () => {
			const statuses = ["NEEDS_ACTION", "IN_PROCESS", "COMPLETED", "CANCELLED"];

			for (const status of statuses) {
				const result = validateTaskForm(createTask({ status }));
				expect(result.valid).toBe(true);
			}
		});

		it("should accept lowercase status (normalized to uppercase)", () => {
			const result = validateTaskForm(createTask({ status: "completed" }));
			expect(result.valid).toBe(true);
		});

		it("should reject invalid status", () => {
			const result = validateTaskForm(createTask({ status: "INVALID" }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "status")).toBe("Invalid task status");
		});

		it("should allow undefined status", () => {
			const result = validateTaskForm(createTask({ status: undefined }));

			expect(result.valid).toBe(true);
		});
	});

	describe("priority validation", () => {
		it("should accept valid priority values (0-9)", () => {
			for (let priority = 0; priority <= 9; priority++) {
				const result = validateTaskForm(createTask({ priority }));
				expect(result.valid).toBe(true);
			}
		});

		it("should reject negative priority", () => {
			const result = validateTaskForm(createTask({ priority: -1 }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "priority")).toBe(
				"Priority must be between 0 and 9",
			);
		});

		it("should reject priority greater than 9", () => {
			const result = validateTaskForm(createTask({ priority: 10 }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "priority")).toBe(
				"Priority must be between 0 and 9",
			);
		});

		it("should allow undefined priority", () => {
			const result = validateTaskForm(createTask({ priority: undefined }));

			expect(result.valid).toBe(true);
		});
	});

	describe("percent complete validation", () => {
		it("should accept valid percent values (0-100)", () => {
			const values = [0, 25, 50, 75, 100];

			for (const percentComplete of values) {
				const result = validateTaskForm(createTask({ percentComplete }));
				expect(result.valid).toBe(true);
			}
		});

		it("should reject negative percent", () => {
			const result = validateTaskForm(createTask({ percentComplete: -1 }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "percentComplete")).toBe(
				"Percent complete must be between 0 and 100",
			);
		});

		it("should reject percent greater than 100", () => {
			const result = validateTaskForm(createTask({ percentComplete: 101 }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "percentComplete")).toBe(
				"Percent complete must be between 0 and 100",
			);
		});

		it("should allow undefined percent complete", () => {
			const result = validateTaskForm(
				createTask({ percentComplete: undefined }),
			);

			expect(result.valid).toBe(true);
		});
	});

	describe("URL validation", () => {
		it("should accept valid URL", () => {
			const result = validateTaskForm(
				createTask({ url: "https://example.com/task/123" }),
			);

			expect(result.valid).toBe(true);
		});

		it("should accept URL with query parameters", () => {
			const result = validateTaskForm(
				createTask({ url: "https://example.com/task?id=123&view=detail" }),
			);

			expect(result.valid).toBe(true);
		});

		it("should reject invalid URL", () => {
			const result = validateTaskForm(createTask({ url: "not-a-url" }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "url")).toBe("Invalid URL format");
		});

		it("should allow empty URL", () => {
			const result = validateTaskForm(createTask({ url: "" }));

			expect(result.valid).toBe(true);
		});

		it("should allow whitespace-only URL (treated as empty)", () => {
			const result = validateTaskForm(createTask({ url: "   " }));

			expect(result.valid).toBe(true);
		});
	});

	describe("email validation", () => {
		it("should accept valid organizer email", () => {
			const result = validateTaskForm(
				createTask({ organizerEmail: "organizer@example.com" }),
			);

			expect(result.valid).toBe(true);
		});

		it("should reject invalid organizer email", () => {
			const result = validateTaskForm(
				createTask({ organizerEmail: "not-an-email" }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "organizerEmail")).toBe(
				"Invalid email format",
			);
		});

		it("should allow empty organizer email", () => {
			const result = validateTaskForm(createTask({ organizerEmail: "" }));

			expect(result.valid).toBe(true);
		});
	});

	describe("color validation", () => {
		it("should accept valid hex colors", () => {
			const colors = ["#FF0000", "#00ff00", "#0000FF", "#F00", "#0f0"];

			for (const color of colors) {
				const result = validateTaskForm(createTask({ color }));
				expect(result.valid).toBe(true);
			}
		});

		it("should reject invalid color format", () => {
			const result = validateTaskForm(createTask({ color: "red" }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "color")).toBe(
				"Invalid color format (use #RGB or #RRGGBB)",
			);
		});

		it("should allow empty color", () => {
			const result = validateTaskForm(createTask({ color: "" }));

			expect(result.valid).toBe(true);
		});
	});

	describe("date validation", () => {
		it("should accept valid dates", () => {
			const result = validateTaskForm(
				createTask({
					startDate: "2024-01-15T10:00:00Z",
					dueDate: "2024-01-16T10:00:00Z",
				}),
			);

			expect(result.valid).toBe(true);
		});

		it("should reject due date before start date", () => {
			const result = validateTaskForm(
				createTask({
					startDate: "2024-01-16T10:00:00Z",
					dueDate: "2024-01-15T10:00:00Z",
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "dueDate")).toBe(
				"Due date must be after start date",
			);
		});

		it("should allow same start and due date", () => {
			const sameDate = "2024-01-15T10:00:00Z";
			const result = validateTaskForm(
				createTask({
					startDate: sameDate,
					dueDate: sameDate,
				}),
			);

			// Same date means due is not BEFORE start, so it should be valid
			expect(result.valid).toBe(true);
		});

		it("should allow start date without due date", () => {
			const result = validateTaskForm(
				createTask({ startDate: "2024-01-15T10:00:00Z" }),
			);

			expect(result.valid).toBe(true);
		});

		it("should allow due date without start date", () => {
			const result = validateTaskForm(
				createTask({ dueDate: "2024-01-15T10:00:00Z" }),
			);

			expect(result.valid).toBe(true);
		});
	});

	describe("geo coordinates validation", () => {
		it("should accept valid coordinates", () => {
			const result = validateTaskForm(
				createTask({ geoLatitude: 40.7128, geoLongitude: -74.006 }),
			);

			expect(result.valid).toBe(true);
		});

		it("should require both or neither coordinate", () => {
			const latOnly = validateTaskForm(createTask({ geoLatitude: 40.7128 }));

			expect(latOnly.valid).toBe(false);
			expect(getFieldError(latOnly, "geoLongitude")).toBe(
				"Both latitude and longitude must be provided together",
			);
		});

		it("should allow neither coordinate", () => {
			const result = validateTaskForm(createTask());

			expect(result.valid).toBe(true);
		});
	});

	describe("attendee validation", () => {
		it("should accept valid attendees", () => {
			const result = validateTaskForm(
				createTask({
					attendees: [
						{ email: "john@example.com", name: "John Doe" },
						{ email: "jane@example.com" },
					],
				}),
			);

			expect(result.valid).toBe(true);
		});

		it("should reject invalid attendee email", () => {
			const result = validateTaskForm(
				createTask({
					attendees: [{ email: "not-an-email" }],
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "attendees[0].email")).toBe(
				"Invalid email format",
			);
		});

		it("should reject attendee name exceeding max length", () => {
			const result = validateTaskForm(
				createTask({
					attendees: [
						{
							email: "valid@example.com",
							name: "A".repeat(FIELD_LIMITS.NAME + 1),
						},
					],
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "attendees[0].name")).toContain(
				"characters or less",
			);
		});

		it("should validate multiple attendees", () => {
			const result = validateTaskForm(
				createTask({
					attendees: [
						{ email: "valid@example.com" },
						{ email: "invalid" },
						{ email: "another@example.com" },
					],
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "attendees[1].email")).toBe(
				"Invalid email format",
			);
		});
	});

	describe("alarm validation", () => {
		it("should accept valid alarm", () => {
			const result = validateTaskForm(
				createTask({
					alarms: [
						{
							trigger: "-PT15M",
							action: "DISPLAY",
							summary: "Task reminder",
						},
					],
				}),
			);

			expect(result.valid).toBe(true);
		});

		it("should require alarm trigger", () => {
			const result = validateTaskForm(
				createTask({
					alarms: [{ action: "DISPLAY", summary: "Reminder" } as any],
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "alarms[0].trigger")).toBe(
				"Alarm trigger is required",
			);
		});

		it("should require valid alarm action", () => {
			const result = validateTaskForm(
				createTask({
					alarms: [{ trigger: "-PT15M", action: "INVALID" } as any],
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "alarms[0].action")).toBe(
				"Invalid alarm action",
			);
		});

		it("should accept valid alarm actions", () => {
			const actions = ["DISPLAY", "EMAIL", "AUDIO"];

			for (const action of actions) {
				const result = validateTaskForm(
					createTask({
						alarms: [
							{
								trigger: "-PT15M",
								action,
								summary: action === "DISPLAY" ? "Summary" : undefined,
								description: action === "EMAIL" ? "Description" : undefined,
							} as any,
						],
					}),
				);

				// EMAIL requires both summary and description
				if (action === "EMAIL") {
					// Missing summary
					const emailResult = validateTaskForm(
						createTask({
							alarms: [
								{
									trigger: "-PT15M",
									action: "EMAIL",
									summary: "Summary",
									description: "Description",
								},
							],
						}),
					);
					expect(emailResult.valid).toBe(true);
				} else if (action === "DISPLAY") {
					expect(result.valid).toBe(true);
				} else {
					// AUDIO doesn't require summary/description
					expect(result.valid).toBe(true);
				}
			}
		});

		it("should require summary for DISPLAY alarms", () => {
			const result = validateTaskForm(
				createTask({
					alarms: [{ trigger: "-PT15M", action: "DISPLAY" }],
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "alarms[0].summary")).toBe(
				"DISPLAY alarms require a summary",
			);
		});

		it("should require summary and description for EMAIL alarms", () => {
			const noSummary = validateTaskForm(
				createTask({
					alarms: [{ trigger: "-PT15M", action: "EMAIL", description: "Desc" }],
				}),
			);

			expect(noSummary.valid).toBe(false);
			expect(getFieldError(noSummary, "alarms[0].summary")).toBe(
				"EMAIL alarms require a summary",
			);

			const noDesc = validateTaskForm(
				createTask({
					alarms: [{ trigger: "-PT15M", action: "EMAIL", summary: "Sum" }],
				}),
			);

			expect(noDesc.valid).toBe(false);
			expect(getFieldError(noDesc, "alarms[0].description")).toBe(
				"EMAIL alarms require a description",
			);
		});

		it("should not require summary for AUDIO alarms", () => {
			const result = validateTaskForm(
				createTask({
					alarms: [{ trigger: "-PT15M", action: "AUDIO" }],
				}),
			);

			expect(result.valid).toBe(true);
		});
	});
});

describe("getFieldError", () => {
	it("should return error message for existing field", () => {
		const result = validateTaskForm({} as TaskFormData);
		const error = getFieldError(result, "Title");

		expect(error).toBe("Title is required");
	});

	it("should return undefined for non-existent field", () => {
		const result = validateTaskForm(createTask());
		const error = getFieldError(result, "nonExistent");

		expect(error).toBeUndefined();
	});
});

describe("hasErrors", () => {
	it("should return true when validation fails", () => {
		const result = validateTaskForm({} as TaskFormData);

		expect(hasErrors(result)).toBe(true);
	});

	it("should return false when validation passes", () => {
		const result = validateTaskForm(createTask());

		expect(hasErrors(result)).toBe(false);
	});
});
