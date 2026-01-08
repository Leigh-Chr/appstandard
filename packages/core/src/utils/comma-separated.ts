/**
 * Generic utilities for managing comma-separated string lists (tags, categories, resources, etc.)
 */

type ItemObject = { category?: string; resource?: string };

/**
 * Parse a comma-separated string into an array of trimmed items
 * Handles both string format and array of objects (normalized format)
 * @param input - Comma-separated string, array of objects, or undefined
 * @returns Array of trimmed, non-empty items
 */
export function parseList(input: string | undefined | ItemObject[]): string[] {
	if (!input) return [];

	// Handle array of objects (normalized format)
	if (Array.isArray(input)) {
		return input
			.map((item) => item.category || item.resource || "")
			.filter((item) => item.trim().length > 0);
	}

	// Handle string format
	if (typeof input !== "string") return [];

	return input
		.split(",")
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

/**
 * Convert an array of items into a comma-separated string
 * @param items - Array of strings
 * @returns Comma-separated string, or undefined if array is empty
 */
export function stringifyList(items: string[]): string | undefined {
	const filtered = items.filter((item) => item.trim().length > 0);
	return filtered.length > 0 ? filtered.join(", ") : undefined;
}

/**
 * Add a new item to an existing comma-separated string
 * @param currentItems - Current comma-separated string
 * @param newItem - New item to add
 * @returns Updated comma-separated string
 */
export function addToList(
	currentItems: string | undefined,
	newItem: string,
): string | undefined {
	const items = parseList(currentItems);
	const trimmedItem = newItem.trim();
	if (trimmedItem && !items.includes(trimmedItem)) {
		items.push(trimmedItem);
	}
	return stringifyList(items);
}

/**
 * Remove an item from a comma-separated string
 * @param currentItems - Current comma-separated string
 * @param itemToRemove - Item to remove
 * @returns Updated comma-separated string
 */
export function removeFromList(
	currentItems: string | undefined,
	itemToRemove: string,
): string | undefined {
	const items = parseList(currentItems);
	const filtered = items.filter((item) => item.trim() !== itemToRemove.trim());
	return stringifyList(filtered);
}

/**
 * Get the last item from a comma-separated string
 * @param input - Comma-separated string or array of objects
 * @returns The last item or empty string
 */
export function getLastItem(input: string | undefined | ItemObject[]): string {
	if (!input) return "";

	// Handle array of objects (normalized format)
	if (Array.isArray(input)) {
		const items = input
			.map((item) => item.category || item.resource || "")
			.filter((item) => item.trim().length > 0);
		return items.length > 0 ? items[items.length - 1]?.trim() || "" : "";
	}

	// Handle string format
	if (typeof input !== "string") return "";

	const items = input.split(",");
	return items.length > 0 ? items[items.length - 1]?.trim() || "" : "";
}

/**
 * Check if an item exists in a comma-separated string
 */
export function hasItem(
	itemsString: string | undefined,
	item: string,
): boolean {
	const items = parseList(itemsString);
	return items.includes(item.trim());
}

// Named aliases for backwards compatibility and semantic clarity
export {
	parseList as parseTags,
	parseList as parseCategories,
	stringifyList as stringifyTags,
	stringifyList as stringifyCategories,
	addToList as addTag,
	addToList as addCategory,
	removeFromList as removeTag,
	removeFromList as removeCategory,
	getLastItem as getLastTag,
	hasItem as hasTag,
	hasItem as hasCategory,
};
