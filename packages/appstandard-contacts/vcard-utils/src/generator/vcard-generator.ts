/**
 * Generate vCard file content from contacts
 * Based on RFC 6350 specification
 */

import type {
	ContactInput,
	GeneratorOptions,
	ParsedAddress,
	ParsedCalendarUri,
	ParsedEmail,
	ParsedIM,
	ParsedKey,
	ParsedLanguage,
	ParsedPhone,
	ParsedRelation,
} from "../types";
import {
	escapeVCardText,
	foldLine,
	formatVCardDate,
	formatVCardTimestamp,
	generateUID,
} from "../utils/escape";

/**
 * Build a property line with optional parameters
 */
function buildPropertyLine(
	name: string,
	value: string,
	params?: Record<string, string>,
): string {
	let line = name;

	if (params) {
		for (const [key, val] of Object.entries(params)) {
			if (val && val !== "true") {
				line += `;${key}=${val}`;
			} else if (val === "true") {
				line += `;${key}`;
			}
		}
	}

	line += `:${value}`;
	return foldLine(line);
}

/**
 * Generate N (structured name) property value
 */
function buildN(contact: ContactInput): string {
	const parts = [
		escapeVCardText(contact.familyName || ""),
		escapeVCardText(contact.givenName || ""),
		escapeVCardText(contact.additionalName || ""),
		escapeVCardText(contact.namePrefix || ""),
		escapeVCardText(contact.nameSuffix || ""),
	];
	return parts.join(";");
}

/**
 * Generate ADR (address) property value
 * Format: po box;extended;street;locality;region;postal;country
 */
function buildADR(address: ParsedAddress): string {
	const parts = [
		escapeVCardText(address.poBox || ""),
		escapeVCardText(address.extendedAddress || ""),
		escapeVCardText(address.streetAddress || ""),
		escapeVCardText(address.locality || ""),
		escapeVCardText(address.region || ""),
		escapeVCardText(address.postalCode || ""),
		escapeVCardText(address.country || ""),
	];
	return parts.join(";");
}

/**
 * Generate GEO property value
 */
function buildGeo(lat: number, lon: number): string {
	return `geo:${lat},${lon}`;
}

/**
 * Generate EMAIL property
 */
function buildEmail(email: ParsedEmail): string {
	const params: Record<string, string> = {};
	if (email.type) {
		params["TYPE"] = email.type.toUpperCase();
	}
	if (email.isPrimary) {
		params["PREF"] = "1";
	}
	return buildPropertyLine("EMAIL", email.email, params);
}

/**
 * Generate TEL property
 */
function buildPhone(phone: ParsedPhone): string {
	const params: Record<string, string> = {
		VALUE: "uri",
	};
	if (phone.type) {
		params["TYPE"] = phone.type.toUpperCase();
	}
	if (phone.isPrimary) {
		params["PREF"] = "1";
	}
	// Format phone as tel: URI
	const telUri = phone.number.startsWith("tel:")
		? phone.number
		: `tel:${phone.number.replace(/\s/g, "")}`;
	return buildPropertyLine("TEL", telUri, params);
}

/**
 * Generate ADR property
 */
function buildAddress(address: ParsedAddress): string {
	const params: Record<string, string> = {};
	if (address.type) {
		params["TYPE"] = address.type.toUpperCase();
	}
	if (address.isPrimary) {
		params["PREF"] = "1";
	}
	return buildPropertyLine("ADR", buildADR(address), params);
}

/**
 * Generate IMPP property
 */
function buildIMPP(im: ParsedIM): string {
	const value = im.handle.includes(":")
		? im.handle
		: `${im.service}:${im.handle}`;
	return buildPropertyLine("IMPP", value);
}

/**
 * Generate RELATED property
 */
function buildRelated(relation: ParsedRelation): string {
	const params: Record<string, string> = {
		TYPE: relation.relationType,
	};
	return buildPropertyLine(
		"RELATED",
		escapeVCardText(relation.relatedName),
		params,
	);
}

/**
 * Generate LANG property (RFC 6350 Section 6.4.4)
 */
function buildLang(language: ParsedLanguage): string {
	const params: Record<string, string> = {};
	if (language.isPrimary) {
		params["PREF"] = "1";
	}
	return buildPropertyLine("LANG", language.tag, params);
}

/**
 * Generate KEY property (RFC 6350 Section 6.8.1)
 */
function buildKey(key: ParsedKey): string {
	const params: Record<string, string> = {};
	if (key.uri) {
		params["VALUE"] = "URI";
		if (key.type) {
			params["MEDIATYPE"] = `application/${key.type}-keys`;
		}
		return buildPropertyLine("KEY", key.uri, params);
	}
	if (key.value) {
		if (key.type) {
			params["MEDIATYPE"] = `application/${key.type}-keys`;
		}
		return buildPropertyLine("KEY", key.value, params);
	}
	return "";
}

/**
 * Generate calendar URI property (FBURL, CALADRURI, CALURI)
 * RFC 6350 Section 6.9
 */
function buildCalendarUri(
	propertyName: string,
	calUri: ParsedCalendarUri,
): string {
	const params: Record<string, string> = {};
	if (calUri.type) {
		params["TYPE"] = calUri.type.toUpperCase();
	}
	if (calUri.isPrimary) {
		params["PREF"] = "1";
	}
	return buildPropertyLine(propertyName, calUri.uri, params);
}

// ============================================================================
// Modular property generators - split from main function to reduce complexity
// ============================================================================

/**
 * Generate header lines (BEGIN, VERSION, PRODID, UID, FN)
 */
function generateHeaderLines(contact: ContactInput, prodId?: string): string[] {
	const lines: string[] = [];
	lines.push("BEGIN:VCARD");
	lines.push("VERSION:4.0");
	lines.push(
		buildPropertyLine("PRODID", prodId || "-//AppStandard Contacts//EN"),
	);
	lines.push(buildPropertyLine("UID", contact.uid || generateUID()));
	lines.push(buildPropertyLine("FN", escapeVCardText(contact.formattedName)));
	return lines;
}

/**
 * Generate name-related properties (N, NICKNAME)
 */
function generateNameLines(contact: ContactInput): string[] {
	const lines: string[] = [];
	const hasNameParts =
		contact.familyName ||
		contact.givenName ||
		contact.additionalName ||
		contact.namePrefix ||
		contact.nameSuffix;
	if (hasNameParts) {
		lines.push(buildPropertyLine("N", buildN(contact)));
	}
	if (contact.nickname) {
		lines.push(
			buildPropertyLine("NICKNAME", escapeVCardText(contact.nickname)),
		);
	}
	return lines;
}

/**
 * Generate personal info properties (PHOTO, BDAY, ANNIVERSARY, GENDER, KIND)
 */
function generatePersonalLines(contact: ContactInput): string[] {
	const lines: string[] = [];
	if (contact.photoUrl) {
		lines.push(buildPropertyLine("PHOTO", contact.photoUrl, { VALUE: "URI" }));
	}
	if (contact.birthday) {
		lines.push(buildPropertyLine("BDAY", formatVCardDate(contact.birthday)));
	}
	if (contact.anniversary) {
		lines.push(
			buildPropertyLine("ANNIVERSARY", formatVCardDate(contact.anniversary)),
		);
	}
	if (contact.gender) {
		lines.push(buildPropertyLine("GENDER", contact.gender));
	}
	if (contact.kind) {
		lines.push(buildPropertyLine("KIND", contact.kind));
	}
	return lines;
}

/**
 * Generate organization properties (ORG, TITLE, ROLE, LOGO, MEMBER)
 */
function generateOrgLines(contact: ContactInput): string[] {
	const lines: string[] = [];
	if (contact.organization) {
		lines.push(buildPropertyLine("ORG", escapeVCardText(contact.organization)));
	}
	if (contact.title) {
		lines.push(buildPropertyLine("TITLE", escapeVCardText(contact.title)));
	}
	if (contact.role) {
		lines.push(buildPropertyLine("ROLE", escapeVCardText(contact.role)));
	}
	if (contact.logoUrl) {
		lines.push(buildPropertyLine("LOGO", contact.logoUrl, { VALUE: "URI" }));
	}
	if (contact.members && contact.members.length > 0) {
		for (const member of contact.members) {
			lines.push(buildPropertyLine("MEMBER", escapeVCardText(member)));
		}
	}
	return lines;
}

/**
 * Generate contact method properties (EMAIL, TEL, ADR, IMPP)
 */
function generateContactMethodLines(contact: ContactInput): string[] {
	const lines: string[] = [];
	if (contact.emails) {
		for (const email of contact.emails) {
			lines.push(buildEmail(email));
		}
	}
	if (contact.phones) {
		for (const phone of contact.phones) {
			lines.push(buildPhone(phone));
		}
	}
	if (contact.addresses) {
		for (const address of contact.addresses) {
			lines.push(buildAddress(address));
		}
	}
	if (contact.imHandles) {
		for (const im of contact.imHandles) {
			lines.push(buildIMPP(im));
		}
	}
	return lines;
}

/**
 * Generate location properties (GEO, TZ, URL)
 */
function generateLocationLines(contact: ContactInput): string[] {
	const lines: string[] = [];
	if (contact.geoLatitude !== undefined && contact.geoLongitude !== undefined) {
		lines.push(
			buildPropertyLine(
				"GEO",
				buildGeo(contact.geoLatitude, contact.geoLongitude),
			),
		);
	}
	if (contact.timezone) {
		lines.push(buildPropertyLine("TZ", contact.timezone));
	}
	if (contact.url) {
		lines.push(buildPropertyLine("URL", contact.url));
	}
	return lines;
}

/**
 * Generate metadata properties (NOTE, CATEGORIES, RELATED, LANG, KEY, SOUND, SOURCE)
 */
function generateMetadataLines(contact: ContactInput): string[] {
	const lines: string[] = [];
	if (contact.note) {
		lines.push(buildPropertyLine("NOTE", escapeVCardText(contact.note)));
	}
	if (contact.categories && contact.categories.length > 0) {
		lines.push(
			buildPropertyLine(
				"CATEGORIES",
				contact.categories.map((c) => escapeVCardText(c)).join(","),
			),
		);
	}
	if (contact.relations) {
		for (const relation of contact.relations) {
			lines.push(buildRelated(relation));
		}
	}
	if (contact.languages && contact.languages.length > 0) {
		for (const lang of contact.languages) {
			lines.push(buildLang(lang));
		}
	}
	if (contact.keys && contact.keys.length > 0) {
		for (const key of contact.keys) {
			const keyLine = buildKey(key);
			if (keyLine) {
				lines.push(keyLine);
			}
		}
	}
	if (contact.soundUrl) {
		lines.push(buildPropertyLine("SOUND", contact.soundUrl, { VALUE: "URI" }));
	}
	if (contact.sourceUrl) {
		lines.push(buildPropertyLine("SOURCE", contact.sourceUrl));
	}
	return lines;
}

/**
 * Generate calendar URI properties (FBURL, CALADRURI, CALURI)
 */
function generateCalendarLines(contact: ContactInput): string[] {
	const lines: string[] = [];
	if (contact.fbUrls && contact.fbUrls.length > 0) {
		for (const fbUrl of contact.fbUrls) {
			lines.push(buildCalendarUri("FBURL", fbUrl));
		}
	}
	if (contact.calAdrUris && contact.calAdrUris.length > 0) {
		for (const calAdrUri of contact.calAdrUris) {
			lines.push(buildCalendarUri("CALADRURI", calAdrUri));
		}
	}
	if (contact.calUris && contact.calUris.length > 0) {
		for (const calUri of contact.calUris) {
			lines.push(buildCalendarUri("CALURI", calUri));
		}
	}
	return lines;
}

/**
 * Generate a single vCard by combining modular property generators
 */
function generateVCard(contact: ContactInput, prodId?: string): string {
	const lines: string[] = [
		...generateHeaderLines(contact, prodId),
		...generateNameLines(contact),
		...generatePersonalLines(contact),
		...generateOrgLines(contact),
		...generateContactMethodLines(contact),
		...generateLocationLines(contact),
		...generateMetadataLines(contact),
		...generateCalendarLines(contact),
	];

	// REV (revision timestamp)
	lines.push(buildPropertyLine("REV", formatVCardTimestamp(new Date())));

	// Required footer
	lines.push("END:VCARD");

	return lines.join("\r\n");
}

/**
 * Generate a vCard file content from contacts
 * @param options - Generation options with contacts array
 * @returns vCard file content string
 */
export function generateVCardFile(options: GeneratorOptions): string {
	const { contacts, prodId } = options;

	if (contacts.length === 0) {
		return "";
	}

	// Generate each vCard and join with blank line
	const vcards = contacts.map((contact) => generateVCard(contact, prodId));
	return vcards.join("\r\n");
}

/**
 * Generate a single vCard string
 * @param contact - Contact data
 * @param prodId - Optional product ID
 * @returns vCard string
 */
export function generateSingleVCard(
	contact: ContactInput,
	prodId?: string,
): string {
	return generateVCard(contact, prodId);
}
