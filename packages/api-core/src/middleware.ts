/**
 * Shared middleware utilities for access control
 */

import type { Context } from "./context";

/**
 * User limits for anonymous vs authenticated users
 * Anonymous: sufficient to test, encourages account creation
 * Authenticated: generous limits for open source project
 */
export const USER_LIMITS = {
	anonymous: {
		calendars: 5,
		eventsPerCalendar: 250,
		groups: 3,
		calendarsPerGroup: 10,
		// AppStandard Contacts
		addressBooks: 5,
		contactsPerAddressBook: 250,
		addressBooksPerGroup: 10,
		// AppStandard Tasks
		taskLists: 5,
		tasksPerList: 250,
		taskListsPerGroup: 10,
	},
	authenticated: {
		calendars: 150,
		eventsPerCalendar: 3000,
		groups: 100,
		calendarsPerGroup: 30,
		// AppStandard Contacts
		addressBooks: 150,
		contactsPerAddressBook: 3000,
		addressBooksPerGroup: 30,
		// AppStandard Tasks
		taskLists: 150,
		tasksPerList: 3000,
		taskListsPerGroup: 30,
	},
} as const;

/**
 * Get limits for a user based on authentication status
 */
export function getLimitsForUser(isAuthenticated: boolean) {
	return isAuthenticated ? USER_LIMITS.authenticated : USER_LIMITS.anonymous;
}

/**
 * Build ownership filter for Prisma queries (simple version)
 * Returns a filter that matches records owned by the user
 * @deprecated Use buildOwnershipFilterFromContext for Context-aware filtering
 */
export function buildOwnershipFilter(
	userId: string,
	isAuthenticated: boolean,
): { userId: string } | { anonymousId: string } {
	if (isAuthenticated) {
		return { userId };
	}
	return { anonymousId: userId };
}

/**
 * Ownership filter structure for Prisma queries
 */
export interface OwnershipFilter {
	OR: Array<{ userId: string }>;
}

/**
 * Build Prisma where clause for user ownership verification
 * Supports both authenticated and anonymous users via Context
 */
export function buildOwnershipFilterFromContext(ctx: Context): OwnershipFilter {
	return {
		OR: [
			...(ctx.session?.user?.id ? [{ userId: ctx.session.user.id }] : []),
			...(ctx.anonymousId ? [{ userId: ctx.anonymousId }] : []),
		],
	};
}

/**
 * Check if user is anonymous (not authenticated) - simple version
 * @deprecated Use isAnonymousUserFromContext for Context-aware check
 */
export function isAnonymousUser(
	session: { user?: { id?: string } } | null,
): boolean {
	return !session?.user?.id;
}

/**
 * Check if user is anonymous (not authenticated) - Context aware
 */
export function isAnonymousUserFromContext(ctx: Context): boolean {
	return !ctx.session?.user?.id && !!ctx.anonymousId;
}

/**
 * Check if user is authenticated - simple version
 * @deprecated Use isAuthenticatedUserFromContext for Context-aware check
 */
export function isAuthenticatedUser(
	session: { user?: { id?: string } } | null,
): boolean {
	return !!session?.user?.id;
}

/**
 * Check if user is authenticated - Context aware
 */
export function isAuthenticatedUserFromContext(ctx: Context): boolean {
	return !!ctx.session?.user?.id;
}
