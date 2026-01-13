/**
 * Dashboard Insights
 * Recurrence, alarms, collaboration, and event status insights
 */

import prisma from "@appstandard/db";
import { calculatePercentage, type DashboardContext } from "./helpers";

/**
 * Recurrence frequency breakdown
 */
export interface RecurrenceByFrequency {
	daily: number;
	weekly: number;
	monthly: number;
	yearly: number;
}

/**
 * Recurrence insights
 */
export interface RecurrenceInsights {
	totalRecurring: number;
	totalEvents: number;
	percentage: number;
	byFrequency: RecurrenceByFrequency;
}

/**
 * Alarm insights
 */
export interface AlarmInsights {
	eventsWithAlarms: number;
	totalEvents: number;
	percentage: number;
	mostCommonTrigger: string | null;
}

/**
 * RSVP status breakdown
 */
export interface RsvpStatus {
	needsAction: number;
	accepted: number;
	declined: number;
	tentative: number;
}

/**
 * Top contact
 */
export interface TopContact {
	email: string;
	count: number;
}

/**
 * Collaboration insights
 */
export interface CollaborationInsights {
	eventsWithAttendees: number;
	uniqueContacts: number;
	topContacts: TopContact[];
	rsvpStatus: RsvpStatus;
}

/**
 * Event status breakdown
 */
export interface EventStatusInsights {
	confirmed: number;
	tentative: number;
	cancelled: number;
}

/**
 * Complete insights result
 */
export interface InsightsResult {
	recurrence: RecurrenceInsights;
	alarms: AlarmInsights;
	collaboration: CollaborationInsights;
	eventStatus: EventStatusInsights;
}

/**
 * Get all dashboard insights
 */
export async function getInsights(
	ctx: DashboardContext,
): Promise<InsightsResult> {
	const { calendarIds } = ctx;

	// Run all queries in parallel
	const [
		totalEventsCount,
		recurringEvents,
		eventsWithAlarmsCount,
		alarmTriggers,
		eventsWithAttendeesCount,
		topContacts,
		uniqueContacts,
		rsvpStatusCounts,
		statusCounts,
	] = await Promise.all([
		// Total events
		prisma.event.count({
			where: { calendarId: { in: calendarIds } },
		}),

		// Recurring events
		prisma.event.findMany({
			where: {
				calendarId: { in: calendarIds },
				rrule: { not: null },
			},
			select: { rrule: true },
		}),

		// Events with alarms
		prisma.event.count({
			where: {
				calendarId: { in: calendarIds },
				alarms: { some: {} },
			},
		}),

		// Most common alarm trigger
		prisma.eventAlarm.groupBy({
			by: ["trigger"],
			where: {
				event: { calendarId: { in: calendarIds } },
			},
			_count: { trigger: true },
			orderBy: { _count: { trigger: "desc" } },
			take: 1,
		}),

		// Events with attendees
		prisma.event.count({
			where: {
				calendarId: { in: calendarIds },
				attendees: { some: {} },
			},
		}),

		// Top contacts
		prisma.eventAttendee.groupBy({
			by: ["email"],
			where: {
				event: { calendarId: { in: calendarIds } },
			},
			_count: { email: true },
			orderBy: { _count: { email: "desc" } },
			take: 3,
		}),

		// Unique contacts
		prisma.eventAttendee.findMany({
			where: { event: { calendarId: { in: calendarIds } } },
			select: { email: true },
			distinct: ["email"],
		}),

		// RSVP status counts
		prisma.eventAttendee.groupBy({
			by: ["status"],
			where: {
				event: { calendarId: { in: calendarIds } },
				status: { not: null },
			},
			_count: { status: true },
		}),

		// Event status counts
		prisma.event.groupBy({
			by: ["status"],
			where: {
				calendarId: { in: calendarIds },
				status: { not: null },
			},
			_count: { status: true },
		}),
	]);

	// Calculate recurrence by frequency
	const recurrenceByFreq: RecurrenceByFrequency = {
		daily: 0,
		weekly: 0,
		monthly: 0,
		yearly: 0,
	};

	for (const event of recurringEvents) {
		if (event.rrule?.includes("FREQ=DAILY")) recurrenceByFreq.daily++;
		else if (event.rrule?.includes("FREQ=WEEKLY")) recurrenceByFreq.weekly++;
		else if (event.rrule?.includes("FREQ=MONTHLY")) recurrenceByFreq.monthly++;
		else if (event.rrule?.includes("FREQ=YEARLY")) recurrenceByFreq.yearly++;
	}

	// Parse RSVP status
	const rsvpStatus: RsvpStatus = {
		needsAction:
			rsvpStatusCounts.find((s) => s.status === "NEEDS_ACTION")?._count
				.status || 0,
		accepted:
			rsvpStatusCounts.find((s) => s.status === "ACCEPTED")?._count.status || 0,
		declined:
			rsvpStatusCounts.find((s) => s.status === "DECLINED")?._count.status || 0,
		tentative:
			rsvpStatusCounts.find((s) => s.status === "TENTATIVE")?._count.status ||
			0,
	};

	// Parse event status
	const eventStatus: EventStatusInsights = {
		confirmed:
			statusCounts.find((s) => s.status === "CONFIRMED")?._count.status || 0,
		tentative:
			statusCounts.find((s) => s.status === "TENTATIVE")?._count.status || 0,
		cancelled:
			statusCounts.find((s) => s.status === "CANCELLED")?._count.status || 0,
	};

	return {
		recurrence: {
			totalRecurring: recurringEvents.length,
			totalEvents: totalEventsCount,
			percentage: calculatePercentage(recurringEvents.length, totalEventsCount),
			byFrequency: recurrenceByFreq,
		},
		alarms: {
			eventsWithAlarms: eventsWithAlarmsCount,
			totalEvents: totalEventsCount,
			percentage: calculatePercentage(eventsWithAlarmsCount, totalEventsCount),
			mostCommonTrigger: alarmTriggers[0]?.trigger || null,
		},
		collaboration: {
			eventsWithAttendees: eventsWithAttendeesCount,
			uniqueContacts: uniqueContacts.length,
			topContacts: topContacts.map((c) => ({
				email: c.email,
				count: c._count.email,
			})),
			rsvpStatus,
		},
		eventStatus,
	};
}
