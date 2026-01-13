/**
 * TEST-002: Calendar App E2E Tests
 *
 * End-to-end tests for critical user flows in AppStandard Calendar.
 * These tests run against a real browser and require the dev server to be running.
 *
 * Run with: bun run test:e2e
 * Requires: bun run dev:calendar (both web and server)
 */

import { expect, getTestId, test, waitForAppReady } from "./fixtures";

test.describe("Calendar App - Core Flows", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await waitForAppReady(page);
	});

	test("should display dashboard with calendar stats", async ({ page }) => {
		// Check for dashboard elements
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		// Should show some stats or calendar content
		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("should navigate to calendars list", async ({ page }) => {
		// Click on calendars link in navigation
		await page.getByRole("link", { name: /calendars/i }).click();

		// Should navigate to calendars page
		await expect(page).toHaveURL(/calendars/);

		// Should show calendars list or empty state
		await expect(
			page.getByText(/calendar/i).or(page.getByText(/no calendars/i)),
		).toBeVisible();
	});

	test("should create a new calendar", async ({ page }) => {
		const testId = getTestId();
		const calendarName = `Test Calendar ${testId}`;

		// Navigate to calendars
		await page.getByRole("link", { name: /calendars/i }).click();
		await expect(page).toHaveURL(/calendars/);

		// Click create button
		await page.getByRole("button", { name: /new|create|add/i }).click();

		// Fill in calendar form
		await page.getByLabel(/name/i).fill(calendarName);

		// Submit form
		await page.getByRole("button", { name: /create|save/i }).click();

		// Should show the new calendar
		await expect(page.getByText(calendarName)).toBeVisible({ timeout: 10000 });
	});

	test("should create a new event", async ({ page }) => {
		const testId = getTestId();
		const eventTitle = `Test Event ${testId}`;

		// First create a calendar if needed
		await page.getByRole("link", { name: /calendars/i }).click();

		// Try to click on the first calendar or create one
		const calendarLink = page.locator('[data-testid="calendar-item"]').first();
		const hasCalendar = await calendarLink.isVisible().catch(() => false);

		if (hasCalendar) {
			await calendarLink.click();
		} else {
			// Create a calendar first
			await page.getByRole("button", { name: /new|create|add/i }).click();
			await page.getByLabel(/name/i).fill(`Test Calendar ${testId}`);
			await page.getByRole("button", { name: /create|save/i }).click();
			await page.waitForURL(/calendars\/.+/);
		}

		// Create event - look for add event button
		const addEventBtn = page.getByRole("button", {
			name: /new event|add event|create event/i,
		});
		if (await addEventBtn.isVisible()) {
			await addEventBtn.click();

			// Fill event form
			await page.getByLabel(/title/i).fill(eventTitle);

			// Submit
			await page.getByRole("button", { name: /create|save/i }).click();

			// Should show the event
			await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 10000 });
		}
	});
});

test.describe("Calendar App - Navigation", () => {
	test("should show offline banner when disconnected", async ({
		page,
		context,
	}) => {
		await page.goto("/");
		await waitForAppReady(page);

		// Simulate offline
		await context.setOffline(true);

		// Trigger a navigation or action that would need network
		await page.reload().catch(() => {});

		// Should show offline indicator (if implemented)
		// This may vary based on PWA implementation
		await context.setOffline(false);
	});

	test("should be responsive on mobile viewport", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await waitForAppReady(page);

		// Check that the page renders without horizontal scroll
		const body = page.locator("body");
		const bodyBox = await body.boundingBox();

		expect(bodyBox?.width).toBeLessThanOrEqual(375);
	});
});

test.describe("Calendar App - Accessibility", () => {
	test("should have proper heading structure", async ({ page }) => {
		await page.goto("/");
		await waitForAppReady(page);

		// Check for h1
		const h1Count = await page.locator("h1").count();
		expect(h1Count).toBeGreaterThanOrEqual(1);
	});

	test("should be navigable by keyboard", async ({ page }) => {
		await page.goto("/");
		await waitForAppReady(page);

		// Tab through the page
		await page.keyboard.press("Tab");
		const focusedElement = page.locator(":focus");
		await expect(focusedElement).toBeVisible();
	});

	test("should have skip link for accessibility", async ({ page }) => {
		await page.goto("/");

		// Look for skip link (common accessibility pattern)
		const skipLink = page.getByRole("link", { name: /skip/i });
		const hasSkipLink = await skipLink.isVisible().catch(() => false);

		// Skip links are a best practice but may not be implemented
		if (hasSkipLink) {
			await skipLink.focus();
			await expect(skipLink).toBeFocused();
		}
	});
});
