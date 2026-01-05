/**
 * Tests for contact duplicate detection
 */
import { describe, expect, it } from "vitest";
import {
	type DuplicateCheckContact,
	type DuplicateDetectionConfig,
	deduplicateContacts,
	findDuplicatesAgainstExisting,
	getDuplicateIds,
} from "../duplicate-detection";

describe("deduplicateContacts", () => {
	describe("UID-based detection", () => {
		it("should detect duplicates by UID", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", uid: "unique-123", formattedName: "John Doe" },
				{ id: "2", uid: "unique-123", formattedName: "Johnny Doe" },
			];

			const result = deduplicateContacts(contacts);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(1);
			expect(result.unique[0].id).toBe("1");
			expect(result.duplicates[0].id).toBe("2");
		});

		it("should not match different UIDs", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", uid: "unique-123", formattedName: "John Doe" },
				{ id: "2", uid: "unique-456", formattedName: "John Doe" },
			];

			const result = deduplicateContacts(contacts);
			expect(result.unique).toHaveLength(2);
			expect(result.duplicates).toHaveLength(0);
		});

		it("should disable UID matching when configured", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", uid: "unique-123", formattedName: "John Doe" },
				{ id: "2", uid: "unique-123", formattedName: "Johnny Doe" },
			];

			const config: DuplicateDetectionConfig = { useUid: false };
			const result = deduplicateContacts(contacts, config);
			// Without UID matching, these are different because names don't match
			expect(result.unique).toHaveLength(2);
		});
	});

	describe("name-based detection", () => {
		it("should detect duplicates by name when no UID", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", formattedName: "John Doe" },
				{ id: "2", formattedName: "John Doe" },
			];

			const config: DuplicateDetectionConfig = { useEmail: false };
			const result = deduplicateContacts(contacts, config);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(1);
		});

		it("should normalize whitespace in names", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", formattedName: "John  Doe" },
				{ id: "2", formattedName: "John Doe" },
			];

			const config: DuplicateDetectionConfig = { useEmail: false };
			const result = deduplicateContacts(contacts, config);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(1);
		});

		it("should be case-insensitive for names", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", formattedName: "JOHN DOE" },
				{ id: "2", formattedName: "john doe" },
			];

			const config: DuplicateDetectionConfig = { useEmail: false };
			const result = deduplicateContacts(contacts, config);
			expect(result.unique).toHaveLength(1);
		});

		it("should trim whitespace from names", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", formattedName: "  John Doe  " },
				{ id: "2", formattedName: "John Doe" },
			];

			const config: DuplicateDetectionConfig = { useEmail: false };
			const result = deduplicateContacts(contacts, config);
			expect(result.unique).toHaveLength(1);
		});
	});

	describe("email-based detection", () => {
		it("should detect duplicates by name AND email", () => {
			const contacts: DuplicateCheckContact[] = [
				{
					id: "1",
					formattedName: "John Doe",
					emails: [{ email: "john@example.com" }],
				},
				{
					id: "2",
					formattedName: "John Doe",
					emails: [{ email: "john@example.com" }],
				},
			];

			const result = deduplicateContacts(contacts);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(1);
		});

		it("should not match same name with different emails (when both are required)", () => {
			const contacts: DuplicateCheckContact[] = [
				{
					id: "1",
					formattedName: "John Doe",
					emails: [{ email: "john@work.com" }],
				},
				{
					id: "2",
					formattedName: "John Doe",
					emails: [{ email: "john@home.com" }],
				},
			];

			const result = deduplicateContacts(contacts);
			expect(result.unique).toHaveLength(2);
		});

		it("should match on email alone when configured", () => {
			const contacts: DuplicateCheckContact[] = [
				{
					id: "1",
					formattedName: "John Doe",
					emails: [{ email: "john@example.com" }],
				},
				{
					id: "2",
					formattedName: "Johnny D",
					emails: [{ email: "john@example.com" }],
				},
			];

			const config: DuplicateDetectionConfig = {
				useName: false,
				useEmail: true,
			};
			const result = deduplicateContacts(contacts, config);
			expect(result.unique).toHaveLength(1);
		});

		it("should be case-insensitive for emails", () => {
			const contacts: DuplicateCheckContact[] = [
				{
					id: "1",
					formattedName: "John Doe",
					emails: [{ email: "JOHN@example.com" }],
				},
				{
					id: "2",
					formattedName: "John Doe",
					emails: [{ email: "john@EXAMPLE.com" }],
				},
			];

			const result = deduplicateContacts(contacts);
			expect(result.unique).toHaveLength(1);
		});

		it("should match when primary emails are the same", () => {
			// Note: The implementation uses the primary (first) email for key generation
			// Contacts with different primary emails are not matched as duplicates
			const contacts: DuplicateCheckContact[] = [
				{
					id: "1",
					formattedName: "John Doe",
					emails: [{ email: "john@home.com" }, { email: "john@work.com" }],
				},
				{
					id: "2",
					formattedName: "John Doe",
					emails: [{ email: "john@home.com" }],
				},
			];

			const result = deduplicateContacts(contacts);
			expect(result.unique).toHaveLength(1);
		});

		it("should not match when primary emails differ even if secondary matches", () => {
			// Implementation limitation: only primary email is used for key generation
			const contacts: DuplicateCheckContact[] = [
				{
					id: "1",
					formattedName: "John Doe",
					emails: [{ email: "john@work.com" }, { email: "john@home.com" }],
				},
				{
					id: "2",
					formattedName: "John Doe",
					emails: [{ email: "john@home.com" }],
				},
			];

			const result = deduplicateContacts(contacts);
			// Different primary emails = different keys = not detected as duplicates
			expect(result.unique).toHaveLength(2);
		});
	});

	describe("phone-based detection", () => {
		it("should detect duplicates by name AND phone when configured", () => {
			const contacts: DuplicateCheckContact[] = [
				{
					id: "1",
					formattedName: "John Doe",
					phones: [{ number: "+1-555-1234" }],
				},
				{
					id: "2",
					formattedName: "John Doe",
					phones: [{ number: "15551234" }],
				},
			];

			const config: DuplicateDetectionConfig = {
				useEmail: false,
				usePhone: true,
			};
			const result = deduplicateContacts(contacts, config);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(1);
		});

		it("should normalize phone numbers (remove non-digits)", () => {
			const contacts: DuplicateCheckContact[] = [
				{
					id: "1",
					formattedName: "John Doe",
					phones: [{ number: "+1 (555) 123-4567" }],
				},
				{
					id: "2",
					formattedName: "John Doe",
					phones: [{ number: "15551234567" }],
				},
			];

			const config: DuplicateDetectionConfig = {
				useEmail: false,
				usePhone: true,
			};
			const result = deduplicateContacts(contacts, config);
			expect(result.unique).toHaveLength(1);
		});

		it("should not match different phone numbers", () => {
			const contacts: DuplicateCheckContact[] = [
				{
					id: "1",
					formattedName: "John Doe",
					phones: [{ number: "+1-555-1234" }],
				},
				{
					id: "2",
					formattedName: "John Doe",
					phones: [{ number: "+1-555-5678" }],
				},
			];

			const config: DuplicateDetectionConfig = {
				useEmail: false,
				usePhone: true,
			};
			const result = deduplicateContacts(contacts, config);
			expect(result.unique).toHaveLength(2);
		});
	});

	describe("edge cases", () => {
		it("should handle empty array", () => {
			const result = deduplicateContacts([]);
			expect(result.unique).toHaveLength(0);
			expect(result.duplicates).toHaveLength(0);
		});

		it("should handle single contact", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", formattedName: "John Doe" },
			];

			const result = deduplicateContacts(contacts);
			expect(result.unique).toHaveLength(1);
			expect(result.duplicates).toHaveLength(0);
		});

		it("should handle contacts without emails", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", formattedName: "John Doe" },
				{ id: "2", formattedName: "John Doe" },
			];

			const result = deduplicateContacts(contacts);
			// No emails means name-only matching won't trigger duplicate
			// because default config requires both name AND email
			expect(result.unique).toHaveLength(2);
		});

		it("should handle contacts with empty emails array", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", formattedName: "John Doe", emails: [] },
				{ id: "2", formattedName: "John Doe", emails: [] },
			];

			const result = deduplicateContacts(contacts);
			expect(result.unique).toHaveLength(2);
		});

		it("should handle null/undefined UIDs", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "1", uid: null, formattedName: "John Doe" },
				{ id: "2", uid: undefined, formattedName: "John Doe" },
			];

			const config: DuplicateDetectionConfig = { useEmail: false };
			const result = deduplicateContacts(contacts, config);
			expect(result.unique).toHaveLength(1);
		});

		it("should keep first occurrence and mark later as duplicates", () => {
			const contacts: DuplicateCheckContact[] = [
				{ id: "first", uid: "same", formattedName: "John" },
				{ id: "second", uid: "same", formattedName: "John" },
				{ id: "third", uid: "same", formattedName: "John" },
			];

			const result = deduplicateContacts(contacts);
			expect(result.unique).toHaveLength(1);
			expect(result.unique[0].id).toBe("first");
			expect(result.duplicates).toHaveLength(2);
		});
	});
});

describe("findDuplicatesAgainstExisting", () => {
	it("should find new contacts that duplicate existing ones", () => {
		const existing: DuplicateCheckContact[] = [
			{ id: "e1", uid: "uid-1", formattedName: "John Doe" },
		];

		const newContacts: DuplicateCheckContact[] = [
			{ id: "n1", uid: "uid-1", formattedName: "Johnny" },
			{ id: "n2", uid: "uid-2", formattedName: "Jane Doe" },
		];

		const result = findDuplicatesAgainstExisting(newContacts, existing);
		expect(result.unique).toHaveLength(1);
		expect(result.unique[0].id).toBe("n2");
		expect(result.duplicates).toHaveLength(1);
		expect(result.duplicates[0].id).toBe("n1");
	});

	it("should not modify existing contacts", () => {
		const existing: DuplicateCheckContact[] = [
			{ id: "e1", formattedName: "John Doe" },
			{ id: "e2", formattedName: "John Doe" }, // Duplicate within existing
		];

		const newContacts: DuplicateCheckContact[] = [
			{ id: "n1", formattedName: "Jane Doe" },
		];

		const config: DuplicateDetectionConfig = { useEmail: false };
		const result = findDuplicatesAgainstExisting(newContacts, existing, config);
		expect(result.unique).toHaveLength(1);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should handle empty new contacts", () => {
		const existing: DuplicateCheckContact[] = [
			{ id: "e1", formattedName: "John Doe" },
		];

		const result = findDuplicatesAgainstExisting([], existing);
		expect(result.unique).toHaveLength(0);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should handle empty existing contacts", () => {
		const newContacts: DuplicateCheckContact[] = [
			{ id: "n1", formattedName: "John Doe" },
			{ id: "n2", formattedName: "Jane Doe" },
		];

		const result = findDuplicatesAgainstExisting(newContacts, []);
		expect(result.unique).toHaveLength(2);
		expect(result.duplicates).toHaveLength(0);
	});

	it("should detect duplicates by email match", () => {
		const existing: DuplicateCheckContact[] = [
			{
				id: "e1",
				formattedName: "John Doe",
				emails: [{ email: "john@example.com" }],
			},
		];

		const newContacts: DuplicateCheckContact[] = [
			{
				id: "n1",
				formattedName: "John Doe",
				emails: [{ email: "john@example.com" }],
			},
		];

		const result = findDuplicatesAgainstExisting(newContacts, existing);
		expect(result.duplicates).toHaveLength(1);
	});
});

describe("getDuplicateIds", () => {
	it("should return IDs of duplicate contacts", () => {
		const contacts: DuplicateCheckContact[] = [
			{ id: "1", uid: "same", formattedName: "John" },
			{ id: "2", uid: "same", formattedName: "John" },
			{ id: "3", uid: "different", formattedName: "Jane" },
		];

		const ids = getDuplicateIds(contacts);
		expect(ids).toEqual(["2"]);
	});

	it("should return empty array for no duplicates", () => {
		const contacts: DuplicateCheckContact[] = [
			{ id: "1", uid: "uid-1", formattedName: "John" },
			{ id: "2", uid: "uid-2", formattedName: "Jane" },
		];

		const ids = getDuplicateIds(contacts);
		expect(ids).toEqual([]);
	});

	it("should return multiple IDs for multiple duplicates", () => {
		const contacts: DuplicateCheckContact[] = [
			{ id: "1", uid: "same", formattedName: "A" },
			{ id: "2", uid: "same", formattedName: "B" },
			{ id: "3", uid: "same", formattedName: "C" },
		];

		const ids = getDuplicateIds(contacts);
		expect(ids).toEqual(["2", "3"]);
	});
});
