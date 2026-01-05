/**
 * Tests for ICS duration format conversion utilities
 */
import { describe, expect, it } from "vitest";
import {
	formatDurationToICS,
	parseDurationFromICS,
} from "../ics-duration-helper";

describe("formatDurationToICS", () => {
	describe("minutes", () => {
		it("should format minutes correctly", () => {
			expect(formatDurationToICS(5, "minutes")).toBe("PT5M");
			expect(formatDurationToICS(30, "minutes")).toBe("PT30M");
			expect(formatDurationToICS(120, "minutes")).toBe("PT120M");
		});

		it("should handle string input for minutes", () => {
			expect(formatDurationToICS("15", "minutes")).toBe("PT15M");
		});
	});

	describe("hours", () => {
		it("should format hours correctly", () => {
			expect(formatDurationToICS(1, "hours")).toBe("PT1H");
			expect(formatDurationToICS(24, "hours")).toBe("PT24H");
		});

		it("should handle string input for hours", () => {
			expect(formatDurationToICS("2", "hours")).toBe("PT2H");
		});
	});

	describe("days", () => {
		it("should format days correctly", () => {
			expect(formatDurationToICS(1, "days")).toBe("P1D");
			expect(formatDurationToICS(7, "days")).toBe("P7D");
			expect(formatDurationToICS(30, "days")).toBe("P30D");
		});

		it("should handle string input for days", () => {
			expect(formatDurationToICS("3", "days")).toBe("P3D");
		});
	});

	describe("seconds", () => {
		it("should format seconds correctly", () => {
			expect(formatDurationToICS(30, "seconds")).toBe("PT30S");
			expect(formatDurationToICS(90, "seconds")).toBe("PT90S");
		});

		it("should handle string input for seconds", () => {
			expect(formatDurationToICS("45", "seconds")).toBe("PT45S");
		});
	});

	describe("edge cases", () => {
		it("should return empty string for zero value", () => {
			expect(formatDurationToICS(0, "minutes")).toBe("");
			expect(formatDurationToICS(0, "hours")).toBe("");
			expect(formatDurationToICS(0, "days")).toBe("");
		});

		it("should return empty string for negative value", () => {
			expect(formatDurationToICS(-5, "minutes")).toBe("");
			expect(formatDurationToICS(-1, "days")).toBe("");
		});

		it("should return empty string for NaN", () => {
			expect(formatDurationToICS("invalid", "minutes")).toBe("");
		});

		it("should return empty string for empty string input", () => {
			expect(formatDurationToICS("", "minutes")).toBe("");
		});
	});
});

describe("parseDurationFromICS", () => {
	describe("minutes", () => {
		it("should parse minutes correctly", () => {
			const result = parseDurationFromICS("PT5M");

			expect(result).toEqual({ value: 5, unit: "minutes" });
		});

		it("should parse multi-digit minutes", () => {
			const result = parseDurationFromICS("PT120M");

			expect(result).toEqual({ value: 120, unit: "minutes" });
		});
	});

	describe("hours", () => {
		it("should parse hours correctly", () => {
			const result = parseDurationFromICS("PT1H");

			expect(result).toEqual({ value: 1, unit: "hours" });
		});

		it("should parse multi-digit hours", () => {
			const result = parseDurationFromICS("PT24H");

			expect(result).toEqual({ value: 24, unit: "hours" });
		});
	});

	describe("days", () => {
		it("should parse days correctly", () => {
			const result = parseDurationFromICS("P1D");

			expect(result).toEqual({ value: 1, unit: "days" });
		});

		it("should parse multi-digit days", () => {
			const result = parseDurationFromICS("P30D");

			expect(result).toEqual({ value: 30, unit: "days" });
		});
	});

	describe("seconds", () => {
		it("should parse seconds correctly", () => {
			const result = parseDurationFromICS("PT30S");

			expect(result).toEqual({ value: 30, unit: "seconds" });
		});

		it("should parse multi-digit seconds", () => {
			const result = parseDurationFromICS("PT90S");

			expect(result).toEqual({ value: 90, unit: "seconds" });
		});
	});

	describe("priority order", () => {
		it("should prioritize days over time components", () => {
			// If both are present, days should be returned first
			const result = parseDurationFromICS("P1DT2H");

			expect(result).toEqual({ value: 1, unit: "days" });
		});

		it("should prioritize hours over minutes", () => {
			const result = parseDurationFromICS("PT2H30M");

			expect(result).toEqual({ value: 2, unit: "hours" });
		});

		it("should prioritize minutes over seconds", () => {
			const result = parseDurationFromICS("PT30M45S");

			expect(result).toEqual({ value: 30, unit: "minutes" });
		});
	});

	describe("invalid inputs", () => {
		it("should return null for null input", () => {
			expect(parseDurationFromICS(null)).toBeNull();
		});

		it("should return null for undefined input", () => {
			expect(parseDurationFromICS(undefined)).toBeNull();
		});

		it("should return null for empty string", () => {
			expect(parseDurationFromICS("")).toBeNull();
		});

		it("should return null for whitespace-only string", () => {
			expect(parseDurationFromICS("   ")).toBeNull();
		});

		it("should return null for invalid format", () => {
			expect(parseDurationFromICS("5 minutes")).toBeNull();
			expect(parseDurationFromICS("PT")).toBeNull();
		});

		it("should return null for P without time or day", () => {
			expect(parseDurationFromICS("P")).toBeNull();
		});
	});
});

describe("round-trip conversion", () => {
	it("should round-trip minutes correctly", () => {
		const original = { value: 15, unit: "minutes" as const };
		const ics = formatDurationToICS(original.value, original.unit);
		const parsed = parseDurationFromICS(ics);

		expect(parsed).toEqual(original);
	});

	it("should round-trip hours correctly", () => {
		const original = { value: 2, unit: "hours" as const };
		const ics = formatDurationToICS(original.value, original.unit);
		const parsed = parseDurationFromICS(ics);

		expect(parsed).toEqual(original);
	});

	it("should round-trip days correctly", () => {
		const original = { value: 7, unit: "days" as const };
		const ics = formatDurationToICS(original.value, original.unit);
		const parsed = parseDurationFromICS(ics);

		expect(parsed).toEqual(original);
	});

	it("should round-trip seconds correctly", () => {
		const original = { value: 45, unit: "seconds" as const };
		const ics = formatDurationToICS(original.value, original.unit);
		const parsed = parseDurationFromICS(ics);

		expect(parsed).toEqual(original);
	});
});
