/**
 * Tests for task duplicate detection
 */
import { describe, expect, it } from "vitest";
import {
	type DuplicateCheckTask,
	type DuplicateDetectionConfig,
	deduplicateTasks,
	findDuplicatesAgainstExisting,
	getDuplicateIds,
} from "../duplicate-detection";

describe("deduplicateTasks", () => {
	describe("UID-based detection", () => {
		it("should detect duplicates by UID", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", uid: "unique-123", title: "Buy groceries" },
				{ id: "2", uid: "unique-123", title: "Get groceries" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(1);
			expect(result.unique[0]?.id).toBe("1");
			expect(result.duplicates[0]?.id).toBe("2");
		});

		it("should not match different UIDs", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", uid: "unique-123", title: "Buy groceries" },
				{ id: "2", uid: "unique-456", title: "Buy groceries" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(2);
			expect(result.duplicates).toHaveLength(0);
		});

		it("should disable UID matching when configured", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", uid: "unique-123", title: "Buy groceries" },
				{ id: "2", uid: "unique-123", title: "Different task" },
			];

			const config: DuplicateDetectionConfig = { useUid: false };
			const result = deduplicateTasks(tasks, config);
			// Without UID matching, these are different because titles don't match
			expect(result.unique).toHaveLength(2);
		});
	});

	describe("title-based detection", () => {
		it("should detect duplicates by title when no UID", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "Buy groceries" },
				{ id: "2", title: "Buy groceries" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(1);
		});

		it("should normalize whitespace in titles", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "Buy  groceries" },
				{ id: "2", title: "Buy groceries" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(1);
		});

		it("should be case-insensitive for titles", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "BUY GROCERIES" },
				{ id: "2", title: "buy groceries" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
		});

		it("should trim whitespace from titles", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "  Buy groceries  " },
				{ id: "2", title: "Buy groceries" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
		});

		it("should disable title matching when configured", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "Buy groceries", dueDate: new Date("2024-01-01") },
				{ id: "2", title: "Buy groceries", dueDate: new Date("2024-01-01") },
			];

			const config: DuplicateDetectionConfig = { useTitle: false };
			const result = deduplicateTasks(tasks, config);
			// With title disabled, they match on date only which puts them in same bucket
			expect(result.unique).toHaveLength(1);
		});
	});

	describe("date-based detection", () => {
		it("should detect duplicates with same title and due date", () => {
			const dueDate = new Date("2024-01-15T10:00:00Z");
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "Buy groceries", dueDate },
				{ id: "2", title: "Buy groceries", dueDate },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(1);
		});

		it("should detect duplicates within date tolerance", () => {
			const tasks: DuplicateCheckTask[] = [
				{
					id: "1",
					title: "Buy groceries",
					dueDate: new Date("2024-01-15T10:00:00Z"),
				},
				{
					id: "2",
					title: "Buy groceries",
					dueDate: new Date("2024-01-15T10:00:30Z"), // 30 seconds later
				},
			];

			const config: DuplicateDetectionConfig = { dateTolerance: 60000 }; // 1 minute
			const result = deduplicateTasks(tasks, config);
			expect(result.unique).toHaveLength(1);
		});

		it("should not match tasks beyond date tolerance", () => {
			const tasks: DuplicateCheckTask[] = [
				{
					id: "1",
					title: "Buy groceries",
					dueDate: new Date("2024-01-15T10:00:00Z"),
				},
				{
					id: "2",
					title: "Buy groceries",
					dueDate: new Date("2024-01-15T10:05:00Z"), // 5 minutes later
				},
			];

			const config: DuplicateDetectionConfig = { dateTolerance: 60000 }; // 1 minute
			const result = deduplicateTasks(tasks, config);
			expect(result.unique).toHaveLength(2);
		});

		it("should use startDate when dueDate is not available", () => {
			const startDate = new Date("2024-01-15T10:00:00Z");
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "Buy groceries", startDate },
				{ id: "2", title: "Buy groceries", startDate },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
		});

		it("should prefer dueDate over startDate", () => {
			const dueDate = new Date("2024-01-15T10:00:00Z");
			const differentDueDate = new Date("2024-01-16T10:00:00Z");
			const startDate = new Date("2024-01-15T10:00:00Z");

			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "Buy groceries", dueDate, startDate },
				{
					id: "2",
					title: "Buy groceries",
					dueDate: differentDueDate,
					startDate,
				},
			];

			const result = deduplicateTasks(tasks);
			// Should use dueDate for comparison, which are different
			expect(result.unique).toHaveLength(2);
		});

		it("should match tasks without dates as potential duplicates", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "Buy groceries" },
				{ id: "2", title: "Buy groceries" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(1);
		});

		it("should not match when one has date and other does not", () => {
			const tasks: DuplicateCheckTask[] = [
				{
					id: "1",
					title: "Buy groceries",
					dueDate: new Date("2024-01-15T10:00:00Z"),
				},
				{ id: "2", title: "Buy groceries" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(2);
		});
	});

	describe("edge cases", () => {
		it("should handle empty array", () => {
			const result = deduplicateTasks([]);
			expect(result.unique).toHaveLength(0);
			expect(result.duplicates).toHaveLength(0);
		});

		it("should handle single task", () => {
			const tasks: DuplicateCheckTask[] = [{ id: "1", title: "Buy groceries" }];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(0);
		});

		it("should handle null/undefined UIDs", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", uid: null, title: "Buy groceries" },
				{ id: "2", uid: undefined, title: "Buy groceries" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
		});

		it("should handle null/undefined dates", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "Buy groceries", dueDate: null, startDate: null },
				{
					id: "2",
					title: "Buy groceries",
					dueDate: undefined,
					startDate: undefined,
				},
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
		});

		it("should keep first occurrence and mark later as duplicates", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "first", uid: "same", title: "Task" },
				{ id: "second", uid: "same", title: "Task" },
				{ id: "third", uid: "same", title: "Task" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
			expect(result.unique[0]?.id).toBe("first");
			expect(result.duplicates).toHaveLength(2);
		});

		it("should handle empty titles", () => {
			const tasks: DuplicateCheckTask[] = [
				{ id: "1", title: "" },
				{ id: "2", title: "" },
			];

			const result = deduplicateTasks(tasks);
			expect(result.unique).toHaveLength(1);
		});
	});

	describe("configuration options", () => {
		it("should respect custom date tolerance", () => {
			const tasks: DuplicateCheckTask[] = [
				{
					id: "1",
					title: "Meeting",
					dueDate: new Date("2024-01-15T10:00:00Z"),
				},
				{
					id: "2",
					title: "Meeting",
					dueDate: new Date("2024-01-15T10:10:00Z"), // 10 minutes later
				},
			];

			// With 15 minute tolerance, these should be duplicates
			const config1: DuplicateDetectionConfig = {
				dateTolerance: 15 * 60 * 1000,
			};
			const result1 = deduplicateTasks(tasks, config1);
			expect(result1.unique).toHaveLength(1);

			// With 5 minute tolerance, these should be unique
			const config2: DuplicateDetectionConfig = {
				dateTolerance: 5 * 60 * 1000,
			};
			const result2 = deduplicateTasks(tasks, config2);
			expect(result2.unique).toHaveLength(2);
		});
	});
});

describe("findDuplicatesAgainstExisting", () => {
	it("should find new tasks that duplicate existing ones", () => {
		const existing: DuplicateCheckTask[] = [
			{ id: "e1", uid: "uid-1", title: "Buy groceries" },
		];

		const newTasks: DuplicateCheckTask[] = [
			{ id: "n1", uid: "uid-1", title: "Get groceries" },
			{ id: "n2", uid: "uid-2", title: "Clean house" },
		];

		const result = findDuplicatesAgainstExisting(newTasks, existing);
		expect(result.unique).toHaveLength(1);
		expect(result.unique[0]?.id).toBe("n2");
		expect(result.duplicates).toHaveLength(1);
		expect(result.duplicates[0]?.id).toBe("n1");
	});

	it("should not modify existing tasks", () => {
		const existing: DuplicateCheckTask[] = [
			{ id: "e1", title: "Buy groceries" },
			{ id: "e2", title: "Buy groceries" }, // Duplicate within existing
		];

		const newTasks: DuplicateCheckTask[] = [{ id: "n1", title: "Clean house" }];

		const result = findDuplicatesAgainstExisting(newTasks, existing);
		expect(result.unique).toHaveLength(1);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should handle empty new tasks", () => {
		const existing: DuplicateCheckTask[] = [
			{ id: "e1", title: "Buy groceries" },
		];

		const result = findDuplicatesAgainstExisting([], existing);
		expect(result.unique).toHaveLength(0);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should handle empty existing tasks", () => {
		const newTasks: DuplicateCheckTask[] = [
			{ id: "n1", title: "Buy groceries" },
			{ id: "n2", title: "Clean house" },
		];

		const result = findDuplicatesAgainstExisting(newTasks, []);
		expect(result.unique).toHaveLength(2);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should detect duplicates by title and date", () => {
		const dueDate = new Date("2024-01-15T10:00:00Z");
		const existing: DuplicateCheckTask[] = [
			{ id: "e1", title: "Meeting", dueDate },
		];

		const newTasks: DuplicateCheckTask[] = [
			{ id: "n1", title: "Meeting", dueDate },
		];

		const result = findDuplicatesAgainstExisting(newTasks, existing);
		expect(result.duplicates).toHaveLength(1);
	});

	it("should use config for date tolerance", () => {
		const existing: DuplicateCheckTask[] = [
			{
				id: "e1",
				title: "Meeting",
				dueDate: new Date("2024-01-15T10:00:00Z"),
			},
		];

		const newTasks: DuplicateCheckTask[] = [
			{
				id: "n1",
				title: "Meeting",
				dueDate: new Date("2024-01-15T10:02:00Z"), // 2 minutes later
			},
		];

		// With 5 minute tolerance
		const config1: DuplicateDetectionConfig = { dateTolerance: 5 * 60 * 1000 };
		const result1 = findDuplicatesAgainstExisting(newTasks, existing, config1);
		expect(result1.duplicates).toHaveLength(1);

		// With 1 minute tolerance
		const config2: DuplicateDetectionConfig = { dateTolerance: 1 * 60 * 1000 };
		const result2 = findDuplicatesAgainstExisting(newTasks, existing, config2);
		expect(result2.duplicates).toHaveLength(0);
	});
});

describe("getDuplicateIds", () => {
	it("should return IDs of duplicate tasks", () => {
		const tasks: DuplicateCheckTask[] = [
			{ id: "1", uid: "same", title: "Task" },
			{ id: "2", uid: "same", title: "Task" },
			{ id: "3", uid: "different", title: "Other" },
		];

		const ids = getDuplicateIds(tasks);
		expect(ids).toEqual(["2"]);
	});

	it("should return empty array for no duplicates", () => {
		const tasks: DuplicateCheckTask[] = [
			{ id: "1", uid: "uid-1", title: "Task 1" },
			{ id: "2", uid: "uid-2", title: "Task 2" },
		];

		const ids = getDuplicateIds(tasks);
		expect(ids).toEqual([]);
	});

	it("should return multiple IDs for multiple duplicates", () => {
		const tasks: DuplicateCheckTask[] = [
			{ id: "1", uid: "same", title: "A" },
			{ id: "2", uid: "same", title: "B" },
			{ id: "3", uid: "same", title: "C" },
		];

		const ids = getDuplicateIds(tasks);
		expect(ids).toEqual(["2", "3"]);
	});

	it("should respect configuration", () => {
		const tasks: DuplicateCheckTask[] = [
			{ id: "1", title: "Task", dueDate: new Date("2024-01-15T10:00:00Z") },
			{ id: "2", title: "Task", dueDate: new Date("2024-01-15T10:05:00Z") },
		];

		// With 10 minute tolerance, these are duplicates
		const config1: DuplicateDetectionConfig = { dateTolerance: 10 * 60 * 1000 };
		const ids1 = getDuplicateIds(tasks, config1);
		expect(ids1).toEqual(["2"]);

		// With 1 minute tolerance, these are unique
		const config2: DuplicateDetectionConfig = { dateTolerance: 1 * 60 * 1000 };
		const ids2 = getDuplicateIds(tasks, config2);
		expect(ids2).toEqual([]);
	});
});
