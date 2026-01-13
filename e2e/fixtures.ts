/**
 * TEST-002: Playwright E2E fixtures
 *
 * Shared fixtures and helpers for E2E tests.
 */

import { test as base, expect } from "@playwright/test";

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<{
	/** Anonymous user context - clears storage before each test */
	anonymousPage: import("@playwright/test").Page;
}>({
	anonymousPage: async ({ page, context }, use) => {
		// Clear any existing storage for anonymous testing
		await context.clearCookies();
		await use(page);
	},
});

export { expect };

/**
 * Wait for the app to be fully loaded
 */
export async function waitForAppReady(page: import("@playwright/test").Page) {
	// Wait for React to hydrate
	await page.waitForLoadState("networkidle");
}

/**
 * Get a unique test ID for isolation
 */
export function getTestId(): string {
	return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
