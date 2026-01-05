/**
 * Name formatting utilities for AppStandard Contacts
 */

/**
 * Build formatted name from name components
 */
export function buildFormattedName(data: {
	givenName?: string | null;
	familyName?: string | null;
	additionalName?: string | null;
	namePrefix?: string | null;
	nameSuffix?: string | null;
}): string {
	const parts: string[] = [];

	if (data.namePrefix?.trim()) {
		parts.push(data.namePrefix.trim());
	}

	if (data.givenName?.trim()) {
		parts.push(data.givenName.trim());
	}

	if (data.additionalName?.trim()) {
		parts.push(data.additionalName.trim());
	}

	if (data.familyName?.trim()) {
		parts.push(data.familyName.trim());
	}

	if (data.nameSuffix?.trim()) {
		parts.push(data.nameSuffix.trim());
	}

	return parts.join(" ") || "Unnamed Contact";
}

/**
 * Parse a formatted name into components (best effort)
 */
export function parseFormattedName(formattedName: string): {
	givenName: string;
	familyName: string;
} {
	const parts = formattedName.trim().split(/\s+/);

	if (parts.length === 0) {
		return { givenName: "", familyName: "" };
	}

	if (parts.length === 1) {
		return { givenName: parts[0] ?? "", familyName: "" };
	}

	// Assume first part is given name, last part is family name
	return {
		givenName: parts[0] ?? "",
		familyName: parts[parts.length - 1] ?? "",
	};
}

/**
 * Get initials from a name
 */
export function getInitials(formattedName: string, maxLength = 2): string {
	const parts = formattedName.trim().split(/\s+/);
	const initials = parts
		.map((part) => part[0]?.toUpperCase() || "")
		.filter((i) => i.length > 0)
		.slice(0, maxLength)
		.join("");

	return initials || "?";
}

/**
 * Get display name (formatted name or fallback)
 */
export function getDisplayName(contact: {
	formattedName?: string | null;
	givenName?: string | null;
	familyName?: string | null;
	organization?: string | null;
	primaryEmail?: string | null;
}): string {
	if (contact.formattedName?.trim()) {
		return contact.formattedName.trim();
	}

	if (contact.givenName || contact.familyName) {
		return [contact.givenName, contact.familyName]
			.filter(Boolean)
			.join(" ")
			.trim();
	}

	if (contact.organization?.trim()) {
		return contact.organization.trim();
	}

	if (contact.primaryEmail?.trim()) {
		return contact.primaryEmail.trim();
	}

	return "Unnamed Contact";
}

/**
 * Sort contacts alphabetically by display name
 */
export function sortContactsByName<T extends { formattedName?: string | null }>(
	contacts: T[],
): T[] {
	return [...contacts].sort((a, b) => {
		const nameA = (a.formattedName || "").toLowerCase();
		const nameB = (b.formattedName || "").toLowerCase();
		return nameA.localeCompare(nameB);
	});
}
