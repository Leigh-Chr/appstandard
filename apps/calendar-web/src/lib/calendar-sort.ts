/**
 * Calendar sorting utilities
 * Uses shared entity sorter from @appstandard/react-utils
 */

import {
	createEntitySorter,
	type SortDirection,
} from "@appstandard/react-utils";
import type {
	CalendarSortBy,
	CalendarSortDirection,
} from "@/components/calendar-list/calendar-filters";

export type CalendarForSort = {
	id: string;
	name: string;
	updatedAt?: string | Date | null;
	createdAt?: string | Date | null;
	eventCount: number;
	color?: string | null;
	sourceUrl?: string | null;
	lastSyncedAt?: string | Date | null;
	events?: Array<{
		id: string;
		title: string;
		startDate: string | Date;
	}>;
};

// Create calendar-specific sorter
const calendarSorter = createEntitySorter<CalendarForSort>({
	countField: "eventCount",
});

/**
 * Sort calendars by the specified criteria
 */
export function sortCalendars(
	calendars: CalendarForSort[],
	sortBy: CalendarSortBy,
	sortDirection: CalendarSortDirection,
): CalendarForSort[] {
	// Map CalendarSortBy to generic sort type
	const genericSortBy =
		sortBy === "eventCount"
			? "count"
			: (sortBy as "name" | "updatedAt" | "createdAt");
	return calendarSorter.sort(
		calendars,
		genericSortBy,
		sortDirection as SortDirection,
	);
}

/**
 * Filter calendars by keyword
 */
export function filterCalendarsByKeyword(
	calendars: CalendarForSort[],
	keyword: string,
): CalendarForSort[] {
	return calendarSorter.filterByKeyword(calendars, keyword);
}
