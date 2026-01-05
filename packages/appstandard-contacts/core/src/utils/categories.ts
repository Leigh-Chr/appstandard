/**
 * Category/tag management utilities
 */

/**
 * Parse a comma-separated category string to array
 */
export function parseCategories(input: string | undefined): string[] {
	if (!input) return [];

	return input
		.split(",")
		.map((c) => c.trim())
		.filter((c) => c.length > 0);
}

/**
 * Convert categories array to comma-separated string
 */
export function stringifyCategories(categories: string[]): string | undefined {
	const result = categories.filter((c) => c.length > 0).join(", ");
	return result.length > 0 ? result : undefined;
}

/**
 * Add a category to existing categories
 */
export function addCategory(
	currentCategories: string | undefined,
	newCategory: string,
): string | undefined {
	const categories = parseCategories(currentCategories);
	if (!categories.includes(newCategory.trim())) {
		categories.push(newCategory.trim());
	}
	return stringifyCategories(categories);
}

/**
 * Remove a category from existing categories
 */
export function removeCategory(
	currentCategories: string | undefined,
	categoryToRemove: string,
): string | undefined {
	const categories = parseCategories(currentCategories);
	const filtered = categories.filter((c) => c !== categoryToRemove.trim());
	return stringifyCategories(filtered);
}

/**
 * Check if a category exists
 */
export function hasCategory(
	categoriesString: string | undefined,
	category: string,
): boolean {
	const categories = parseCategories(categoriesString);
	return categories.includes(category.trim());
}
