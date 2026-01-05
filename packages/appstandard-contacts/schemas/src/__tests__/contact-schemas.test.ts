/**
 * Tests for contact Zod validation schemas
 */
import { describe, expect, it } from "vitest";
import {
	addressBookCreateSchema,
	addressBookUpdateSchema,
	contactCreateSchema,
	contactUpdateSchema,
	geoCoordinatesSchema,
} from "../contact-schemas";

describe("contactCreateSchema", () => {
	const validContact = {
		addressBookId: "book-123",
		formattedName: "John Doe",
	};

	describe("required fields", () => {
		it("should validate with minimal required fields", () => {
			const result = contactCreateSchema.safeParse(validContact);

			expect(result.success).toBe(true);
		});

		it("should require addressBookId", () => {
			const result = contactCreateSchema.safeParse({
				formattedName: "John Doe",
			});

			expect(result.success).toBe(false);
		});

		it("should require formattedName", () => {
			const result = contactCreateSchema.safeParse({
				addressBookId: "book-123",
			});

			expect(result.success).toBe(false);
		});

		it("should reject empty formattedName", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				formattedName: "",
			});

			expect(result.success).toBe(false);
		});

		it("should trim formattedName", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				formattedName: "  John Doe  ",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.formattedName).toBe("John Doe");
			}
		});
	});

	describe("name components", () => {
		it("should accept all name components", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				familyName: "Doe",
				givenName: "John",
				additionalName: "William",
				namePrefix: "Dr.",
				nameSuffix: "Jr.",
				nickname: "Johnny",
			});

			expect(result.success).toBe(true);
		});

		it("should trim name components", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				familyName: "  Doe  ",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.familyName).toBe("Doe");
			}
		});
	});

	describe("kind validation", () => {
		it("should accept valid kind values", () => {
			const kinds = ["INDIVIDUAL", "GROUP", "ORG", "LOCATION"];

			for (const kind of kinds) {
				const result = contactCreateSchema.safeParse({ ...validContact, kind });
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid kind", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				kind: "INVALID",
			});

			expect(result.success).toBe(false);
		});

		it("should default to INDIVIDUAL", () => {
			const result = contactCreateSchema.safeParse(validContact);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.kind).toBe("INDIVIDUAL");
			}
		});
	});

	describe("gender validation", () => {
		it("should accept valid gender values", () => {
			const genders = ["M", "F", "O", "N", "U"];

			for (const gender of genders) {
				const result = contactCreateSchema.safeParse({
					...validContact,
					gender,
				});
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid gender", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				gender: "X",
			});

			expect(result.success).toBe(false);
		});
	});

	describe("geo coordinates validation", () => {
		it("should accept valid coordinates", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				geoLatitude: 40.7128,
				geoLongitude: -74.006,
			});

			expect(result.success).toBe(true);
		});

		it("should reject only latitude", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				geoLatitude: 40.7128,
			});

			expect(result.success).toBe(false);
		});

		it("should reject only longitude", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				geoLongitude: -74.006,
			});

			expect(result.success).toBe(false);
		});

		it("should reject invalid latitude range", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				geoLatitude: 91,
				geoLongitude: 0,
			});

			expect(result.success).toBe(false);
		});

		it("should reject invalid longitude range", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				geoLatitude: 0,
				geoLongitude: 181,
			});

			expect(result.success).toBe(false);
		});
	});

	describe("email validation", () => {
		it("should accept valid emails", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				emails: [
					{ email: "john@example.com", type: "work" },
					{ email: "john.doe@company.org", type: "home", isPrimary: true },
				],
			});

			expect(result.success).toBe(true);
		});

		it("should reject invalid email format", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				emails: [{ email: "not-an-email" }],
			});

			expect(result.success).toBe(false);
		});
	});

	describe("phone validation", () => {
		it("should accept valid phone numbers", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				phones: [
					{ number: "+1 (555) 123-4567", type: "cell" },
					{ number: "555.123.4567", type: "work" },
				],
			});

			expect(result.success).toBe(true);
		});

		it("should reject invalid phone format", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				phones: [{ number: "ab" }],
			});

			expect(result.success).toBe(false);
		});
	});

	describe("address validation", () => {
		it("should accept valid addresses", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				addresses: [
					{
						streetAddress: "123 Main St",
						locality: "New York",
						region: "NY",
						postalCode: "10001",
						country: "USA",
						type: "home",
					},
				],
			});

			expect(result.success).toBe(true);
		});

		it("should accept partial addresses", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				addresses: [{ locality: "Paris" }],
			});

			expect(result.success).toBe(true);
		});
	});

	describe("IM handles validation", () => {
		it("should accept valid IM handles", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				imHandles: [
					{ handle: "@johndoe", service: "telegram" },
					{ handle: "john.doe", service: "skype" },
				],
			});

			expect(result.success).toBe(true);
		});

		it("should reject empty handle", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				imHandles: [{ handle: "", service: "telegram" }],
			});

			expect(result.success).toBe(false);
		});

		it("should reject empty service", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				imHandles: [{ handle: "@johndoe", service: "" }],
			});

			expect(result.success).toBe(false);
		});
	});

	describe("relations validation", () => {
		it("should accept valid relations", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				relations: [
					{ relatedName: "Jane Doe", relationType: "spouse" },
					{ relatedName: "Bob Smith", relationType: "friend" },
				],
			});

			expect(result.success).toBe(true);
		});

		it("should reject empty relatedName", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				relations: [{ relatedName: "", relationType: "spouse" }],
			});

			expect(result.success).toBe(false);
		});
	});

	describe("dates validation", () => {
		it("should accept valid birthday", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				birthday: "1990-05-15",
			});

			expect(result.success).toBe(true);
		});

		it("should accept valid anniversary", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				anniversary: "2015-08-22",
			});

			expect(result.success).toBe(true);
		});

		it("should coerce date strings to Date objects", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				birthday: "1990-05-15T00:00:00Z",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.birthday).toBeInstanceOf(Date);
			}
		});
	});

	describe("URL validation", () => {
		it("should accept valid URL", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				url: "https://johndoe.com",
			});

			expect(result.success).toBe(true);
		});

		it("should reject invalid URL", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				url: "not-a-url",
			});

			expect(result.success).toBe(false);
		});

		it("should accept valid photoUrl", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				photoUrl: "https://example.com/photo.jpg",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("organization fields", () => {
		it("should accept organization details", () => {
			const result = contactCreateSchema.safeParse({
				...validContact,
				organization: "Acme Corp",
				title: "Software Engineer",
				role: "Developer",
			});

			expect(result.success).toBe(true);
		});
	});
});

describe("contactUpdateSchema", () => {
	it("should require id", () => {
		const result = contactUpdateSchema.safeParse({
			formattedName: "Jane Doe",
		});

		expect(result.success).toBe(false);
	});

	it("should validate with only id", () => {
		const result = contactUpdateSchema.safeParse({
			id: "contact-123",
		});

		expect(result.success).toBe(true);
	});

	it("should allow partial updates", () => {
		const result = contactUpdateSchema.safeParse({
			id: "contact-123",
			nickname: "Johnny",
		});

		expect(result.success).toBe(true);
	});

	it("should not include addressBookId", () => {
		const result = contactUpdateSchema.safeParse({
			id: "contact-123",
			addressBookId: "book-123",
		});

		// addressBookId should be stripped
		expect(result.success).toBe(true);
		if (result.success) {
			expect((result.data as any).addressBookId).toBeUndefined();
		}
	});

	it("should still validate geo coordinates", () => {
		const result = contactUpdateSchema.safeParse({
			id: "contact-123",
			geoLatitude: 40.7128,
		});

		expect(result.success).toBe(false);
	});
});

describe("addressBookCreateSchema", () => {
	it("should validate with required fields", () => {
		const result = addressBookCreateSchema.safeParse({
			name: "My Contacts",
		});

		expect(result.success).toBe(true);
	});

	it("should require name", () => {
		const result = addressBookCreateSchema.safeParse({});

		expect(result.success).toBe(false);
	});

	it("should reject empty name", () => {
		const result = addressBookCreateSchema.safeParse({
			name: "",
		});

		expect(result.success).toBe(false);
	});

	it("should trim name", () => {
		const result = addressBookCreateSchema.safeParse({
			name: "  My Contacts  ",
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("My Contacts");
		}
	});

	it("should accept optional color", () => {
		const result = addressBookCreateSchema.safeParse({
			name: "My Contacts",
			color: "#00FF00",
		});

		expect(result.success).toBe(true);
	});

	it("should reject invalid color format", () => {
		const result = addressBookCreateSchema.safeParse({
			name: "My Contacts",
			color: "green",
		});

		expect(result.success).toBe(false);
	});

	it("should accept optional sourceUrl", () => {
		const result = addressBookCreateSchema.safeParse({
			name: "My Contacts",
			sourceUrl: "https://example.com/contacts.vcf",
		});

		expect(result.success).toBe(true);
	});

	it("should reject invalid sourceUrl", () => {
		const result = addressBookCreateSchema.safeParse({
			name: "My Contacts",
			sourceUrl: "not-a-url",
		});

		expect(result.success).toBe(false);
	});
});

describe("addressBookUpdateSchema", () => {
	it("should require id", () => {
		const result = addressBookUpdateSchema.safeParse({
			name: "Updated",
		});

		expect(result.success).toBe(false);
	});

	it("should validate with only id", () => {
		const result = addressBookUpdateSchema.safeParse({
			id: "book-123",
		});

		expect(result.success).toBe(true);
	});

	it("should allow partial updates", () => {
		const result = addressBookUpdateSchema.safeParse({
			id: "book-123",
			color: "#0000FF",
		});

		expect(result.success).toBe(true);
	});
});

describe("geoCoordinatesSchema", () => {
	it("should accept valid coordinates", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: 40.7128,
			geoLongitude: -74.006,
		});

		expect(result.success).toBe(true);
	});

	it("should accept both null", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: null,
			geoLongitude: null,
		});

		expect(result.success).toBe(true);
	});

	it("should accept both undefined", () => {
		const result = geoCoordinatesSchema.safeParse({});

		expect(result.success).toBe(true);
	});

	it("should reject only latitude", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLatitude: 40.7128,
		});

		expect(result.success).toBe(false);
	});

	it("should reject only longitude", () => {
		const result = geoCoordinatesSchema.safeParse({
			geoLongitude: -74.006,
		});

		expect(result.success).toBe(false);
	});
});
