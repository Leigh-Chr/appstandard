// SPDX-License-Identifier: AGPL-3.0
// Copyright (C) 2024 AppStandard Contacts
/**
 * @appstandard-contacts/core
 * User limits - Both anonymous and authenticated users have limits
 * Authenticated users have generous limits, anonymous users have stricter ones
 */

/**
 * Limits applied to anonymous (non-authenticated) users
 * Sufficient to test the app, but encourages account creation
 * Anonymous data is auto-deleted after 60 days of inactivity
 */
export const ANONYMOUS_LIMITS = {
	addressBooks: 5,
	contactsPerBook: 250,
	groups: 3,
	addressBooksPerGroup: 10,
} as const;

/**
 * Limits applied to authenticated users
 * Generous limits to cover 99.9% of legitimate use cases
 * Open source project - we want to be generous while staying reasonable
 */
export const AUTHENTICATED_LIMITS = {
	addressBooks: 150,
	contactsPerBook: 3000,
	groups: 100,
	addressBooksPerGroup: 30,
} as const;

export type AnonymousLimits = typeof ANONYMOUS_LIMITS;
export type AuthenticatedLimits = typeof AUTHENTICATED_LIMITS;

/**
 * Check if a user is authenticated (has a session)
 */
export function isAuthenticated(
	sessionUserId: string | null | undefined,
): boolean {
	return !!sessionUserId;
}

/**
 * Check if user has reached address book limit
 * Returns true if limit is reached (user cannot create more)
 */
export function hasReachedAddressBookLimit(
	isAuth: boolean,
	currentCount: number,
): boolean {
	const limit = isAuth
		? AUTHENTICATED_LIMITS.addressBooks
		: ANONYMOUS_LIMITS.addressBooks;
	return currentCount >= limit;
}

/**
 * Check if user has reached contact limit for an address book
 * Returns true if limit is reached (user cannot create more)
 */
export function hasReachedContactLimit(
	isAuth: boolean,
	currentCount: number,
): boolean {
	const limit = isAuth
		? AUTHENTICATED_LIMITS.contactsPerBook
		: ANONYMOUS_LIMITS.contactsPerBook;
	return currentCount >= limit;
}

/**
 * Get the maximum number of address books for a user
 */
export function getMaxAddressBooks(isAuth: boolean): number {
	return isAuth
		? AUTHENTICATED_LIMITS.addressBooks
		: ANONYMOUS_LIMITS.addressBooks;
}

/**
 * Get the maximum number of contacts per address book for a user
 */
export function getMaxContactsPerBook(isAuth: boolean): number {
	return isAuth
		? AUTHENTICATED_LIMITS.contactsPerBook
		: ANONYMOUS_LIMITS.contactsPerBook;
}

/**
 * Check if user has reached group limit
 * Returns true if limit is reached (user cannot create more)
 */
export function hasReachedGroupLimit(
	isAuth: boolean,
	currentCount: number,
): boolean {
	const limit = isAuth ? AUTHENTICATED_LIMITS.groups : ANONYMOUS_LIMITS.groups;
	return currentCount >= limit;
}

/**
 * Get the maximum number of groups for a user
 */
export function getMaxGroups(isAuth: boolean): number {
	return isAuth ? AUTHENTICATED_LIMITS.groups : ANONYMOUS_LIMITS.groups;
}

/**
 * Get the maximum number of address books per group for a user
 */
export function getMaxAddressBooksPerGroup(isAuth: boolean): number {
	return isAuth
		? AUTHENTICATED_LIMITS.addressBooksPerGroup
		: ANONYMOUS_LIMITS.addressBooksPerGroup;
}
