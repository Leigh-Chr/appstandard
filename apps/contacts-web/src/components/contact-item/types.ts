/**
 * Types for Contact Item components
 */

export interface ContactCategory {
	id?: string;
	category: string;
}

export interface ContactAddress {
	locality?: string | null;
	country?: string | null;
	streetAddress?: string | null;
	postalCode?: string | null;
	region?: string | null;
}

export interface Contact {
	id: string;
	formattedName: string;
	nickname?: string | null;
	title?: string | null;
	role?: string | null;
	organization?: string | null;
	primaryEmail?: string | null;
	primaryPhone?: string | null;
	primaryAddress?: ContactAddress | null;
	birthday?: string | Date | null;
	url?: string | null;
	note?: string | null;
	categories?: ContactCategory[];
	// Counts for secondary info display
	emailCount?: number;
	phoneCount?: number;
	addressCount?: number;
	imHandleCount?: number;
	relationCount?: number;
}

export interface ContactCardProps {
	contact: Contact;
	addressBookId: string;
	addressBookColor?: string | null;
	onEdit: (id: string) => void;
	onDuplicate: (id: string) => void;
	onMove: (id: string) => void;
	onDelete: (id: string, name?: string) => void;
	isDuplicating: boolean;
	/** Selection mode props */
	selectionMode?: boolean;
	isSelected?: boolean;
	onToggleSelect?: (id: string) => void;
}

export interface ContactGridCardProps extends ContactCardProps {}

/** Format contact location string */
export function formatLocation(
	address: ContactAddress | null | undefined,
): string | null {
	if (!address) return null;
	const parts = [address.locality, address.country].filter(Boolean);
	return parts.length > 0 ? parts.join(", ") : null;
}

/** Format contact categories */
export function formatCategories(
	categories: ContactCategory[] | undefined,
): string | null {
	if (!categories || categories.length === 0) return null;
	return categories.map((c) => c.category).join(", ");
}

/** Format contact title/role at organization */
export function formatPosition(contact: Contact): string | null {
	const parts: string[] = [];
	if (contact.title) parts.push(contact.title);
	if (contact.role && contact.role !== contact.title) parts.push(contact.role);
	const position = parts.join(", ");
	if (position && contact.organization)
		return `${position} at ${contact.organization}`;
	return position || contact.organization || null;
}
