/**
 * Tests for event helper functions
 */
import { describe, expect, it } from "vitest";
import {
	parseAlarmAction,
	parseAttendeeRole,
	parseAttendeeStatus,
	parseEventClass,
	parseEventStatus,
	parseEventTransparency,
	prepareAlarmData,
	prepareAttendeeData,
	prepareCategoriesData,
	prepareEventData,
	prepareRecurrenceDatesData,
	prepareResourcesData,
} from "../event-helpers";

describe("parseEventStatus", () => {
	it("should parse CONFIRMED status", () => {
		expect(parseEventStatus("CONFIRMED")).toBe("CONFIRMED");
		expect(parseEventStatus("confirmed")).toBe("CONFIRMED");
		expect(parseEventStatus("Confirmed")).toBe("CONFIRMED");
	});

	it("should parse TENTATIVE status", () => {
		expect(parseEventStatus("TENTATIVE")).toBe("TENTATIVE");
		expect(parseEventStatus("tentative")).toBe("TENTATIVE");
	});

	it("should parse CANCELLED status", () => {
		expect(parseEventStatus("CANCELLED")).toBe("CANCELLED");
		expect(parseEventStatus("cancelled")).toBe("CANCELLED");
	});

	it("should return null for invalid status", () => {
		expect(parseEventStatus("INVALID")).toBe(null);
		expect(parseEventStatus("PENDING")).toBe(null);
	});

	it("should return null for null/undefined", () => {
		expect(parseEventStatus(null)).toBe(null);
		expect(parseEventStatus(undefined)).toBe(null);
	});

	it("should trim whitespace", () => {
		expect(parseEventStatus("  CONFIRMED  ")).toBe("CONFIRMED");
	});
});

describe("parseEventClass", () => {
	it("should parse PUBLIC class", () => {
		expect(parseEventClass("PUBLIC")).toBe("PUBLIC");
		expect(parseEventClass("public")).toBe("PUBLIC");
	});

	it("should parse PRIVATE class", () => {
		expect(parseEventClass("PRIVATE")).toBe("PRIVATE");
	});

	it("should parse CONFIDENTIAL class", () => {
		expect(parseEventClass("CONFIDENTIAL")).toBe("CONFIDENTIAL");
	});

	it("should return null for invalid class", () => {
		expect(parseEventClass("SECRET")).toBe(null);
		expect(parseEventClass("INTERNAL")).toBe(null);
	});

	it("should return null for null/undefined", () => {
		expect(parseEventClass(null)).toBe(null);
		expect(parseEventClass(undefined)).toBe(null);
	});
});

describe("parseEventTransparency", () => {
	it("should parse OPAQUE transparency", () => {
		expect(parseEventTransparency("OPAQUE")).toBe("OPAQUE");
		expect(parseEventTransparency("opaque")).toBe("OPAQUE");
	});

	it("should parse TRANSPARENT transparency", () => {
		expect(parseEventTransparency("TRANSPARENT")).toBe("TRANSPARENT");
	});

	it("should return null for invalid transparency", () => {
		expect(parseEventTransparency("BUSY")).toBe(null);
	});

	it("should return null for null/undefined", () => {
		expect(parseEventTransparency(null)).toBe(null);
		expect(parseEventTransparency(undefined)).toBe(null);
	});
});

describe("parseAttendeeRole", () => {
	it("should parse CHAIR role", () => {
		expect(parseAttendeeRole("CHAIR")).toBe("CHAIR");
		expect(parseAttendeeRole("chair")).toBe("CHAIR");
	});

	it("should parse REQ-PARTICIPANT (RFC 5545 format)", () => {
		expect(parseAttendeeRole("REQ-PARTICIPANT")).toBe("REQ_PARTICIPANT");
		expect(parseAttendeeRole("REQ_PARTICIPANT")).toBe("REQ_PARTICIPANT");
	});

	it("should parse OPT-PARTICIPANT", () => {
		expect(parseAttendeeRole("OPT-PARTICIPANT")).toBe("OPT_PARTICIPANT");
		expect(parseAttendeeRole("OPT_PARTICIPANT")).toBe("OPT_PARTICIPANT");
	});

	it("should parse NON-PARTICIPANT", () => {
		expect(parseAttendeeRole("NON-PARTICIPANT")).toBe("NON_PARTICIPANT");
		expect(parseAttendeeRole("NON_PARTICIPANT")).toBe("NON_PARTICIPANT");
	});

	it("should return null for invalid role", () => {
		expect(parseAttendeeRole("GUEST")).toBe(null);
		expect(parseAttendeeRole("ORGANIZER")).toBe(null);
	});

	it("should return null for null/undefined", () => {
		expect(parseAttendeeRole(null)).toBe(null);
		expect(parseAttendeeRole(undefined)).toBe(null);
	});
});

describe("parseAttendeeStatus", () => {
	it("should parse NEEDS-ACTION (RFC 5545 format)", () => {
		expect(parseAttendeeStatus("NEEDS-ACTION")).toBe("NEEDS_ACTION");
		expect(parseAttendeeStatus("NEEDS_ACTION")).toBe("NEEDS_ACTION");
	});

	it("should parse ACCEPTED", () => {
		expect(parseAttendeeStatus("ACCEPTED")).toBe("ACCEPTED");
		expect(parseAttendeeStatus("accepted")).toBe("ACCEPTED");
	});

	it("should parse DECLINED", () => {
		expect(parseAttendeeStatus("DECLINED")).toBe("DECLINED");
	});

	it("should parse TENTATIVE", () => {
		expect(parseAttendeeStatus("TENTATIVE")).toBe("TENTATIVE");
	});

	it("should parse DELEGATED", () => {
		expect(parseAttendeeStatus("DELEGATED")).toBe("DELEGATED");
	});

	it("should return null for invalid status", () => {
		expect(parseAttendeeStatus("MAYBE")).toBe(null);
		expect(parseAttendeeStatus("PENDING")).toBe(null);
	});

	it("should return null for null/undefined", () => {
		expect(parseAttendeeStatus(null)).toBe(null);
		expect(parseAttendeeStatus(undefined)).toBe(null);
	});
});

describe("parseAlarmAction", () => {
	it("should parse DISPLAY action", () => {
		expect(parseAlarmAction("DISPLAY")).toBe("DISPLAY");
		expect(parseAlarmAction("display")).toBe("DISPLAY");
	});

	it("should parse EMAIL action", () => {
		expect(parseAlarmAction("EMAIL")).toBe("EMAIL");
	});

	it("should parse AUDIO action", () => {
		expect(parseAlarmAction("AUDIO")).toBe("AUDIO");
	});

	it("should return null for invalid action", () => {
		expect(parseAlarmAction("POPUP")).toBe(null);
		expect(parseAlarmAction("SMS")).toBe(null);
	});

	it("should return null for null/undefined", () => {
		expect(parseAlarmAction(null)).toBe(null);
		expect(parseAlarmAction(undefined)).toBe(null);
	});
});

describe("prepareEventData", () => {
	it("should return empty object for empty input", () => {
		const result = prepareEventData({});
		expect(result).toEqual({});
	});

	it("should trim string fields", () => {
		const result = prepareEventData({
			title: "  Test Title  ",
			description: "  Description  ",
			location: "  Location  ",
		});
		expect(result.title).toBe("Test Title");
		expect(result.description).toBe("Description");
		expect(result.location).toBe("Location");
	});

	it("should convert empty strings to null", () => {
		const result = prepareEventData({
			title: "",
			description: "   ",
		});
		expect(result.title).toBe(null);
		expect(result.description).toBe(null);
	});

	it("should preserve dates", () => {
		const startDate = new Date("2024-01-15T10:00:00Z");
		const endDate = new Date("2024-01-15T11:00:00Z");
		const result = prepareEventData({ startDate, endDate });
		expect(result.startDate).toBe(startDate);
		expect(result.endDate).toBe(endDate);
	});

	it("should default sequence to 0 if null", () => {
		const result = prepareEventData({ sequence: null });
		expect(result.sequence).toBe(0);
	});

	it("should preserve sequence value", () => {
		const result = prepareEventData({ sequence: 5 });
		expect(result.sequence).toBe(5);
	});

	it("should preserve numeric fields", () => {
		const result = prepareEventData({
			priority: 5,
			geoLatitude: 48.8566,
			geoLongitude: 2.3522,
		});
		expect(result.priority).toBe(5);
		expect(result.geoLatitude).toBe(48.8566);
		expect(result.geoLongitude).toBe(2.3522);
	});

	it("should preserve enum fields", () => {
		const result = prepareEventData({
			status: "CONFIRMED",
			class: "PRIVATE",
			transp: "OPAQUE",
		});
		expect(result.status).toBe("CONFIRMED");
		expect(result.class).toBe("PRIVATE");
		expect(result.transp).toBe("OPAQUE");
	});
});

describe("prepareAttendeeData", () => {
	it("should return undefined for undefined input", () => {
		expect(prepareAttendeeData(undefined)).toBeUndefined();
	});

	it("should return undefined for empty array", () => {
		expect(prepareAttendeeData([])).toBeUndefined();
	});

	it("should prepare basic attendee data", () => {
		const result = prepareAttendeeData([{ email: "test@example.com" }]);
		expect(result).toEqual({
			create: [
				{
					name: null,
					email: "test@example.com",
					role: null,
					status: null,
					rsvp: false,
				},
			],
		});
	});

	it("should prepare attendee with all fields", () => {
		const result = prepareAttendeeData([
			{
				name: "  John Doe  ",
				email: " john@example.com ",
				role: "REQ-PARTICIPANT",
				status: "ACCEPTED",
				rsvp: true,
			},
		]);
		expect(result?.create[0]).toEqual({
			name: "John Doe",
			email: "john@example.com",
			role: "REQ_PARTICIPANT",
			status: "ACCEPTED",
			rsvp: true,
		});
	});

	it("should handle multiple attendees", () => {
		const result = prepareAttendeeData([
			{ email: "alice@example.com", name: "Alice" },
			{ email: "bob@example.com", name: "Bob" },
		]);
		expect(result?.create).toHaveLength(2);
	});

	it("should default rsvp to false", () => {
		const result = prepareAttendeeData([{ email: "test@example.com" }]);
		expect(result?.create[0].rsvp).toBe(false);
	});
});

describe("prepareAlarmData", () => {
	it("should return undefined for undefined input", () => {
		expect(prepareAlarmData(undefined)).toBeUndefined();
	});

	it("should return undefined for empty array", () => {
		expect(prepareAlarmData([])).toBeUndefined();
	});

	it("should prepare basic alarm data", () => {
		const result = prepareAlarmData([
			{
				trigger: "-PT15M",
				action: "DISPLAY",
			},
		]);
		expect(result).toEqual({
			create: [
				{
					trigger: "-PT15M",
					action: "DISPLAY",
					summary: null,
					description: null,
					duration: null,
					repeat: null,
				},
			],
		});
	});

	it("should prepare alarm with all fields", () => {
		const result = prepareAlarmData([
			{
				trigger: "-PT30M",
				action: "EMAIL",
				summary: "  Reminder  ",
				description: "  Meeting starts soon  ",
				duration: "PT5M",
				repeat: 3,
			},
		]);
		expect(result?.create[0]).toEqual({
			trigger: "-PT30M",
			action: "EMAIL",
			summary: "Reminder",
			description: "Meeting starts soon",
			duration: "PT5M",
			repeat: 3,
		});
	});

	it("should default invalid action to DISPLAY", () => {
		const result = prepareAlarmData([
			{
				trigger: "-PT15M",
				action: "INVALID",
			},
		]);
		expect(result?.create[0].action).toBe("DISPLAY");
	});

	it("should handle multiple alarms", () => {
		const result = prepareAlarmData([
			{ trigger: "-PT15M", action: "DISPLAY" },
			{ trigger: "-PT5M", action: "AUDIO" },
		]);
		expect(result?.create).toHaveLength(2);
	});
});

describe("prepareCategoriesData", () => {
	it("should return undefined for undefined input", () => {
		expect(prepareCategoriesData(undefined)).toBeUndefined();
	});

	it("should return undefined for null input", () => {
		expect(prepareCategoriesData(null)).toBeUndefined();
	});

	it("should return undefined for empty string", () => {
		expect(prepareCategoriesData("")).toBeUndefined();
	});

	it("should return undefined for empty array", () => {
		expect(prepareCategoriesData([])).toBeUndefined();
	});

	it("should parse comma-separated string", () => {
		const result = prepareCategoriesData("Work, Meeting, Important");
		expect(result).toEqual({
			create: [
				{ category: "Work" },
				{ category: "Meeting" },
				{ category: "Important" },
			],
		});
	});

	it("should parse array of strings", () => {
		const result = prepareCategoriesData(["Work", "Personal"]);
		expect(result).toEqual({
			create: [{ category: "Work" }, { category: "Personal" }],
		});
	});

	it("should remove duplicates", () => {
		const result = prepareCategoriesData(["Work", "Meeting", "Work"]);
		expect(result?.create).toHaveLength(2);
	});

	it("should trim whitespace", () => {
		const result = prepareCategoriesData("  Work  ,  Meeting  ");
		expect(result).toEqual({
			create: [{ category: "Work" }, { category: "Meeting" }],
		});
	});

	it("should filter empty values", () => {
		const result = prepareCategoriesData("Work, , Meeting, ");
		expect(result).toEqual({
			create: [{ category: "Work" }, { category: "Meeting" }],
		});
	});
});

describe("prepareResourcesData", () => {
	it("should return undefined for undefined input", () => {
		expect(prepareResourcesData(undefined)).toBeUndefined();
	});

	it("should return undefined for null input", () => {
		expect(prepareResourcesData(null)).toBeUndefined();
	});

	it("should parse comma-separated string", () => {
		const result = prepareResourcesData("Projector, Whiteboard");
		expect(result).toEqual({
			create: [{ resource: "Projector" }, { resource: "Whiteboard" }],
		});
	});

	it("should parse array of strings", () => {
		const result = prepareResourcesData(["Room A", "Room B"]);
		expect(result).toEqual({
			create: [{ resource: "Room A" }, { resource: "Room B" }],
		});
	});

	it("should remove duplicates", () => {
		const result = prepareResourcesData(["Projector", "Laptop", "Projector"]);
		expect(result?.create).toHaveLength(2);
	});
});

describe("prepareRecurrenceDatesData", () => {
	it("should return undefined for no dates", () => {
		expect(prepareRecurrenceDatesData(undefined, undefined)).toBeUndefined();
	});

	it("should return undefined for null dates", () => {
		expect(prepareRecurrenceDatesData(null, null)).toBeUndefined();
	});

	it("should handle RDATE array", () => {
		const date = new Date("2024-01-15T10:00:00Z");
		const result = prepareRecurrenceDatesData([date], undefined);
		expect(result).toEqual({
			create: [{ date, type: "RDATE" }],
		});
	});

	it("should handle EXDATE array", () => {
		const date = new Date("2024-01-22T10:00:00Z");
		const result = prepareRecurrenceDatesData(undefined, [date]);
		expect(result).toEqual({
			create: [{ date, type: "EXDATE" }],
		});
	});

	it("should handle both RDATE and EXDATE", () => {
		const rdate = new Date("2024-01-15T10:00:00Z");
		const exdate = new Date("2024-01-22T10:00:00Z");
		const result = prepareRecurrenceDatesData([rdate], [exdate]);
		expect(result?.create).toHaveLength(2);
		expect(result?.create[0]).toEqual({ date: rdate, type: "RDATE" });
		expect(result?.create[1]).toEqual({ date: exdate, type: "EXDATE" });
	});

	it("should parse JSON string for RDATE", () => {
		const dateStr = '["2024-01-15T10:00:00.000Z"]';
		const result = prepareRecurrenceDatesData(dateStr, undefined);
		expect(result?.create).toHaveLength(1);
		expect(result?.create[0].type).toBe("RDATE");
		expect(result?.create[0].date.toISOString()).toBe(
			"2024-01-15T10:00:00.000Z",
		);
	});

	it("should parse JSON string for EXDATE", () => {
		const dateStr = '["2024-01-22T10:00:00.000Z", "2024-01-29T10:00:00.000Z"]';
		const result = prepareRecurrenceDatesData(undefined, dateStr);
		expect(result?.create).toHaveLength(2);
		expect(result?.create[0].type).toBe("EXDATE");
		expect(result?.create[1].type).toBe("EXDATE");
	});

	it("should handle invalid JSON gracefully", () => {
		const result = prepareRecurrenceDatesData("not json", undefined);
		expect(result).toBeUndefined();
	});

	it("should filter invalid dates", () => {
		const validDate = new Date("2024-01-15T10:00:00Z");
		const invalidDate = new Date("invalid");
		const result = prepareRecurrenceDatesData(
			[validDate, invalidDate],
			undefined,
		);
		expect(result?.create).toHaveLength(1);
	});
});
