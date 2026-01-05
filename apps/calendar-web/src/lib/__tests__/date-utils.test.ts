/**
 * Tests for date utility functions
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	formatEventDateTime,
	getEventTimeStatus,
	groupEventsByDate,
	normalizeDate,
} from "../date-utils";

describe("normalizeDate", () => {
	it("should return Date object unchanged", () => {
		const date = new Date("2024-01-15T10:00:00Z");
		const result = normalizeDate(date);

		expect(result).toBe(date);
	});

	it("should convert ISO string to Date", () => {
		const result = normalizeDate("2024-01-15T10:00:00Z");

		expect(result).toBeInstanceOf(Date);
		expect(result.toISOString()).toBe("2024-01-15T10:00:00.000Z");
	});

	it("should handle date-only string", () => {
		const result = normalizeDate("2024-01-15");

		expect(result).toBeInstanceOf(Date);
		expect(result.getFullYear()).toBe(2024);
		expect(result.getMonth()).toBe(0); // January
		expect(result.getDate()).toBe(15);
	});
});

describe("formatEventDateTime", () => {
	it("should identify single-day event", () => {
		const result = formatEventDateTime(
			"2024-01-15T10:00:00Z",
			"2024-01-15T11:00:00Z",
		);

		expect(result.isMultiDay).toBe(false);
	});

	it("should identify multi-day event", () => {
		const result = formatEventDateTime(
			"2024-01-15T10:00:00Z",
			"2024-01-17T11:00:00Z",
		);

		expect(result.isMultiDay).toBe(true);
	});

	it("should identify past event", () => {
		const pastDate = new Date();
		pastDate.setFullYear(pastDate.getFullYear() - 1);

		const result = formatEventDateTime(
			pastDate.toISOString(),
			new Date(pastDate.getTime() + 3600000).toISOString(),
		);

		expect(result.isPastEvent).toBe(true);
	});

	it("should identify future event", () => {
		const futureDate = new Date();
		futureDate.setFullYear(futureDate.getFullYear() + 1);

		const result = formatEventDateTime(
			futureDate.toISOString(),
			new Date(futureDate.getTime() + 3600000).toISOString(),
		);

		expect(result.isPastEvent).toBe(false);
	});

	it("should return formatted time range", () => {
		const result = formatEventDateTime(
			"2024-01-15T10:00:00",
			"2024-01-15T14:30:00",
		);

		expect(result.time).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);
	});

	it("should handle Date objects", () => {
		const start = new Date("2024-01-15T10:00:00Z");
		const end = new Date("2024-01-15T11:00:00Z");

		const result = formatEventDateTime(start, end);

		expect(result.isMultiDay).toBe(false);
		expect(result.time).toBeDefined();
	});
});

describe("getEventTimeStatus", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should return ongoing status for current event", () => {
		const now = new Date("2024-01-15T10:30:00Z");
		vi.setSystemTime(now);

		const result = getEventTimeStatus(
			"2024-01-15T10:00:00Z",
			"2024-01-15T11:00:00Z",
		);

		expect(result?.status).toBe("ongoing");
		expect(result?.label).toBe("En cours");
	});

	it("should return past status for finished event", () => {
		const now = new Date("2024-01-15T12:00:00Z");
		vi.setSystemTime(now);

		const result = getEventTimeStatus(
			"2024-01-15T10:00:00Z",
			"2024-01-15T11:00:00Z",
		);

		expect(result?.status).toBe("past");
		expect(result?.label).toBe("Finished");
	});

	it("should return soon status for event starting within 15 minutes", () => {
		const now = new Date("2024-01-15T09:50:00Z");
		vi.setSystemTime(now);

		const result = getEventTimeStatus(
			"2024-01-15T10:00:00Z",
			"2024-01-15T11:00:00Z",
		);

		expect(result?.status).toBe("soon");
		expect(result?.label).toMatch(/In \d+ min/);
	});

	it("should return upcoming status for event starting within an hour", () => {
		const now = new Date("2024-01-15T09:15:00Z");
		vi.setSystemTime(now);

		const result = getEventTimeStatus(
			"2024-01-15T10:00:00Z",
			"2024-01-15T11:00:00Z",
		);

		expect(result?.status).toBe("upcoming");
		expect(result?.label).toMatch(/In \d+ min/);
	});

	it("should return null for events more than an hour away", () => {
		const now = new Date("2024-01-15T08:00:00Z");
		vi.setSystemTime(now);

		const result = getEventTimeStatus(
			"2024-01-15T10:00:00Z",
			"2024-01-15T11:00:00Z",
		);

		expect(result).toBeNull();
	});

	it("should handle Date objects", () => {
		const now = new Date("2024-01-15T10:30:00Z");
		vi.setSystemTime(now);

		const result = getEventTimeStatus(
			new Date("2024-01-15T10:00:00Z"),
			new Date("2024-01-15T11:00:00Z"),
		);

		expect(result?.status).toBe("ongoing");
	});
});

describe("groupEventsByDate", () => {
	it("should group events by date", () => {
		const events = [
			{ id: "1", startDate: "2024-01-15T10:00:00Z" },
			{ id: "2", startDate: "2024-01-15T14:00:00Z" },
			{ id: "3", startDate: "2024-01-16T10:00:00Z" },
		];

		const groups = groupEventsByDate(events);

		expect(groups.size).toBe(2);
	});

	it("should include events in correct groups", () => {
		const events = [
			{ id: "1", startDate: "2024-01-15T10:00:00Z" },
			{ id: "2", startDate: "2024-01-15T14:00:00Z" },
			{ id: "3", startDate: "2024-01-16T10:00:00Z" },
		];

		const groups = groupEventsByDate(events);
		const jan15Group = groups.get("2024-01-15");
		const jan16Group = groups.get("2024-01-16");

		expect(jan15Group?.events).toHaveLength(2);
		expect(jan16Group?.events).toHaveLength(1);
	});

	it("should include label for each group", () => {
		const events = [{ id: "1", startDate: "2024-01-15T10:00:00Z" }];

		const groups = groupEventsByDate(events);
		const group = groups.get("2024-01-15");

		expect(group?.label).toBeDefined();
		expect(typeof group?.label).toBe("string");
	});

	it("should include date for each group", () => {
		const events = [{ id: "1", startDate: "2024-01-15T10:00:00Z" }];

		const groups = groupEventsByDate(events);
		const group = groups.get("2024-01-15");

		expect(group?.date).toBeInstanceOf(Date);
	});

	it("should handle empty array", () => {
		const groups = groupEventsByDate([]);

		expect(groups.size).toBe(0);
	});

	it("should handle Date objects", () => {
		const events = [{ id: "1", startDate: new Date("2024-01-15T10:00:00Z") }];

		const groups = groupEventsByDate(events);

		expect(groups.size).toBe(1);
	});

	it("should preserve original event objects", () => {
		const events = [
			{ id: "event-1", startDate: "2024-01-15T10:00:00Z", title: "Meeting" },
		];

		const groups = groupEventsByDate(events);
		const group = groups.get("2024-01-15");

		expect(group?.events[0]).toBe(events[0]);
	});
});
