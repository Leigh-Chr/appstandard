/**
 * Contact validation functions
 */

import { FIELD_LIMITS } from "../constants/field-limits";
import { isValidContactKind, isValidGender } from "../constants/vcard-enums";
import type {
	ContactAddressData,
	ContactEmailData,
	ContactFormData,
	ContactPhoneData,
} from "../types/contact";

/**
 * Validation error
 */
export interface ValidationError {
	field: string;
	message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

/**
 * Validate required field
 */
function validateRequired(
	value: string | undefined,
	fieldName: string,
): ValidationError | null {
	if (!value || value.trim().length === 0) {
		return { field: fieldName, message: `${fieldName} is required` };
	}
	return null;
}

/**
 * Validate field length
 */
function validateLength(
	value: string | undefined,
	maxLength: number,
	fieldName: string,
): ValidationError | null {
	if (value && value.length > maxLength) {
		return {
			field: fieldName,
			message: `${fieldName} must be ${maxLength} characters or less`,
		};
	}
	return null;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
	const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
	return hexRegex.test(color);
}

/**
 * Validate phone number (basic validation)
 */
function isValidPhone(phone: string): boolean {
	// Allow digits, spaces, dashes, parentheses, plus sign
	const phoneRegex = /^[+]?[\d\s\-().]{3,}$/;
	return phoneRegex.test(phone);
}

/**
 * Validate email entry
 */
function validateEmail(
	email: ContactEmailData,
	index: number,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!email.email || !isValidEmail(email.email)) {
		errors.push({
			field: `emails[${index}].email`,
			message: "Invalid email format",
		});
	}

	if (email.email && email.email.length > FIELD_LIMITS.EMAIL) {
		errors.push({
			field: `emails[${index}].email`,
			message: `Email must be ${FIELD_LIMITS.EMAIL} characters or less`,
		});
	}

	return errors;
}

/**
 * Validate phone entry
 */
function validatePhone(
	phone: ContactPhoneData,
	index: number,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!phone.number || !isValidPhone(phone.number)) {
		errors.push({
			field: `phones[${index}].number`,
			message: "Invalid phone number format",
		});
	}

	if (phone.number && phone.number.length > FIELD_LIMITS.PHONE) {
		errors.push({
			field: `phones[${index}].number`,
			message: `Phone number must be ${FIELD_LIMITS.PHONE} characters or less`,
		});
	}

	return errors;
}

/**
 * Validate address entry
 */
function validateAddress(
	address: ContactAddressData,
	index: number,
): ValidationError[] {
	const errors: ValidationError[] = [];

	const addressFields = [
		{
			value: address.streetAddress,
			max: FIELD_LIMITS.STREET_ADDRESS,
			name: "Street address",
		},
		{ value: address.locality, max: FIELD_LIMITS.LOCALITY, name: "City" },
		{ value: address.region, max: FIELD_LIMITS.REGION, name: "State/Province" },
		{
			value: address.postalCode,
			max: FIELD_LIMITS.POSTAL_CODE,
			name: "Postal code",
		},
		{ value: address.country, max: FIELD_LIMITS.COUNTRY, name: "Country" },
	];

	for (const field of addressFields) {
		if (field.value && field.value.length > field.max) {
			errors.push({
				field: `addresses[${index}].${field.name.toLowerCase().replace(/\s+/g, "")}`,
				message: `${field.name} must be ${field.max} characters or less`,
			});
		}
	}

	return errors;
}

/**
 * Validate contact form data
 */
export function validateContactForm(data: ContactFormData): ValidationResult {
	const errors: ValidationError[] = [];

	// Required fields
	const formattedNameError = validateRequired(data.formattedName, "Name");
	if (formattedNameError) errors.push(formattedNameError);

	// Field lengths
	const lengthChecks = [
		{
			value: data.formattedName,
			max: FIELD_LIMITS.FORMATTED_NAME,
			field: "Name",
		},
		{
			value: data.familyName,
			max: FIELD_LIMITS.FAMILY_NAME,
			field: "Family name",
		},
		{
			value: data.givenName,
			max: FIELD_LIMITS.GIVEN_NAME,
			field: "Given name",
		},
		{
			value: data.additionalName,
			max: FIELD_LIMITS.ADDITIONAL_NAME,
			field: "Additional name",
		},
		{
			value: data.namePrefix,
			max: FIELD_LIMITS.NAME_PREFIX,
			field: "Name prefix",
		},
		{
			value: data.nameSuffix,
			max: FIELD_LIMITS.NAME_SUFFIX,
			field: "Name suffix",
		},
		{ value: data.nickname, max: FIELD_LIMITS.NICKNAME, field: "Nickname" },
		{
			value: data.organization,
			max: FIELD_LIMITS.ORGANIZATION,
			field: "Organization",
		},
		{ value: data.title, max: FIELD_LIMITS.TITLE, field: "Title" },
		{ value: data.role, max: FIELD_LIMITS.ROLE, field: "Role" },
		{ value: data.note, max: FIELD_LIMITS.NOTE, field: "Note" },
		{ value: data.url, max: FIELD_LIMITS.URL, field: "URL" },
		{ value: data.photoUrl, max: FIELD_LIMITS.PHOTO_URL, field: "Photo URL" },
		{ value: data.timezone, max: FIELD_LIMITS.TIMEZONE, field: "Timezone" },
	];

	for (const check of lengthChecks) {
		const error = validateLength(check.value, check.max, check.field);
		if (error) errors.push(error);
	}

	// Kind validation
	if (data.kind && !isValidContactKind(data.kind)) {
		errors.push({ field: "kind", message: "Invalid contact kind" });
	}

	// Gender validation
	if (data.gender && !isValidGender(data.gender)) {
		errors.push({ field: "gender", message: "Invalid gender value" });
	}

	// URL validation
	if (data.url?.trim() && !isValidUrl(data.url)) {
		errors.push({ field: "url", message: "Invalid URL format" });
	}

	if (data.photoUrl?.trim() && !isValidUrl(data.photoUrl)) {
		errors.push({ field: "photoUrl", message: "Invalid photo URL format" });
	}

	// Geo coordinates validation (both or neither)
	const hasLat = data.geoLatitude !== undefined && data.geoLatitude !== null;
	const hasLon = data.geoLongitude !== undefined && data.geoLongitude !== null;
	if (hasLat !== hasLon) {
		errors.push({
			field: "geoLongitude",
			message: "Both latitude and longitude must be provided together",
		});
	}

	// Validate latitude range
	if (hasLat) {
		const lat = data.geoLatitude as number;
		if (lat < -90 || lat > 90) {
			errors.push({
				field: "geoLatitude",
				message: "Latitude must be between -90 and 90",
			});
		}
	}

	// Validate longitude range
	if (hasLon) {
		const lon = data.geoLongitude as number;
		if (lon < -180 || lon > 180) {
			errors.push({
				field: "geoLongitude",
				message: "Longitude must be between -180 and 180",
			});
		}
	}

	// Email validation
	if (data.emails && Array.isArray(data.emails)) {
		data.emails.forEach((email, index) => {
			errors.push(...validateEmail(email, index));
		});
	}

	// Phone validation
	if (data.phones && Array.isArray(data.phones)) {
		data.phones.forEach((phone, index) => {
			errors.push(...validatePhone(phone, index));
		});
	}

	// Address validation
	if (data.addresses && Array.isArray(data.addresses)) {
		data.addresses.forEach((address, index) => {
			errors.push(...validateAddress(address, index));
		});
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Get error for a specific field
 */
export function getFieldError(
	result: ValidationResult,
	field: string,
): string | undefined {
	const error = result.errors.find((e) => e.field === field);
	return error?.message;
}

/**
 * Check if validation result has any errors
 */
export function hasErrors(result: ValidationResult): boolean {
	return !result.valid;
}
