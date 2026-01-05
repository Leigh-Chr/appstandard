/**
 * Tests for utility functions
 */
import { describe, expect, it } from "vitest";
import { createQueryKeys, queryKeyUtils } from "../query/query-keys";

describe("createQueryKeys", () => {
	const userKeys = createQueryKeys("user");

	it("should create all key", () => {
		expect(userKeys.all).toEqual(["user"]);
	});

	it("should create lists key", () => {
		expect(userKeys.lists()).toEqual(["user", "list"]);
	});

	it("should create list key without filters", () => {
		expect(userKeys.list()).toEqual(["user", "list", {}]);
	});

	it("should create list key with filters", () => {
		const filters = { status: "active", page: 1 };
		expect(userKeys.list(filters)).toEqual(["user", "list", filters]);
	});

	it("should create details key", () => {
		expect(userKeys.details()).toEqual(["user", "detail"]);
	});

	it("should create detail key with id", () => {
		expect(userKeys.detail("123")).toEqual(["user", "detail", "123"]);
	});

	it("should create typed keys", () => {
		const calendarKeys = createQueryKeys("calendar");
		expect(calendarKeys.all).toEqual(["calendar"]);
		expect(calendarKeys.detail("cal-1")).toEqual([
			"calendar",
			"detail",
			"cal-1",
		]);
	});
});

describe("queryKeyUtils.matches", () => {
	it("should match exact prefix", () => {
		expect(queryKeyUtils.matches(["user", "list"], ["user"])).toBe(true);
		expect(queryKeyUtils.matches(["user", "detail", "123"], ["user"])).toBe(
			true,
		);
		expect(
			queryKeyUtils.matches(["user", "detail", "123"], ["user", "detail"]),
		).toBe(true);
	});

	it("should not match different prefix", () => {
		expect(queryKeyUtils.matches(["user", "list"], ["calendar"])).toBe(false);
		expect(queryKeyUtils.matches(["user", "detail"], ["user", "list"])).toBe(
			false,
		);
	});

	it("should not match if prefix is longer than key", () => {
		expect(queryKeyUtils.matches(["user"], ["user", "list", "filters"])).toBe(
			false,
		);
	});

	it("should match object prefixes", () => {
		const filters = { status: "active" };
		expect(
			queryKeyUtils.matches(
				["user", "list", { status: "active" }],
				["user", "list", filters],
			),
		).toBe(true);
	});

	it("should not match different object prefixes", () => {
		expect(
			queryKeyUtils.matches(
				["user", "list", { status: "active" }],
				["user", "list", { status: "inactive" }],
			),
		).toBe(false);
	});

	it("should handle empty prefix", () => {
		expect(queryKeyUtils.matches(["user", "list"], [])).toBe(true);
	});

	it("should handle null in prefix", () => {
		expect(queryKeyUtils.matches([null, "list"], [null])).toBe(true);
	});
});
