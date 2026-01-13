import {
	buildOwnershipFilterFromContext,
	isAnonymousUserFromContext,
	isAuthenticatedUserFromContext,
} from "@appstandard/api-core";
import {
	ANONYMOUS_LIMITS,
	AUTHENTICATED_LIMITS,
	getMaxCalendars,
	getMaxEventsPerCalendar,
	hasReachedCalendarLimit,
	hasReachedEventLimit,
} from "@appstandard/core";
import prisma from "@appstandard/db";
import { TRPCError } from "@trpc/server";
import type { Context } from "./context";

/**
 * CODE-006: Re-exports from api-core for backwards compatibility
 * @deprecated Import directly from '@appstandard/api-core' instead
 * These re-exports will be removed in a future major version
 */
export const buildOwnershipFilter = buildOwnershipFilterFromContext;
/** @deprecated Import from '@appstandard/api-core' instead */
export const isAnonymousUser = isAnonymousUserFromContext;
/** @deprecated Import from '@appstandard/api-core' instead */
export const isAuthenticatedUser = isAuthenticatedUserFromContext;

/**
 * Get error message for calendar limit based on user type
 */
function getCalendarLimitMessage(isAuth: boolean): string {
	if (isAuth) {
		return `Limit reached: you have reached the maximum of ${AUTHENTICATED_LIMITS.calendars} calendars. This generous limit helps keep the service free for everyone.`;
	}
	return `Limit reached: you can create a maximum of ${ANONYMOUS_LIMITS.calendars} calendars in anonymous mode. Create a free account to have up to ${AUTHENTICATED_LIMITS.calendars} calendars.`;
}

/**
 * Get error message for event limit based on user type
 */
function getEventLimitMessage(isAuth: boolean): string {
	if (isAuth) {
		return `Limit reached: you have reached the maximum of ${AUTHENTICATED_LIMITS.eventsPerCalendar} events per calendar. This generous limit helps keep the service free for everyone.`;
	}
	return `Limit reached: you can create a maximum of ${ANONYMOUS_LIMITS.eventsPerCalendar} events per calendar in anonymous mode. Create a free account to have up to ${AUTHENTICATED_LIMITS.eventsPerCalendar} events.`;
}

/**
 * Check calendar limit for user
 * Both authenticated and anonymous users have limits
 * Throws error if limit exceeded
 *
 * WARNING: This function has a TOCTOU race condition.
 * For atomic operations, use createCalendarAtomically instead.
 * @deprecated Use createCalendarAtomically for new code
 */
export async function checkCalendarLimit(ctx: Context): Promise<void> {
	const isAuth = isAuthenticatedUser(ctx);
	const userId = isAuth ? ctx.session?.user?.id : ctx.anonymousId;

	if (!userId) return;

	const calendarCount = await prisma.calendar.count({
		where: { userId },
	});

	if (hasReachedCalendarLimit(isAuth, calendarCount)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: getCalendarLimitMessage(isAuth),
		});
	}
}

/**
 * SECURITY: Atomically create a calendar with limit checking
 * Uses Prisma transaction to prevent race condition bypasses
 */
export async function createCalendarAtomically(
	ctx: Context,
	data: { name: string; color?: string | null; sourceUrl?: string },
): Promise<Awaited<ReturnType<typeof prisma.calendar.create>>> {
	const isAuth = isAuthenticatedUser(ctx);
	const userId = ctx.session?.user?.id || ctx.anonymousId;

	if (!userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}

	const maxCalendars = getMaxCalendars(isAuth);

	// Use interactive transaction for atomicity
	return prisma.$transaction(async (tx) => {
		// Count within transaction
		const calendarCount = await tx.calendar.count({
			where: { userId },
		});

		if (calendarCount >= maxCalendars) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: getCalendarLimitMessage(isAuth),
			});
		}

		// Create within same transaction
		return tx.calendar.create({
			data: {
				name: data.name,
				color: data.color || null,
				sourceUrl: data.sourceUrl,
				userId,
			},
		});
	});
}

/**
 * SECURITY: Atomically create an event with limit checking
 * Uses Prisma transaction to prevent race condition bypasses
 */
export async function createEventAtomically(
	ctx: Context,
	calendarId: string,
	eventData: Parameters<typeof prisma.event.create>[0]["data"],
): Promise<Awaited<ReturnType<typeof prisma.event.create>>> {
	const isAuth = isAuthenticatedUser(ctx);
	const userId = ctx.session?.user?.id || ctx.anonymousId;

	if (!userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}

	const maxEvents = getMaxEventsPerCalendar(isAuth);

	// Use interactive transaction for atomicity
	return prisma.$transaction(async (tx) => {
		// Verify ownership and get event count
		const calendar = await tx.calendar.findFirst({
			where: {
				id: calendarId,
				userId,
			},
			include: {
				_count: {
					select: { events: true },
				},
			},
		});

		if (!calendar) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Calendar not found",
			});
		}

		if (calendar._count.events >= maxEvents) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: getEventLimitMessage(isAuth),
			});
		}

		// Create within same transaction
		return tx.event.create({
			data: eventData,
		});
	});
}

/**
 * Check event limit for user in a calendar
 * Both authenticated and anonymous users have limits
 * Throws error if limit exceeded
 */
export async function checkEventLimit(
	ctx: Context,
	calendarId: string,
): Promise<void> {
	const isAuth = isAuthenticatedUser(ctx);
	const userId = isAuth ? ctx.session?.user?.id : ctx.anonymousId;

	if (!userId) return;

	// Verify calendar belongs to user and get event count
	const calendar = await prisma.calendar.findFirst({
		where: {
			id: calendarId,
			userId,
		},
		include: {
			_count: {
				select: { events: true },
			},
		},
	});

	if (!calendar) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Calendar not found",
		});
	}

	if (hasReachedEventLimit(isAuth, calendar._count.events)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: getEventLimitMessage(isAuth),
		});
	}
}

/**
 * Get current usage stats for user (authenticated or anonymous)
 */
export async function getUserUsage(ctx: Context): Promise<{
	calendarCount: number;
	maxCalendars: number;
	eventCounts: Record<string, number>;
	maxEventsPerCalendar: number;
	isAuthenticated: boolean;
} | null> {
	const userId = ctx.session?.user?.id || ctx.anonymousId;
	if (!userId) {
		return null;
	}

	const isAuth = isAuthenticatedUser(ctx);

	const calendars = await prisma.calendar.findMany({
		where: { userId },
		include: {
			_count: {
				select: { events: true },
			},
		},
	});

	const eventCounts: Record<string, number> = {};
	for (const cal of calendars) {
		eventCounts[cal.id] = cal._count.events;
	}

	return {
		calendarCount: calendars.length,
		maxCalendars: getMaxCalendars(isAuth),
		eventCounts,
		maxEventsPerCalendar: getMaxEventsPerCalendar(isAuth),
		isAuthenticated: isAuth,
	};
}

/**
 * Verify calendar access with optimized single query
 * Returns the calendar if access is granted, throws TRPCError otherwise
 *
 * Access is granted if:
 * 1. User is the owner of the calendar (original owner)
 * 2. User is a member of a shared group that contains this calendar (authenticated users only)
 */
export async function verifyCalendarAccess(
	calendarId: string,
	ctx: Context,
): Promise<{ id: string; userId: string | null }> {
	const calendar = await prisma.calendar.findUnique({
		where: { id: calendarId },
		select: { id: true, userId: true },
	});

	if (!calendar) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Calendar not found",
		});
	}

	// SECURITY: Orphaned calendars (userId=null) should not be accessible to anyone
	// This prevents unauthorized access to orphaned data
	if (calendar.userId === null) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Access denied to this calendar",
		});
	}

	// 1. Verify ownership (original behavior)
	const ownershipFilter = buildOwnershipFilter(ctx);
	const isOwner =
		ownershipFilter.OR?.some(
			(condition) =>
				"userId" in condition && condition.userId === calendar.userId,
		) ?? false;

	if (isOwner) {
		return calendar;
	}

	// 2. Check if calendar is in a shared group where user is a member (authenticated users only)
	if (ctx.session?.user?.id) {
		const groupMember = await prisma.calendarGroupMember.findFirst({
			where: {
				calendarId,
				group: {
					members: {
						some: {
							userId: ctx.session.user.id,
							acceptedAt: { not: null }, // Only accepted invitations
						},
					},
				},
			},
			select: {
				groupId: true,
			},
		});

		if (groupMember) {
			// User has access via group membership
			return calendar;
		}
	}

	// No access
	throw new TRPCError({
		code: "FORBIDDEN",
		message: "Access denied to this calendar",
	});
}
