/**
 * Dashboard Upcoming Events and Conflicts
 * Handles upcoming events grouping and conflict detection
 */

import prisma from "@appstandard/db";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { type DashboardContext, getDayLabel, isAllDayEvent } from "./helpers";

/**
 * Event in upcoming list
 */
export interface UpcomingEvent {
	id: string;
	title: string;
	startDate: Date;
	endDate: Date;
	isAllDay: boolean;
	calendarId: string;
	calendarName: string;
	calendarColor: string | null;
	location: string | null;
	hasAttendees: boolean;
	attendeeCount: number;
	isRecurring: boolean;
	status: string | null;
	priority: number | null;
	conflictsWith: string[];
}

/**
 * Day group in upcoming list
 */
export interface UpcomingDay {
	date: string;
	dayLabel: string;
	events: UpcomingEvent[];
}

/**
 * Event pair in conflict
 */
export interface Conflict {
	event1: { id: string; title: string; startDate: Date; endDate: Date };
	event2: { id: string; title: string; startDate: Date; endDate: Date };
}

/**
 * Result of upcoming events query
 */
export interface UpcomingResult {
	upcoming: UpcomingDay[];
	conflicts: Conflict[];
}

/**
 * Fetch upcoming events for the next 7 days and detect conflicts
 */
export async function getUpcomingEventsAndConflicts(
	ctx: DashboardContext,
): Promise<UpcomingResult> {
	const { calendarIds, now } = ctx;
	const todayStart = startOfDay(now);
	const upcomingEnd = addDays(now, 7);
	const conflictWindow = addDays(now, 30);

	// Run queries in parallel
	const [upcomingEvents, opaqueEvents] = await Promise.all([
		// Upcoming 7 days events
		prisma.event.findMany({
			where: {
				calendarId: { in: calendarIds },
				startDate: { lte: upcomingEnd },
				endDate: { gte: todayStart },
			},
			select: {
				id: true,
				title: true,
				startDate: true,
				endDate: true,
				location: true,
				rrule: true,
				status: true,
				priority: true,
				calendar: { select: { id: true, name: true, color: true } },
				attendees: { select: { id: true } },
			},
			orderBy: { startDate: "asc" },
		}),

		// Opaque events for conflict detection (next 30 days)
		prisma.event.findMany({
			where: {
				calendarId: { in: calendarIds },
				startDate: { gte: now, lte: conflictWindow },
				OR: [{ transp: null }, { transp: "OPAQUE" }],
			},
			select: { id: true, title: true, startDate: true, endDate: true },
			orderBy: { startDate: "asc" },
		}),
	]);

	// Group events by date
	const eventsByDate = new Map<string, UpcomingDay>();

	for (const event of upcomingEvents) {
		const dateKey = format(event.startDate, "yyyy-MM-dd");
		if (!eventsByDate.has(dateKey)) {
			eventsByDate.set(dateKey, {
				date: dateKey,
				dayLabel: getDayLabel(event.startDate),
				events: [],
			});
		}

		const dayData = eventsByDate.get(dateKey);
		if (!dayData) continue;

		dayData.events.push({
			id: event.id,
			title: event.title,
			startDate: event.startDate,
			endDate: event.endDate,
			isAllDay: isAllDayEvent(event.startDate, event.endDate),
			calendarId: event.calendar.id,
			calendarName: event.calendar.name,
			calendarColor: event.calendar.color,
			location: event.location,
			hasAttendees: event.attendees.length > 0,
			attendeeCount: event.attendees.length,
			isRecurring: !!event.rrule,
			status: event.status,
			priority: event.priority,
			conflictsWith: [], // Will be filled below
		});
	}

	// CODE-007: Use parseISO for safer date parsing
	const upcoming = Array.from(eventsByDate.values()).sort(
		(a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
	);

	// Detect conflicts
	const conflicts: Conflict[] = [];
	const MAX_CONFLICTS = 10;

	for (
		let i = 0;
		i < opaqueEvents.length && conflicts.length < MAX_CONFLICTS;
		i++
	) {
		for (
			let j = i + 1;
			j < opaqueEvents.length && conflicts.length < MAX_CONFLICTS;
			j++
		) {
			const e1 = opaqueEvents[i];
			const e2 = opaqueEvents[j];
			if (!e1 || !e2) continue;

			// Check for overlap: e1.start < e2.end AND e2.start < e1.end
			if (e1.startDate < e2.endDate && e2.startDate < e1.endDate) {
				conflicts.push({ event1: e1, event2: e2 });

				// Update conflictsWith in upcoming events
				for (const day of upcoming) {
					for (const ev of day.events) {
						if (ev.id === e1.id) ev.conflictsWith.push(e2.id);
						if (ev.id === e2.id) ev.conflictsWith.push(e1.id);
					}
				}
			}
		}
	}

	return { upcoming, conflicts };
}
