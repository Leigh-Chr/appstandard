/**
 * Local storage utilities for anonymous users
 */

import {
	createAnonymousIdGetter,
	isValidAnonymousId,
} from "@appstandard/react-utils";

const ANONYMOUS_ID_KEY = "appstandard-tasks-anonymous-id";

/**
 * Get or create anonymous user ID for AppStandard Tasks
 */
export const getAnonymousId = createAnonymousIdGetter(ANONYMOUS_ID_KEY);

// Re-export for external use
export { isValidAnonymousId };
