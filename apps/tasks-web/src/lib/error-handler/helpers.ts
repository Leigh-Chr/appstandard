/**
 * Error handler helper functions for Tasks app
 * App-specific error message overrides
 */

import type { ErrorInfo } from "@appstandard/react-utils";

// App-specific error message overrides
export const TASKS_ERROR_MESSAGES: Partial<Record<string, ErrorInfo>> = {
	NOT_FOUND: {
		title: "Resource Not Found",
		description: "This task list or task doesn't exist or has been deleted.",
	},
};
