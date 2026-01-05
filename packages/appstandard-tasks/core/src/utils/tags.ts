/**
 * Tag/category management utilities
 */

interface TagObject {
	category?: string;
	name?: string;
}

/**
 * Parse a comma-separated tag string or tag object array to string array
 */
export function parseTags(input: string | TagObject[] | undefined): string[] {
	if (!input) return [];

	if (typeof input === "string") {
		return input
			.split(",")
			.map((t) => t.trim())
			.filter((t) => t.length > 0);
	}

	if (Array.isArray(input)) {
		return input
			.map((t) => t.category || t.name || "")
			.filter((t) => t.length > 0);
	}

	return [];
}

/**
 * Convert tags array to comma-separated string
 */
export function stringifyTags(tags: string[]): string | undefined {
	const result = tags.filter((t) => t.length > 0).join(", ");
	return result.length > 0 ? result : undefined;
}

/**
 * Add a tag to existing tags
 */
export function addTag(
	currentTags: string | undefined,
	newTag: string,
): string | undefined {
	const tags = parseTags(currentTags);
	if (!tags.includes(newTag.trim())) {
		tags.push(newTag.trim());
	}
	return stringifyTags(tags);
}

/**
 * Remove a tag from existing tags
 */
export function removeTag(
	currentTags: string | undefined,
	tagToRemove: string,
): string | undefined {
	const tags = parseTags(currentTags);
	const filtered = tags.filter((t) => t !== tagToRemove.trim());
	return stringifyTags(filtered);
}

/**
 * Check if a tag exists
 */
export function hasTag(tagString: string | undefined, tag: string): boolean {
	const tags = parseTags(tagString);
	return tags.includes(tag.trim());
}

/**
 * Get the last tag from a tag string
 */
export function getLastTag(input: string | TagObject[] | undefined): string {
	const tags = parseTags(input);
	return tags[tags.length - 1] || "";
}
