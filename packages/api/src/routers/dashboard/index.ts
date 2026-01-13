/**
 * Dashboard Router
 * Provides comprehensive dashboard statistics and insights
 *
 * Refactored from a 900+ line monolithic function into modular components
 * for better maintainability and parallel query execution.
 */

import prisma from "@appstandard/db";
import { z } from "zod";
import { authOrAnonProcedure, router } from "../../index";
import { isAuthenticatedUser } from "../../middleware";
import { getBreakdown } from "./breakdown";
import { getCalendarStats } from "./calendars";
import { getEmptyDashboardState } from "./empty-state";
import { getHealthMetrics } from "./health";
import {
	type DashboardContext,
	getPeriodDates,
	type SharedEventData,
} from "./helpers";
import { getHeroMetrics } from "./hero";
import { getInsights } from "./insights";
import { getSharingMetrics } from "./sharing";
import { getTimeLoad } from "./time-load";
import { getUpcomingEventsAndConflicts } from "./upcoming";

export const dashboardRouter = router({
	getStats: authOrAnonProcedure
		.input(
			z.object({
				period: z.enum(["today", "week", "month", "year"]).default("week"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.userId;
			const now = new Date();
			const periodDates = getPeriodDates(input.period, now);

			// Get user's calendars
			const userCalendars = await prisma.calendar.findMany({
				where: { userId },
				select: {
					id: true,
					name: true,
					color: true,
				},
			});

			const calendarIds = userCalendars.map((c) => c.id);

			// Return empty state for users with no calendars
			if (calendarIds.length === 0) {
				return getEmptyDashboardState(periodDates, input.period);
			}

			// DB-007: Pre-fetch shared events data to avoid duplicate queries
			// Both hero and breakdown need events for the period - fetch once and share
			const [sharedEvents, sharedEventsPrevPeriod] = await Promise.all([
				prisma.event.findMany({
					where: {
						calendarId: { in: calendarIds },
						startDate: { lte: periodDates.end },
						endDate: { gte: periodDates.start },
					},
					select: {
						id: true,
						startDate: true,
						endDate: true,
						calendarId: true,
						transp: true,
						categories: { select: { category: true } },
					},
				}) as Promise<SharedEventData[]>,
				prisma.event.findMany({
					where: {
						calendarId: { in: calendarIds },
						startDate: { lte: periodDates.previousEnd },
						endDate: { gte: periodDates.previousStart },
					},
					select: {
						id: true,
						startDate: true,
						endDate: true,
						calendarId: true,
						transp: true,
						categories: { select: { category: true } },
					},
				}) as Promise<SharedEventData[]>,
			]);

			// Build context for all sub-modules
			const dashboardCtx: DashboardContext = {
				userId,
				calendarIds,
				userCalendars,
				now,
				periodDates,
				period: input.period,
				isAuthenticated: isAuthenticatedUser(ctx),
				authenticatedUserId: ctx.session?.user?.id,
				sharedEvents,
				sharedEventsPrevPeriod,
			};

			// Execute all independent queries in parallel
			const [
				hero,
				upcomingResult,
				breakdown,
				insights,
				calendars,
				health,
				sharing,
			] = await Promise.all([
				getHeroMetrics(dashboardCtx),
				getUpcomingEventsAndConflicts(dashboardCtx),
				getBreakdown(dashboardCtx),
				getInsights(dashboardCtx),
				getCalendarStats(dashboardCtx),
				getHealthMetrics(dashboardCtx),
				getSharingMetrics(dashboardCtx),
			]);

			// Time load depends on hero.hoursOccupied, so we calculate it after
			// Note: We already have hoursOccupied from hero metrics
			const timeLoad = await getTimeLoad(dashboardCtx, hero.hoursOccupied);

			return {
				period: {
					start: periodDates.start,
					end: periodDates.end,
					label: input.period,
				},
				hero,
				upcoming: upcomingResult.upcoming,
				conflicts: upcomingResult.conflicts,
				timeLoad,
				breakdown,
				insights,
				calendars,
				health,
				sharing,
			};
		}),
});
