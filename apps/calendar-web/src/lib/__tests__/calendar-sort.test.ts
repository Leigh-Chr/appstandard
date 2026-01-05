/**
 * Tests for calendar sorting utilities
 */
import { describe, expect, it } from "vitest";
import {
	type CalendarForSort,
	filterCalendarsByKeyword,
	sortCalendars,
} from "../calendar-sort";

// Helper to create a test calendar
function createCalendar(
	overrides: Partial<CalendarForSort> = {},
): CalendarForSort {
	return {
		id: "cal-1",
		name: "Test Calendar",
		eventCount: 10,
		updatedAt: "2024-01-15T10:00:00Z",
		createdAt: "2024-01-01T10:00:00Z",
		color: "#FF0000",
		sourceUrl: null,
		lastSyncedAt: null,
		events: [],
		...overrides,
	};
}

describe("sortCalendars", () => {
	describe("sort by name", () => {
		it("should sort calendars alphabetically by name", () => {
			const calendars = [
				createCalendar({ id: "1", name: "Zebra" }),
				createCalendar({ id: "2", name: "Alpha" }),
				createCalendar({ id: "3", name: "Mike" }),
			];

			const sorted = sortCalendars(calendars, "name", "asc");

			expect(sorted.map((c) => c.name)).toEqual(["Alpha", "Mike", "Zebra"]);
		});

		it("should handle case-insensitive sorting", () => {
			const calendars = [
				createCalendar({ id: "1", name: "beta" }),
				createCalendar({ id: "2", name: "Alpha" }),
				createCalendar({ id: "3", name: "CHARLIE" }),
			];

			const sorted = sortCalendars(calendars, "name", "asc");

			expect(sorted.map((c) => c.name)).toEqual(["Alpha", "beta", "CHARLIE"]);
		});

		it("should not modify the original array", () => {
			const calendars = [
				createCalendar({ id: "1", name: "B" }),
				createCalendar({ id: "2", name: "A" }),
			];

			const sorted = sortCalendars(calendars, "name", "asc");

			expect(calendars[0].name).toBe("B");
			expect(sorted[0].name).toBe("A");
		});
	});

	describe("sort by updatedAt", () => {
		it("should sort by updatedAt in ascending order", () => {
			const calendars = [
				createCalendar({
					id: "1",
					name: "C",
					updatedAt: "2024-01-15T10:00:00Z",
				}),
				createCalendar({
					id: "2",
					name: "A",
					updatedAt: "2024-01-01T10:00:00Z",
				}),
				createCalendar({
					id: "3",
					name: "B",
					updatedAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortCalendars(calendars, "updatedAt", "asc");

			expect(sorted.map((c) => c.name)).toEqual(["A", "B", "C"]);
		});

		it("should sort by updatedAt in descending order", () => {
			const calendars = [
				createCalendar({
					id: "1",
					name: "C",
					updatedAt: "2024-01-15T10:00:00Z",
				}),
				createCalendar({
					id: "2",
					name: "A",
					updatedAt: "2024-01-01T10:00:00Z",
				}),
				createCalendar({
					id: "3",
					name: "B",
					updatedAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortCalendars(calendars, "updatedAt", "desc");

			expect(sorted.map((c) => c.name)).toEqual(["C", "B", "A"]);
		});

		it("should handle null updatedAt", () => {
			const calendars = [
				createCalendar({ id: "1", name: "A", updatedAt: null }),
				createCalendar({
					id: "2",
					name: "B",
					updatedAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortCalendars(calendars, "updatedAt", "desc");

			expect(sorted.map((c) => c.name)).toEqual(["B", "A"]);
		});

		it("should handle Date objects", () => {
			const calendars = [
				createCalendar({
					id: "1",
					name: "A",
					updatedAt: new Date("2024-01-15T10:00:00Z"),
				}),
				createCalendar({
					id: "2",
					name: "B",
					updatedAt: new Date("2024-01-01T10:00:00Z"),
				}),
			];

			const sorted = sortCalendars(calendars, "updatedAt", "desc");

			expect(sorted.map((c) => c.name)).toEqual(["A", "B"]);
		});
	});

	describe("sort by createdAt", () => {
		it("should sort by createdAt in ascending order", () => {
			const calendars = [
				createCalendar({
					id: "1",
					name: "C",
					createdAt: "2024-01-15T10:00:00Z",
				}),
				createCalendar({
					id: "2",
					name: "A",
					createdAt: "2024-01-01T10:00:00Z",
				}),
				createCalendar({
					id: "3",
					name: "B",
					createdAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortCalendars(calendars, "createdAt", "asc");

			expect(sorted.map((c) => c.name)).toEqual(["A", "B", "C"]);
		});

		it("should sort by createdAt in descending order", () => {
			const calendars = [
				createCalendar({
					id: "1",
					name: "C",
					createdAt: "2024-01-15T10:00:00Z",
				}),
				createCalendar({
					id: "2",
					name: "A",
					createdAt: "2024-01-01T10:00:00Z",
				}),
				createCalendar({
					id: "3",
					name: "B",
					createdAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortCalendars(calendars, "createdAt", "desc");

			expect(sorted.map((c) => c.name)).toEqual(["C", "B", "A"]);
		});
	});

	describe("sort by eventCount", () => {
		it("should sort by event count in ascending order", () => {
			const calendars = [
				createCalendar({ id: "1", name: "A", eventCount: 50 }),
				createCalendar({ id: "2", name: "B", eventCount: 10 }),
				createCalendar({ id: "3", name: "C", eventCount: 30 }),
			];

			const sorted = sortCalendars(calendars, "eventCount", "asc");

			expect(sorted.map((c) => c.eventCount)).toEqual([10, 30, 50]);
		});

		it("should handle zero event counts", () => {
			const calendars = [
				createCalendar({ id: "1", name: "A", eventCount: 0 }),
				createCalendar({ id: "2", name: "B", eventCount: 5 }),
				createCalendar({ id: "3", name: "C", eventCount: 0 }),
			];

			const sorted = sortCalendars(calendars, "eventCount", "asc");

			expect(sorted[0].eventCount).toBe(0);
			expect(sorted[1].eventCount).toBe(0);
			expect(sorted[2].eventCount).toBe(5);
		});
	});

	describe("edge cases", () => {
		it("should handle empty array", () => {
			const sorted = sortCalendars([], "name", "asc");

			expect(sorted).toEqual([]);
		});

		it("should handle single element array", () => {
			const calendars = [createCalendar({ name: "Only One" })];

			const sorted = sortCalendars(calendars, "name", "asc");

			expect(sorted).toHaveLength(1);
			expect(sorted[0].name).toBe("Only One");
		});
	});
});

describe("filterCalendarsByKeyword", () => {
	it("should filter calendars by keyword", () => {
		const calendars = [
			createCalendar({ id: "1", name: "Work Calendar" }),
			createCalendar({ id: "2", name: "Personal Calendar" }),
			createCalendar({ id: "3", name: "Family Events" }),
		];

		const filtered = filterCalendarsByKeyword(calendars, "personal");

		expect(filtered).toHaveLength(1);
		expect(filtered[0].name).toBe("Personal Calendar");
	});

	it("should be case-insensitive", () => {
		const calendars = [
			createCalendar({ id: "1", name: "Work Calendar" }),
			createCalendar({ id: "2", name: "Personal Calendar" }),
		];

		const filtered = filterCalendarsByKeyword(calendars, "WORK");

		expect(filtered).toHaveLength(1);
		expect(filtered[0].name).toBe("Work Calendar");
	});

	it("should match partial names", () => {
		const calendars = [
			createCalendar({ id: "1", name: "Work Calendar" }),
			createCalendar({ id: "2", name: "Personal Calendar" }),
		];

		const filtered = filterCalendarsByKeyword(calendars, "Cal");

		expect(filtered).toHaveLength(2);
	});

	it("should return all calendars for empty keyword", () => {
		const calendars = [
			createCalendar({ id: "1", name: "Work" }),
			createCalendar({ id: "2", name: "Personal" }),
		];

		const filtered = filterCalendarsByKeyword(calendars, "");

		expect(filtered).toHaveLength(2);
	});

	it("should return all calendars for whitespace-only keyword", () => {
		const calendars = [
			createCalendar({ id: "1", name: "Work" }),
			createCalendar({ id: "2", name: "Personal" }),
		];

		const filtered = filterCalendarsByKeyword(calendars, "   ");

		expect(filtered).toHaveLength(2);
	});

	it("should return empty array when no matches", () => {
		const calendars = [
			createCalendar({ id: "1", name: "Work" }),
			createCalendar({ id: "2", name: "Personal" }),
		];

		const filtered = filterCalendarsByKeyword(calendars, "xyz");

		expect(filtered).toHaveLength(0);
	});

	it("should trim keyword whitespace", () => {
		const calendars = [createCalendar({ id: "1", name: "Work Calendar" })];

		const filtered = filterCalendarsByKeyword(calendars, "  work  ");

		expect(filtered).toHaveLength(1);
	});
});
