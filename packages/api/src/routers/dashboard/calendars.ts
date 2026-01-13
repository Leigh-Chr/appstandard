/**
 * Dashboard Calendar Stats
 * Per-calendar statistics
 */

import prisma from "@appstandard/db";
import type { DashboardContext } from "./helpers";

/**
 * Calendar with stats
 */
export interface CalendarWithStats {
	id: string;
	name: string;
	color: string | null;
	eventCount: number;
	eventsThisPeriod: number;
}

/**
 * Get statistics for each calendar
 */
export async function getCalendarStats(
	ctx: DashboardContext,
): Promise<CalendarWithStats[]> {
	const { userCalendars, periodDates } = ctx;

	// Use batched queries instead of Promise.all with individual queries
	// This is more efficient for large numbers of calendars
	const calendarIds = userCalendars.map((c) => c.id);

	// Get event counts per calendar
	const eventCounts = await prisma.event.groupBy({
		by: ["calendarId"],
		where: { calendarId: { in: calendarIds } },
		_count: { id: true },
	});

	// Get events this period per calendar
	const eventsThisPeriod = await prisma.event.groupBy({
		by: ["calendarId"],
		where: {
			calendarId: { in: calendarIds },
			startDate: { lte: periodDates.end },
			endDate: { gte: periodDates.start },
		},
		_count: { id: true },
	});

	// Create lookup maps for O(1) access
	const eventCountMap = new Map(
		eventCounts.map((e) => [e.calendarId, e._count.id]),
	);
	const periodCountMap = new Map(
		eventsThisPeriod.map((e) => [e.calendarId, e._count.id]),
	);

	return userCalendars.map((cal) => ({
		id: cal.id,
		name: cal.name,
		color: cal.color,
		eventCount: eventCountMap.get(cal.id) || 0,
		eventsThisPeriod: periodCountMap.get(cal.id) || 0,
	}));
}
