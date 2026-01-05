/**
 * Anonymous ID utilities for local storage
 * Provides consistent anonymous user identification across apps
 */

const ANON_ID_LENGTH = 32;

/**
 * Validate anonymous ID format
 */
export function isValidAnonymousId(id: string): boolean {
	const pattern = /^anon-[a-zA-Z0-9_-]{21,64}$/;
	return pattern.test(id);
}

/**
 * Generate a random ID using crypto.randomUUID
 */
function generateRandomId(length: number): string {
	// Use multiple UUIDs to get enough entropy
	let result = "";
	while (result.length < length) {
		result += crypto.randomUUID().replace(/-/g, "");
	}
	return result.slice(0, length);
}

/**
 * Factory function to create getAnonymousId for a specific app
 * @param storageKey - The localStorage key to use (e.g., "appstandard-anonymous-id")
 */
export function createAnonymousIdGetter(storageKey: string) {
	return function getAnonymousId(): string {
		if (typeof window === "undefined") {
			return "";
		}

		let anonymousId = localStorage.getItem(storageKey);

		// Regenerate if invalid format (legacy or tampered)
		if (!anonymousId || !isValidAnonymousId(anonymousId)) {
			anonymousId = `anon-${generateRandomId(ANON_ID_LENGTH)}`;
			localStorage.setItem(storageKey, anonymousId);
		}

		return anonymousId;
	};
}
