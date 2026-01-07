import { z } from "zod";
import { FIELD_LIMITS } from "./field-limits";

/**
 * Common reusable Zod schemas for AppStandard Contacts validation
 */

// Pre-created email validator for efficient reuse in refinements
const emailValidator = z.string().email();

/**
 * Email schema with automatic trimming and validation
 */
export const emailSchema = z
	.string()
	.trim()
	.email("Invalid email format")
	.max(
		FIELD_LIMITS.EMAIL,
		`Email cannot exceed ${FIELD_LIMITS.EMAIL} characters`,
	);

/**
 * Nullable email schema
 */
export const nullableEmailSchema = z
	.string()
	.trim()
	.max(FIELD_LIMITS.EMAIL)
	.refine(
		(val) => {
			if (!val || val.trim() === "") return true;
			return emailValidator.safeParse(val).success;
		},
		{ message: "Invalid email format" },
	)
	.optional()
	.nullable();

/**
 * URL schema with protocol validation
 */
export const urlSchema = z
	.string()
	.trim()
	.max(FIELD_LIMITS.URL, `URL cannot exceed ${FIELD_LIMITS.URL} characters`)
	.refine(
		(val) => {
			if (!val || val.trim() === "") return true;
			try {
				const urlObj = new URL(val);
				const safeProtocols = ["http:", "https:", "mailto:", "tel:"];
				return safeProtocols.includes(urlObj.protocol);
			} catch {
				return false;
			}
		},
		{ message: "Invalid URL format or unauthorized protocol" },
	)
	.optional()
	.nullable();

/**
 * String schema with automatic trimming and null conversion
 */
export const nullableTrimmedStringSchema = (maxLength?: number) =>
	z
		.string()
		.trim()
		.max(maxLength || 10000)
		.transform((val) => (val === "" ? null : val))
		.nullable()
		.optional();

/**
 * Date string schema for form inputs
 */
export const dateStringSchema = z.string().refine(
	(val) => {
		if (!val || val.trim() === "") return true;
		const date = new Date(val);
		return !Number.isNaN(date.getTime());
	},
	{ message: "Invalid date format" },
);

/**
 * Color schema (hex format)
 */
export const colorSchema = z
	.string()
	.trim()
	.regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (#RRGGBB)")
	.transform((val) => (val === "" ? null : val))
	.nullable()
	.optional();

/**
 * Phone number schema (basic validation)
 */
export const phoneSchema = z
	.string()
	.trim()
	.max(FIELD_LIMITS.PHONE)
	.refine(
		(val) => {
			if (!val || val.trim() === "") return false;
			// Allow digits, spaces, dashes, parentheses, plus sign
			return /^[+]?[\d\s\-().]{3,}$/.test(val);
		},
		{ message: "Invalid phone number format" },
	);

/**
 * Optional phone number schema
 */
export const optionalPhoneSchema = z
	.string()
	.trim()
	.max(FIELD_LIMITS.PHONE)
	.refine(
		(val) => {
			if (!val || val.trim() === "") return true;
			return /^[+]?[\d\s\-().]{3,}$/.test(val);
		},
		{ message: "Invalid phone number format" },
	)
	.optional()
	.nullable();

/**
 * Optional coerced date schema for API inputs.
 * Handles empty strings, null, undefined, valid date strings, and Date objects.
 * Converts empty strings to null before coercion.
 */
export const optionalCoercedDateSchema = z
	.union([z.string(), z.date(), z.null(), z.undefined()])
	.optional()
	.transform((val): Date | null | undefined => {
		if (val === null || val === undefined) return null;
		if (typeof val === "string") {
			const trimmed = val.trim();
			if (trimmed === "") return null;
			const date = new Date(trimmed);
			if (Number.isNaN(date.getTime())) {
				throw new Error("Invalid date format");
			}
			return date;
		}
		return val;
	});
