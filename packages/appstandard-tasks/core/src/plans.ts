// SPDX-License-Identifier: AGPL-3.0
// Copyright (C) 2024 AppStandard Tasks
/**
 * @appstandard-tasks/core
 * User limits - Both anonymous and authenticated users have limits
 * Authenticated users have generous limits, anonymous users have stricter ones
 */

/**
 * Limits applied to anonymous (non-authenticated) users
 * Sufficient to test the app, but encourages account creation
 * Anonymous data is auto-deleted after 60 days of inactivity
 */
export const ANONYMOUS_LIMITS = {
	taskLists: 5,
	tasksPerList: 250,
	groups: 3,
	taskListsPerGroup: 10,
} as const;

/**
 * Limits applied to authenticated users
 * Generous limits to cover 99.9% of legitimate use cases
 * Open source project - we want to be generous while staying reasonable
 */
export const AUTHENTICATED_LIMITS = {
	taskLists: 150,
	tasksPerList: 3000,
	groups: 100,
	taskListsPerGroup: 30,
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
 * Check if user has reached task list limit
 * Returns true if limit is reached (user cannot create more)
 */
export function hasReachedTaskListLimit(
	isAuth: boolean,
	currentCount: number,
): boolean {
	const limit = isAuth
		? AUTHENTICATED_LIMITS.taskLists
		: ANONYMOUS_LIMITS.taskLists;
	return currentCount >= limit;
}

/**
 * Check if user has reached task limit for a task list
 * Returns true if limit is reached (user cannot create more)
 */
export function hasReachedTaskLimit(
	isAuth: boolean,
	currentCount: number,
): boolean {
	const limit = isAuth
		? AUTHENTICATED_LIMITS.tasksPerList
		: ANONYMOUS_LIMITS.tasksPerList;
	return currentCount >= limit;
}

/**
 * Get the maximum number of task lists for a user
 */
export function getMaxTaskLists(isAuth: boolean): number {
	return isAuth ? AUTHENTICATED_LIMITS.taskLists : ANONYMOUS_LIMITS.taskLists;
}

/**
 * Get the maximum number of tasks per list for a user
 */
export function getMaxTasksPerList(isAuth: boolean): number {
	return isAuth
		? AUTHENTICATED_LIMITS.tasksPerList
		: ANONYMOUS_LIMITS.tasksPerList;
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
 * Get the maximum number of task lists per group for a user
 */
export function getMaxTaskListsPerGroup(isAuth: boolean): number {
	return isAuth
		? AUTHENTICATED_LIMITS.taskListsPerGroup
		: ANONYMOUS_LIMITS.taskListsPerGroup;
}
