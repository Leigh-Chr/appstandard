/**
 * Parse vCard file content and extract contacts
 * Based on RFC 6350 specification
 */

import type {
	ContactKindValue,
	GenderValue,
	ParsedAddress,
	ParsedCalendarUri,
	ParsedContact,
	ParsedIM,
	ParsedKey,
	ParsedLanguage,
	ParsedRelation,
	ParseResult,
} from "../types";
import {
	parseVCardDate,
	unescapeVCardText,
	unfoldLines,
} from "../utils/escape";

/**
 * Parse a single property line into name, parameters, and value
 */
interface ParsedProperty {
	name: string;
	params: Record<string, string>;
	value: string;
}

function parsePropertyLine(line: string): ParsedProperty | null {
	// Match property:value or property;params:value
	const colonIndex = line.indexOf(":");
	if (colonIndex === -1) return null;

	const beforeColon = line.substring(0, colonIndex);
	const value = line.substring(colonIndex + 1);

	// Parse property name and parameters
	const parts = beforeColon.split(";");
	const name = (parts[0] ?? "").toUpperCase();
	const params: Record<string, string> = {};

	for (let i = 1; i < parts.length; i++) {
		const param = parts[i];
		if (!param) continue;
		const eqIndex = param.indexOf("=");
		if (eqIndex !== -1) {
			const paramName = param.substring(0, eqIndex).toUpperCase();
			const paramValue = param.substring(eqIndex + 1).replace(/^"|"$/g, "");
			params[paramName] = paramValue;
		} else {
			// Handle valueless parameters (e.g., TYPE parameter without =)
			params[param.toUpperCase()] = "true";
		}
	}

	return { name, params, value };
}

/**
 * Extract TYPE parameter value
 */
function extractType(params: Record<string, string>): string | undefined {
	return params["TYPE"]?.toLowerCase();
}

/**
 * Check if PREF parameter is present
 */
function isPrimary(params: Record<string, string>): boolean {
	return params["PREF"] === "1" || params["PREF"]?.toLowerCase() === "true";
}

/**
 * Parse N (structured name) property
 * Format: family;given;additional;prefix;suffix
 */
function parseN(value: string): {
	familyName?: string;
	givenName?: string;
	additionalName?: string;
	namePrefix?: string;
	nameSuffix?: string;
} {
	const parts = value.split(";").map((p) => unescapeVCardText(p.trim()));
	return {
		familyName: parts[0] || undefined,
		givenName: parts[1] || undefined,
		additionalName: parts[2] || undefined,
		namePrefix: parts[3] || undefined,
		nameSuffix: parts[4] || undefined,
	};
}

/**
 * Parse ADR (address) property (RFC 6350 Section 6.3.1)
 * Format: po box;extended;street;locality;region;postal;country
 */
function parseADR(
	value: string,
	params: Record<string, string>,
): ParsedAddress {
	const parts = value.split(";").map((p) => unescapeVCardText(p.trim()));
	return {
		type: extractType(params),
		poBox: parts[0] || undefined,
		extendedAddress: parts[1] || undefined,
		streetAddress: parts[2] || undefined,
		locality: parts[3] || undefined,
		region: parts[4] || undefined,
		postalCode: parts[5] || undefined,
		country: parts[6] || undefined,
		isPrimary: isPrimary(params),
	};
}

/**
 * Parse LANG property (RFC 6350 Section 6.4.4)
 */
function parseLang(
	value: string,
	params: Record<string, string>,
): ParsedLanguage {
	return {
		tag: value.trim(),
		isPrimary: isPrimary(params),
	};
}

/**
 * Parse KEY property (RFC 6350 Section 6.8.1)
 */
function parseKey(value: string, params: Record<string, string>): ParsedKey {
	const key: ParsedKey = {};

	// Check if it's a URI or inline data
	if (value.startsWith("http") || params["VALUE"] === "URI") {
		key.uri = value;
	} else {
		key.value = value;
	}

	// Extract key type from MEDIATYPE or TYPE parameter
	const mediaType = params["MEDIATYPE"];
	if (mediaType) {
		if (mediaType.includes("pgp")) key.type = "pgp";
		else if (mediaType.includes("x509") || mediaType.includes("pkix"))
			key.type = "x509";
	}
	const typeParam = params["TYPE"];
	if (typeParam) {
		key.type = typeParam.toLowerCase();
	}

	return key;
}

/**
 * Parse calendar URI property (FBURL, CALADRURI, CALURI)
 * RFC 6350 Section 6.9
 */
function parseCalendarUri(
	value: string,
	params: Record<string, string>,
): ParsedCalendarUri {
	return {
		uri: value,
		type: extractType(params),
		isPrimary: isPrimary(params),
	};
}

/**
 * Parse GEO property
 * Format: geo:lat,lon or lat;lon
 */
function parseGeo(value: string): {
	geoLatitude?: number;
	geoLongitude?: number;
} {
	// Handle geo: URI format
	let coords = value;
	if (value.toLowerCase().startsWith("geo:")) {
		coords = value.substring(4);
	}

	// Try comma separator first, then semicolon
	let parts = coords.split(",");
	if (parts.length !== 2) {
		parts = coords.split(";");
	}

	if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
		const lat = Number.parseFloat(parts[0]);
		const lon = Number.parseFloat(parts[1]);
		if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
			return { geoLatitude: lat, geoLongitude: lon };
		}
	}

	return {};
}

/**
 * Parse GENDER property
 * Format: M, F, O, N, U (optionally followed by ;identity)
 */
function parseGender(value: string): GenderValue | undefined {
	const parts = value.split(";");
	const genderCode = (parts[0] ?? "").toUpperCase();
	if (["M", "F", "O", "N", "U"].includes(genderCode)) {
		return genderCode as GenderValue;
	}
	return undefined;
}

/**
 * Parse KIND property
 */
function parseKind(value: string): ContactKindValue | undefined {
	const kind = value.toLowerCase();
	if (["individual", "group", "org", "location"].includes(kind)) {
		return kind as ContactKindValue;
	}
	return undefined;
}

/**
 * Parse IMPP property
 * Format: scheme:handle (e.g., xmpp:user@example.com)
 */
function parseIMPP(value: string): ParsedIM | undefined {
	const colonIndex = value.indexOf(":");
	if (colonIndex !== -1) {
		const service = value.substring(0, colonIndex).toLowerCase();
		const handle = value.substring(colonIndex + 1);
		if (handle) {
			return { service, handle };
		}
	}
	return undefined;
}

/**
 * Parse RELATED property
 */
function parseRelated(
	value: string,
	params: Record<string, string>,
): ParsedRelation | undefined {
	const relationType = extractType(params) || "contact";
	if (value) {
		return { relatedName: unescapeVCardText(value), relationType };
	}
	return undefined;
}

// ============================================================================
// Property handlers - extracted from switch statement to reduce complexity
// ============================================================================

type PropertyHandler = (
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
) => void;

/**
 * Handle simple text properties
 */
function handleSimpleText(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	switch (prop.name) {
		case "FN":
			contact.formattedName = unescapeVCardText(prop.value);
			break;
		case "NICKNAME":
			contact.nickname = unescapeVCardText(prop.value);
			break;
		case "TITLE":
			contact.title = unescapeVCardText(prop.value);
			break;
		case "ROLE":
			contact.role = unescapeVCardText(prop.value);
			break;
		case "NOTE":
			contact.note = unescapeVCardText(prop.value);
			break;
		case "TZ":
			contact.timezone = prop.value;
			break;
		case "URL":
			contact.url = prop.value;
			break;
		case "UID":
			contact.uid = prop.value;
			break;
		case "PRODID":
			contact.prodId = prop.value;
			break;
		case "CLIENTPIDMAP":
			contact.clientPidMap = prop.value;
			break;
		case "XML":
			contact.xml = prop.value;
			break;
		case "SOURCE":
			contact.sourceUrl = prop.value;
			break;
	}
}

/**
 * Handle structured name property
 */
function handleN(contact: Partial<ParsedContact>, prop: ParsedProperty): void {
	const name = parseN(prop.value);
	Object.assign(contact, name);
}

/**
 * Handle photo/media URI properties
 */
function handleMediaUri(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	const isUri = prop.value.startsWith("http") || prop.params["VALUE"] === "URI";
	if (!isUri) return;

	switch (prop.name) {
		case "PHOTO":
			contact.photoUrl = prop.value;
			break;
		case "LOGO":
			contact.logoUrl = prop.value;
			break;
		case "SOUND":
			contact.soundUrl = prop.value;
			break;
	}
}

/**
 * Handle date properties
 */
function handleDates(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	switch (prop.name) {
		case "BDAY":
			contact.birthday = parseVCardDate(prop.value);
			break;
		case "ANNIVERSARY":
			contact.anniversary = parseVCardDate(prop.value);
			break;
		case "REV":
			try {
				contact.revision = new Date(prop.value);
			} catch {
				// Ignore invalid revision dates
			}
			break;
	}
}

/**
 * Handle contact method properties (EMAIL, TEL, ADR)
 */
function handleContactMethods(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	switch (prop.name) {
		case "EMAIL":
			contact.emails?.push({
				email: prop.value.toLowerCase(),
				type: extractType(prop.params),
				isPrimary: isPrimary(prop.params),
			});
			break;
		case "TEL":
			contact.phones?.push({
				number: prop.value,
				type: extractType(prop.params),
				isPrimary: isPrimary(prop.params),
			});
			break;
		case "ADR":
			contact.addresses?.push(parseADR(prop.value, prop.params));
			break;
	}
}

/**
 * Handle organization property
 */
function handleOrg(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	// ORG can have multiple components separated by ;
	contact.organization = unescapeVCardText(prop.value.split(";")[0] ?? "");
}

/**
 * Handle geo property
 */
function handleGeo(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	const geo = parseGeo(prop.value);
	Object.assign(contact, geo);
}

/**
 * Handle enum properties (GENDER, KIND)
 */
function handleEnums(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	switch (prop.name) {
		case "GENDER":
			contact.gender = parseGender(prop.value);
			break;
		case "KIND":
			contact.kind = parseKind(prop.value);
			break;
	}
}

/**
 * Handle categories property
 */
function handleCategories(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	contact.categories = prop.value
		.split(",")
		.map((c) => unescapeVCardText(c.trim()))
		.filter((c) => c.length > 0);
}

/**
 * Handle IMPP property
 */
function handleIMPP(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	const im = parseIMPP(prop.value);
	if (im) {
		contact.imHandles?.push(im);
	}
}

/**
 * Handle RELATED property
 */
function handleRelated(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	const relation = parseRelated(prop.value, prop.params);
	if (relation) {
		contact.relations?.push(relation);
	}
}

/**
 * Handle KEY property
 */
function handleKey(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	contact.keys?.push(parseKey(prop.value, prop.params));
}

/**
 * Handle MEMBER property
 */
function handleMember(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	if (prop.value) {
		contact.members?.push(unescapeVCardText(prop.value));
	}
}

/**
 * Handle LANG property
 */
function handleLang(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	contact.languages?.push(parseLang(prop.value, prop.params));
}

/**
 * Handle calendar URI properties (FBURL, CALADRURI, CALURI)
 */
function handleCalendarUris(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	const calUri = parseCalendarUri(prop.value, prop.params);
	switch (prop.name) {
		case "FBURL":
			contact.fbUrls?.push(calUri);
			break;
		case "CALADRURI":
			contact.calAdrUris?.push(calUri);
			break;
		case "CALURI":
			contact.calUris?.push(calUri);
			break;
	}
}

/**
 * Handle social profile extensions
 */
function handleSocialProfile(
	contact: Partial<ParsedContact>,
	prop: ParsedProperty,
): void {
	if (prop.value) {
		const service =
			prop.params["TYPE"]?.toLowerCase() ||
			prop.name.replace("X-", "").toLowerCase();
		contact.imHandles?.push({ service, handle: prop.value });
	}
}

/**
 * Property handler map - routes property names to their handlers
 */
const propertyHandlers: Record<string, PropertyHandler> = {
	FN: handleSimpleText,
	N: handleN,
	NICKNAME: handleSimpleText,
	PHOTO: handleMediaUri,
	BDAY: handleDates,
	ANNIVERSARY: handleDates,
	GENDER: handleEnums,
	EMAIL: handleContactMethods,
	TEL: handleContactMethods,
	ADR: handleContactMethods,
	ORG: handleOrg,
	TITLE: handleSimpleText,
	ROLE: handleSimpleText,
	GEO: handleGeo,
	TZ: handleSimpleText,
	NOTE: handleSimpleText,
	URL: handleSimpleText,
	KIND: handleEnums,
	UID: handleSimpleText,
	REV: handleDates,
	CATEGORIES: handleCategories,
	IMPP: handleIMPP,
	RELATED: handleRelated,
	LOGO: handleMediaUri,
	SOUND: handleMediaUri,
	KEY: handleKey,
	MEMBER: handleMember,
	LANG: handleLang,
	SOURCE: handleSimpleText,
	PRODID: handleSimpleText,
	CLIENTPIDMAP: handleSimpleText,
	XML: handleSimpleText,
	FBURL: handleCalendarUris,
	CALADRURI: handleCalendarUris,
	CALURI: handleCalendarUris,
	"X-SOCIALPROFILE": handleSocialProfile,
	"X-TWITTER": handleSocialProfile,
	"X-FACEBOOK": handleSocialProfile,
};

/**
 * Clean up empty arrays in the contact object
 */
function cleanupEmptyArrays(contact: Partial<ParsedContact>): void {
	if (contact.emails?.length === 0) contact.emails = undefined;
	if (contact.phones?.length === 0) contact.phones = undefined;
	if (contact.addresses?.length === 0) contact.addresses = undefined;
	if (contact.imHandles?.length === 0) contact.imHandles = undefined;
	if (contact.categories?.length === 0) contact.categories = undefined;
	if (contact.relations?.length === 0) contact.relations = undefined;
	if (contact.languages?.length === 0) contact.languages = undefined;
	if (contact.keys?.length === 0) contact.keys = undefined;
	if (contact.fbUrls?.length === 0) contact.fbUrls = undefined;
	if (contact.calAdrUris?.length === 0) contact.calAdrUris = undefined;
	if (contact.calUris?.length === 0) contact.calUris = undefined;
	if (contact.members?.length === 0) contact.members = undefined;
}

/**
 * Parse a single vCard block using handler map pattern
 */
function parseVCard(lines: string[], errors: string[]): ParsedContact | null {
	const contact: Partial<ParsedContact> = {
		emails: [],
		phones: [],
		addresses: [],
		imHandles: [],
		categories: [],
		relations: [],
		languages: [],
		keys: [],
		fbUrls: [],
		calAdrUris: [],
		calUris: [],
		members: [],
	};

	for (const line of lines) {
		if (!line.trim() || line.startsWith("BEGIN:") || line.startsWith("END:")) {
			continue;
		}

		const prop = parsePropertyLine(line);
		if (!prop) continue;

		try {
			const handler = propertyHandlers[prop.name];
			if (handler) {
				handler(contact, prop);
			}
			// Unknown properties are silently ignored
		} catch (err) {
			errors.push(
				`Failed to parse property ${prop.name}: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	// FN is required
	if (!contact.formattedName) {
		errors.push("vCard missing required FN property");
		return null;
	}

	// Clean up empty arrays
	cleanupEmptyArrays(contact);

	return contact as ParsedContact;
}

/**
 * Parse a vCard file content and extract contacts
 * @param fileContent - Raw vCard/VCF file content
 * @returns Parsed contacts and any parsing errors
 */
export function parseVCardFile(fileContent: string): ParseResult {
	const contacts: ParsedContact[] = [];
	const errors: string[] = [];

	try {
		// Unfold lines first (RFC 6350 line folding)
		const unfolded = unfoldLines(fileContent);

		// Split into lines
		const lines = unfolded.split(/\r?\n/);

		// Find vCard blocks
		let currentVCard: string[] = [];
		let inVCard = false;

		for (const line of lines) {
			const trimmed = line.trim();

			if (trimmed.toUpperCase() === "BEGIN:VCARD") {
				inVCard = true;
				currentVCard = [];
				continue;
			}

			if (trimmed.toUpperCase() === "END:VCARD") {
				if (inVCard && currentVCard.length > 0) {
					const contact = parseVCard(currentVCard, errors);
					if (contact) {
						contacts.push(contact);
					}
				}
				inVCard = false;
				currentVCard = [];
				continue;
			}

			if (inVCard) {
				currentVCard.push(line);
			}
		}

		if (contacts.length === 0 && errors.length === 0) {
			errors.push("No valid vCard entries found in the file.");
		}
	} catch (error) {
		errors.push(
			`Failed to parse vCard file: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	return { contacts, errors };
}
