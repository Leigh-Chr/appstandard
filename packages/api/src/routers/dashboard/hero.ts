/**
 * Dashboard Hero Metrics
 * Key metrics displayed at the top of the dashboard
 */

import prisma from "@appstandard/db";
import { endOfDay, startOfDay } from "date-fns";
import {
	type DashboardContext,
	getEventDurationHours,
	roundToOneDecimal,
} from "./helpers";

/**
 * Next event information
 */
export interface NextEvent {
	id: string;
	title: string;
	startDate: Date;
	calendarName: string;
	calendarColor: string | null;
}

/**
 * Hero metrics result
 */
export interface HeroMetrics {
	eventsToday: number;
	eventsPeriod: number;
	eventsPreviousPeriod: number;
	hoursOccupied: number;
	hoursPreviousPeriod: number;
	avgDuration: number;
	nextEvent: NextEvent | null;
	pendingInvitations: number;
}

/**
 * Fetch hero metrics for the dashboard
 * Uses parallel queries for better performance
 */
export async function getHeroMetrics(
	ctx: DashboardContext,
): Promise<HeroMetrics> {
	const { calendarIds, now } = ctx;
	const todayStart = startOfDay(now);
	const todayEnd = endOfDay(now);

	// DB-007: Use shared events data if available, otherwise query
	const sharedEvents = ctx.sharedEvents ?? [];
	const sharedEventsPrev = ctx.sharedEventsPrevPeriod ?? [];

	// Filter OPAQUE events from shared data for duration calculation
	const eventsForDuration = sharedEvents.filter(
		(e) => e.transp === null || e.transp === "OPAQUE",
	);
	const eventsPrevDuration = sharedEventsPrev.filter(
		(e) => e.transp === null || e.transp === "OPAQUE",
	);

	// Run remaining independent queries in parallel
	const [eventsToday, nextEventData, pendingInvitationsCount] =
		await Promise.all([
			// Events today
			prisma.event.count({
				where: {
					calendarId: { in: calendarIds },
					startDate: { lte: todayEnd },
					endDate: { gte: todayStart },
				},
			}),

			// Next event
			prisma.event.findFirst({
				where: {
					calendarId: { in: calendarIds },
					startDate: { gt: now },
				},
				orderBy: { startDate: "asc" },
				include: {
					calendar: { select: { name: true, color: true } },
				},
			}),

			// Pending invitations (NEEDS_ACTION)
			prisma.eventAttendee.count({
				where: {
					event: { calendarId: { in: calendarIds } },
					status: "NEEDS_ACTION",
				},
			}),
		]);

	// Use shared data for period counts (no need for separate queries)
	const eventsPeriod = sharedEvents.length;
	const eventsPreviousPeriod = sharedEventsPrev.length;

	// Calculate hours occupied
	const hoursOccupied = eventsForDuration.reduce(
		(sum, e) => sum + getEventDurationHours(e.startDate, e.endDate),
		0,
	);

	// Average duration
	const avgDuration =
		eventsForDuration.length > 0 ? hoursOccupied / eventsForDuration.length : 0;

	// Hours previous period
	const hoursPreviousPeriod = eventsPrevDuration.reduce(
		(sum, e) => sum + getEventDurationHours(e.startDate, e.endDate),
		0,
	);

	// Format next event
	const nextEvent = nextEventData
		? {
				id: nextEventData.id,
				title: nextEventData.title,
				startDate: nextEventData.startDate,
				calendarName: nextEventData.calendar.name,
				calendarColor: nextEventData.calendar.color,
			}
		: null;

	return {
		eventsToday,
		eventsPeriod,
		eventsPreviousPeriod,
		hoursOccupied: roundToOneDecimal(hoursOccupied),
		hoursPreviousPeriod: roundToOneDecimal(hoursPreviousPeriod),
		avgDuration: roundToOneDecimal(avgDuration),
		nextEvent,
		pendingInvitations: pendingInvitationsCount,
	};
}
