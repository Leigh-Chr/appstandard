/**
 * App Badge hook for PWA
 * Sets the app badge count on the app icon (taskbar/dock)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Badging_API
 */

import { useEffect } from "react";

/**
 * Hook to set the app badge count
 * Automatically clears badge on unmount
 *
 * @param count - Number to display on the badge (0 or negative clears it)
 *
 * @example
 * ```tsx
 * // Show overdue tasks count on app icon
 * const overdueCount = tasks.filter(t => isOverdue(t)).length;
 * useBadge(overdueCount);
 * ```
 */
export function useBadge(count: number): void {
	useEffect(() => {
		// Check if Badging API is supported
		if (!("setAppBadge" in navigator)) {
			return;
		}

		const updateBadge = async () => {
			try {
				if (count > 0) {
					await navigator.setAppBadge(count);
				} else {
					await navigator.clearAppBadge();
				}
			} catch {
				// Silently fail - badge API may not be available in all contexts
			}
		};

		updateBadge();

		// Clear badge on unmount
		return () => {
			if ("clearAppBadge" in navigator) {
				navigator.clearAppBadge().catch(() => {
					// Silently fail
				});
			}
		};
	}, [count]);
}

/**
 * Manually set the app badge
 * Useful for one-off badge updates outside of React components
 */
export async function setAppBadge(count: number): Promise<boolean> {
	if (!("setAppBadge" in navigator)) {
		return false;
	}

	try {
		if (count > 0) {
			await navigator.setAppBadge(count);
		} else {
			await navigator.clearAppBadge();
		}
		return true;
	} catch {
		return false;
	}
}

/**
 * Clear the app badge
 */
export async function clearAppBadge(): Promise<boolean> {
	if (!("clearAppBadge" in navigator)) {
		return false;
	}

	try {
		await navigator.clearAppBadge();
		return true;
	} catch {
		return false;
	}
}
