/**
 * Field length limits for AppStandard Contacts validation
 * Shared between frontend and backend
 */
export const FIELD_LIMITS = {
	// Name fields
	FORMATTED_NAME: 255,
	FAMILY_NAME: 100,
	GIVEN_NAME: 100,
	ADDITIONAL_NAME: 100,
	NAME_PREFIX: 50,
	NAME_SUFFIX: 50,
	NICKNAME: 100,

	// Contact info
	EMAIL: 254,
	PHONE: 50,

	// Address fields (RFC 6350)
	PO_BOX: 100,
	EXTENDED_ADDRESS: 200,
	STREET_ADDRESS: 500,
	LOCALITY: 100,
	REGION: 100,
	POSTAL_CODE: 20,
	COUNTRY: 100,

	// Organization
	ORGANIZATION: 255,
	TITLE: 200,
	ROLE: 200,

	// URLs
	URL: 2083,
	PHOTO_URL: 2083,
	UID: 255,

	// Other
	NOTE: 10000,
	TIMEZONE: 100,

	// Categories
	CATEGORY: 100,
	CATEGORIES_STRING: 500,

	// Relations
	RELATION_NAME: 200,

	// IM
	IM_HANDLE: 200,
	IM_SERVICE: 50,

	// Address book
	ADDRESS_BOOK_NAME: 100,
} as const;
