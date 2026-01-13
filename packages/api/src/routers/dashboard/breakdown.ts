/**
 * Dashboard Breakdown
 * Category and calendar breakdown analysis
 */

import {
	calculatePercentage,
	type DashboardContext,
	getEventDurationHours,
	roundToOneDecimal,
} from "./helpers";

/**
 * Category breakdown entry
 */
export interface CategoryBreakdown {
	category: string;
	hours: number;
	eventCount: number;
	percentage: number;
}

/**
 * Calendar breakdown entry
 */
export interface CalendarBreakdown {
	calendarId: string;
	calendarName: string;
	calendarColor: string | null;
	hours: number;
	eventCount: number;
	percentage: number;
}

/**
 * Breakdown result
 */
export interface BreakdownResult {
	byCategory: CategoryBreakdown[];
	byCalendar: CalendarBreakdown[];
	hasCategories: boolean;
}

/**
 * Calculate event breakdown by category and calendar
 */
export async function getBreakdown(
	ctx: DashboardContext,
): Promise<BreakdownResult> {
	const { userCalendars } = ctx;

	// DB-007: Use shared events data instead of making a separate query
	const eventsWithCategories = ctx.sharedEvents ?? [];

	// Calculate category breakdown
	const categoryHours = new Map<string, number>();
	const categoryEventCounts = new Map<string, number>();
	let totalCategoryHours = 0;

	// Calculate calendar breakdown
	const calHours = new Map<string, number>();
	const calCounts = new Map<string, number>();
	let totalHours = 0;

	for (const event of eventsWithCategories) {
		const duration = getEventDurationHours(event.startDate, event.endDate);

		// Calendar breakdown
		calHours.set(
			event.calendarId,
			(calHours.get(event.calendarId) || 0) + duration,
		);
		calCounts.set(event.calendarId, (calCounts.get(event.calendarId) || 0) + 1);
		totalHours += duration;

		// Category breakdown
		if (event.categories.length > 0) {
			for (const cat of event.categories) {
				categoryHours.set(
					cat.category,
					(categoryHours.get(cat.category) || 0) + duration,
				);
				categoryEventCounts.set(
					cat.category,
					(categoryEventCounts.get(cat.category) || 0) + 1,
				);
				totalCategoryHours += duration;
			}
		}
	}

	const byCategory = Array.from(categoryHours.entries())
		.map(([category, hours]) => ({
			category,
			hours: roundToOneDecimal(hours),
			eventCount: categoryEventCounts.get(category) || 0,
			percentage: calculatePercentage(hours, totalCategoryHours),
		}))
		.sort((a, b) => b.hours - a.hours);

	const byCalendar = userCalendars
		.map((cal) => ({
			calendarId: cal.id,
			calendarName: cal.name,
			calendarColor: cal.color,
			hours: roundToOneDecimal(calHours.get(cal.id) || 0),
			eventCount: calCounts.get(cal.id) || 0,
			percentage: calculatePercentage(calHours.get(cal.id) || 0, totalHours),
		}))
		.sort((a, b) => b.hours - a.hours);

	return {
		byCategory,
		byCalendar,
		hasCategories: byCategory.length > 0,
	};
}
