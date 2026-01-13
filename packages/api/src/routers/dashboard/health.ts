/**
 * Dashboard Health Metrics
 * Calendar and event health indicators
 */

import prisma from "@appstandard/db";
import { subMonths } from "date-fns";
import type { DashboardContext } from "./helpers";

/**
 * Health metrics result
 */
export interface HealthResult {
	eventsWithoutTitle: number;
	eventsWithoutDescription: number;
	tentativeEvents: number;
	cancelledEvents: number;
	oldEvents: number;
	emptyCalendars: number;
	potentialDuplicates: number;
	expiredShareLinks: number;
}

/**
 * Get calendar/event health metrics
 */
export async function getHealthMetrics(
	ctx: DashboardContext,
): Promise<HealthResult> {
	const { calendarIds, now } = ctx;
	const sixMonthsAgo = subMonths(now, 6);

	// Run all queries in parallel
	const [
		eventsWithoutTitle,
		eventsWithoutDescription,
		tentativeEvents,
		cancelledEvents,
		oldEvents,
		emptyCalendars,
		potentialDuplicatesResult,
		expiredShareLinks,
	] = await Promise.all([
		// Events without title
		prisma.event.count({
			where: {
				calendarId: { in: calendarIds },
				title: "",
			},
		}),

		// Events without description
		prisma.event.count({
			where: {
				calendarId: { in: calendarIds },
				OR: [{ description: null }, { description: "" }],
			},
		}),

		// Tentative events
		prisma.event.count({
			where: {
				calendarId: { in: calendarIds },
				status: "TENTATIVE",
			},
		}),

		// Cancelled events
		prisma.event.count({
			where: {
				calendarId: { in: calendarIds },
				status: "CANCELLED",
			},
		}),

		// Old events (more than 6 months ago)
		prisma.event.count({
			where: {
				calendarId: { in: calendarIds },
				endDate: { lt: sixMonthsAgo },
			},
		}),

		// Empty calendars
		prisma.calendar.count({
			where: {
				id: { in: calendarIds },
				events: { none: {} },
			},
		}),

		// Potential duplicates (same title + same day)
		prisma.$queryRaw<{ count: bigint }[]>`
			SELECT COUNT(*) as count FROM (
				SELECT e1.id
				FROM event e1
				JOIN event e2 ON e1.id < e2.id
				WHERE e1."calendarId" = ANY(${calendarIds})
				AND e2."calendarId" = ANY(${calendarIds})
				AND e1.title = e2.title
				AND DATE(e1."startDate") = DATE(e2."startDate")
				AND e1.title != ''
				LIMIT 100
			) as duplicates
		`,

		// Expired share links
		prisma.calendarShareLink.count({
			where: {
				calendarId: { in: calendarIds },
				expiresAt: { lt: now },
				isActive: true,
			},
		}),
	]);

	return {
		eventsWithoutTitle,
		eventsWithoutDescription,
		tentativeEvents,
		cancelledEvents,
		oldEvents,
		emptyCalendars,
		potentialDuplicates: Number(potentialDuplicatesResult[0]?.count || 0),
		expiredShareLinks,
	};
}
