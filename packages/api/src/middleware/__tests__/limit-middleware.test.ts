/**
 * TEST-004: Middleware unit tests for limit checking
 */

import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth first
vi.mock("@appstandard/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn().mockResolvedValue(null),
		},
	},
}));

// Mock Prisma
vi.mock("@appstandard/db", () => ({
	default: {
		calendar: {
			count: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
		},
		event: {
			create: vi.fn(),
		},
		$transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
			fn({
				calendar: {
					count: vi.fn(),
					findFirst: vi.fn(),
					create: vi.fn(),
				},
				event: {
					create: vi.fn(),
				},
			}),
		),
	},
}));

// Mock api-core
vi.mock("@appstandard/api-core", () => ({
	buildOwnershipFilterFromContext: vi.fn((ctx) => ({
		OR: ctx.session?.user?.id
			? [{ userId: ctx.session.user.id }]
			: ctx.anonymousId
				? [{ userId: ctx.anonymousId }]
				: [],
	})),
	isAnonymousUserFromContext: vi.fn(
		(ctx) => !ctx.session?.user?.id && !!ctx.anonymousId,
	),
	isAuthenticatedUserFromContext: vi.fn((ctx) => !!ctx.session?.user?.id),
}));

import prisma from "@appstandard/db";
import type { Context } from "../../context";
import {
	checkCalendarLimit,
	checkEventLimit,
	createCalendarAtomically,
	getUserUsage,
} from "../../middleware";

describe("Limit Middleware", () => {
	const anonymousContext: Context = {
		session: null,
		anonymousId: "anon-test123",
		correlationId: "test-correlation-id",
		userId: "anon-test123",
	} as Context;

	const authenticatedContext: Context = {
		session: {
			user: { id: "user-123" },
		},
		anonymousId: null,
		correlationId: "test-correlation-id",
		userId: "user-123",
	} as unknown as Context;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("checkCalendarLimit", () => {
		it("should allow anonymous user under calendar limit", async () => {
			(prisma.calendar.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);

			await expect(
				checkCalendarLimit(anonymousContext),
			).resolves.toBeUndefined();
		});

		it("should throw for anonymous user at calendar limit", async () => {
			// Anonymous limit is 5 calendars
			(prisma.calendar.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

			await expect(checkCalendarLimit(anonymousContext)).rejects.toThrow(
				TRPCError,
			);
		});

		it("should allow authenticated user with more calendars", async () => {
			// Authenticated users can have up to 150 calendars
			(prisma.calendar.count as ReturnType<typeof vi.fn>).mockResolvedValue(
				100,
			);

			await expect(
				checkCalendarLimit(authenticatedContext),
			).resolves.toBeUndefined();
		});

		it("should throw for authenticated user at limit", async () => {
			(prisma.calendar.count as ReturnType<typeof vi.fn>).mockResolvedValue(
				150,
			);

			await expect(checkCalendarLimit(authenticatedContext)).rejects.toThrow(
				TRPCError,
			);
		});

		it("should do nothing if no userId", async () => {
			const noUserContext: Context = {
				session: null,
				anonymousId: null,
				correlationId: "test",
				userId: null,
			} as unknown as Context;

			await expect(checkCalendarLimit(noUserContext)).resolves.toBeUndefined();
			expect(prisma.calendar.count).not.toHaveBeenCalled();
		});
	});

	describe("checkEventLimit", () => {
		it("should allow adding events under limit", async () => {
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				{
					id: "cal-1",
					userId: "anon-test123",
					_count: { events: 200 },
				},
			);

			await expect(
				checkEventLimit(anonymousContext, "cal-1"),
			).resolves.toBeUndefined();
		});

		it("should throw for anonymous user at event limit", async () => {
			// Anonymous limit is 250 events per calendar
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				{
					id: "cal-1",
					userId: "anon-test123",
					_count: { events: 250 },
				},
			);

			await expect(checkEventLimit(anonymousContext, "cal-1")).rejects.toThrow(
				TRPCError,
			);
		});

		it("should throw NOT_FOUND if calendar doesn't exist", async () => {
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				null,
			);

			await expect(
				checkEventLimit(anonymousContext, "non-existent"),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("createCalendarAtomically", () => {
		it("should throw UNAUTHORIZED if no userId", async () => {
			const noUserContext: Context = {
				session: null,
				anonymousId: null,
				correlationId: "test",
				userId: null,
			} as unknown as Context;

			await expect(
				createCalendarAtomically(noUserContext, { name: "Test" }),
			).rejects.toThrow(TRPCError);
		});

		it("should create calendar when under limit", async () => {
			const mockCreatedCalendar = {
				id: "new-cal",
				name: "Test Calendar",
				color: "#FF0000",
				userId: "anon-test123",
			};

			// Mock transaction behavior
			(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
				async (fn) => {
					const tx = {
						calendar: {
							count: vi.fn().mockResolvedValue(3),
							create: vi.fn().mockResolvedValue(mockCreatedCalendar),
						},
					};
					return fn(tx);
				},
			);

			const result = await createCalendarAtomically(anonymousContext, {
				name: "Test Calendar",
				color: "#FF0000",
			});

			expect(result.name).toBe("Test Calendar");
		});

		it("should throw FORBIDDEN when at limit", async () => {
			(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
				async (fn) => {
					const tx = {
						calendar: {
							count: vi.fn().mockResolvedValue(5), // At anonymous limit
							create: vi.fn(),
						},
					};
					return fn(tx);
				},
			);

			await expect(
				createCalendarAtomically(anonymousContext, { name: "Test" }),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("getUserUsage", () => {
		it("should return null if no userId", async () => {
			const noUserContext: Context = {
				session: null,
				anonymousId: null,
				correlationId: "test",
				userId: null,
			} as unknown as Context;

			const result = await getUserUsage(noUserContext);
			expect(result).toBeNull();
		});

		it("should return usage stats for anonymous user", async () => {
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ id: "cal-1", _count: { events: 50 } },
				{ id: "cal-2", _count: { events: 100 } },
			]);

			const result = await getUserUsage(anonymousContext);

			expect(result).not.toBeNull();
			expect(result?.calendarCount).toBe(2);
			expect(result?.maxCalendars).toBe(5); // Anonymous limit
			expect(result?.eventCounts["cal-1"]).toBe(50);
			expect(result?.eventCounts["cal-2"]).toBe(100);
			expect(result?.isAuthenticated).toBe(false);
		});

		it("should return higher limits for authenticated user", async () => {
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ id: "cal-1", _count: { events: 1000 } },
			]);

			const result = await getUserUsage(authenticatedContext);

			expect(result).not.toBeNull();
			expect(result?.maxCalendars).toBe(150); // Authenticated limit
			expect(result?.maxEventsPerCalendar).toBe(3000); // Authenticated limit
			expect(result?.isAuthenticated).toBe(true);
		});
	});
});
