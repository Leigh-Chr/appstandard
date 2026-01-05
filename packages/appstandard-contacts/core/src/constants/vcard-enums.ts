/**
 * vCard 4.0 enumeration constants and validators
 * Based on RFC 6350 specifications
 * Complete RFC 6350 coverage
 */

// ----- Contact Kind (RFC 6350 Section 6.1.4) -----

export const CONTACT_KIND_VALUES = [
	"individual",
	"group",
	"org",
	"location",
] as const;
export type ContactKindValue = (typeof CONTACT_KIND_VALUES)[number];

export function isValidContactKind(value: string): value is ContactKindValue {
	return CONTACT_KIND_VALUES.includes(value.toLowerCase() as ContactKindValue);
}

// ----- Gender (RFC 6350 Section 6.2.7) -----

export const GENDER_VALUES = ["M", "F", "O", "N", "U"] as const;
export type GenderValue = (typeof GENDER_VALUES)[number];

export const GENDER_LABELS: Record<GenderValue, string> = {
	M: "Male",
	F: "Female",
	O: "Other",
	N: "None/Not applicable",
	U: "Unknown",
};

export function isValidGender(value: string): value is GenderValue {
	return GENDER_VALUES.includes(value.toUpperCase() as GenderValue);
}

// ----- Phone Type (RFC 6350 Section 6.4.1) -----

export const PHONE_TYPE_VALUES = [
	"home",
	"work",
	"cell",
	"fax",
	"pager",
	"voice",
	"text",
	"textphone",
	"video",
] as const;
export type PhoneTypeValue = (typeof PHONE_TYPE_VALUES)[number];

export function isValidPhoneType(value: string): value is PhoneTypeValue {
	return PHONE_TYPE_VALUES.includes(value.toLowerCase() as PhoneTypeValue);
}

// ----- Email Type (RFC 6350 Section 6.4.2) -----

export const EMAIL_TYPE_VALUES = ["home", "work"] as const;
export type EmailTypeValue = (typeof EMAIL_TYPE_VALUES)[number];

export function isValidEmailType(value: string): value is EmailTypeValue {
	return EMAIL_TYPE_VALUES.includes(value.toLowerCase() as EmailTypeValue);
}

// ----- Address Type (RFC 6350 Section 6.3.1) -----

export const ADDRESS_TYPE_VALUES = ["home", "work"] as const;
export type AddressTypeValue = (typeof ADDRESS_TYPE_VALUES)[number];

export function isValidAddressType(value: string): value is AddressTypeValue {
	return ADDRESS_TYPE_VALUES.includes(value.toLowerCase() as AddressTypeValue);
}

// ----- Relation Type (RFC 6350 Section 6.6.6) -----

export const RELATION_TYPE_VALUES = [
	"contact",
	"acquaintance",
	"friend",
	"met",
	"co-worker",
	"colleague",
	"co-resident",
	"neighbor",
	"child",
	"parent",
	"sibling",
	"spouse",
	"kin",
	"muse",
	"crush",
	"date",
	"sweetheart",
	"me",
	"agent",
	"emergency",
] as const;
export type RelationTypeValue = (typeof RELATION_TYPE_VALUES)[number];

export function isValidRelationType(value: string): value is RelationTypeValue {
	return RELATION_TYPE_VALUES.includes(
		value.toLowerCase() as RelationTypeValue,
	);
}

// ----- IM Service (RFC 6350 Section 6.4.3 - IMPP) -----

export const IM_SERVICE_VALUES = [
	"xmpp",
	"sip",
	"aim",
	"icq",
	"irc",
	"msn",
	"skype",
	"telegram",
	"whatsapp",
	"signal",
	"discord",
	"slack",
	"teams",
	"matrix",
	"yahoo",
] as const;
export type IMServiceValue = (typeof IM_SERVICE_VALUES)[number];

export function isValidIMService(value: string): value is IMServiceValue {
	return IM_SERVICE_VALUES.includes(value.toLowerCase() as IMServiceValue);
}

// ----- Key Type (RFC 6350 Section 6.8.1) -----

export const KEY_TYPE_VALUES = ["pgp", "x509", "ssh"] as const;
export type KeyTypeValue = (typeof KEY_TYPE_VALUES)[number];

export function isValidKeyType(value: string): value is KeyTypeValue {
	return KEY_TYPE_VALUES.includes(value.toLowerCase() as KeyTypeValue);
}

// ----- Language Tag (RFC 6350 Section 6.4.4 - LANG) -----
// Based on BCP 47 language tags

export function isValidLanguageTag(value: string): boolean {
	// Basic BCP 47 validation: language[-region]
	return /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/.test(value);
}

// ----- URL Type (RFC 6350 - multiple properties use TYPE) -----

export const URL_TYPE_VALUES = ["home", "work"] as const;
export type URLTypeValue = (typeof URL_TYPE_VALUES)[number];

export function isValidURLType(value: string): value is URLTypeValue {
	return URL_TYPE_VALUES.includes(value.toLowerCase() as URLTypeValue);
}

// ----- Calendar User Type (RFC 6350 Section 6.9) -----
// For FBURL, CALADRURI, CALURI properties

export const CALENDAR_TYPE_VALUES = ["home", "work"] as const;
export type CalendarTypeValue = (typeof CALENDAR_TYPE_VALUES)[number];

export function isValidCalendarType(value: string): value is CalendarTypeValue {
	return CALENDAR_TYPE_VALUES.includes(
		value.toLowerCase() as CalendarTypeValue,
	);
}
