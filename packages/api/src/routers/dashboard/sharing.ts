/**
 * Dashboard Sharing Metrics
 * Share links, bundles, and group statistics
 */

import prisma from "@appstandard/db";
import { startOfMonth } from "date-fns";
import type { DashboardContext } from "./helpers";

/**
 * Sharing metrics result
 */
export interface SharingResult {
	activeLinks: number;
	linkAccessThisMonth: number;
	activeBundles: number;
	bundleAccessThisMonth: number;
	sharedGroups: number;
	groupMembers: number;
	pendingInvitations: number;
}

/**
 * Get sharing metrics
 */
export async function getSharingMetrics(
	ctx: DashboardContext,
): Promise<SharingResult> {
	const { calendarIds, now, isAuthenticated, authenticatedUserId, userId } =
		ctx;
	const monthStart = startOfMonth(now);

	// Base queries (always run)
	const baseQueries = await Promise.all([
		// Active share links
		prisma.calendarShareLink.count({
			where: {
				calendarId: { in: calendarIds },
				isActive: true,
				OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
			},
		}),

		// Link access this month
		prisma.calendarShareLink.aggregate({
			where: {
				calendarId: { in: calendarIds },
				lastAccessedAt: { gte: monthStart },
			},
			_sum: { accessCount: true },
		}),

		// Active bundles
		prisma.calendarShareBundle.count({
			where: {
				calendars: { some: { calendarId: { in: calendarIds } } },
				isActive: true,
				OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
			},
		}),

		// Bundle access this month
		prisma.calendarShareBundle.aggregate({
			where: {
				calendars: { some: { calendarId: { in: calendarIds } } },
				lastAccessedAt: { gte: monthStart },
			},
			_sum: { accessCount: true },
		}),
	]);

	const [
		activeLinks,
		linkAccessThisMonth,
		activeBundles,
		bundleAccessThisMonth,
	] = baseQueries;

	// Group stats (only for authenticated users)
	let sharedGroups = 0;
	let groupMembers = 0;
	let pendingInvitations = 0;

	if (isAuthenticated && authenticatedUserId) {
		const [sharedGroupsCount, userGroups, pendingInvitationsCount] =
			await Promise.all([
				prisma.calendarGroup.count({
					where: {
						members: {
							some: {
								userId: authenticatedUserId,
								acceptedAt: { not: null },
							},
						},
					},
				}),

				prisma.calendarGroup.findMany({
					where: { userId },
					include: {
						members: { where: { acceptedAt: { not: null } } },
					},
				}),

				prisma.groupMember.count({
					where: {
						userId: authenticatedUserId,
						acceptedAt: null,
					},
				}),
			]);

		sharedGroups = sharedGroupsCount;
		groupMembers = userGroups.reduce((sum, g) => sum + g.members.length, 0);
		pendingInvitations = pendingInvitationsCount;
	}

	return {
		activeLinks,
		linkAccessThisMonth: linkAccessThisMonth._sum.accessCount || 0,
		activeBundles,
		bundleAccessThisMonth: bundleAccessThisMonth._sum.accessCount || 0,
		sharedGroups,
		groupMembers,
		pendingInvitations,
	};
}
