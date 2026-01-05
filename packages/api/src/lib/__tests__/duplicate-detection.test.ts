/**
 * Tests for calendar event duplicate detection
 */
import { describe, expect, it } from "vitest";
import {
	areEventsDuplicates,
	type DuplicateCheckEvent,
	deduplicateEvents,
	findDuplicatesAgainstExisting,
	getDuplicateIds,
} from "../duplicate-detection";

// Helper to create a test event
function createEvent(
	overrides: Partial<DuplicateCheckEvent> = {},
): DuplicateCheckEvent {
	return {
		id: "event-1",
		uid: null,
		title: "Test Event",
		startDate: new Date("2024-01-15T10:00:00Z"),
		endDate: new Date("2024-01-15T11:00:00Z"),
		location: null,
		...overrides,
	};
}

describe("areEventsDuplicates", () => {
	describe("UID-based detection", () => {
		it("should detect duplicates when UIDs match", () => {
			const event1 = createEvent({ id: "1", uid: "abc-123" });
			const event2 = createEvent({ id: "2", uid: "abc-123" });

			expect(areEventsDuplicates(event1, event2)).toBe(true);
		});

		it("should not detect duplicates when UIDs differ", () => {
			const event1 = createEvent({ id: "1", uid: "abc-123" });
			const event2 = createEvent({ id: "2", uid: "xyz-789" });

			expect(areEventsDuplicates(event1, event2)).toBe(false);
		});

		it("should use UID as primary identifier when both have UIDs", () => {
			// Different titles but same UID
			const event1 = createEvent({
				id: "1",
				uid: "abc-123",
				title: "Meeting A",
			});
			const event2 = createEvent({
				id: "2",
				uid: "abc-123",
				title: "Meeting B",
			});

			expect(areEventsDuplicates(event1, event2)).toBe(true);
		});

		it("should fall back to title/date when UID detection is disabled", () => {
			const event1 = createEvent({ id: "1", uid: "abc-123" });
			const event2 = createEvent({
				id: "2",
				uid: "abc-123",
				title: "Different Title",
			});

			expect(areEventsDuplicates(event1, event2, { useUid: false })).toBe(
				false,
			);
		});
	});

	describe("title-based detection", () => {
		it("should detect duplicates with same title and dates", () => {
			const event1 = createEvent({ id: "1" });
			const event2 = createEvent({ id: "2" });

			expect(areEventsDuplicates(event1, event2)).toBe(true);
		});

		it("should normalize title whitespace", () => {
			const event1 = createEvent({ id: "1", title: "Team   Meeting" });
			const event2 = createEvent({ id: "2", title: "Team Meeting" });

			expect(areEventsDuplicates(event1, event2)).toBe(true);
		});

		it("should be case-insensitive for titles", () => {
			const event1 = createEvent({ id: "1", title: "Team Meeting" });
			const event2 = createEvent({ id: "2", title: "TEAM MEETING" });

			expect(areEventsDuplicates(event1, event2)).toBe(true);
		});

		it("should trim title whitespace", () => {
			const event1 = createEvent({ id: "1", title: "  Meeting  " });
			const event2 = createEvent({ id: "2", title: "Meeting" });

			expect(areEventsDuplicates(event1, event2)).toBe(true);
		});

		it("should not detect duplicates with different titles", () => {
			const event1 = createEvent({ id: "1", title: "Meeting A" });
			const event2 = createEvent({ id: "2", title: "Meeting B" });

			expect(areEventsDuplicates(event1, event2)).toBe(false);
		});

		it("should ignore title when disabled", () => {
			const event1 = createEvent({ id: "1", title: "Meeting A" });
			const event2 = createEvent({ id: "2", title: "Meeting B" });

			expect(areEventsDuplicates(event1, event2, { useTitle: false })).toBe(
				true,
			);
		});
	});

	describe("date tolerance", () => {
		it("should detect duplicates within default tolerance (1 minute)", () => {
			const event1 = createEvent({
				id: "1",
				startDate: new Date("2024-01-15T10:00:00Z"),
			});
			const event2 = createEvent({
				id: "2",
				startDate: new Date("2024-01-15T10:00:30Z"), // 30 seconds later
			});

			expect(areEventsDuplicates(event1, event2)).toBe(true);
		});

		it("should not detect duplicates outside default tolerance", () => {
			const event1 = createEvent({
				id: "1",
				startDate: new Date("2024-01-15T10:00:00Z"),
			});
			const event2 = createEvent({
				id: "2",
				startDate: new Date("2024-01-15T10:02:00Z"), // 2 minutes later
			});

			expect(areEventsDuplicates(event1, event2)).toBe(false);
		});

		it("should use custom date tolerance", () => {
			const event1 = createEvent({
				id: "1",
				startDate: new Date("2024-01-15T10:00:00Z"),
			});
			const event2 = createEvent({
				id: "2",
				startDate: new Date("2024-01-15T10:05:00Z"), // 5 minutes later
			});

			// Default tolerance (1 minute) would fail
			expect(areEventsDuplicates(event1, event2)).toBe(false);

			// 10 minute tolerance should succeed
			expect(
				areEventsDuplicates(event1, event2, { dateTolerance: 600000 }),
			).toBe(true);
		});

		it("should check both start and end dates", () => {
			const event1 = createEvent({
				id: "1",
				startDate: new Date("2024-01-15T10:00:00Z"),
				endDate: new Date("2024-01-15T11:00:00Z"),
			});
			const event2 = createEvent({
				id: "2",
				startDate: new Date("2024-01-15T10:00:00Z"),
				endDate: new Date("2024-01-15T12:00:00Z"), // 1 hour later end
			});

			expect(areEventsDuplicates(event1, event2)).toBe(false);
		});
	});

	describe("location-based detection", () => {
		it("should not compare location by default", () => {
			const event1 = createEvent({ id: "1", location: "Room A" });
			const event2 = createEvent({ id: "2", location: "Room B" });

			expect(areEventsDuplicates(event1, event2)).toBe(true);
		});

		it("should compare location when enabled", () => {
			const event1 = createEvent({ id: "1", location: "Room A" });
			const event2 = createEvent({ id: "2", location: "Room B" });

			expect(areEventsDuplicates(event1, event2, { useLocation: true })).toBe(
				false,
			);
		});

		it("should detect duplicates with same location", () => {
			const event1 = createEvent({ id: "1", location: "Room A" });
			const event2 = createEvent({ id: "2", location: "Room A" });

			expect(areEventsDuplicates(event1, event2, { useLocation: true })).toBe(
				true,
			);
		});

		it("should be case-insensitive for location", () => {
			const event1 = createEvent({ id: "1", location: "Conference Room" });
			const event2 = createEvent({ id: "2", location: "CONFERENCE ROOM" });

			expect(areEventsDuplicates(event1, event2, { useLocation: true })).toBe(
				true,
			);
		});

		it("should treat null/empty locations as equal", () => {
			const event1 = createEvent({ id: "1", location: null });
			const event2 = createEvent({ id: "2", location: "" });

			expect(areEventsDuplicates(event1, event2, { useLocation: true })).toBe(
				true,
			);
		});
	});
});

describe("deduplicateEvents", () => {
	it("should return unique events and duplicates", () => {
		const events = [
			createEvent({ id: "1", uid: "abc-123" }),
			createEvent({ id: "2", uid: "abc-123" }), // duplicate of 1
			createEvent({ id: "3", uid: "xyz-789" }),
		];

		const result = deduplicateEvents(events);

		expect(result.unique).toHaveLength(2);
		expect(result.unique.map((e) => e.id)).toEqual(["1", "3"]);
		expect(result.duplicates).toHaveLength(1);
		expect(result.duplicates[0].id).toBe("2");
	});

	it("should keep first occurrence when duplicates found", () => {
		const events = [
			createEvent({ id: "first", title: "Meeting" }),
			createEvent({ id: "second", title: "Meeting" }),
			createEvent({ id: "third", title: "Meeting" }),
		];

		const result = deduplicateEvents(events);

		expect(result.unique).toHaveLength(1);
		expect(result.unique[0].id).toBe("first");
		expect(result.duplicates.map((e) => e.id)).toEqual(["second", "third"]);
	});

	it("should handle empty array", () => {
		const result = deduplicateEvents([]);

		expect(result.unique).toHaveLength(0);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should handle array with no duplicates", () => {
		const events = [
			createEvent({ id: "1", title: "Meeting A" }),
			createEvent({ id: "2", title: "Meeting B" }),
			createEvent({ id: "3", title: "Meeting C" }),
		];

		const result = deduplicateEvents(events);

		expect(result.unique).toHaveLength(3);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should handle multiple groups of duplicates", () => {
		const events = [
			createEvent({ id: "1", uid: "group-a" }),
			createEvent({ id: "2", uid: "group-b" }),
			createEvent({ id: "3", uid: "group-a" }), // duplicate of 1
			createEvent({ id: "4", uid: "group-b" }), // duplicate of 2
		];

		const result = deduplicateEvents(events);

		expect(result.unique).toHaveLength(2);
		expect(result.unique.map((e) => e.id)).toEqual(["1", "2"]);
		expect(result.duplicates).toHaveLength(2);
	});

	it("should apply custom configuration", () => {
		const events = [
			createEvent({ id: "1", title: "Meeting A" }),
			createEvent({ id: "2", title: "Meeting B" }), // Different title
		];

		// Without title comparison, these should be duplicates
		const result = deduplicateEvents(events, { useTitle: false });

		expect(result.unique).toHaveLength(1);
		expect(result.duplicates).toHaveLength(1);
	});
});

describe("findDuplicatesAgainstExisting", () => {
	it("should find duplicates in new events that match existing events", () => {
		const existingEvents = [
			createEvent({ id: "existing-1", uid: "abc-123" }),
			createEvent({ id: "existing-2", title: "Team Meeting" }),
		];

		const newEvents = [
			createEvent({ id: "new-1", uid: "abc-123" }), // duplicate of existing-1
			createEvent({ id: "new-2", uid: "xyz-789" }), // unique
		];

		const result = findDuplicatesAgainstExisting(newEvents, existingEvents);

		expect(result.unique).toHaveLength(1);
		expect(result.unique[0].id).toBe("new-2");
		expect(result.duplicates).toHaveLength(1);
		expect(result.duplicates[0].id).toBe("new-1");
	});

	it("should return all unique when no matches", () => {
		const existingEvents = [
			createEvent({ id: "existing-1", title: "Meeting A" }),
		];

		const newEvents = [
			createEvent({ id: "new-1", title: "Meeting B" }),
			createEvent({ id: "new-2", title: "Meeting C" }),
		];

		const result = findDuplicatesAgainstExisting(newEvents, existingEvents);

		expect(result.unique).toHaveLength(2);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should handle empty existing events", () => {
		const newEvents = [
			createEvent({ id: "new-1" }),
			createEvent({ id: "new-2" }),
		];

		const result = findDuplicatesAgainstExisting(newEvents, []);

		expect(result.unique).toHaveLength(2);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should handle empty new events", () => {
		const existingEvents = [createEvent({ id: "existing-1" })];

		const result = findDuplicatesAgainstExisting([], existingEvents);

		expect(result.unique).toHaveLength(0);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should find multiple duplicates of same existing event", () => {
		const existingEvents = [createEvent({ id: "existing-1", uid: "abc-123" })];

		const newEvents = [
			createEvent({ id: "new-1", uid: "abc-123" }),
			createEvent({ id: "new-2", uid: "abc-123" }),
			createEvent({ id: "new-3", uid: "abc-123" }),
		];

		const result = findDuplicatesAgainstExisting(newEvents, existingEvents);

		expect(result.unique).toHaveLength(0);
		expect(result.duplicates).toHaveLength(3);
	});

	it("should use title-based matching when UIDs not available", () => {
		const existingEvents = [
			createEvent({ id: "existing-1", title: "Weekly Standup" }),
		];

		const newEvents = [
			createEvent({ id: "new-1", title: "Weekly Standup" }),
			createEvent({ id: "new-2", title: "Monthly Review" }),
		];

		const result = findDuplicatesAgainstExisting(newEvents, existingEvents);

		expect(result.unique).toHaveLength(1);
		expect(result.unique[0].id).toBe("new-2");
		expect(result.duplicates).toHaveLength(1);
		expect(result.duplicates[0].id).toBe("new-1");
	});
});

describe("getDuplicateIds", () => {
	it("should return IDs of duplicate events", () => {
		const events = [
			createEvent({ id: "keep-1", uid: "abc-123" }),
			createEvent({ id: "remove-1", uid: "abc-123" }),
			createEvent({ id: "keep-2", uid: "xyz-789" }),
			createEvent({ id: "remove-2", uid: "xyz-789" }),
		];

		const duplicateIds = getDuplicateIds(events);

		expect(duplicateIds).toEqual(["remove-1", "remove-2"]);
	});

	it("should return empty array when no duplicates", () => {
		const events = [
			createEvent({ id: "1", title: "A" }),
			createEvent({ id: "2", title: "B" }),
			createEvent({ id: "3", title: "C" }),
		];

		const duplicateIds = getDuplicateIds(events);

		expect(duplicateIds).toEqual([]);
	});

	it("should return empty array for empty input", () => {
		const duplicateIds = getDuplicateIds([]);

		expect(duplicateIds).toEqual([]);
	});

	it("should respect custom configuration", () => {
		const events = [
			createEvent({ id: "1", title: "A" }),
			createEvent({ id: "2", title: "B" }),
		];

		// Without title comparison, these should be duplicates
		const duplicateIds = getDuplicateIds(events, { useTitle: false });

		expect(duplicateIds).toEqual(["2"]);
	});
});

describe("edge cases", () => {
	it("should handle events with undefined optional fields", () => {
		const event1: DuplicateCheckEvent = {
			id: "1",
			title: "Test",
			startDate: new Date("2024-01-15T10:00:00Z"),
			endDate: new Date("2024-01-15T11:00:00Z"),
		};

		const event2: DuplicateCheckEvent = {
			id: "2",
			uid: undefined,
			title: "Test",
			startDate: new Date("2024-01-15T10:00:00Z"),
			endDate: new Date("2024-01-15T11:00:00Z"),
			location: undefined,
		};

		expect(areEventsDuplicates(event1, event2)).toBe(true);
	});

	it("should handle events at date boundaries", () => {
		const event1 = createEvent({
			id: "1",
			startDate: new Date("2024-01-15T23:59:59.999Z"),
			endDate: new Date("2024-01-16T00:59:59.999Z"),
		});

		const event2 = createEvent({
			id: "2",
			startDate: new Date("2024-01-16T00:00:00.000Z"),
			endDate: new Date("2024-01-16T01:00:00.000Z"),
		});

		// 1ms difference is within tolerance
		expect(areEventsDuplicates(event1, event2)).toBe(true);
	});

	it("should handle very long titles", () => {
		const longTitle = "A".repeat(1000);

		const event1 = createEvent({ id: "1", title: longTitle });
		const event2 = createEvent({ id: "2", title: longTitle });

		expect(areEventsDuplicates(event1, event2)).toBe(true);
	});

	it("should handle special characters in titles", () => {
		const event1 = createEvent({ id: "1", title: "Meeting @#$%^&*()" });
		const event2 = createEvent({ id: "2", title: "Meeting @#$%^&*()" });

		expect(areEventsDuplicates(event1, event2)).toBe(true);
	});

	it("should handle unicode in titles", () => {
		const event1 = createEvent({ id: "1", title: "Reunión de equipo" });
		const event2 = createEvent({ id: "2", title: "Reunión de equipo" });

		expect(areEventsDuplicates(event1, event2)).toBe(true);
	});

	it("should handle emoji in titles", () => {
		const event1 = createEvent({ id: "1", title: "Team Sync" });
		const event2 = createEvent({ id: "2", title: "Team Sync" });

		expect(areEventsDuplicates(event1, event2)).toBe(true);
	});

	it("should handle zero-duration events", () => {
		const sameTime = new Date("2024-01-15T10:00:00Z");

		const event1 = createEvent({
			id: "1",
			startDate: sameTime,
			endDate: sameTime,
		});

		const event2 = createEvent({
			id: "2",
			startDate: sameTime,
			endDate: sameTime,
		});

		expect(areEventsDuplicates(event1, event2)).toBe(true);
	});
});
