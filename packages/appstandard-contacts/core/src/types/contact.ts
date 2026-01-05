/**
 * Contact entity and form data types
 * Based on RFC 6350 vCard 4.0 specification
 * Complete RFC 6350 coverage
 */

import type {
	AddressTypeValue,
	ContactKindValue,
	EmailTypeValue,
	GenderValue,
	PhoneTypeValue,
	RelationTypeValue,
} from "../constants/vcard-enums";

/**
 * Email data (RFC 6350 Section 6.4.2)
 */
export interface ContactEmailData {
	email: string;
	type?: EmailTypeValue | null;
	isPrimary?: boolean;
}

/**
 * Phone data (RFC 6350 Section 6.4.1)
 */
export interface ContactPhoneData {
	number: string;
	type?: PhoneTypeValue | null;
	isPrimary?: boolean;
}

/**
 * Address data per RFC 6350 ADR property (Section 6.3.1)
 */
export interface ContactAddressData {
	type?: AddressTypeValue | null;
	poBox?: string | null; // PO Box
	extendedAddress?: string | null; // Extended address
	streetAddress?: string | null; // Street
	locality?: string | null; // City
	region?: string | null; // State/Province
	postalCode?: string | null;
	country?: string | null;
	isPrimary?: boolean;
}

/**
 * Instant Messaging data per RFC 6350 IMPP property (Section 6.4.3)
 */
export interface ContactIMData {
	handle: string;
	service: string; // xmpp, sip, skype, telegram, etc.
}

/**
 * Relation data per RFC 6350 RELATED property (Section 6.6.6)
 */
export interface ContactRelationData {
	relatedName: string; // Name or URI of related person
	relationType: RelationTypeValue | string;
}

/**
 * Language data per RFC 6350 LANG property (Section 6.4.4)
 */
export interface ContactLanguageData {
	tag: string; // BCP 47 language tag (e.g., "en", "fr-CA")
	isPrimary?: boolean;
}

/**
 * Key data per RFC 6350 KEY property (Section 6.8.1)
 */
export interface ContactKeyData {
	uri?: string | null; // URI to key
	value?: string | null; // Inline key data
	type?: string | null; // pgp, x509, ssh
}

/**
 * Calendar URI data per RFC 6350 Section 6.9
 */
export interface ContactCalendarData {
	uri: string;
	type?: string | null; // home, work
	isPrimary?: boolean;
}

/**
 * Contact entity - Database representation
 * Complete RFC 6350 coverage
 */
export interface ContactEntity {
	id: string;
	addressBookId: string;

	// ----- Required per RFC 6350 -----
	formattedName: string; // FN property

	// ----- Name components (N property - Section 6.2.2) -----
	familyName?: string | null;
	givenName?: string | null;
	additionalName?: string | null;
	namePrefix?: string | null;
	nameSuffix?: string | null;

	// ----- Identification (Section 6.2) -----
	nickname?: string | null; // NICKNAME
	photoUrl?: string | null; // PHOTO
	birthday?: Date | null; // BDAY
	anniversary?: Date | null; // ANNIVERSARY
	gender?: GenderValue | null; // GENDER

	// ----- Organization (Section 6.6) -----
	organization?: string | null; // ORG
	title?: string | null; // TITLE
	role?: string | null; // ROLE
	logoUrl?: string | null; // LOGO (Section 6.6.3)
	members?: string[]; // MEMBER (Section 6.6.5 - for KIND:group)

	// ----- Location (Section 6.5) -----
	geoLatitude?: number | null; // GEO
	geoLongitude?: number | null; // GEO
	timezone?: string | null; // TZ

	// ----- Communication (Section 6.4) -----
	languages?: ContactLanguageData[]; // LANG (Section 6.4.4)

	// ----- Additional properties -----
	note?: string | null; // NOTE (Section 6.7.2)
	url?: string | null; // URL (Section 6.7.8)
	kind: ContactKindValue; // KIND (Section 6.1.4)
	soundUrl?: string | null; // SOUND (Section 6.7.5)
	sourceUrl?: string | null; // SOURCE (Section 6.1.3)

	// ----- Security (Section 6.8) -----
	keys?: ContactKeyData[]; // KEY (Section 6.8.1)

	// ----- Calendar properties (Section 6.9) -----
	fbUrls?: ContactCalendarData[]; // FBURL (Section 6.9.1)
	calAdrUris?: ContactCalendarData[]; // CALADRURI (Section 6.9.2)
	calUris?: ContactCalendarData[]; // CALURI (Section 6.9.3)

	// ----- RFC 6350 Metadata -----
	uid?: string | null; // UID (Section 6.7.6)
	revision?: Date | null; // REV (Section 6.7.4)
	prodId?: string | null; // PRODID (Section 6.7.3)
	clientPidMap?: string | null; // CLIENTPIDMAP (Section 6.7.7)
	xml?: string | null; // XML (Section 6.1.5)

	// ----- Multi-value properties -----
	emails?: ContactEmailData[]; // EMAIL
	phones?: ContactPhoneData[]; // TEL
	addresses?: ContactAddressData[]; // ADR
	imHandles?: ContactIMData[]; // IMPP
	categories?: string[]; // CATEGORIES (Section 6.7.1)
	relations?: ContactRelationData[]; // RELATED

	// ----- Database timestamps -----
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Contact form data - For UI forms
 * Complete RFC 6350 coverage
 */
export interface ContactFormData {
	// ----- Required -----
	formattedName: string; // FN

	// ----- Name components (N) -----
	familyName?: string | undefined;
	givenName?: string | undefined;
	additionalName?: string | undefined;
	namePrefix?: string | undefined;
	nameSuffix?: string | undefined;

	// ----- Identification -----
	nickname?: string | undefined; // NICKNAME
	photoUrl?: string | undefined; // PHOTO
	birthday?: string | undefined; // BDAY (ISO date string)
	anniversary?: string | undefined; // ANNIVERSARY
	gender?: string | undefined; // GENDER

	// ----- Organization -----
	organization?: string | undefined; // ORG
	title?: string | undefined; // TITLE
	role?: string | undefined; // ROLE
	logoUrl?: string | undefined; // LOGO
	members?: string | undefined; // MEMBER (comma-separated for KIND:group)

	// ----- Location -----
	geoLatitude?: number | undefined; // GEO
	geoLongitude?: number | undefined; // GEO
	timezone?: string | undefined; // TZ

	// ----- Additional -----
	note?: string | undefined; // NOTE
	url?: string | undefined; // URL
	kind?: string | undefined; // KIND
	soundUrl?: string | undefined; // SOUND
	sourceUrl?: string | undefined; // SOURCE

	// ----- Calendar properties -----
	fbUrl?: string | undefined; // FBURL
	calAdrUri?: string | undefined; // CALADRURI
	calUri?: string | undefined; // CALURI

	// ----- RFC 6350 Metadata -----
	uid?: string | undefined; // UID

	// ----- Multi-value (string format) -----
	categories?: string | undefined; // CATEGORIES (comma-separated)
	languages?: string | undefined; // LANG (comma-separated BCP 47 tags)

	// ----- Complex relations (arrays) -----
	emails?: ContactEmailData[] | undefined;
	phones?: ContactPhoneData[] | undefined;
	addresses?: ContactAddressData[] | undefined;
	imHandles?: ContactIMData[] | undefined;
	relations?: ContactRelationData[] | undefined;
	keys?: ContactKeyData[] | undefined;
}

/**
 * Contact summary - Lightweight contact info
 */
export interface ContactSummary {
	id: string;
	formattedName: string;
	photoUrl?: string | null;
	primaryEmail?: string | null;
	primaryPhone?: string | null;
	organization?: string | null;
	addressBookId: string;
}
