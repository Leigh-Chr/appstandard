/**
 * Tests for address book sorting utilities
 */
import { describe, expect, it } from "vitest";
import {
	type AddressBookForSort,
	filterAddressBooksByKeyword,
	sortAddressBooks,
} from "../address-book-sort";

// Helper to create a test address book
function createAddressBook(
	overrides: Partial<AddressBookForSort> = {},
): AddressBookForSort {
	return {
		id: "ab-1",
		name: "Test Address Book",
		contactCount: 10,
		updatedAt: "2024-01-15T10:00:00Z",
		createdAt: "2024-01-01T10:00:00Z",
		color: "#FF0000",
		...overrides,
	};
}

describe("sortAddressBooks", () => {
	describe("sort by name", () => {
		it("should sort address books alphabetically by name", () => {
			const addressBooks = [
				createAddressBook({ id: "1", name: "Zebra" }),
				createAddressBook({ id: "2", name: "Alpha" }),
				createAddressBook({ id: "3", name: "Mike" }),
			];

			const sorted = sortAddressBooks(addressBooks, "name", "asc");

			expect(sorted.map((ab) => ab.name)).toEqual(["Alpha", "Mike", "Zebra"]);
		});

		it("should handle case-insensitive sorting", () => {
			const addressBooks = [
				createAddressBook({ id: "1", name: "beta" }),
				createAddressBook({ id: "2", name: "Alpha" }),
				createAddressBook({ id: "3", name: "CHARLIE" }),
			];

			const sorted = sortAddressBooks(addressBooks, "name", "asc");

			expect(sorted.map((ab) => ab.name)).toEqual(["Alpha", "beta", "CHARLIE"]);
		});

		it("should not modify the original array", () => {
			const addressBooks = [
				createAddressBook({ id: "1", name: "B" }),
				createAddressBook({ id: "2", name: "A" }),
			];

			const sorted = sortAddressBooks(addressBooks, "name", "asc");

			expect(addressBooks[0].name).toBe("B");
			expect(sorted[0].name).toBe("A");
		});
	});

	describe("sort by updatedAt", () => {
		it("should sort by updatedAt in ascending order", () => {
			const addressBooks = [
				createAddressBook({
					id: "1",
					name: "C",
					updatedAt: "2024-01-15T10:00:00Z",
				}),
				createAddressBook({
					id: "2",
					name: "A",
					updatedAt: "2024-01-01T10:00:00Z",
				}),
				createAddressBook({
					id: "3",
					name: "B",
					updatedAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortAddressBooks(addressBooks, "updatedAt", "asc");

			expect(sorted.map((ab) => ab.name)).toEqual(["A", "B", "C"]);
		});

		it("should sort by updatedAt in descending order", () => {
			const addressBooks = [
				createAddressBook({
					id: "1",
					name: "C",
					updatedAt: "2024-01-15T10:00:00Z",
				}),
				createAddressBook({
					id: "2",
					name: "A",
					updatedAt: "2024-01-01T10:00:00Z",
				}),
				createAddressBook({
					id: "3",
					name: "B",
					updatedAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortAddressBooks(addressBooks, "updatedAt", "desc");

			expect(sorted.map((ab) => ab.name)).toEqual(["C", "B", "A"]);
		});

		it("should handle null updatedAt", () => {
			const addressBooks = [
				createAddressBook({ id: "1", name: "A", updatedAt: null }),
				createAddressBook({
					id: "2",
					name: "B",
					updatedAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortAddressBooks(addressBooks, "updatedAt", "desc");

			expect(sorted.map((ab) => ab.name)).toEqual(["B", "A"]);
		});

		it("should handle Date objects", () => {
			const addressBooks = [
				createAddressBook({
					id: "1",
					name: "A",
					updatedAt: new Date("2024-01-15T10:00:00Z"),
				}),
				createAddressBook({
					id: "2",
					name: "B",
					updatedAt: new Date("2024-01-01T10:00:00Z"),
				}),
			];

			const sorted = sortAddressBooks(addressBooks, "updatedAt", "desc");

			expect(sorted.map((ab) => ab.name)).toEqual(["A", "B"]);
		});
	});

	describe("sort by createdAt", () => {
		it("should sort by createdAt in ascending order", () => {
			const addressBooks = [
				createAddressBook({
					id: "1",
					name: "C",
					createdAt: "2024-01-15T10:00:00Z",
				}),
				createAddressBook({
					id: "2",
					name: "A",
					createdAt: "2024-01-01T10:00:00Z",
				}),
				createAddressBook({
					id: "3",
					name: "B",
					createdAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortAddressBooks(addressBooks, "createdAt", "asc");

			expect(sorted.map((ab) => ab.name)).toEqual(["A", "B", "C"]);
		});

		it("should sort by createdAt in descending order", () => {
			const addressBooks = [
				createAddressBook({
					id: "1",
					name: "C",
					createdAt: "2024-01-15T10:00:00Z",
				}),
				createAddressBook({
					id: "2",
					name: "A",
					createdAt: "2024-01-01T10:00:00Z",
				}),
				createAddressBook({
					id: "3",
					name: "B",
					createdAt: "2024-01-10T10:00:00Z",
				}),
			];

			const sorted = sortAddressBooks(addressBooks, "createdAt", "desc");

			expect(sorted.map((ab) => ab.name)).toEqual(["C", "B", "A"]);
		});
	});

	describe("sort by contactCount", () => {
		it("should sort by contact count in ascending order", () => {
			const addressBooks = [
				createAddressBook({ id: "1", name: "A", contactCount: 50 }),
				createAddressBook({ id: "2", name: "B", contactCount: 10 }),
				createAddressBook({ id: "3", name: "C", contactCount: 30 }),
			];

			const sorted = sortAddressBooks(addressBooks, "contactCount", "asc");

			expect(sorted.map((ab) => ab.contactCount)).toEqual([10, 30, 50]);
		});

		it("should handle zero contact counts", () => {
			const addressBooks = [
				createAddressBook({ id: "1", name: "A", contactCount: 0 }),
				createAddressBook({ id: "2", name: "B", contactCount: 5 }),
				createAddressBook({ id: "3", name: "C", contactCount: 0 }),
			];

			const sorted = sortAddressBooks(addressBooks, "contactCount", "asc");

			expect(sorted[0].contactCount).toBe(0);
			expect(sorted[1].contactCount).toBe(0);
			expect(sorted[2].contactCount).toBe(5);
		});
	});

	describe("edge cases", () => {
		it("should handle empty array", () => {
			const sorted = sortAddressBooks([], "name", "asc");

			expect(sorted).toEqual([]);
		});

		it("should handle single element array", () => {
			const addressBooks = [createAddressBook({ name: "Only One" })];

			const sorted = sortAddressBooks(addressBooks, "name", "asc");

			expect(sorted).toHaveLength(1);
			expect(sorted[0].name).toBe("Only One");
		});
	});
});

describe("filterAddressBooksByKeyword", () => {
	it("should filter address books by keyword", () => {
		const addressBooks = [
			createAddressBook({ id: "1", name: "Work Contacts" }),
			createAddressBook({ id: "2", name: "Personal Contacts" }),
			createAddressBook({ id: "3", name: "Family" }),
		];

		const filtered = filterAddressBooksByKeyword(addressBooks, "personal");

		expect(filtered).toHaveLength(1);
		expect(filtered[0].name).toBe("Personal Contacts");
	});

	it("should be case-insensitive", () => {
		const addressBooks = [
			createAddressBook({ id: "1", name: "Work Contacts" }),
			createAddressBook({ id: "2", name: "Personal Contacts" }),
		];

		const filtered = filterAddressBooksByKeyword(addressBooks, "WORK");

		expect(filtered).toHaveLength(1);
		expect(filtered[0].name).toBe("Work Contacts");
	});

	it("should match partial names", () => {
		const addressBooks = [
			createAddressBook({ id: "1", name: "Work Contacts" }),
			createAddressBook({ id: "2", name: "Personal Contacts" }),
		];

		const filtered = filterAddressBooksByKeyword(addressBooks, "Contact");

		expect(filtered).toHaveLength(2);
	});

	it("should return all address books for empty keyword", () => {
		const addressBooks = [
			createAddressBook({ id: "1", name: "Work" }),
			createAddressBook({ id: "2", name: "Personal" }),
		];

		const filtered = filterAddressBooksByKeyword(addressBooks, "");

		expect(filtered).toHaveLength(2);
	});

	it("should return all address books for whitespace-only keyword", () => {
		const addressBooks = [
			createAddressBook({ id: "1", name: "Work" }),
			createAddressBook({ id: "2", name: "Personal" }),
		];

		const filtered = filterAddressBooksByKeyword(addressBooks, "   ");

		expect(filtered).toHaveLength(2);
	});

	it("should return empty array when no matches", () => {
		const addressBooks = [
			createAddressBook({ id: "1", name: "Work" }),
			createAddressBook({ id: "2", name: "Personal" }),
		];

		const filtered = filterAddressBooksByKeyword(addressBooks, "xyz");

		expect(filtered).toHaveLength(0);
	});

	it("should trim keyword whitespace", () => {
		const addressBooks = [
			createAddressBook({ id: "1", name: "Work Contacts" }),
		];

		const filtered = filterAddressBooksByKeyword(addressBooks, "  work  ");

		expect(filtered).toHaveLength(1);
	});
});
