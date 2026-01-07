import { z } from "zod";
import { FIELD_LIMITS } from "./field-limits";

/**
 * Common reusable Zod schemas for validation
 * These schemas include transformations and can be reused across the codebase
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
 * Nullable email schema - accepts empty strings and validates email format
 * Use this for optional email fields in forms
 * Follows the same pattern as urlSchema for consistency
 */
export const nullableEmailSchema = z
	.string()
	.trim()
	.max(
		FIELD_LIMITS.EMAIL,
		`Email cannot exceed ${FIELD_LIMITS.EMAIL} characters`,
	)
	.refine(
		(val) => {
			// Accept empty strings (optional field)
			if (!val || val.trim() === "") return true;
			// Otherwise validate as email using pre-created validator
			return emailValidator.safeParse(val).success;
		},
		{
			message: "Invalid email format",
		},
	)
	.optional()
	.nullable();

/**
 * URL schema with protocol validation and automatic trimming
 * Only allows safe protocols: http, https, mailto, tel
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
		{
			message:
				"Invalid URL format or unauthorized protocol. Use http://, https://, mailto: or tel:",
		},
	)
	.optional()
	.nullable();

/**
 * Trimmed string schema - automatically trims whitespace
 */
export const trimmedStringSchema = <T extends z.ZodString>(schema: T) =>
	schema.trim();

/**
 * String schema with automatic trimming and null conversion
 * Converts empty strings to null
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
 * Date string schema for form inputs (ISO datetime format)
 */
export const dateStringSchema = z
	.string()
	.min(1, "Date is required")
	.refine(
		(val) => {
			const date = new Date(val);
			return !Number.isNaN(date.getTime());
		},
		{
			message: "Invalid date format",
		},
	);

/**
 * Schema for validating date range (start < end)
 */
export const dateRangeSchema = z
	.object({
		startDate: dateStringSchema,
		endDate: dateStringSchema,
	})
	.refine(
		(data) => {
			const start = new Date(data.startDate);
			const end = new Date(data.endDate);
			return end > start;
		},
		{
			message: "End date must be after start date",
			path: ["endDate"],
		},
	);

/**
 * Required coerced date schema for API inputs.
 * Handles valid date strings and Date objects, rejects empty strings.
 */
export const requiredCoercedDateSchema = z
	.union([z.string(), z.date()])
	.refine(
		(val) => {
			if (typeof val === "string") {
				const trimmed = val.trim();
				if (trimmed === "") return false;
				const date = new Date(trimmed);
				return !Number.isNaN(date.getTime());
			}
			return val instanceof Date && !Number.isNaN(val.getTime());
		},
		{ message: "Date is required and must be valid" },
	)
	.transform((val): Date => {
		if (typeof val === "string") {
			return new Date(val.trim());
		}
		return val;
	});

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
