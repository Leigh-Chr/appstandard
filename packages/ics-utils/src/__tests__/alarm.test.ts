/**
 * Tests for alarm trigger parsing and formatting
 */
import { describe, expect, it } from "vitest";
import { formatAlarmTrigger, parseAlarmTrigger } from "../alarm";

describe("parseAlarmTrigger", () => {
	describe("relative triggers", () => {
		it("should parse negative minutes trigger (before event)", () => {
			const result = parseAlarmTrigger("-PT15M");
			expect(result).toEqual({ when: "before", value: 15, unit: "minutes" });
		});

		it("should parse negative hours trigger", () => {
			const result = parseAlarmTrigger("-PT2H");
			expect(result).toEqual({ when: "before", value: 2, unit: "hours" });
		});

		it("should parse negative days trigger", () => {
			const result = parseAlarmTrigger("-P1D");
			expect(result).toEqual({ when: "before", value: 1, unit: "days" });
		});

		it("should parse positive minutes trigger (after event)", () => {
			const result = parseAlarmTrigger("PT30M");
			expect(result).toEqual({ when: "after", value: 30, unit: "minutes" });
		});

		it("should parse positive hours trigger", () => {
			const result = parseAlarmTrigger("PT1H");
			expect(result).toEqual({ when: "after", value: 1, unit: "hours" });
		});

		it("should parse complex duration", () => {
			const result = parseAlarmTrigger("-P1DT2H");
			// Should return days since it's the largest unit
			expect(result).toEqual({ when: "before", value: 1, unit: "days" });
		});
	});

	describe("absolute triggers", () => {
		it("should parse absolute datetime with Z suffix", () => {
			const result = parseAlarmTrigger("20240115T093000Z");
			expect(result).toEqual({ when: "at", value: 0, unit: "minutes" });
		});

		it("should parse absolute datetime without Z suffix", () => {
			const result = parseAlarmTrigger("20240115T093000");
			expect(result).toEqual({ when: "at", value: 0, unit: "minutes" });
		});
	});

	describe("invalid triggers", () => {
		it("should return null for empty string", () => {
			expect(parseAlarmTrigger("")).toBeNull();
		});

		it("should return null for invalid format", () => {
			expect(parseAlarmTrigger("invalid")).toBeNull();
		});

		it("should return null for P without time component", () => {
			expect(parseAlarmTrigger("P")).toBeNull();
		});
	});

	describe("prioritization", () => {
		it("should prioritize days over hours in complex duration", () => {
			const result = parseAlarmTrigger("-P2DT3H30M");
			expect(result?.unit).toBe("days");
			expect(result?.value).toBe(2);
		});

		it("should prioritize hours over minutes", () => {
			const result = parseAlarmTrigger("-PT3H45M");
			expect(result?.unit).toBe("hours");
			expect(result?.value).toBe(3);
		});
	});
});

describe("formatAlarmTrigger", () => {
	describe("before triggers", () => {
		it("should format minutes before", () => {
			expect(formatAlarmTrigger("before", 15, "minutes")).toBe("-PT15M");
		});

		it("should format hours before", () => {
			expect(formatAlarmTrigger("before", 2, "hours")).toBe("-PT2H");
		});

		it("should format days before", () => {
			expect(formatAlarmTrigger("before", 1, "days")).toBe("-P1D");
		});
	});

	describe("after triggers", () => {
		it("should format minutes after", () => {
			expect(formatAlarmTrigger("after", 30, "minutes")).toBe("PT30M");
		});

		it("should format hours after", () => {
			expect(formatAlarmTrigger("after", 1, "hours")).toBe("PT1H");
		});

		it("should format days after", () => {
			expect(formatAlarmTrigger("after", 3, "days")).toBe("P3D");
		});
	});

	describe("at triggers", () => {
		it("should return empty string for at triggers", () => {
			expect(formatAlarmTrigger("at", 0, "minutes")).toBe("");
		});
	});
});

describe("round-trip", () => {
	it("should parse formatted trigger correctly", () => {
		const formatted = formatAlarmTrigger("before", 30, "minutes");
		const parsed = parseAlarmTrigger(formatted);
		expect(parsed).toEqual({ when: "before", value: 30, unit: "minutes" });
	});

	it("should handle hours round-trip", () => {
		const formatted = formatAlarmTrigger("before", 2, "hours");
		const parsed = parseAlarmTrigger(formatted);
		expect(parsed).toEqual({ when: "before", value: 2, unit: "hours" });
	});

	it("should handle days round-trip", () => {
		const formatted = formatAlarmTrigger("before", 1, "days");
		const parsed = parseAlarmTrigger(formatted);
		expect(parsed).toEqual({ when: "before", value: 1, unit: "days" });
	});

	it("should handle after trigger round-trip", () => {
		const formatted = formatAlarmTrigger("after", 15, "minutes");
		const parsed = parseAlarmTrigger(formatted);
		expect(parsed).toEqual({ when: "after", value: 15, unit: "minutes" });
	});
});
