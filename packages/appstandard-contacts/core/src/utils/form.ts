/**
 * Form utility functions for AppStandard Contacts
 */

import { isValidContactKind, isValidGender } from "../constants/vcard-enums";
import type {
	ContactAddressData,
	ContactEmailData,
	ContactFormData,
	ContactPhoneData,
} from "../types/contact";

/**
 * Initialize contact form data with defaults
 */
export function initializeFormData(
	initialData?: Partial<ContactFormData>,
): ContactFormData {
	return {
		formattedName: "",
		familyName: "",
		givenName: "",
		additionalName: "",
		namePrefix: "",
		nameSuffix: "",
		nickname: "",
		photoUrl: "",
		birthday: "",
		anniversary: "",
		gender: "",
		organization: "",
		title: "",
		role: "",
		geoLatitude: undefined,
		geoLongitude: undefined,
		timezone: "",
		note: "",
		url: "",
		kind: "individual",
		uid: "",
		categories: "",
		emails: [],
		phones: [],
		addresses: [],
		imHandles: [],
		relations: [],
		...initialData,
	};
}

/**
 * Transform contact form data to API format
 */
export function transformContactFormData(
	data: ContactFormData,
	addressBookId?: string,
): Record<string, unknown> {
	const transformed: Record<string, unknown> = {};

	// Required fields
	transformed["formattedName"] = data.formattedName.trim();

	if (addressBookId) {
		transformed["addressBookId"] = addressBookId;
	}

	// Optional string fields
	const stringFields = [
		"familyName",
		"givenName",
		"additionalName",
		"namePrefix",
		"nameSuffix",
		"nickname",
		"photoUrl",
		"organization",
		"title",
		"role",
		"timezone",
		"note",
		"url",
		"uid",
	] as const;

	for (const field of stringFields) {
		const value = data[field];
		if (value && typeof value === "string" && value.trim()) {
			transformed[field] = value.trim();
		} else {
			transformed[field] = null;
		}
	}

	// Dates
	if (data.birthday?.trim()) {
		transformed["birthday"] = new Date(data.birthday);
	} else {
		transformed["birthday"] = null;
	}

	if (data.anniversary?.trim()) {
		transformed["anniversary"] = new Date(data.anniversary);
	} else {
		transformed["anniversary"] = null;
	}

	// Enums
	if (data.kind && isValidContactKind(data.kind)) {
		transformed["kind"] = data.kind.toLowerCase();
	} else {
		transformed["kind"] = "individual";
	}

	if (data.gender && isValidGender(data.gender)) {
		transformed["gender"] = data.gender.toUpperCase();
	} else {
		transformed["gender"] = null;
	}

	// Geo coordinates
	if (data.geoLatitude !== undefined && data.geoLongitude !== undefined) {
		transformed["geoLatitude"] = data.geoLatitude;
		transformed["geoLongitude"] = data.geoLongitude;
	} else {
		transformed["geoLatitude"] = null;
		transformed["geoLongitude"] = null;
	}

	// Categories (comma-separated string to array)
	if (data.categories?.trim()) {
		transformed["categories"] = data.categories
			.split(",")
			.map((c) => c.trim())
			.filter((c) => c.length > 0);
	} else {
		transformed["categories"] = [];
	}

	// Emails
	if (data["emails"] && Array.isArray(data["emails"])) {
		transformed["emails"] = data["emails"]
			.filter((e: ContactEmailData) => e.email?.trim())
			.map((e: ContactEmailData) => ({
				email: e.email.trim(),
				type: e.type || null,
				isPrimary: e.isPrimary ?? false,
			}));
	}

	// Phones
	if (data["phones"] && Array.isArray(data["phones"])) {
		transformed["phones"] = data["phones"]
			.filter((p: ContactPhoneData) => p.number?.trim())
			.map((p: ContactPhoneData) => ({
				number: p.number.trim(),
				type: p.type || null,
				isPrimary: p.isPrimary ?? false,
			}));
	}

	// Addresses
	if (data["addresses"] && Array.isArray(data["addresses"])) {
		transformed["addresses"] = data["addresses"]
			.filter(
				(a: ContactAddressData) =>
					a.streetAddress?.trim() ||
					a.locality?.trim() ||
					a.region?.trim() ||
					a.postalCode?.trim() ||
					a.country?.trim(),
			)
			.map((a: ContactAddressData) => ({
				type: a.type || null,
				streetAddress: a.streetAddress?.trim() || null,
				locality: a.locality?.trim() || null,
				region: a.region?.trim() || null,
				postalCode: a.postalCode?.trim() || null,
				country: a.country?.trim() || null,
				isPrimary: a.isPrimary ?? false,
			}));
	}

	// IM Handles
	if (data["imHandles"] && Array.isArray(data["imHandles"])) {
		transformed["imHandles"] = data["imHandles"]
			.filter((im) => im.handle?.trim() && im.service?.trim())
			.map((im) => ({
				handle: im.handle.trim(),
				service: im.service.trim().toLowerCase(),
			}));
	}

	// Relations
	if (data["relations"] && Array.isArray(data["relations"])) {
		transformed["relations"] = data["relations"]
			.filter((r) => r.relatedName?.trim())
			.map((r) => ({
				relatedName: r.relatedName.trim(),
				relationType: r.relationType || "contact",
			}));
	}

	return transformed;
}
