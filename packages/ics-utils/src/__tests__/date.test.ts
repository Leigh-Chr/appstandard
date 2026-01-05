/**
 * Tests for ICS date parsing and formatting utilities
 */
import { describe, expect, it } from "vitest";
import {
	formatDateOnlyToICS,
	formatDateToICS,
	isValidIcsDate,
	parseDateFromICS,
} from "../date";

describe("formatDateToICS", () => {
	it("should format date to ICS datetime format", () => {
		const date = new Date(Date.UTC(2024, 0, 15, 10, 30, 45));
		expect(formatDateToICS(date)).toBe("20240115T103045Z");
	});

	it("should pad single digit values with zeros", () => {
		const date = new Date(Date.UTC(2024, 0, 5, 8, 5, 3));
		expect(formatDateToICS(date)).toBe("20240105T080503Z");
	});

	it("should handle midnight", () => {
		const date = new Date(Date.UTC(2024, 5, 20, 0, 0, 0));
		expect(formatDateToICS(date)).toBe("20240620T000000Z");
	});

	it("should handle end of day", () => {
		const date = new Date(Date.UTC(2024, 11, 31, 23, 59, 59));
		expect(formatDateToICS(date)).toBe("20241231T235959Z");
	});

	it("should use UTC time", () => {
		// Create date in local timezone, result should be UTC
		const date = new Date("2024-01-15T10:30:00Z");
		expect(formatDateToICS(date)).toBe("20240115T103000Z");
	});
});

describe("formatDateOnlyToICS", () => {
	it("should format date to ICS date-only format", () => {
		const date = new Date(Date.UTC(2024, 0, 15, 10, 30, 0));
		expect(formatDateOnlyToICS(date)).toBe("20240115");
	});

	it("should ignore time component", () => {
		const date = new Date(Date.UTC(2024, 5, 20, 23, 59, 59));
		expect(formatDateOnlyToICS(date)).toBe("20240620");
	});

	it("should pad single digit month and day", () => {
		const date = new Date(Date.UTC(2024, 0, 5));
		expect(formatDateOnlyToICS(date)).toBe("20240105");
	});
});

describe("parseDateFromICS", () => {
	describe("datetime format (YYYYMMDDTHHmmssZ)", () => {
		it("should parse valid ICS datetime", () => {
			const result = parseDateFromICS("20240115T103045Z");
			expect(result).toBeInstanceOf(Date);
			expect(result?.getUTCFullYear()).toBe(2024);
			expect(result?.getUTCMonth()).toBe(0); // January
			expect(result?.getUTCDate()).toBe(15);
			expect(result?.getUTCHours()).toBe(10);
			expect(result?.getUTCMinutes()).toBe(30);
			expect(result?.getUTCSeconds()).toBe(45);
		});

		it("should parse midnight", () => {
			const result = parseDateFromICS("20240620T000000Z");
			expect(result?.getUTCHours()).toBe(0);
			expect(result?.getUTCMinutes()).toBe(0);
			expect(result?.getUTCSeconds()).toBe(0);
		});

		it("should parse end of day", () => {
			const result = parseDateFromICS("20241231T235959Z");
			expect(result?.getUTCMonth()).toBe(11); // December
			expect(result?.getUTCDate()).toBe(31);
			expect(result?.getUTCHours()).toBe(23);
			expect(result?.getUTCMinutes()).toBe(59);
			expect(result?.getUTCSeconds()).toBe(59);
		});
	});

	describe("date-only format (YYYYMMDD)", () => {
		it("should parse valid ICS date-only", () => {
			const result = parseDateFromICS("20240115");
			expect(result).toBeInstanceOf(Date);
			expect(result?.getUTCFullYear()).toBe(2024);
			expect(result?.getUTCMonth()).toBe(0);
			expect(result?.getUTCDate()).toBe(15);
			expect(result?.getUTCHours()).toBe(0);
			expect(result?.getUTCMinutes()).toBe(0);
			expect(result?.getUTCSeconds()).toBe(0);
		});
	});

	describe("invalid inputs", () => {
		it("should return null for empty string", () => {
			expect(parseDateFromICS("")).toBeNull();
		});

		it("should return null for null", () => {
			expect(parseDateFromICS(null)).toBeNull();
		});

		it("should return null for undefined", () => {
			expect(parseDateFromICS(undefined)).toBeNull();
		});

		it("should return null for whitespace only", () => {
			expect(parseDateFromICS("   ")).toBeNull();
		});

		it("should return null for invalid format", () => {
			expect(parseDateFromICS("invalid")).toBeNull();
			expect(parseDateFromICS("2024-01-15")).toBeNull();
			expect(parseDateFromICS("2024-01-15T10:30:00Z")).toBeNull();
		});

		it("should return null for incomplete datetime", () => {
			expect(parseDateFromICS("20240115T1030")).toBeNull();
		});

		it("should return null for datetime without Z", () => {
			expect(parseDateFromICS("20240115T103045")).toBeNull();
		});
	});

	describe("whitespace handling", () => {
		it("should trim leading whitespace", () => {
			const result = parseDateFromICS("  20240115T103045Z");
			expect(result).toBeInstanceOf(Date);
		});

		it("should trim trailing whitespace", () => {
			const result = parseDateFromICS("20240115T103045Z  ");
			expect(result).toBeInstanceOf(Date);
		});
	});
});

describe("isValidIcsDate", () => {
	it("should return true for valid datetime format", () => {
		expect(isValidIcsDate("20240115T103045Z")).toBe(true);
	});

	it("should return true for valid date-only format", () => {
		expect(isValidIcsDate("20240115")).toBe(true);
	});

	it("should return false for invalid format", () => {
		expect(isValidIcsDate("")).toBe(false);
		expect(isValidIcsDate("invalid")).toBe(false);
		expect(isValidIcsDate("2024-01-15")).toBe(false);
	});
});

describe("round-trip", () => {
	it("should format and parse datetime correctly", () => {
		const original = new Date(Date.UTC(2024, 5, 20, 14, 30, 0));
		const formatted = formatDateToICS(original);
		const parsed = parseDateFromICS(formatted);

		expect(parsed?.getTime()).toBe(original.getTime());
	});

	it("should format and parse date-only correctly", () => {
		const original = new Date(Date.UTC(2024, 5, 20, 0, 0, 0));
		const formatted = formatDateOnlyToICS(original);
		const parsed = parseDateFromICS(formatted);

		expect(parsed?.getUTCFullYear()).toBe(original.getUTCFullYear());
		expect(parsed?.getUTCMonth()).toBe(original.getUTCMonth());
		expect(parsed?.getUTCDate()).toBe(original.getUTCDate());
	});
});
