/**
 * Enhanced duplicate detection for contacts
 *
 * Detection strategy:
 * 1. If both contacts have a UID, compare by UID (strongest identifier)
 * 2. Otherwise, compare by name + email with configurable settings
 */

/** Configuration for duplicate detection */
export interface DuplicateDetectionConfig {
	/** Compare by UID when available (default: true) */
	useUid?: boolean | undefined;
	/** Compare by formatted name (default: true) */
	useName?: boolean | undefined;
	/** Compare by email addresses (default: true) */
	useEmail?: boolean | undefined;
	/** Compare by phone numbers (default: false) */
	usePhone?: boolean | undefined;
}

const DEFAULT_CONFIG: Required<DuplicateDetectionConfig> = {
	useUid: true,
	useName: true,
	useEmail: true,
	usePhone: false,
};

/** Minimal contact interface for duplicate detection */
export interface DuplicateCheckContact {
	id: string;
	uid?: string | null | undefined;
	formattedName: string;
	emails?: Array<{ email: string }> | undefined;
	phones?: Array<{ number: string }> | undefined;
}

/**
 * Normalize a string for comparison
 */
function normalizeString(str: string): string {
	return str.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Generate a comparison key for a contact based on its properties
 * This key is used to group potentially duplicate contacts
 */
function generateContactKey(
	contact: DuplicateCheckContact,
	config: Required<DuplicateDetectionConfig>,
): string {
	// If UID is available and we're using it, it's the primary key
	if (config.useUid && contact.uid) {
		return `uid:${contact.uid}`;
	}

	// Otherwise, create a composite key
	const parts: string[] = [];

	if (config.useName) {
		parts.push(normalizeString(contact.formattedName));
	}

	// Use primary email if available
	if (config.useEmail && contact.emails && contact.emails.length > 0) {
		const primaryEmail = contact.emails[0];
		if (primaryEmail) {
			parts.push(normalizeString(primaryEmail.email));
		}
	}

	return parts.join("|") || `id:${contact.id}`;
}

/**
 * Check if two contacts have any matching emails
 */
function haveMatchingEmails(
	contact1: DuplicateCheckContact,
	contact2: DuplicateCheckContact,
): boolean {
	if (!contact1.emails || !contact2.emails) return false;
	if (contact1.emails.length === 0 || contact2.emails.length === 0)
		return false;

	const emails1 = new Set(contact1.emails.map((e) => normalizeString(e.email)));
	return contact2.emails.some((e) => emails1.has(normalizeString(e.email)));
}

/**
 * Check if two contacts have any matching phone numbers
 */
function haveMatchingPhones(
	contact1: DuplicateCheckContact,
	contact2: DuplicateCheckContact,
): boolean {
	if (!contact1.phones || !contact2.phones) return false;
	if (contact1.phones.length === 0 || contact2.phones.length === 0)
		return false;

	// Normalize phone numbers by removing non-digits
	const normalize = (num: string) => num.replace(/\D/g, "");
	const phones1 = new Set(contact1.phones.map((p) => normalize(p.number)));
	return contact2.phones.some((p) => phones1.has(normalize(p.number)));
}

/**
 * Check if two contacts are duplicates based on the configuration
 */
function areContactsDuplicates(
	contact1: DuplicateCheckContact,
	contact2: DuplicateCheckContact,
	config: DuplicateDetectionConfig = {},
): boolean {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };

	// If both have UIDs and we're using them, compare UIDs directly
	if (mergedConfig.useUid && contact1.uid && contact2.uid) {
		return contact1.uid === contact2.uid;
	}

	// Check name match
	let nameMatch = false;
	if (mergedConfig.useName) {
		const name1 = normalizeString(contact1.formattedName);
		const name2 = normalizeString(contact2.formattedName);
		nameMatch = name1 === name2;
	}

	// Check email match
	let emailMatch = false;
	if (mergedConfig.useEmail) {
		emailMatch = haveMatchingEmails(contact1, contact2);
	}

	// Check phone match
	let phoneMatch = false;
	if (mergedConfig.usePhone) {
		phoneMatch = haveMatchingPhones(contact1, contact2);
	}

	// Consider duplicates if:
	// - Same name AND same email
	// - Same name AND same phone (if phone matching enabled)
	// - Same email (strong match)
	if (
		mergedConfig.useName &&
		mergedConfig.useEmail &&
		nameMatch &&
		emailMatch
	) {
		return true;
	}

	if (
		mergedConfig.useName &&
		mergedConfig.usePhone &&
		nameMatch &&
		phoneMatch
	) {
		return true;
	}

	// If only using name, match on name alone
	if (
		mergedConfig.useName &&
		!mergedConfig.useEmail &&
		!mergedConfig.usePhone
	) {
		return nameMatch;
	}

	// If only using email, match on email alone
	if (mergedConfig.useEmail && !mergedConfig.useName && emailMatch) {
		return true;
	}

	return false;
}

/**
 * Find and remove duplicates from an array of contacts
 * Returns the deduplicated array, keeping the first occurrence
 */
export function deduplicateContacts<T extends DuplicateCheckContact>(
	contacts: T[],
	config: DuplicateDetectionConfig = {},
): { unique: T[]; duplicates: T[] } {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };
	const seen = new Map<string, T>();
	const duplicates: T[] = [];

	for (const contact of contacts) {
		const key = generateContactKey(contact, mergedConfig);

		const existing = seen.get(key);
		if (existing) {
			// Double-check with direct comparison to handle edge cases
			if (areContactsDuplicates(contact, existing, config)) {
				duplicates.push(contact);
				continue;
			}
		}

		seen.set(key, contact);
	}

	return {
		unique: contacts.filter((c) => !duplicates.includes(c)),
		duplicates,
	};
}

/**
 * Find contacts in `newContacts` that are duplicates of contacts in `existingContacts`
 * Returns contacts from `newContacts` that should be skipped
 */
export function findDuplicatesAgainstExisting<T extends DuplicateCheckContact>(
	newContacts: T[],
	existingContacts: DuplicateCheckContact[],
	config: DuplicateDetectionConfig = {},
): { unique: T[]; duplicates: T[] } {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };
	const unique: T[] = [];
	const duplicates: T[] = [];

	// Build lookup for existing contacts
	const existingByKey = new Map<string, DuplicateCheckContact[]>();
	for (const contact of existingContacts) {
		const key = generateContactKey(contact, mergedConfig);
		const existing = existingByKey.get(key) || [];
		existing.push(contact);
		existingByKey.set(key, existing);
	}

	for (const newContact of newContacts) {
		const key = generateContactKey(newContact, mergedConfig);
		const potentialDuplicates = existingByKey.get(key) || [];

		const isDuplicate = potentialDuplicates.some((existing) =>
			areContactsDuplicates(newContact, existing, config),
		);

		if (isDuplicate) {
			duplicates.push(newContact);
		} else {
			unique.push(newContact);
		}
	}

	return { unique, duplicates };
}

/**
 * Get duplicate IDs from an array of contacts
 * Returns IDs of contacts that should be removed (keeping first occurrence)
 */
export function getDuplicateIds(
	contacts: DuplicateCheckContact[],
	config: DuplicateDetectionConfig = {},
): string[] {
	const { duplicates } = deduplicateContacts(contacts, config);
	return duplicates.map((c) => c.id);
}
