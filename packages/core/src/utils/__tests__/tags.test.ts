/**
 * Tests for tag utility functions
 */
import { describe, expect, it } from "vitest";
import {
	addTag,
	getLastTag,
	hasTag,
	parseTags,
	removeTag,
	stringifyTags,
} from "../comma-separated";

describe("parseTags", () => {
	describe("string input", () => {
		it("should parse comma-separated tags", () => {
			expect(parseTags("work, personal, urgent")).toEqual([
				"work",
				"personal",
				"urgent",
			]);
		});

		it("should trim whitespace from tags", () => {
			expect(parseTags("  work  ,  personal  ")).toEqual(["work", "personal"]);
		});

		it("should filter out empty tags", () => {
			expect(parseTags("work, , personal, ,")).toEqual(["work", "personal"]);
		});

		it("should handle single tag", () => {
			expect(parseTags("work")).toEqual(["work"]);
		});

		it("should return empty array for empty string", () => {
			expect(parseTags("")).toEqual([]);
		});

		it("should return empty array for whitespace-only string", () => {
			expect(parseTags("   ")).toEqual([]);
		});

		it("should return empty array for undefined", () => {
			expect(parseTags(undefined)).toEqual([]);
		});
	});

	describe("array of objects input", () => {
		it("should extract category values from objects", () => {
			const input = [{ category: "work" }, { category: "personal" }];
			expect(parseTags(input)).toEqual(["work", "personal"]);
		});

		it("should extract resource values from objects", () => {
			const input = [{ resource: "room" }, { resource: "projector" }];
			expect(parseTags(input)).toEqual(["room", "projector"]);
		});

		it("should handle mixed category and resource", () => {
			const input = [{ category: "work" }, { resource: "room" }];
			expect(parseTags(input)).toEqual(["work", "room"]);
		});

		it("should filter empty values", () => {
			const input = [
				{ category: "work" },
				{ category: "" },
				{ category: "personal" },
			];
			expect(parseTags(input)).toEqual(["work", "personal"]);
		});

		it("should handle empty array", () => {
			expect(parseTags([])).toEqual([]);
		});
	});
});

describe("stringifyTags", () => {
	it("should join tags with comma and space", () => {
		expect(stringifyTags(["work", "personal", "urgent"])).toBe(
			"work, personal, urgent",
		);
	});

	it("should filter out empty tags", () => {
		expect(stringifyTags(["work", "", "personal", "  "])).toBe(
			"work, personal",
		);
	});

	it("should return undefined for empty array", () => {
		expect(stringifyTags([])).toBeUndefined();
	});

	it("should return undefined for array with only empty tags", () => {
		expect(stringifyTags(["", "  ", ""])).toBeUndefined();
	});

	it("should handle single tag", () => {
		expect(stringifyTags(["work"])).toBe("work");
	});
});

describe("addTag", () => {
	it("should add a new tag to existing tags", () => {
		expect(addTag("work, personal", "urgent")).toBe("work, personal, urgent");
	});

	it("should add a tag to empty string", () => {
		expect(addTag("", "work")).toBe("work");
	});

	it("should add a tag to undefined", () => {
		expect(addTag(undefined, "work")).toBe("work");
	});

	it("should trim the new tag", () => {
		expect(addTag("work", "  personal  ")).toBe("work, personal");
	});

	it("should not add duplicate tags", () => {
		expect(addTag("work, personal", "work")).toBe("work, personal");
	});

	it("should not add empty tag", () => {
		expect(addTag("work", "")).toBe("work");
	});

	it("should not add whitespace-only tag", () => {
		expect(addTag("work", "   ")).toBe("work");
	});
});

describe("removeTag", () => {
	it("should remove a tag from the list", () => {
		expect(removeTag("work, personal, urgent", "personal")).toBe(
			"work, urgent",
		);
	});

	it("should return undefined when removing the only tag", () => {
		expect(removeTag("work", "work")).toBeUndefined();
	});

	it("should handle removing first tag", () => {
		expect(removeTag("work, personal", "work")).toBe("personal");
	});

	it("should handle removing last tag", () => {
		expect(removeTag("work, personal", "personal")).toBe("work");
	});

	it("should handle tag not in list", () => {
		expect(removeTag("work, personal", "urgent")).toBe("work, personal");
	});

	it("should handle undefined input", () => {
		expect(removeTag(undefined, "work")).toBeUndefined();
	});

	it("should trim the tag to remove", () => {
		expect(removeTag("work, personal", "  personal  ")).toBe("work");
	});
});

describe("getLastTag", () => {
	describe("string input", () => {
		it("should return the last tag", () => {
			expect(getLastTag("work, personal, urgent")).toBe("urgent");
		});

		it("should trim the last tag", () => {
			expect(getLastTag("work, personal,  urgent  ")).toBe("urgent");
		});

		it("should handle single tag", () => {
			expect(getLastTag("work")).toBe("work");
		});

		it("should return empty string for empty input", () => {
			expect(getLastTag("")).toBe("");
		});

		it("should return empty string for undefined", () => {
			expect(getLastTag(undefined)).toBe("");
		});
	});

	describe("array of objects input", () => {
		it("should return the last category", () => {
			const input = [{ category: "work" }, { category: "personal" }];
			expect(getLastTag(input)).toBe("personal");
		});

		it("should filter empty values and return last non-empty", () => {
			const input = [{ category: "work" }, { category: "" }];
			expect(getLastTag(input)).toBe("work");
		});

		it("should return empty string for empty array", () => {
			expect(getLastTag([])).toBe("");
		});
	});
});

describe("hasTag", () => {
	it("should return true if tag exists", () => {
		expect(hasTag("work, personal, urgent", "personal")).toBe(true);
	});

	it("should return false if tag does not exist", () => {
		expect(hasTag("work, personal", "urgent")).toBe(false);
	});

	it("should be case-sensitive", () => {
		expect(hasTag("Work, Personal", "work")).toBe(false);
	});

	it("should trim the tag to check", () => {
		expect(hasTag("work, personal", "  personal  ")).toBe(true);
	});

	it("should handle undefined input", () => {
		expect(hasTag(undefined, "work")).toBe(false);
	});

	it("should handle empty tag string", () => {
		expect(hasTag("work", "")).toBe(false);
	});
});
