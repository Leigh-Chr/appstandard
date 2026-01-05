/**
 * Tests for duration parsing and formatting utilities
 */
import { describe, expect, it } from "vitest";
import {
	durationToMinutes,
	formatDuration,
	formatNegativeDuration,
	isValidDuration,
	parseDuration,
} from "../duration";

describe("parseDuration", () => {
	describe("valid durations", () => {
		it("should parse minutes (PT5M)", () => {
			const result = parseDuration("PT5M");
			expect(result).toEqual({ value: 5, unit: "minutes" });
		});

		it("should parse hours (PT2H)", () => {
			const result = parseDuration("PT2H");
			expect(result).toEqual({ value: 2, unit: "hours" });
		});

		it("should parse days (P3D)", () => {
			const result = parseDuration("P3D");
			expect(result).toEqual({ value: 3, unit: "days" });
		});

		it("should parse seconds (PT30S)", () => {
			const result = parseDuration("PT30S");
			expect(result).toEqual({ value: 30, unit: "seconds" });
		});

		it("should parse complex duration (P1DT2H30M)", () => {
			// Should return the largest unit (days)
			const result = parseDuration("P1DT2H30M");
			expect(result).toEqual({ value: 1, unit: "days" });
		});

		it("should handle negative durations (-PT15M)", () => {
			const result = parseDuration("-PT15M");
			expect(result).toEqual({ value: 15, unit: "minutes" });
		});

		it("should handle without P prefix", () => {
			const result = parseDuration("T1H");
			expect(result).toEqual({ value: 1, unit: "hours" });
		});
	});

	describe("invalid durations", () => {
		it("should return null for empty string", () => {
			expect(parseDuration("")).toBeNull();
		});

		it("should return null for null", () => {
			expect(parseDuration(null)).toBeNull();
		});

		it("should return null for undefined", () => {
			expect(parseDuration(undefined)).toBeNull();
		});

		it("should return null for whitespace only", () => {
			expect(parseDuration("   ")).toBeNull();
		});

		it("should return null for invalid format", () => {
			expect(parseDuration("invalid")).toBeNull();
		});

		it("should return null for P without time component", () => {
			expect(parseDuration("P")).toBeNull();
		});
	});

	describe("prioritization", () => {
		it("should prioritize days over hours", () => {
			const result = parseDuration("P2DT3H");
			expect(result?.unit).toBe("days");
			expect(result?.value).toBe(2);
		});

		it("should prioritize hours over minutes", () => {
			const result = parseDuration("PT3H30M");
			expect(result?.unit).toBe("hours");
			expect(result?.value).toBe(3);
		});

		it("should prioritize minutes over seconds", () => {
			const result = parseDuration("PT5M30S");
			expect(result?.unit).toBe("minutes");
			expect(result?.value).toBe(5);
		});
	});
});

describe("isValidDuration", () => {
	it("should return true for valid durations", () => {
		expect(isValidDuration("PT5M")).toBe(true);
		expect(isValidDuration("PT1H")).toBe(true);
		expect(isValidDuration("P1D")).toBe(true);
		expect(isValidDuration("-PT30M")).toBe(true);
	});

	it("should return false for invalid durations", () => {
		expect(isValidDuration("")).toBe(false);
		expect(isValidDuration("invalid")).toBe(false);
		expect(isValidDuration("P")).toBe(false);
	});
});

describe("durationToMinutes", () => {
	it("should convert minutes to minutes", () => {
		expect(durationToMinutes("PT30M")).toBe(30);
	});

	it("should convert hours to minutes", () => {
		expect(durationToMinutes("PT2H")).toBe(120);
	});

	it("should convert days to minutes", () => {
		expect(durationToMinutes("P1D")).toBe(24 * 60);
		expect(durationToMinutes("P2D")).toBe(2 * 24 * 60);
	});

	it("should convert seconds to minutes (rounded up)", () => {
		expect(durationToMinutes("PT30S")).toBe(1);
		expect(durationToMinutes("PT90S")).toBe(2);
	});

	it("should return null for invalid duration", () => {
		expect(durationToMinutes("")).toBeNull();
		expect(durationToMinutes(null)).toBeNull();
		expect(durationToMinutes(undefined)).toBeNull();
	});
});

describe("formatDuration", () => {
	it("should format minutes", () => {
		expect(formatDuration(30, "minutes")).toBe("PT30M");
	});

	it("should format hours", () => {
		expect(formatDuration(2, "hours")).toBe("PT2H");
	});

	it("should format days", () => {
		expect(formatDuration(3, "days")).toBe("P3D");
	});
});

describe("formatNegativeDuration", () => {
	it("should format negative minutes", () => {
		expect(formatNegativeDuration(15, "minutes")).toBe("-PT15M");
	});

	it("should format negative hours", () => {
		expect(formatNegativeDuration(1, "hours")).toBe("-PT1H");
	});

	it("should format negative days", () => {
		expect(formatNegativeDuration(2, "days")).toBe("-P2D");
	});
});

describe("round-trip", () => {
	it("should parse formatted duration correctly", () => {
		const formatted = formatDuration(45, "minutes");
		const parsed = parseDuration(formatted);
		expect(parsed).toEqual({ value: 45, unit: "minutes" });
	});

	it("should parse formatted negative duration", () => {
		const formatted = formatNegativeDuration(30, "minutes");
		const parsed = parseDuration(formatted);
		expect(parsed).toEqual({ value: 30, unit: "minutes" });
	});
});
