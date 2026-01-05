/**
 * Tests for date utility functions
 */
import { describe, expect, it } from "vitest";
import {
	addDaysToDate,
	addHoursToDate,
	addMinutesToDate,
	endOfDay,
	formatDateShort,
	formatEventDuration,
	getDurationMinutes,
	isSameDay,
	isValidDate,
	normalizeDate,
	startOfDay,
	toDateTimeLocal,
} from "../date";

describe("normalizeDate", () => {
	it("should return the same Date object if input is Date", () => {
		const date = new Date("2024-01-15T10:00:00Z");
		expect(normalizeDate(date)).toBe(date);
	});

	it("should convert ISO string to Date", () => {
		const result = normalizeDate("2024-01-15T10:00:00Z");
		expect(result).toBeInstanceOf(Date);
		expect(result.toISOString()).toBe("2024-01-15T10:00:00.000Z");
	});

	it("should handle date-only strings", () => {
		const result = normalizeDate("2024-01-15");
		expect(result).toBeInstanceOf(Date);
		expect(result.getFullYear()).toBe(2024);
		expect(result.getMonth()).toBe(0); // January
		expect(result.getDate()).toBe(15);
	});
});

describe("isValidDate", () => {
	it("should return true for valid Date objects", () => {
		expect(isValidDate(new Date())).toBe(true);
		expect(isValidDate(new Date("2024-01-15"))).toBe(true);
	});

	it("should return false for Invalid Date", () => {
		expect(isValidDate(new Date("invalid"))).toBe(false);
	});

	it("should return false for non-Date values", () => {
		expect(isValidDate("2024-01-15")).toBe(false);
		expect(isValidDate(null)).toBe(false);
		expect(isValidDate(undefined)).toBe(false);
		expect(isValidDate(12345)).toBe(false);
		expect(isValidDate({})).toBe(false);
	});
});

describe("toDateTimeLocal", () => {
	it("should format date for datetime-local input", () => {
		const date = new Date("2024-01-15T10:30:00");
		const result = toDateTimeLocal(date);
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
	});

	it("should accept string input", () => {
		const result = toDateTimeLocal("2024-01-15T10:30:00");
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
	});
});

describe("formatDateShort", () => {
	it("should format date in short format", () => {
		const date = new Date("2024-01-15T10:30:00");
		const result = formatDateShort(date);
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
	});

	it("should accept string input", () => {
		const result = formatDateShort("2024-01-15T10:30:00");
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
	});
});

describe("addMinutesToDate", () => {
	it("should add minutes to a date", () => {
		const date = new Date("2024-01-15T10:00:00Z");
		const result = addMinutesToDate(date, 30);
		expect(result.toISOString()).toBe("2024-01-15T10:30:00.000Z");
	});

	it("should handle crossing hours", () => {
		const date = new Date("2024-01-15T10:45:00Z");
		const result = addMinutesToDate(date, 30);
		expect(result.toISOString()).toBe("2024-01-15T11:15:00.000Z");
	});

	it("should handle negative minutes", () => {
		const date = new Date("2024-01-15T10:30:00Z");
		const result = addMinutesToDate(date, -15);
		expect(result.toISOString()).toBe("2024-01-15T10:15:00.000Z");
	});

	it("should accept string input", () => {
		const result = addMinutesToDate("2024-01-15T10:00:00Z", 30);
		expect(result.toISOString()).toBe("2024-01-15T10:30:00.000Z");
	});
});

describe("addHoursToDate", () => {
	it("should add hours to a date", () => {
		const date = new Date("2024-01-15T10:00:00Z");
		const result = addHoursToDate(date, 2);
		expect(result.toISOString()).toBe("2024-01-15T12:00:00.000Z");
	});

	it("should handle crossing days", () => {
		const date = new Date("2024-01-15T22:00:00Z");
		const result = addHoursToDate(date, 5);
		expect(result.toISOString()).toBe("2024-01-16T03:00:00.000Z");
	});

	it("should handle negative hours", () => {
		const date = new Date("2024-01-15T10:00:00Z");
		const result = addHoursToDate(date, -3);
		expect(result.toISOString()).toBe("2024-01-15T07:00:00.000Z");
	});
});

describe("addDaysToDate", () => {
	it("should add days to a date", () => {
		const date = new Date("2024-01-15T10:00:00Z");
		const result = addDaysToDate(date, 5);
		expect(result.toISOString()).toBe("2024-01-20T10:00:00.000Z");
	});

	it("should handle month boundaries", () => {
		const date = new Date("2024-01-30T10:00:00Z");
		const result = addDaysToDate(date, 5);
		expect(result.toISOString()).toBe("2024-02-04T10:00:00.000Z");
	});

	it("should handle negative days", () => {
		const date = new Date("2024-01-15T10:00:00Z");
		const result = addDaysToDate(date, -5);
		expect(result.toISOString()).toBe("2024-01-10T10:00:00.000Z");
	});
});

describe("getDurationMinutes", () => {
	it("should calculate duration in minutes", () => {
		const start = new Date("2024-01-15T10:00:00Z");
		const end = new Date("2024-01-15T11:30:00Z");
		expect(getDurationMinutes(start, end)).toBe(90);
	});

	it("should handle same time", () => {
		const time = new Date("2024-01-15T10:00:00Z");
		expect(getDurationMinutes(time, time)).toBe(0);
	});

	it("should handle crossing days", () => {
		const start = new Date("2024-01-15T22:00:00Z");
		const end = new Date("2024-01-16T02:00:00Z");
		expect(getDurationMinutes(start, end)).toBe(240); // 4 hours
	});

	it("should accept string inputs", () => {
		expect(
			getDurationMinutes("2024-01-15T10:00:00Z", "2024-01-15T11:00:00Z"),
		).toBe(60);
	});
});

describe("formatEventDuration", () => {
	it("should format hours and minutes", () => {
		const start = new Date("2024-01-15T10:00:00Z");
		const end = new Date("2024-01-15T11:30:00Z");
		expect(formatEventDuration(start, end)).toBe("1h 30min");
	});

	it("should format hours only when no minutes", () => {
		const start = new Date("2024-01-15T10:00:00Z");
		const end = new Date("2024-01-15T12:00:00Z");
		expect(formatEventDuration(start, end)).toBe("2h");
	});

	it("should format minutes only when less than an hour", () => {
		const start = new Date("2024-01-15T10:00:00Z");
		const end = new Date("2024-01-15T10:45:00Z");
		expect(formatEventDuration(start, end)).toBe("45min");
	});

	it("should handle 0 minutes", () => {
		const time = new Date("2024-01-15T10:00:00Z");
		expect(formatEventDuration(time, time)).toBe("0min");
	});
});

describe("isSameDay", () => {
	it("should return true for same day", () => {
		const date1 = new Date("2024-01-15T10:00:00");
		const date2 = new Date("2024-01-15T22:30:00");
		expect(isSameDay(date1, date2)).toBe(true);
	});

	it("should return false for different days", () => {
		const date1 = new Date("2024-01-15T10:00:00");
		const date2 = new Date("2024-01-16T10:00:00");
		expect(isSameDay(date1, date2)).toBe(false);
	});

	it("should return false for different months", () => {
		const date1 = new Date("2024-01-15T10:00:00");
		const date2 = new Date("2024-02-15T10:00:00");
		expect(isSameDay(date1, date2)).toBe(false);
	});

	it("should return false for different years", () => {
		const date1 = new Date("2024-01-15T10:00:00");
		const date2 = new Date("2025-01-15T10:00:00");
		expect(isSameDay(date1, date2)).toBe(false);
	});

	it("should accept string inputs", () => {
		expect(isSameDay("2024-01-15T10:00:00", "2024-01-15T22:00:00")).toBe(true);
	});
});

describe("startOfDay", () => {
	it("should return start of day (00:00:00)", () => {
		const date = new Date("2024-01-15T14:30:45.123");
		const result = startOfDay(date);
		expect(result.getHours()).toBe(0);
		expect(result.getMinutes()).toBe(0);
		expect(result.getSeconds()).toBe(0);
		expect(result.getMilliseconds()).toBe(0);
	});

	it("should preserve the date", () => {
		const date = new Date("2024-01-15T14:30:00");
		const result = startOfDay(date);
		expect(result.getFullYear()).toBe(2024);
		expect(result.getMonth()).toBe(0);
		expect(result.getDate()).toBe(15);
	});

	it("should accept string input", () => {
		const result = startOfDay("2024-01-15T14:30:00");
		expect(result.getHours()).toBe(0);
	});
});

describe("endOfDay", () => {
	it("should return end of day (23:59:59.999)", () => {
		const date = new Date("2024-01-15T14:30:45.123");
		const result = endOfDay(date);
		expect(result.getHours()).toBe(23);
		expect(result.getMinutes()).toBe(59);
		expect(result.getSeconds()).toBe(59);
		expect(result.getMilliseconds()).toBe(999);
	});

	it("should preserve the date", () => {
		const date = new Date("2024-01-15T14:30:00");
		const result = endOfDay(date);
		expect(result.getFullYear()).toBe(2024);
		expect(result.getMonth()).toBe(0);
		expect(result.getDate()).toBe(15);
	});

	it("should accept string input", () => {
		const result = endOfDay("2024-01-15T14:30:00");
		expect(result.getHours()).toBe(23);
	});
});
