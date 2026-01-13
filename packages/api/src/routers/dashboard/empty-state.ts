/**
 * Dashboard Empty State
 * Returns default values when user has no calendars
 */

import type { PeriodDates } from "./helpers";

/**
 * Generate empty dashboard response for users with no calendars
 */
export function getEmptyDashboardState(
	periodDates: PeriodDates,
	period: string,
) {
	return {
		period: {
			start: periodDates.start,
			end: periodDates.end,
			label: period,
		},
		hero: {
			eventsToday: 0,
			eventsPeriod: 0,
			eventsPreviousPeriod: 0,
			hoursOccupied: 0,
			hoursPreviousPeriod: 0,
			avgDuration: 0,
			nextEvent: null,
			pendingInvitations: 0,
		},
		upcoming: [],
		conflicts: [],
		timeLoad: {
			hoursOccupied: 0,
			hoursAvailable: 40,
			percentageOccupied: 0,
			heatmap: [],
		},
		breakdown: {
			byCategory: [],
			byCalendar: [],
			hasCategories: false,
		},
		insights: {
			recurrence: {
				totalRecurring: 0,
				totalEvents: 0,
				percentage: 0,
				byFrequency: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
			},
			alarms: {
				eventsWithAlarms: 0,
				totalEvents: 0,
				percentage: 0,
				mostCommonTrigger: null,
			},
			collaboration: {
				eventsWithAttendees: 0,
				uniqueContacts: 0,
				topContacts: [],
				rsvpStatus: {
					needsAction: 0,
					accepted: 0,
					declined: 0,
					tentative: 0,
				},
			},
			eventStatus: {
				confirmed: 0,
				tentative: 0,
				cancelled: 0,
			},
		},
		calendars: [],
		health: {
			eventsWithoutTitle: 0,
			eventsWithoutDescription: 0,
			tentativeEvents: 0,
			cancelledEvents: 0,
			oldEvents: 0,
			emptyCalendars: 0,
			potentialDuplicates: 0,
			expiredShareLinks: 0,
		},
		sharing: {
			activeLinks: 0,
			linkAccessThisMonth: 0,
			activeBundles: 0,
			bundleAccessThisMonth: 0,
			sharedGroups: 0,
			groupMembers: 0,
			pendingInvitations: 0,
		},
	};
}
