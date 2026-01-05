/**
 * Field length limits for AppStandard Contacts
 * Based on RFC 6350 vCard 4.0
 * Used in validation schemas
 */

export const FIELD_LIMITS = {
	// ----- Name fields (RFC 6350 Section 6.2) -----
	FORMATTED_NAME: 255, // FN
	FAMILY_NAME: 100, // N component
	GIVEN_NAME: 100, // N component
	ADDITIONAL_NAME: 100, // N component
	NAME_PREFIX: 50, // N component
	NAME_SUFFIX: 50, // N component
	NICKNAME: 100, // NICKNAME

	// ----- Contact info (RFC 6350 Section 6.4) -----
	EMAIL: 254, // EMAIL (RFC 5321 max)
	PHONE: 50, // TEL
	IM_HANDLE: 100, // IMPP
	LANG: 35, // LANG (BCP 47 tag)

	// ----- Address fields (RFC 6350 Section 6.3.1) -----
	PO_BOX: 100, // ADR component
	EXTENDED_ADDRESS: 200, // ADR component
	STREET_ADDRESS: 500, // ADR component
	LOCALITY: 100, // ADR component (city)
	REGION: 100, // ADR component (state/province)
	POSTAL_CODE: 20, // ADR component
	COUNTRY: 100, // ADR component

	// ----- Organization (RFC 6350 Section 6.6) -----
	ORGANIZATION: 255, // ORG
	TITLE: 100, // TITLE
	ROLE: 100, // ROLE
	MEMBER: 255, // MEMBER (for KIND:group)

	// ----- URLs and identifiers -----
	URL: 2083, // URL
	PHOTO_URL: 2083, // PHOTO
	LOGO_URL: 2083, // LOGO (RFC 6350 Section 6.6.3)
	SOUND_URL: 2083, // SOUND (RFC 6350 Section 6.7.5)
	SOURCE_URL: 2083, // SOURCE (RFC 6350 Section 6.1.3)
	UID: 255, // UID

	// ----- Calendar properties (RFC 6350 Section 6.9) -----
	FBURL: 2083, // FBURL (free/busy URL)
	CALADRURI: 2083, // CALADRURI (calendar address URI)
	CALURI: 2083, // CALURI (calendar URI)

	// ----- Security (RFC 6350 Section 6.8) -----
	KEY: 10000, // KEY (public key data)

	// ----- Other -----
	NOTE: 10000, // NOTE
	CATEGORY: 100, // Single category
	CATEGORIES_STRING: 500, // CATEGORIES (comma-separated)
	TIMEZONE: 50, // TZ
	XML: 50000, // XML (RFC 6350 Section 6.1.5)

	// ----- Relations (RFC 6350 Section 6.6.6) -----
	RELATED_NAME: 200, // RELATED

	// ----- Sync properties (RFC 6350 Section 6.7.7) -----
	CLIENTPIDMAP: 100, // CLIENTPIDMAP

	// ----- Extensions -----
	COLOR: 7, // #RRGGBB (non-standard)
} as const;

export type FieldLimitKey = keyof typeof FIELD_LIMITS;
