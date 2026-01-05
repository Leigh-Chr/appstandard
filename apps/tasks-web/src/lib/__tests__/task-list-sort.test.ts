/**
 * Tests for task list sorting utilities
 */
import { describe, expect, it } from "vitest";
import {
	filterTaskListsByKeyword,
	sortTaskLists,
	type TaskListForSort,
} from "../task-list-sort";

// Helper to create a test task list
function createTaskList(
	overrides: Partial<TaskListForSort> = {},
): TaskListForSort {
	return {
		id: "tl-1",
		name: "Test Task List",
		taskCount: 10,
		completedCount: 3,
		updatedAt: "2024-01-15T10:00:00Z",
		createdAt: "2024-01-01T10:00:00Z",
		color: "#FF0000",
		...overrides,
	};
}

describe("sortTaskLists", () => {
	describe("sort by name", () => {
		it("should sort task lists alphabetically by name", () => {
			const taskLists = [
				createTaskList({ id: "1", name: "Zebra" }),
				createTaskList({ id: "2", name: "Alpha" }),
				createTaskList({ id: "3", name: "Mike" }),
			];

			const sorted = sortTaskLists(taskLists, "name", "asc");

			expect(sorted.map((tl) => tl.name)).toEqual(["Alpha", "Mike", "Zebra"]);
		});

		it("should handle case-insensitive sorting", () => {
			const taskLists = [
				createTaskList({ id: "1", name: "beta" }),
				createTaskList({ id: "2", name: "Alpha" }),
				createTaskList({ id: "3", name: "CHARLIE" }),
			];

			const sorted = sortTaskLists(taskLists, "name", "asc");

			expect(sorted.map((tl) => tl.name)).toEqual(["Alpha", "beta", "CHARLIE"]);
		});

		it("should not modify the original array", () => {
			const taskLists = [
				createTaskList({ id: "1", name: "B" }),
				createTaskList({ id: "2", name: "A" }),
			];

			const sorted = sortTaskLists(taskLists, "name", "asc");

			expect(taskLists[0].name).toBe("B");
			expect(sorted[0].name).toBe("A");
		});
	});

	describe("sort by updatedAt", () => {
		it("should sort by updatedAt in ascending order", () => {
			const taskLists = [
				createTaskList({
					id: "1",
					name: "C",
					updatedAt: "2024-01-15T10:00:00Z",
				}),
				createTaskList({
					id: "2",
					name: "A",
					updatedAt: "2024-01-01T10:00:00Z",
				}),
				createTaskList({
					id: "3",
					name: "B",
					updatedAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortTaskLists(taskLists, "updatedAt", "asc");

			expect(sorted.map((tl) => tl.name)).toEqual(["A", "B", "C"]);
		});

		it("should sort by updatedAt in descending order", () => {
			const taskLists = [
				createTaskList({
					id: "1",
					name: "C",
					updatedAt: "2024-01-15T10:00:00Z",
				}),
				createTaskList({
					id: "2",
					name: "A",
					updatedAt: "2024-01-01T10:00:00Z",
				}),
				createTaskList({
					id: "3",
					name: "B",
					updatedAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortTaskLists(taskLists, "updatedAt", "desc");

			expect(sorted.map((tl) => tl.name)).toEqual(["C", "B", "A"]);
		});

		it("should handle null updatedAt", () => {
			const taskLists = [
				createTaskList({ id: "1", name: "A", updatedAt: null }),
				createTaskList({
					id: "2",
					name: "B",
					updatedAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortTaskLists(taskLists, "updatedAt", "desc");

			expect(sorted.map((tl) => tl.name)).toEqual(["B", "A"]);
		});

		it("should handle Date objects", () => {
			const taskLists = [
				createTaskList({
					id: "1",
					name: "A",
					updatedAt: new Date("2024-01-15T10:00:00Z"),
				}),
				createTaskList({
					id: "2",
					name: "B",
					updatedAt: new Date("2024-01-01T10:00:00Z"),
				}),
			];

			const sorted = sortTaskLists(taskLists, "updatedAt", "desc");

			expect(sorted.map((tl) => tl.name)).toEqual(["A", "B"]);
		});
	});

	describe("sort by createdAt", () => {
		it("should sort by createdAt in ascending order", () => {
			const taskLists = [
				createTaskList({
					id: "1",
					name: "C",
					createdAt: "2024-01-15T10:00:00Z",
				}),
				createTaskList({
					id: "2",
					name: "A",
					createdAt: "2024-01-01T10:00:00Z",
				}),
				createTaskList({
					id: "3",
					name: "B",
					createdAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortTaskLists(taskLists, "createdAt", "asc");

			expect(sorted.map((tl) => tl.name)).toEqual(["A", "B", "C"]);
		});

		it("should sort by createdAt in descending order", () => {
			const taskLists = [
				createTaskList({
					id: "1",
					name: "C",
					createdAt: "2024-01-15T10:00:00Z",
				}),
				createTaskList({
					id: "2",
					name: "A",
					createdAt: "2024-01-01T10:00:00Z",
				}),
				createTaskList({
					id: "3",
					name: "B",
					createdAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortTaskLists(taskLists, "createdAt", "desc");

			expect(sorted.map((tl) => tl.name)).toEqual(["C", "B", "A"]);
		});
	});

	describe("sort by taskCount", () => {
		it("should sort by task count in ascending order", () => {
			const taskLists = [
				createTaskList({ id: "1", name: "A", taskCount: 50 }),
				createTaskList({ id: "2", name: "B", taskCount: 10 }),
				createTaskList({ id: "3", name: "C", taskCount: 30 }),
			];

			const sorted = sortTaskLists(taskLists, "taskCount", "asc");

			expect(sorted.map((tl) => tl.taskCount)).toEqual([10, 30, 50]);
		});

		it("should handle zero task counts", () => {
			const taskLists = [
				createTaskList({ id: "1", name: "A", taskCount: 0 }),
				createTaskList({ id: "2", name: "B", taskCount: 5 }),
				createTaskList({ id: "3", name: "C", taskCount: 0 }),
			];

			const sorted = sortTaskLists(taskLists, "taskCount", "asc");

			expect(sorted[0].taskCount).toBe(0);
			expect(sorted[1].taskCount).toBe(0);
			expect(sorted[2].taskCount).toBe(5);
		});
	});

	describe("edge cases", () => {
		it("should handle empty array", () => {
			const sorted = sortTaskLists([], "name", "asc");

			expect(sorted).toEqual([]);
		});

		it("should handle single element array", () => {
			const taskLists = [createTaskList({ name: "Only One" })];

			const sorted = sortTaskLists(taskLists, "name", "asc");

			expect(sorted).toHaveLength(1);
			expect(sorted[0].name).toBe("Only One");
		});
	});
});

describe("filterTaskListsByKeyword", () => {
	it("should filter task lists by keyword", () => {
		const taskLists = [
			createTaskList({ id: "1", name: "Work Tasks" }),
			createTaskList({ id: "2", name: "Personal Tasks" }),
			createTaskList({ id: "3", name: "Shopping" }),
		];

		const filtered = filterTaskListsByKeyword(taskLists, "personal");

		expect(filtered).toHaveLength(1);
		expect(filtered[0].name).toBe("Personal Tasks");
	});

	it("should be case-insensitive", () => {
		const taskLists = [
			createTaskList({ id: "1", name: "Work Tasks" }),
			createTaskList({ id: "2", name: "Personal Tasks" }),
		];

		const filtered = filterTaskListsByKeyword(taskLists, "WORK");

		expect(filtered).toHaveLength(1);
		expect(filtered[0].name).toBe("Work Tasks");
	});

	it("should match partial names", () => {
		const taskLists = [
			createTaskList({ id: "1", name: "Work Tasks" }),
			createTaskList({ id: "2", name: "Personal Tasks" }),
		];

		const filtered = filterTaskListsByKeyword(taskLists, "Task");

		expect(filtered).toHaveLength(2);
	});

	it("should return all task lists for empty keyword", () => {
		const taskLists = [
			createTaskList({ id: "1", name: "Work" }),
			createTaskList({ id: "2", name: "Personal" }),
		];

		const filtered = filterTaskListsByKeyword(taskLists, "");

		expect(filtered).toHaveLength(2);
	});

	it("should return all task lists for whitespace-only keyword", () => {
		const taskLists = [
			createTaskList({ id: "1", name: "Work" }),
			createTaskList({ id: "2", name: "Personal" }),
		];

		const filtered = filterTaskListsByKeyword(taskLists, "   ");

		expect(filtered).toHaveLength(2);
	});

	it("should return empty array when no matches", () => {
		const taskLists = [
			createTaskList({ id: "1", name: "Work" }),
			createTaskList({ id: "2", name: "Personal" }),
		];

		const filtered = filterTaskListsByKeyword(taskLists, "xyz");

		expect(filtered).toHaveLength(0);
	});

	it("should trim keyword whitespace", () => {
		const taskLists = [createTaskList({ id: "1", name: "Work Tasks" })];

		const filtered = filterTaskListsByKeyword(taskLists, "  work  ");

		expect(filtered).toHaveLength(1);
	});
});
