/**
 * Core calendar CRUD operations
 * Extracted from calendar.ts for better maintainability
 */

import { ErrorMessages, handlePrismaError } from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { authOrAnonProcedure, router } from "../../index";
import { cleanupCalendarRelations } from "../../lib/cleanup-calendar-relations";
import {
	buildOwnershipFilter,
	createCalendarAtomically,
	getUserUsage,
} from "../../middleware";

export const calendarCoreRouter = router({
	list: authOrAnonProcedure
		.input(
			z
				.object({
					filterGroups: z.array(z.string()).optional(),
					limit: z.number().int().min(1).max(100).optional().default(50),
					cursor: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const limit = input?.limit ?? 50;
			const cursor = input?.cursor;

			// Build where clause with cursor support
			const where: {
				OR: Array<{ userId: string }>;
				id?: { gt: string };
			} = {
				...buildOwnershipFilter(ctx),
			};

			if (cursor) {
				where.id = { gt: cursor };
			}

			// Fetch one extra to determine if there's a next page
			const calendarsRaw = await prisma.calendar.findMany({
				where,
				include: {
					_count: {
						select: { events: true },
					},
				},
				orderBy: {
					updatedAt: "desc",
				},
				take: limit + 1,
			});

			// Filter by groups if specified
			let calendars = calendarsRaw;
			if (input?.filterGroups && input.filterGroups.length > 0) {
				// Get all calendar IDs that belong to the specified groups
				const groupMembers = await prisma.calendarGroupMember.findMany({
					where: {
						groupId: { in: input.filterGroups },
					},
					select: { calendarId: true },
				});

				const calendarIdsInGroups = new Set(
					groupMembers.map((m) => m.calendarId),
				);

				// Filter calendars to only those in the specified groups
				calendars = calendars.filter((cal) => calendarIdsInGroups.has(cal.id));
			}

			// Determine next cursor
			let nextCursor: string | undefined;
			if (calendars.length > limit) {
				const nextItem = calendars.pop();
				nextCursor = nextItem?.id;
			}

			// Update updatedAt for all calendars on list access (for anonymous users only)
			// This prevents cleanup of calendars that are still being accessed
			// Only do this for anonymous users to avoid unnecessary DB writes for authenticated users
			if (ctx.anonymousId && calendars.length > 0) {
				const calendarIds = calendars.map((cal) => cal.id);
				try {
					await prisma.calendar.updateMany({
						where: {
							id: { in: calendarIds },
							userId: ctx.anonymousId,
						},
						data: { updatedAt: new Date() },
					});
				} catch (error) {
					handlePrismaError(error);
				}
			}

			return {
				calendars: calendars.map((cal) => ({
					id: cal.id,
					name: cal.name,
					color: cal.color,
					eventCount: cal._count.events,
					sourceUrl: cal.sourceUrl,
					lastSyncedAt: cal.lastSyncedAt,
					createdAt: cal.createdAt,
					updatedAt: cal.updatedAt,
				})),
				nextCursor,
			};
		}),

	getById: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			// Single query to check existence, ownership, and fetch data
			// Use findUnique first to check existence, then verify ownership
			const calendar = await prisma.calendar.findUnique({
				where: { id: input.id },
				include: {
					events: {
						orderBy: {
							startDate: "asc",
						},
					},
				},
			});

			if (!calendar) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: ErrorMessages.CALENDAR_NOT_FOUND,
				});
			}

			// SECURITY: Orphaned calendars (userId=null) should not be accessible
			if (calendar.userId === null) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: ErrorMessages.CALENDAR_ACCESS_DENIED,
				});
			}

			// Verify ownership in a single check
			const ownershipFilter = buildOwnershipFilter(ctx);
			const hasAccess =
				ownershipFilter.OR?.some(
					(condition) =>
						"userId" in condition && condition.userId === calendar.userId,
				) ?? false;

			if (!hasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: ErrorMessages.CALENDAR_ACCESS_DENIED,
				});
			}

			// Update updatedAt on access to prevent cleanup of actively used calendars
			// This ensures that calendars that are viewed (even if not modified) are not considered orphaned
			// Use updateMany to avoid another query if not needed
			if (ctx.anonymousId) {
				try {
					await prisma.calendar.updateMany({
						where: {
							id: input.id,
							userId: ctx.anonymousId,
						},
						data: { updatedAt: new Date() },
					});
				} catch (error) {
					handlePrismaError(error);
				}
			}

			return calendar;
		}),

	create: authOrAnonProcedure
		.input(
			z.object({
				name: z
					.string()
					.trim()
					.min(1)
					.max(200)
					.transform((val) => val.trim()), // Max length validation with auto-trimming
				color: z
					.string()
					.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color (format: #RRGGBB)")
					.optional()
					.nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// API-003: Use atomic creation to prevent race condition on limit check
			try {
				return await createCalendarAtomically(ctx, {
					name: input.name, // Already trimmed by Zod transform
					color: input.color,
				});
			} catch (error) {
				handlePrismaError(error);
			}
		}),

	update: authOrAnonProcedure
		.input(
			z.object({
				id: z.string(),
				name: z
					.string()
					.trim()
					.min(1)
					.max(200)
					.transform((val) => val.trim())
					.optional(), // Now optional for partial updates
				color: z
					.string()
					.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color (format: #RRGGBB)")
					.optional()
					.nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Single query to check existence and ownership
			const calendar = await prisma.calendar.findUnique({
				where: { id: input.id },
				select: { id: true, userId: true },
			});

			if (!calendar) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: ErrorMessages.CALENDAR_NOT_FOUND,
				});
			}

			// SECURITY: Orphaned calendars (userId=null) should not be accessible
			if (calendar.userId === null) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: ErrorMessages.CALENDAR_ACCESS_DENIED,
				});
			}

			// Verify ownership
			const ownershipFilter = buildOwnershipFilter(ctx);
			const hasAccess =
				ownershipFilter.OR?.some(
					(condition) =>
						"userId" in condition && condition.userId === calendar.userId,
				) ?? false;

			if (!hasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: ErrorMessages.CALENDAR_ACCESS_DENIED,
				});
			}

			const updateData: { name?: string; color?: string | null } = {};
			if (input.name !== undefined) {
				updateData.name = input.name;
			}
			if (input.color !== undefined) {
				updateData.color = input.color;
			}

			let updated: Awaited<ReturnType<typeof prisma.calendar.update>>;
			try {
				updated = await prisma.calendar.update({
					where: { id: input.id },
					data: updateData,
				});

				// DB-006: Propagate name/color changes to all events
				const eventUpdateData: {
					calendarName?: string;
					calendarColor?: string | null;
				} = {};
				if (input.name !== undefined) {
					eventUpdateData.calendarName = input.name;
				}
				if (input.color !== undefined) {
					eventUpdateData.calendarColor = input.color;
				}
				if (Object.keys(eventUpdateData).length > 0) {
					await prisma.event.updateMany({
						where: { calendarId: input.id },
						data: eventUpdateData,
					});
				}
			} catch (error) {
				handlePrismaError(error);
			}

			return updated;
		}),

	delete: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Single query to check existence and ownership
			const calendar = await prisma.calendar.findUnique({
				where: { id: input.id },
				select: { id: true, userId: true },
			});

			if (!calendar) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: ErrorMessages.CALENDAR_NOT_FOUND,
				});
			}

			// SECURITY: Orphaned calendars (userId=null) should not be accessible
			if (calendar.userId === null) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: ErrorMessages.CALENDAR_ACCESS_DENIED,
				});
			}

			// Verify ownership
			const ownershipFilter = buildOwnershipFilter(ctx);
			const hasAccess =
				ownershipFilter.OR?.some(
					(condition) =>
						"userId" in condition && condition.userId === calendar.userId,
				) ?? false;

			if (!hasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: ErrorMessages.CALENDAR_ACCESS_DENIED,
				});
			}

			try {
				// Use transaction to ensure atomicity of cleanup and deletion
				await prisma.$transaction(async (tx) => {
					// Cleanup all relations (CalendarShareLink, ShareBundleCalendar, CalendarGroupMember)
					await cleanupCalendarRelations([input.id], tx);
					// Delete calendar (Events will be deleted via CASCADE)
					await tx.calendar.delete({
						where: { id: input.id },
					});
				});
			} catch (error) {
				handlePrismaError(error);
			}

			return { success: true };
		}),

	/**
	 * Bulk delete multiple calendars
	 */
	bulkDelete: authOrAnonProcedure
		.input(
			z.object({
				calendarIds: z.array(z.string()).min(1).max(100),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Get all calendars and verify they belong to the user
			const calendars = await prisma.calendar.findMany({
				where: {
					id: { in: input.calendarIds },
					...buildOwnershipFilter(ctx),
				},
			});

			if (calendars.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: ErrorMessages.notFound("Calendars"),
				});
			}

			// Get accessible calendar IDs
			const accessibleCalendarIds = calendars.map((c) => c.id);

			// Use transaction to ensure atomicity of cleanup and deletion
			let result: Awaited<ReturnType<typeof prisma.calendar.deleteMany>>;
			try {
				result = await prisma.$transaction(async (tx) => {
					// Cleanup all relations (CalendarShareLink, ShareBundleCalendar, CalendarGroupMember)
					await cleanupCalendarRelations(accessibleCalendarIds, tx);
					// Delete calendars (Events will be deleted via CASCADE)
					return await tx.calendar.deleteMany({
						where: { id: { in: accessibleCalendarIds } },
					});
				});
			} catch (error) {
				handlePrismaError(error);
			}

			return {
				deletedCount: result.count,
				requestedCount: input.calendarIds.length,
			};
		}),

	/**
	 * Get usage statistics for the current user
	 * Returns limits and current usage (useful for anonymous users)
	 */
	getUsage: authOrAnonProcedure.query(async ({ ctx }) => {
		const usage = await getUserUsage(ctx);
		return usage;
	}),
});
