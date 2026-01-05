/**
 * Tests for ICS date format conversion utilities
 */
import { describe, expect, it } from "vitest";
import { formatDateToICS, parseDateFromICS } from "../ics-date-helper";

describe("formatDateToICS", () => {
	it("should format date to ICS format (YYYYMMDDTHHmmssZ)", () => {
		const date = new Date(Date.UTC(2024, 0, 15, 10, 30, 45));
		const result = formatDateToICS(date);

		expect(result).toBe("20240115T103045Z");
	});

	it("should pad single-digit values with zeros", () => {
		const date = new Date(Date.UTC(2024, 0, 5, 8, 5, 3));
		const result = formatDateToICS(date);

		expect(result).toBe("20240105T080503Z");
	});

	it("should handle midnight", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
		const result = formatDateToICS(date);

		expect(result).toBe("20240101T000000Z");
	});

	it("should handle end of day", () => {
		const date = new Date(Date.UTC(2024, 11, 31, 23, 59, 59));
		const result = formatDateToICS(date);

		expect(result).toBe("20241231T235959Z");
	});

	it("should handle different months", () => {
		const dates = [
			{ date: new Date(Date.UTC(2024, 0, 1)), expected: "20240101T" },
			{ date: new Date(Date.UTC(2024, 5, 15)), expected: "20240615T" },
			{ date: new Date(Date.UTC(2024, 11, 25)), expected: "20241225T" },
		];

		for (const { date, expected } of dates) {
			expect(formatDateToICS(date).startsWith(expected)).toBe(true);
		}
	});
});

describe("parseDateFromICS", () => {
	describe("full datetime format (YYYYMMDDTHHmmssZ)", () => {
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

		it("should parse midnight datetime", () => {
			const result = parseDateFromICS("20240101T000000Z");

			expect(result?.getUTCHours()).toBe(0);
			expect(result?.getUTCMinutes()).toBe(0);
			expect(result?.getUTCSeconds()).toBe(0);
		});

		it("should parse end of day datetime", () => {
			const result = parseDateFromICS("20241231T235959Z");

			expect(result?.getUTCHours()).toBe(23);
			expect(result?.getUTCMinutes()).toBe(59);
			expect(result?.getUTCSeconds()).toBe(59);
		});
	});

	describe("date-only format (YYYYMMDD)", () => {
		it("should parse valid ICS date", () => {
			const result = parseDateFromICS("20240115");

			expect(result).toBeInstanceOf(Date);
			expect(result?.getUTCFullYear()).toBe(2024);
			expect(result?.getUTCMonth()).toBe(0); // January
			expect(result?.getUTCDate()).toBe(15);
		});

		it("should set time to midnight for date-only format", () => {
			const result = parseDateFromICS("20240115");

			expect(result?.getUTCHours()).toBe(0);
			expect(result?.getUTCMinutes()).toBe(0);
			expect(result?.getUTCSeconds()).toBe(0);
		});
	});

	describe("invalid inputs", () => {
		it("should return null for null input", () => {
			const result = parseDateFromICS(null);

			expect(result).toBeNull();
		});

		it("should return null for undefined input", () => {
			const result = parseDateFromICS(undefined);

			expect(result).toBeNull();
		});

		it("should return null for empty string", () => {
			const result = parseDateFromICS("");

			expect(result).toBeNull();
		});

		it("should return null for whitespace-only string", () => {
			const result = parseDateFromICS("   ");

			expect(result).toBeNull();
		});

		it("should return null for invalid format", () => {
			const result = parseDateFromICS("2024-01-15");

			expect(result).toBeNull();
		});

		it("should return null for wrong length", () => {
			expect(parseDateFromICS("2024011")).toBeNull(); // too short
			expect(parseDateFromICS("202401150")).toBeNull(); // wrong length
		});

		it("should return null for datetime without Z suffix", () => {
			const result = parseDateFromICS("20240115T103045");

			expect(result).toBeNull();
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

describe("round-trip conversion", () => {
	it("should round-trip datetime correctly", () => {
		const original = new Date(Date.UTC(2024, 5, 15, 14, 30, 0));
		const icsFormat = formatDateToICS(original);
		const parsed = parseDateFromICS(icsFormat);

		expect(parsed?.getTime()).toBe(original.getTime());
	});

	it("should round-trip multiple dates correctly", () => {
		const dates = [
			new Date(Date.UTC(2024, 0, 1, 0, 0, 0)),
			new Date(Date.UTC(2024, 11, 31, 23, 59, 59)),
			new Date(Date.UTC(2025, 6, 4, 12, 0, 0)),
		];

		for (const original of dates) {
			const icsFormat = formatDateToICS(original);
			const parsed = parseDateFromICS(icsFormat);

			expect(parsed?.getTime()).toBe(original.getTime());
		}
	});
});
