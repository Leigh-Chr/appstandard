/**
 * Tests for contact validation functions
 */
import { describe, expect, it } from "vitest";
import { FIELD_LIMITS } from "../../constants/field-limits";
import type { ContactFormData } from "../../types/contact";
import {
	getFieldError,
	hasErrors,
	isValidHexColor,
	validateContactForm,
} from "../contact";

// Helper to create a minimal valid contact
function createContact(
	overrides: Partial<ContactFormData> = {},
): ContactFormData {
	return {
		formattedName: "John Doe",
		...overrides,
	} as ContactFormData;
}

describe("validateContactForm", () => {
	describe("required fields", () => {
		it("should require formattedName", () => {
			const result = validateContactForm({} as ContactFormData);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Name")).toBe("Name is required");
		});

		it("should reject empty formattedName", () => {
			const result = validateContactForm(createContact({ formattedName: "" }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Name")).toBe("Name is required");
		});

		it("should reject whitespace-only formattedName", () => {
			const result = validateContactForm(
				createContact({ formattedName: "   " }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Name")).toBe("Name is required");
		});

		it("should accept valid formattedName", () => {
			const result = validateContactForm(
				createContact({ formattedName: "Jane Smith" }),
			);

			expect(result.valid).toBe(true);
		});
	});

	describe("field length validation", () => {
		it("should reject formattedName exceeding max length", () => {
			const result = validateContactForm(
				createContact({
					formattedName: "A".repeat(FIELD_LIMITS.FORMATTED_NAME + 1),
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Name")).toContain("characters or less");
		});

		it("should reject familyName exceeding max length", () => {
			const result = validateContactForm(
				createContact({ familyName: "A".repeat(FIELD_LIMITS.FAMILY_NAME + 1) }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Family name")).toContain(
				"characters or less",
			);
		});

		it("should reject givenName exceeding max length", () => {
			const result = validateContactForm(
				createContact({ givenName: "A".repeat(FIELD_LIMITS.GIVEN_NAME + 1) }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Given name")).toContain(
				"characters or less",
			);
		});

		it("should reject note exceeding max length", () => {
			const result = validateContactForm(
				createContact({ note: "A".repeat(FIELD_LIMITS.NOTE + 1) }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "Note")).toContain("characters or less");
		});

		it("should accept fields at max length", () => {
			const result = validateContactForm(
				createContact({
					formattedName: "A".repeat(FIELD_LIMITS.FORMATTED_NAME),
				}),
			);

			expect(result.valid).toBe(true);
		});
	});

	describe("kind validation", () => {
		it("should accept valid contact kinds", () => {
			const kinds = ["individual", "group", "org", "location"];

			for (const kind of kinds) {
				const result = validateContactForm(createContact({ kind }));
				expect(result.valid).toBe(true);
			}
		});

		it("should reject invalid contact kind", () => {
			const result = validateContactForm(createContact({ kind: "invalid" }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "kind")).toBe("Invalid contact kind");
		});

		it("should allow undefined kind", () => {
			const result = validateContactForm(createContact({ kind: undefined }));

			expect(result.valid).toBe(true);
		});
	});

	describe("gender validation", () => {
		it("should accept valid gender values", () => {
			const genders = ["M", "F", "O", "N", "U"];

			for (const gender of genders) {
				const result = validateContactForm(createContact({ gender }));
				expect(result.valid).toBe(true);
			}
		});

		it("should reject invalid gender", () => {
			const result = validateContactForm(createContact({ gender: "X" }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "gender")).toBe("Invalid gender value");
		});

		it("should allow undefined gender", () => {
			const result = validateContactForm(createContact({ gender: undefined }));

			expect(result.valid).toBe(true);
		});
	});

	describe("URL validation", () => {
		it("should accept valid URL", () => {
			const result = validateContactForm(
				createContact({ url: "https://example.com" }),
			);

			expect(result.valid).toBe(true);
		});

		it("should accept URL with path", () => {
			const result = validateContactForm(
				createContact({ url: "https://example.com/profile/john" }),
			);

			expect(result.valid).toBe(true);
		});

		it("should reject invalid URL", () => {
			const result = validateContactForm(createContact({ url: "not-a-url" }));

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "url")).toBe("Invalid URL format");
		});

		it("should allow empty URL", () => {
			const result = validateContactForm(createContact({ url: "" }));

			expect(result.valid).toBe(true);
		});

		it("should allow whitespace-only URL (treated as empty)", () => {
			const result = validateContactForm(createContact({ url: "   " }));

			expect(result.valid).toBe(true);
		});
	});

	describe("photo URL validation", () => {
		it("should accept valid photo URL", () => {
			const result = validateContactForm(
				createContact({ photoUrl: "https://example.com/photo.jpg" }),
			);

			expect(result.valid).toBe(true);
		});

		it("should reject invalid photo URL", () => {
			const result = validateContactForm(
				createContact({ photoUrl: "not-a-url" }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "photoUrl")).toBe(
				"Invalid photo URL format",
			);
		});
	});

	describe("geo coordinates validation", () => {
		it("should accept valid coordinates", () => {
			const result = validateContactForm(
				createContact({ geoLatitude: 40.7128, geoLongitude: -74.006 }),
			);

			expect(result.valid).toBe(true);
		});

		it("should require both or neither coordinate", () => {
			const latOnly = validateContactForm(
				createContact({ geoLatitude: 40.7128 }),
			);

			expect(latOnly.valid).toBe(false);
			expect(getFieldError(latOnly, "geoLongitude")).toBe(
				"Both latitude and longitude must be provided together",
			);

			const lonOnly = validateContactForm(
				createContact({ geoLongitude: -74.006 }),
			);

			expect(lonOnly.valid).toBe(false);
		});

		it("should reject latitude outside range", () => {
			const result = validateContactForm(
				createContact({ geoLatitude: 91, geoLongitude: 0 }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "geoLatitude")).toBe(
				"Latitude must be between -90 and 90",
			);
		});

		it("should reject longitude outside range", () => {
			const result = validateContactForm(
				createContact({ geoLatitude: 0, geoLongitude: 181 }),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "geoLongitude")).toBe(
				"Longitude must be between -180 and 180",
			);
		});

		it("should accept boundary values", () => {
			const result = validateContactForm(
				createContact({ geoLatitude: -90, geoLongitude: 180 }),
			);

			expect(result.valid).toBe(true);
		});
	});

	describe("email validation", () => {
		it("should accept valid emails", () => {
			const result = validateContactForm(
				createContact({
					emails: [
						{ email: "john@example.com", type: "work" },
						{ email: "jane.doe@company.org", type: "home" },
					],
				}),
			);

			expect(result.valid).toBe(true);
		});

		it("should reject invalid email format", () => {
			const result = validateContactForm(
				createContact({
					emails: [{ email: "not-an-email" }],
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "emails[0].email")).toBe(
				"Invalid email format",
			);
		});

		it("should reject email exceeding max length", () => {
			const result = validateContactForm(
				createContact({
					emails: [{ email: `${"a".repeat(250)}@example.com` }],
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "emails[0].email")).toContain(
				"characters or less",
			);
		});

		it("should validate multiple emails", () => {
			const result = validateContactForm(
				createContact({
					emails: [{ email: "valid@example.com" }, { email: "invalid" }],
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "emails[1].email")).toBe(
				"Invalid email format",
			);
		});
	});

	describe("phone validation", () => {
		it("should accept valid phone numbers", () => {
			const result = validateContactForm(
				createContact({
					phones: [
						{ number: "+1 (555) 123-4567", type: "cell" },
						{ number: "555.123.4567", type: "work" },
					],
				}),
			);

			expect(result.valid).toBe(true);
		});

		it("should reject invalid phone format", () => {
			const result = validateContactForm(
				createContact({
					phones: [{ number: "ab" }], // Too short and letters
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "phones[0].number")).toBe(
				"Invalid phone number format",
			);
		});

		it("should reject phone exceeding max length", () => {
			const result = validateContactForm(
				createContact({
					phones: [{ number: "1".repeat(FIELD_LIMITS.PHONE + 1) }],
				}),
			);

			expect(result.valid).toBe(false);
			expect(getFieldError(result, "phones[0].number")).toContain(
				"characters or less",
			);
		});
	});

	describe("address validation", () => {
		it("should accept valid address", () => {
			const result = validateContactForm(
				createContact({
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
				}),
			);

			expect(result.valid).toBe(true);
		});

		it("should reject street address exceeding max length", () => {
			const result = validateContactForm(
				createContact({
					addresses: [
						{
							streetAddress: "A".repeat(FIELD_LIMITS.STREET_ADDRESS + 1),
						},
					],
				}),
			);

			expect(result.valid).toBe(false);
		});

		it("should reject postal code exceeding max length", () => {
			const result = validateContactForm(
				createContact({
					addresses: [
						{
							postalCode: "1".repeat(FIELD_LIMITS.POSTAL_CODE + 1),
						},
					],
				}),
			);

			expect(result.valid).toBe(false);
		});
	});
});

describe("isValidHexColor", () => {
	it("should accept 6-digit hex colors", () => {
		expect(isValidHexColor("#FF0000")).toBe(true);
		expect(isValidHexColor("#00ff00")).toBe(true);
		expect(isValidHexColor("#0000FF")).toBe(true);
		expect(isValidHexColor("#AbCdEf")).toBe(true);
	});

	it("should accept 3-digit hex colors", () => {
		expect(isValidHexColor("#F00")).toBe(true);
		expect(isValidHexColor("#0f0")).toBe(true);
		expect(isValidHexColor("#00F")).toBe(true);
	});

	it("should reject colors without hash", () => {
		expect(isValidHexColor("FF0000")).toBe(false);
		expect(isValidHexColor("F00")).toBe(false);
	});

	it("should reject invalid hex characters", () => {
		expect(isValidHexColor("#GGGGGG")).toBe(false);
		expect(isValidHexColor("#XYZ")).toBe(false);
	});

	it("should reject invalid lengths", () => {
		expect(isValidHexColor("#FF")).toBe(false);
		expect(isValidHexColor("#FFFF")).toBe(false);
		expect(isValidHexColor("#FFFFFFF")).toBe(false);
	});
});

describe("getFieldError", () => {
	it("should return error message for existing field", () => {
		const result = validateContactForm({} as ContactFormData);
		const error = getFieldError(result, "Name");

		expect(error).toBe("Name is required");
	});

	it("should return undefined for non-existent field", () => {
		const result = validateContactForm(createContact());
		const error = getFieldError(result, "nonExistent");

		expect(error).toBeUndefined();
	});
});

describe("hasErrors", () => {
	it("should return true when validation fails", () => {
		const result = validateContactForm({} as ContactFormData);

		expect(hasErrors(result)).toBe(true);
	});

	it("should return false when validation passes", () => {
		const result = validateContactForm(createContact());

		expect(hasErrors(result)).toBe(false);
	});
});
