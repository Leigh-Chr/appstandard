/**
 * Error handler helper functions for Contacts app
 * App-specific error message overrides
 */

import type { ErrorInfo } from "@appstandard/react-utils";

// App-specific error message overrides
export const CONTACTS_ERROR_MESSAGES: Partial<Record<string, ErrorInfo>> = {
	NOT_FOUND: {
		title: "Resource Not Found",
		description:
			"This address book or contact doesn't exist or has been deleted.",
	},
};
