import { z } from "zod";
import {
	colorSchema,
	dateStringSchema,
	emailSchema,
	nullableTrimmedStringSchema,
	phoneSchema,
	urlSchema,
} from "./common-schemas";
import { FIELD_LIMITS } from "./field-limits";

/**
 * Contact kind values (RFC 6350) - matches Prisma ContactKind enum
 */
const contactKindSchema = z.enum(["INDIVIDUAL", "GROUP", "ORG", "LOCATION"]);

/**
 * Gender values (RFC 6350)
 */
const genderSchema = z.enum(["M", "F", "O", "N", "U"]);

/**
 * Phone type values
 */
const phoneTypeSchema = z.enum([
	"home",
	"work",
	"cell",
	"fax",
	"voice",
	"text",
	"video",
	"pager",
]);

/**
 * Email type values
 */
const emailTypeSchema = z.enum(["home", "work"]);

/**
 * Address type values
 */
const addressTypeSchema = z.enum(["home", "work"]);

/**
 * Relation type values
 */
const relationTypeSchema = z.enum([
	"spouse",
	"child",
	"parent",
	"sibling",
	"friend",
	"colleague",
	"co-worker",
	"neighbor",
	"agent",
	"emergency",
	"contact",
]);

/**
 * IM service values
 */
const imServiceSchema = z.enum([
	"xmpp",
	"skype",
	"telegram",
	"whatsapp",
	"signal",
	"discord",
	"slack",
	"teams",
	"other",
]);

/**
 * Email entry schema
 */
const contactEmailSchema = z.object({
	email: emailSchema,
	type: z.string().max(50).optional().nullable(),
	isPrimary: z.boolean().optional().default(false),
});

/**
 * Phone entry schema
 */
const contactPhoneSchema = z.object({
	number: phoneSchema,
	type: z.string().max(50).optional().nullable(),
	isPrimary: z.boolean().optional().default(false),
});

/**
 * Address entry schema
 */
const contactAddressSchema = z.object({
	type: z.string().max(50).optional().nullable(),
	streetAddress: nullableTrimmedStringSchema(FIELD_LIMITS.STREET_ADDRESS),
	locality: nullableTrimmedStringSchema(FIELD_LIMITS.LOCALITY),
	region: nullableTrimmedStringSchema(FIELD_LIMITS.REGION),
	postalCode: nullableTrimmedStringSchema(FIELD_LIMITS.POSTAL_CODE),
	country: nullableTrimmedStringSchema(FIELD_LIMITS.COUNTRY),
	isPrimary: z.boolean().optional().default(false),
});

/**
 * IM handle entry schema
 */
const contactIMSchema = z.object({
	handle: z.string().trim().min(1).max(FIELD_LIMITS.IM_HANDLE),
	service: z.string().trim().min(1).max(FIELD_LIMITS.IM_SERVICE),
});

/**
 * Relation entry schema
 */
const contactRelationSchema = z.object({
	relatedName: z.string().trim().min(1).max(FIELD_LIMITS.RELATION_NAME),
	relationType: z.string().trim().min(1).max(50),
});

/**
 * Geographic coordinates schema
 */
export const geoCoordinatesSchema = z
	.object({
		geoLatitude: z.number().min(-90).max(90).optional().nullable(),
		geoLongitude: z.number().min(-180).max(180).optional().nullable(),
	})
	.refine(
		(data) => {
			const hasLat =
				data.geoLatitude !== null && data.geoLatitude !== undefined;
			const hasLon =
				data.geoLongitude !== null && data.geoLongitude !== undefined;
			return hasLat === hasLon;
		},
		{
			message: "Both latitude and longitude must be provided together",
			path: ["geoLongitude"],
		},
	);

/**
 * UID schema
 */
const uidSchema = z
	.string()
	.trim()
	.max(FIELD_LIMITS.UID)
	.transform((val) => (val === "" ? null : val?.trim()))
	.nullable()
	.optional();

/**
 * Geo refinement function to validate lat/long pairs
 */
const geoRefinement = (data: {
	geoLatitude?: number | null;
	geoLongitude?: number | null;
}) => {
	const hasLat = data.geoLatitude !== null && data.geoLatitude !== undefined;
	const hasLon = data.geoLongitude !== null && data.geoLongitude !== undefined;
	return hasLat === hasLon;
};

const geoRefinementMessage = {
	message: "Both latitude and longitude must be provided together",
	path: ["geoLongitude"],
};

/**
 * Base contact schema without refinements (for composition)
 */
const contactBaseSchema = z.object({
	addressBookId: z.string(),

	// Required
	formattedName: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(FIELD_LIMITS.FORMATTED_NAME)
		.transform((val) => val.trim()),

	// Name components
	familyName: nullableTrimmedStringSchema(FIELD_LIMITS.FAMILY_NAME),
	givenName: nullableTrimmedStringSchema(FIELD_LIMITS.GIVEN_NAME),
	additionalName: nullableTrimmedStringSchema(FIELD_LIMITS.ADDITIONAL_NAME),
	namePrefix: nullableTrimmedStringSchema(FIELD_LIMITS.NAME_PREFIX),
	nameSuffix: nullableTrimmedStringSchema(FIELD_LIMITS.NAME_SUFFIX),
	nickname: nullableTrimmedStringSchema(FIELD_LIMITS.NICKNAME),

	// Photo
	photoUrl: urlSchema,

	// Dates
	birthday: z.coerce.date().optional().nullable(),
	anniversary: z.coerce.date().optional().nullable(),

	// Demographics
	gender: genderSchema.optional().nullable(),

	// Organization
	organization: nullableTrimmedStringSchema(FIELD_LIMITS.ORGANIZATION),
	title: nullableTrimmedStringSchema(FIELD_LIMITS.TITLE),
	role: nullableTrimmedStringSchema(FIELD_LIMITS.ROLE),

	// Geography
	geoLatitude: z.number().min(-90).max(90).optional().nullable(),
	geoLongitude: z.number().min(-180).max(180).optional().nullable(),
	timezone: nullableTrimmedStringSchema(FIELD_LIMITS.TIMEZONE),

	// Additional
	note: nullableTrimmedStringSchema(FIELD_LIMITS.NOTE),
	url: urlSchema,
	kind: contactKindSchema.optional().default("INDIVIDUAL"),
	uid: uidSchema,

	// Categories (comma-separated)
	categories: nullableTrimmedStringSchema(FIELD_LIMITS.CATEGORIES_STRING),

	// Multi-value relations
	emails: z.array(contactEmailSchema).optional(),
	phones: z.array(contactPhoneSchema).optional(),
	addresses: z.array(contactAddressSchema).optional(),
	imHandles: z.array(contactIMSchema).optional(),
	relations: z.array(contactRelationSchema).optional(),
});

/**
 * Complete contact schema for create operations
 */
export const contactCreateSchema = contactBaseSchema.refine(
	geoRefinement,
	geoRefinementMessage,
);

/**
 * Schema for contact update operations
 */
export const contactUpdateSchema = contactBaseSchema
	.omit({ addressBookId: true })
	.extend({
		id: z.string(),
		formattedName: z
			.string()
			.trim()
			.min(1)
			.max(FIELD_LIMITS.FORMATTED_NAME)
			.transform((val) => val.trim())
			.optional(),
	})
	.refine(geoRefinement, geoRefinementMessage);

/**
 * Schema for contact form data (frontend format)
 */
const contactFormDataSchema = z
	.object({
		// Required
		formattedName: z
			.string()
			.trim()
			.min(1, "Name is required")
			.max(FIELD_LIMITS.FORMATTED_NAME)
			.transform((val) => val.trim()),

		// Name components
		familyName: nullableTrimmedStringSchema(FIELD_LIMITS.FAMILY_NAME),
		givenName: nullableTrimmedStringSchema(FIELD_LIMITS.GIVEN_NAME),
		additionalName: nullableTrimmedStringSchema(FIELD_LIMITS.ADDITIONAL_NAME),
		namePrefix: nullableTrimmedStringSchema(FIELD_LIMITS.NAME_PREFIX),
		nameSuffix: nullableTrimmedStringSchema(FIELD_LIMITS.NAME_SUFFIX),
		nickname: nullableTrimmedStringSchema(FIELD_LIMITS.NICKNAME),

		// Photo
		photoUrl: nullableTrimmedStringSchema(FIELD_LIMITS.PHOTO_URL),

		// Dates as strings
		birthday: dateStringSchema.optional().nullable(),
		anniversary: dateStringSchema.optional().nullable(),

		// Demographics
		gender: z.string().max(10).optional().nullable(),

		// Organization
		organization: nullableTrimmedStringSchema(FIELD_LIMITS.ORGANIZATION),
		title: nullableTrimmedStringSchema(FIELD_LIMITS.TITLE),
		role: nullableTrimmedStringSchema(FIELD_LIMITS.ROLE),

		// Geography
		geoLatitude: z.number().min(-90).max(90).optional().nullable(),
		geoLongitude: z.number().min(-180).max(180).optional().nullable(),
		timezone: nullableTrimmedStringSchema(FIELD_LIMITS.TIMEZONE),

		// Additional
		note: nullableTrimmedStringSchema(FIELD_LIMITS.NOTE),
		url: nullableTrimmedStringSchema(FIELD_LIMITS.URL),
		kind: z.string().max(20).optional().default("INDIVIDUAL"),
		uid: nullableTrimmedStringSchema(FIELD_LIMITS.UID),

		// Categories
		categories: nullableTrimmedStringSchema(FIELD_LIMITS.CATEGORIES_STRING),

		// Multi-value relations
		emails: z.array(contactEmailSchema).optional(),
		phones: z.array(contactPhoneSchema).optional(),
		addresses: z.array(contactAddressSchema).optional(),
		imHandles: z.array(contactIMSchema).optional(),
		relations: z.array(contactRelationSchema).optional(),
	})
	.refine(
		(data) => {
			const hasLat =
				data.geoLatitude !== null && data.geoLatitude !== undefined;
			const hasLon =
				data.geoLongitude !== null && data.geoLongitude !== undefined;
			return hasLat === hasLon;
		},
		{
			message: "Both latitude and longitude must be provided together",
			path: ["geoLongitude"],
		},
	);

/**
 * Address book create schema
 */
export const addressBookCreateSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(FIELD_LIMITS.ADDRESS_BOOK_NAME)
		.transform((val) => val.trim()),
	color: colorSchema,
	sourceUrl: urlSchema,
});

/**
 * Address book update schema
 */
export const addressBookUpdateSchema = z.object({
	id: z.string(),
	name: z
		.string()
		.trim()
		.min(1)
		.max(FIELD_LIMITS.ADDRESS_BOOK_NAME)
		.transform((val) => val.trim())
		.optional(),
	color: colorSchema,
	sourceUrl: urlSchema,
});

// Type exports
export type ContactKind = z.infer<typeof contactKindSchema>;
export type Gender = z.infer<typeof genderSchema>;
export type PhoneType = z.infer<typeof phoneTypeSchema>;
export type EmailType = z.infer<typeof emailTypeSchema>;
export type AddressType = z.infer<typeof addressTypeSchema>;
export type RelationType = z.infer<typeof relationTypeSchema>;
export type IMService = z.infer<typeof imServiceSchema>;
export type ContactEmail = z.infer<typeof contactEmailSchema>;
export type ContactPhone = z.infer<typeof contactPhoneSchema>;
export type ContactAddress = z.infer<typeof contactAddressSchema>;
export type ContactIM = z.infer<typeof contactIMSchema>;
export type ContactRelation = z.infer<typeof contactRelationSchema>;
export type ContactCreate = z.infer<typeof contactCreateSchema>;
export type ContactUpdate = z.infer<typeof contactUpdateSchema>;
export type ContactFormData = z.infer<typeof contactFormDataSchema>;
export type AddressBookCreate = z.infer<typeof addressBookCreateSchema>;
export type AddressBookUpdate = z.infer<typeof addressBookUpdateSchema>;
