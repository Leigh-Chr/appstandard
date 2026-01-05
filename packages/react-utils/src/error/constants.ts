/**
 * Error message constants for tRPC error handling
 */

import type { ErrorInfo } from "./types";

/**
 * Standard error messages for tRPC error codes
 * Note: NOT_FOUND description should be customized per app (calendar/contacts/tasks)
 */
export const ERROR_MESSAGES: Record<string, ErrorInfo> = {
	UNAUTHORIZED: {
		title: "Authentication Required",
		description: "Please sign in to continue.",
	},
	FORBIDDEN: {
		title: "Access Denied",
		description: "You do not have the necessary permissions.",
	},
	NOT_FOUND: {
		title: "Resource Not Found",
		description: "The requested resource doesn't exist or has been deleted.",
	},
	BAD_REQUEST: {
		title: "Invalid Request",
		description: "The provided data is incorrect.",
	},
	INTERNAL_SERVER_ERROR: {
		title: "Server Error",
		description: "An error occurred on the server. Please try again later.",
	},
	TIMEOUT: {
		title: "Timeout",
		description: "The request took too long. Check your connection.",
	},
	NETWORK_ERROR: {
		title: "Network Error",
		description:
			"Unable to contact the server. Check your connection and that the server is running.",
	},
	TOO_MANY_REQUESTS: {
		title: "Too Many Requests",
		description: "Please wait a moment before trying again.",
	},
	CONFLICT: {
		title: "Conflict",
		description: "This action conflicts with existing data.",
	},
	PRECONDITION_FAILED: {
		title: "Precondition Failed",
		description:
			"The resource has been modified. Please refresh and try again.",
	},
	PARSE_ERROR: {
		title: "Parse Error",
		description: "The request could not be parsed. Please check your input.",
	},
	METHOD_NOT_SUPPORTED: {
		title: "Method Not Supported",
		description: "This operation is not supported.",
	},
	PAYLOAD_TOO_LARGE: {
		title: "Payload Too Large",
		description: "The data you're trying to send is too large.",
	},
	UNPROCESSABLE_CONTENT: {
		title: "Unprocessable Content",
		description: "The request was well-formed but contains semantic errors.",
	},
	CLIENT_CLOSED_REQUEST: {
		title: "Request Cancelled",
		description: "The request was cancelled before completion.",
	},
};

/**
 * Patterns to detect network errors from error messages
 */
export const NETWORK_ERROR_PATTERNS = [
	"fetch",
	"network",
	"failed to fetch",
	"connection",
	"offline",
	"dns",
	"econnrefused",
	"enotfound",
];
