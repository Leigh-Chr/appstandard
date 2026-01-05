// SPDX-License-Identifier: AGPL-3.0
// Copyright (C) 2024 AppStandard Calendar
/**
 * @appstandard/core
 * User limits - Both anonymous and authenticated users have limits
 * Authenticated users have generous limits, anonymous users have stricter ones
 */

/**
 * Limits applied to anonymous (non-authenticated) users
 * Sufficient to test the app, but encourages account creation
 * Anonymous data is auto-deleted after 60 days of inactivity
 */
export const ANONYMOUS_LIMITS = {
	calendars: 5,
	eventsPerCalendar: 250,
	groups: 3,
	calendarsPerGroup: 10,
} as const;

/**
 * Limits applied to authenticated users
 * Generous limits to cover 99.9% of legitimate use cases
 * Open source project - we want to be generous while staying reasonable
 */
export const AUTHENTICATED_LIMITS = {
	calendars: 150,
	eventsPerCalendar: 3000,
	groups: 100,
	calendarsPerGroup: 30,
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
 * Check if user has reached calendar limit
 * Returns true if limit is reached (user cannot create more)
 */
export function hasReachedCalendarLimit(
	isAuth: boolean,
	currentCount: number,
): boolean {
	const limit = isAuth
		? AUTHENTICATED_LIMITS.calendars
		: ANONYMOUS_LIMITS.calendars;
	return currentCount >= limit;
}

/**
 * Check if user has reached event limit for a calendar
 * Returns true if limit is reached (user cannot create more)
 */
export function hasReachedEventLimit(
	isAuth: boolean,
	currentCount: number,
): boolean {
	const limit = isAuth
		? AUTHENTICATED_LIMITS.eventsPerCalendar
		: ANONYMOUS_LIMITS.eventsPerCalendar;
	return currentCount >= limit;
}

/**
 * Get the maximum number of calendars for a user
 */
export function getMaxCalendars(isAuth: boolean): number {
	return isAuth ? AUTHENTICATED_LIMITS.calendars : ANONYMOUS_LIMITS.calendars;
}

/**
 * Get the maximum number of events per calendar for a user
 */
export function getMaxEventsPerCalendar(isAuth: boolean): number {
	return isAuth
		? AUTHENTICATED_LIMITS.eventsPerCalendar
		: ANONYMOUS_LIMITS.eventsPerCalendar;
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
 * Get the maximum number of calendars per group for a user
 */
export function getMaxCalendarsPerGroup(isAuth: boolean): number {
	return isAuth
		? AUTHENTICATED_LIMITS.calendarsPerGroup
		: ANONYMOUS_LIMITS.calendarsPerGroup;
}
