/**
 * CODE-005: Standardized error messages for tRPC errors
 * Use these constants instead of hardcoded strings for consistency
 */

// Authentication errors
export const AUTH_REQUIRED = "Authentication required";
export const ACCESS_DENIED = "Access denied";

// Generic resource errors (for app-specific resources like calendars, contacts, tasks)
export const notFound = (resource: string) => `${resource} not found`;
export const accessDenied = (resource: string) =>
	`Access denied to this ${resource.toLowerCase()}`;
export const limitReached = (resource: string, limit: number) =>
	`Limit reached: you can only have ${limit} ${resource.toLowerCase()}s`;

// Calendar-specific errors
export const CALENDAR_NOT_FOUND = "Calendar not found";
export const CALENDAR_ACCESS_DENIED = "Access denied to this calendar";

// Event-specific errors
export const EVENT_NOT_FOUND = "Event not found";
export const EVENT_ACCESS_DENIED = "Access denied to this event";
export const EVENTS_NOT_FOUND = "No events found";
export const EVENTS_ACCESS_DENIED = "You do not have access to these events";
export const EVENT_UID_EXISTS =
	"An event with this UID already exists in this calendar";

// Group-specific errors
export const GROUP_NOT_FOUND = "Group not found";
export const GROUP_ACCESS_DENIED = "Access denied to this group";
export const GROUP_EMPTY = "Group is empty. Add items to the group first.";
export const MEMBER_NOT_FOUND = "Member not found";

// Share link errors
export const SHARE_LINK_NOT_FOUND = "Share link not found";
export const SHARE_LINK_EXPIRED = "This share link has expired";
export const SHARE_LINK_DISABLED = "This share link has been disabled";
export const SHARE_LINK_INVALID = "Share link not found or expired";

// Share bundle errors
export const SHARE_BUNDLE_NOT_FOUND = "Share bundle not found";
export const SHARE_BUNDLE_EXPIRED = "This share bundle has expired";
export const SHARE_BUNDLE_DISABLED = "This share bundle has been disabled";
export const SHARE_BUNDLE_INVALID = "Share bundle not found or expired";
export const SHARE_BUNDLE_UNAVAILABLE = "This bundle is no longer available";
export const SHARE_BUNDLE_UPDATE_DENIED =
	"You do not have permission to update this bundle";
export const SHARE_BUNDLE_DELETE_DENIED =
	"You do not have permission to delete this bundle";

// File/Import errors
export const fileTooLarge = (maxSizeMB: number) =>
	`File too large. Maximum allowed size: ${maxSizeMB}MB`;
export const bundleTooLarge = (actualSizeMB: number, maxSizeMB: number) =>
	`Bundle too large (${actualSizeMB.toFixed(2)}MB). Maximum allowed: ${maxSizeMB}MB. Please select fewer items or remove some.`;
export const parseError = (errors: string[]) =>
	`Unable to parse file: ${errors.join(", ")}`;
export const fetchError = (status: number) =>
	`Unable to retrieve content: ${status}`;

// Limit errors
export const shareLinkLimitReached = (limit: number, resource: string) =>
	`Limit reached: you can only create ${limit} share links per ${resource.toLowerCase()}. Delete an existing link to create a new one.`;
export const bundleLimitReached = (limit: number) =>
	`Limit reached: you can only create ${limit} share bundles. Delete an existing bundle to create a new one.`;

// User errors
export const USER_NOT_FOUND = "User not found";
export const EXPORT_AUTH_REQUIRED =
	"You must be authenticated to export your data";

// Transaction errors
export const TRANSACTION_FAILED = "Transaction failed. Please try again.";

// Validation errors
export const GROUP_OR_ITEMS_REQUIRED =
	"Either groupId or item IDs must be provided";
export const PRIVATE_RESOURCE = "This is private";
export const NO_SOURCE_URL =
	"This resource has no source URL. It cannot be refreshed.";
