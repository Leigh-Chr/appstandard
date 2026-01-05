/**
 * Core types for vCard data structures
 * Based on RFC 6350 specifications
 * Complete RFC 6350 coverage
 */

// ----- vCard Property Types -----

export type ContactKindValue = "individual" | "group" | "org" | "location";

export type GenderValue = "M" | "F" | "O" | "N" | "U";

export type PhoneTypeValue =
	| "home"
	| "work"
	| "cell"
	| "fax"
	| "voice"
	| "text"
	| "textphone"
	| "video"
	| "pager";

export type EmailTypeValue = "home" | "work";

export type AddressTypeValue = "home" | "work";

export type RelationTypeValue =
	| "contact"
	| "acquaintance"
	| "friend"
	| "met"
	| "co-worker"
	| "colleague"
	| "co-resident"
	| "neighbor"
	| "child"
	| "parent"
	| "sibling"
	| "spouse"
	| "kin"
	| "muse"
	| "crush"
	| "date"
	| "sweetheart"
	| "me"
	| "agent"
	| "emergency";

export type IMServiceValue =
	| "xmpp"
	| "sip"
	| "aim"
	| "icq"
	| "irc"
	| "msn"
	| "skype"
	| "telegram"
	| "whatsapp"
	| "signal"
	| "discord"
	| "slack"
	| "teams"
	| "matrix"
	| "yahoo";

// ----- Parsed vCard Types -----

export interface ParsedEmail {
	email: string;
	type?: EmailTypeValue | string | undefined;
	isPrimary?: boolean | undefined;
}

export interface ParsedPhone {
	number: string;
	type?: PhoneTypeValue | string | undefined;
	isPrimary?: boolean | undefined;
}

export interface ParsedAddress {
	type?: AddressTypeValue | string | undefined;
	poBox?: string | undefined; // RFC 6350 ADR component
	extendedAddress?: string | undefined; // RFC 6350 ADR component
	streetAddress?: string | undefined;
	locality?: string | undefined;
	region?: string | undefined;
	postalCode?: string | undefined;
	country?: string | undefined;
	isPrimary?: boolean | undefined;
}

export interface ParsedIM {
	handle: string;
	service: IMServiceValue | string;
}

export interface ParsedRelation {
	relatedName: string;
	relationType: RelationTypeValue | string;
}

/**
 * Language preference (RFC 6350 Section 6.4.4)
 */
export interface ParsedLanguage {
	tag: string; // BCP 47 language tag
	isPrimary?: boolean | undefined;
}

/**
 * Public key / Certificate (RFC 6350 Section 6.8.1)
 */
export interface ParsedKey {
	uri?: string | undefined; // URI to key
	value?: string | undefined; // Inline key data
	type?: string | undefined; // pgp, x509, ssh
}

/**
 * Calendar URI (RFC 6350 Section 6.9)
 */
export interface ParsedCalendarUri {
	uri: string;
	type?: string | undefined; // home, work
	isPrimary?: boolean | undefined;
}

/**
 * Parsed vCard contact - Complete RFC 6350 coverage
 */
export interface ParsedContact {
	// ----- Required (FN) -----
	formattedName: string;

	// ----- Name components (N - Section 6.2.2) -----
	familyName?: string | undefined;
	givenName?: string | undefined;
	additionalName?: string | undefined;
	namePrefix?: string | undefined;
	nameSuffix?: string | undefined;

	// ----- Identification (Section 6.2) -----
	nickname?: string | undefined; // NICKNAME
	photoUrl?: string | undefined; // PHOTO
	birthday?: Date | undefined; // BDAY
	anniversary?: Date | undefined; // ANNIVERSARY
	gender?: GenderValue | undefined; // GENDER

	// ----- Organization (Section 6.6) -----
	organization?: string | undefined; // ORG
	title?: string | undefined; // TITLE
	role?: string | undefined; // ROLE
	logoUrl?: string | undefined; // LOGO (Section 6.6.3)
	members?: string[] | undefined; // MEMBER (Section 6.6.5)

	// ----- Geography (Section 6.5) -----
	geoLatitude?: number | undefined; // GEO
	geoLongitude?: number | undefined; // GEO
	timezone?: string | undefined; // TZ

	// ----- Communication (Section 6.4) -----
	languages?: ParsedLanguage[] | undefined; // LANG (Section 6.4.4)

	// ----- Additional properties -----
	note?: string | undefined; // NOTE (Section 6.7.2)
	url?: string | undefined; // URL (Section 6.7.8)
	kind?: ContactKindValue | undefined; // KIND (Section 6.1.4)
	soundUrl?: string | undefined; // SOUND (Section 6.7.5)
	sourceUrl?: string | undefined; // SOURCE (Section 6.1.3)

	// ----- Security (Section 6.8) -----
	keys?: ParsedKey[] | undefined; // KEY (Section 6.8.1)

	// ----- Calendar properties (Section 6.9) -----
	fbUrls?: ParsedCalendarUri[] | undefined; // FBURL (Section 6.9.1)
	calAdrUris?: ParsedCalendarUri[] | undefined; // CALADRURI (Section 6.9.2)
	calUris?: ParsedCalendarUri[] | undefined; // CALURI (Section 6.9.3)

	// ----- RFC 6350 Metadata -----
	uid?: string | undefined; // UID (Section 6.7.6)
	revision?: Date | undefined; // REV (Section 6.7.4)
	prodId?: string | undefined; // PRODID (Section 6.7.3)
	clientPidMap?: string | undefined; // CLIENTPIDMAP (Section 6.7.7)
	xml?: string | undefined; // XML (Section 6.1.5)

	// ----- Multi-value properties -----
	emails?: ParsedEmail[] | undefined;
	phones?: ParsedPhone[] | undefined;
	addresses?: ParsedAddress[] | undefined;
	imHandles?: ParsedIM[] | undefined;
	categories?: string[] | undefined;
	relations?: ParsedRelation[] | undefined;
}

// ----- Parser Result -----

export interface ParseResult {
	contacts: ParsedContact[];
	errors: string[];
}

// ----- Generator Types -----

export interface ContactInput {
	// ----- Required -----
	formattedName: string;

	// ----- Name components -----
	familyName?: string;
	givenName?: string;
	additionalName?: string;
	namePrefix?: string;
	nameSuffix?: string;

	// ----- Identification -----
	nickname?: string;
	photoUrl?: string;
	birthday?: Date;
	anniversary?: Date;
	gender?: GenderValue;

	// ----- Organization -----
	organization?: string;
	title?: string;
	role?: string;
	logoUrl?: string;
	members?: string[];

	// ----- Geography -----
	geoLatitude?: number;
	geoLongitude?: number;
	timezone?: string;

	// ----- Communication -----
	languages?: ParsedLanguage[];

	// ----- Additional -----
	note?: string;
	url?: string;
	kind?: ContactKindValue;
	soundUrl?: string;
	sourceUrl?: string;
	uid?: string;

	// ----- Security -----
	keys?: ParsedKey[];

	// ----- Calendar properties -----
	fbUrls?: ParsedCalendarUri[];
	calAdrUris?: ParsedCalendarUri[];
	calUris?: ParsedCalendarUri[];

	// ----- Multi-value properties -----
	emails?: ParsedEmail[];
	phones?: ParsedPhone[];
	addresses?: ParsedAddress[];
	imHandles?: ParsedIM[];
	categories?: string[];
	relations?: ParsedRelation[];
}

export interface GeneratorOptions {
	contacts: ContactInput[];
	prodId?: string;
}
