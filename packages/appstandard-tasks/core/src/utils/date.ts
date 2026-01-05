/**
 * Date utility functions for AppStandard Tasks
 */

import {
	addDays,
	addHours,
	addMinutes,
	isSameDay as dateFnsIsSameDay,
	startOfDay as dateFnsStartOfDay,
	differenceInMinutes,
	endOfDay,
	format,
	isValid,
	parseISO,
} from "date-fns";

/**
 * Normalize a date to a Date object
 */
function normalizeDate(date: Date | string): Date {
	if (typeof date === "string") {
		return parseISO(date);
	}
	return date;
}

/**
 * Format date for datetime-local input
 */
export function toDateTimeLocal(date: Date | string): string {
	const d = normalizeDate(date);
	return format(d, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Format date for display
 */
export function formatDateShort(date: Date | string): string {
	const d = normalizeDate(date);
	return format(d, "yyyy-MM-dd HH:mm");
}

/**
 * Format due date relative to today
 */
export function formatDueDate(date: Date | string): string {
	const d = normalizeDate(date);
	const today = new Date();

	if (dateFnsIsSameDay(d, today)) {
		return `Today at ${format(d, "HH:mm")}`;
	}

	const tomorrow = addDays(today, 1);
	if (dateFnsIsSameDay(d, tomorrow)) {
		return `Tomorrow at ${format(d, "HH:mm")}`;
	}

	return format(d, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Add days to a date
 */
export function addDaysToDate(date: Date | string, days: number): Date {
	return addDays(normalizeDate(date), days);
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date | string, hours: number): Date {
	return addHours(normalizeDate(date), hours);
}

/**
 * Add minutes to a date
 */
export function addMinutesToDate(date: Date | string, minutes: number): Date {
	return addMinutes(normalizeDate(date), minutes);
}

/**
 * Get duration in minutes between two dates
 */
export function getDurationMinutes(
	start: Date | string,
	end: Date | string,
): number {
	return differenceInMinutes(normalizeDate(end), normalizeDate(start));
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date | string, date2: Date | string): boolean {
	return dateFnsIsSameDay(normalizeDate(date1), normalizeDate(date2));
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string): Date {
	return dateFnsStartOfDay(normalizeDate(date));
}

/**
 * Get end of day
 */
export function endOfDayDate(date: Date | string): Date {
	return endOfDay(normalizeDate(date));
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: Date | string): boolean {
	if (date instanceof Date) {
		return isValid(date);
	}
	const parsed = parseISO(date);
	return isValid(parsed);
}

/**
 * Check if a task is overdue
 */
export function isOverdue(dueDate: Date | string): boolean {
	const due = normalizeDate(dueDate);
	return due < new Date();
}

/**
 * Check if a task is due today
 */
export function isDueToday(dueDate: Date | string): boolean {
	return isSameDay(dueDate, new Date());
}

/**
 * Check if a task is due this week
 */
export function isDueThisWeek(dueDate: Date | string): boolean {
	const due = normalizeDate(dueDate);
	const today = new Date();
	const endOfWeek = addDays(today, 7 - today.getDay());
	return due >= today && due <= endOfWeek;
}
