/**
 * Dashboard helper functions
 * Utility functions for date calculations and event processing
 */

import {
	addDays,
	addMonths,
	addWeeks,
	addYears,
	differenceInMinutes,
	endOfDay,
	endOfMonth,
	endOfWeek,
	endOfYear,
	format,
	isToday,
	isTomorrow,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from "date-fns";

/**
 * Period dates for current and previous periods
 */
export interface PeriodDates {
	start: Date;
	end: Date;
	previousStart: Date;
	previousEnd: Date;
}

/**
 * Calculate start/end dates for a given period
 */
export function getPeriodDates(
	period: "today" | "week" | "month" | "year",
	now: Date,
): PeriodDates {
	switch (period) {
		case "today":
			return {
				start: startOfDay(now),
				end: endOfDay(now),
				previousStart: startOfDay(addDays(now, -1)),
				previousEnd: endOfDay(addDays(now, -1)),
			};
		case "week":
			return {
				start: startOfWeek(now, { weekStartsOn: 1 }),
				end: endOfWeek(now, { weekStartsOn: 1 }),
				previousStart: startOfWeek(addWeeks(now, -1), { weekStartsOn: 1 }),
				previousEnd: endOfWeek(addWeeks(now, -1), { weekStartsOn: 1 }),
			};
		case "month":
			return {
				start: startOfMonth(now),
				end: endOfMonth(now),
				previousStart: startOfMonth(addMonths(now, -1)),
				previousEnd: endOfMonth(addMonths(now, -1)),
			};
		case "year":
			return {
				start: startOfYear(now),
				end: endOfYear(now),
				previousStart: startOfYear(addYears(now, -1)),
				previousEnd: endOfYear(addYears(now, -1)),
			};
	}
}

/**
 * Calculate event duration in hours
 */
export function getEventDurationHours(startDate: Date, endDate: Date): number {
	return differenceInMinutes(endDate, startDate) / 60;
}

/**
 * Check if an event is an all-day event
 * All-day events start and end at midnight and span at least 24 hours
 */
export function isAllDayEvent(startDate: Date, endDate: Date): boolean {
	const durationHours = getEventDurationHours(startDate, endDate);
	const startMidnight =
		startDate.getHours() === 0 && startDate.getMinutes() === 0;
	const endMidnight = endDate.getHours() === 0 && endDate.getMinutes() === 0;
	return startMidnight && endMidnight && durationHours >= 24;
}

/**
 * Get human-readable day label for a date
 */
export function getDayLabel(date: Date): string {
	if (isToday(date)) return "Today";
	if (isTomorrow(date)) return "Tomorrow";
	return format(date, "EEEE d MMMM");
}

/**
 * Round a number to one decimal place
 */
export function roundToOneDecimal(value: number): number {
	return Math.round(value * 10) / 10;
}

/**
 * Calculate percentage with safety for division by zero
 */
export function calculatePercentage(
	value: number,
	total: number,
	max = 100,
): number {
	if (total === 0) return 0;
	return Math.min(max, Math.round((value / total) * 100));
}

/**
 * Get hour slot label for heatmap
 */
export function getHourSlot(hour: number): string {
	if (hour < 10) return "08-10";
	if (hour < 12) return "10-12";
	if (hour < 14) return "12-14";
	if (hour < 17) return "14-17";
	return "17-20";
}

/**
 * Available hours based on period type
 */
export function getAvailableHours(period: string): number {
	return period === "today" ? 8 : 40;
}

/**
 * User calendar basic info
 */
export interface UserCalendar {
	id: string;
	name: string;
	color: string | null;
}

/**
 * Shared event data for dashboard queries
 * DB-007: Pre-fetched to avoid duplicate queries across modules
 */
export interface SharedEventData {
	id: string;
	startDate: Date;
	endDate: Date;
	calendarId: string;
	transp: string | null;
	categories: { category: string }[];
}

/**
 * Context for dashboard queries
 */
export interface DashboardContext {
	userId: string;
	calendarIds: string[];
	userCalendars: UserCalendar[];
	now: Date;
	periodDates: PeriodDates;
	period: "today" | "week" | "month" | "year";
	isAuthenticated: boolean;
	authenticatedUserId?: string;
	/** DB-007: Shared events data to avoid duplicate queries */
	sharedEvents?: SharedEventData[];
	sharedEventsPrevPeriod?: SharedEventData[];
}
