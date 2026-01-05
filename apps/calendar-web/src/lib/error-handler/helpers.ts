/**
 * Error handler helper functions for Calendar app
 * App-specific error message overrides
 */

import type { ErrorInfo } from "@appstandard/react-utils";

// App-specific error message overrides
export const CALENDAR_ERROR_MESSAGES: Partial<Record<string, ErrorInfo>> = {
	NOT_FOUND: {
		title: "Resource Not Found",
		description: "This calendar or event doesn't exist or has been deleted.",
	},
};
