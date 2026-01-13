/**
 * TEST-005: Share and Bundle endpoint unit tests
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
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
		},
		calendarShareLink: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		calendarShareBundle: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		calendarGroup: {
			findFirst: vi.fn(),
		},
	},
}));

// Mock middleware
vi.mock("../../middleware", () => ({
	buildOwnershipFilter: vi.fn((ctx) => ({
		OR: ctx.session?.user?.id
			? [{ userId: ctx.session.user.id }]
			: ctx.anonymousId
				? [{ userId: ctx.anonymousId }]
				: [],
	})),
}));

// Mock logger
vi.mock("../../lib/logger", () => ({
	logger: {
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
	},
}));

// Mock ICS generator
vi.mock("../../lib/ics-generator", () => ({
	generateIcs: vi.fn(() => "BEGIN:VCALENDAR\nEND:VCALENDAR"),
}));

// Mock duplicate detection
vi.mock("../../lib/duplicate-detection", () => ({
	deduplicateEvents: vi.fn((events) => ({ unique: events, duplicates: [] })),
}));

import prisma from "@appstandard/db";
import type { Context } from "../../context";
import { shareRouter } from "../share";

describe("shareRouter", () => {
	const anonymousContext: Context = {
		session: null,
		anonymousId: "anon-test123",
		correlationId: "test-correlation-id",
		userId: "anon-test123",
	} as Context;

	// Authenticated context prepared for future protected route tests
	const _authenticatedContext: Context = {
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

	describe("detectType", () => {
		it("should detect single calendar share link", async () => {
			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "link-1",
				isActive: true,
				expiresAt: null,
			});

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.detectType({ token: "valid-token" });

			expect(result.type).toBe("single");
		});

		it("should detect bundle share", async () => {
			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);
			(
				prisma.calendarShareBundle.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "bundle-1",
				isActive: true,
				expiresAt: null,
			});

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.detectType({ token: "bundle-token" });

			expect(result.type).toBe("bundle");
		});

		it("should return null for disabled share link", async () => {
			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "link-1",
				isActive: false,
				expiresAt: null,
			});

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.detectType({ token: "disabled-token" });

			expect(result.type).toBeNull();
			expect(result.reason).toBe("disabled");
		});

		it("should return null for expired share link", async () => {
			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "link-1",
				isActive: true,
				expiresAt: new Date("2020-01-01"),
			});

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.detectType({ token: "expired-token" });

			expect(result.type).toBeNull();
			expect(result.reason).toBe("expired");
		});

		it("should return not_found for unknown token", async () => {
			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);
			(
				prisma.calendarShareBundle.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.detectType({ token: "unknown-token" });

			expect(result.type).toBeNull();
			expect(result.reason).toBe("not_found");
		});
	});

	describe("create", () => {
		it("should create a share link for owned calendar", async () => {
			const mockCalendar = {
				id: "cal-1",
				name: "Test Calendar",
				userId: "anon-test123",
			};

			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendar,
			);
			(
				prisma.calendarShareLink.count as ReturnType<typeof vi.fn>
			).mockResolvedValue(0);
			(
				prisma.calendarShareLink.create as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "link-1",
				token: "generated-token",
				name: "My Share",
				isActive: true,
				expiresAt: null,
				createdAt: new Date(),
			});

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.create({
				calendarId: "cal-1",
				name: "My Share",
			});

			expect(result.token).toBe("generated-token");
			expect(result.name).toBe("My Share");
			expect(prisma.calendarShareLink.create).toHaveBeenCalled();
		});

		it("should throw NOT_FOUND for non-owned calendar", async () => {
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				null,
			);

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.create({ calendarId: "non-owned-cal" }),
			).rejects.toThrow(TRPCError);
		});

		it("should throw FORBIDDEN when at share link limit", async () => {
			const mockCalendar = {
				id: "cal-1",
				name: "Test Calendar",
				userId: "anon-test123",
			};

			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendar,
			);
			(
				prisma.calendarShareLink.count as ReturnType<typeof vi.fn>
			).mockResolvedValue(10);

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(caller.create({ calendarId: "cal-1" })).rejects.toThrow(
				TRPCError,
			);
		});
	});

	describe("list", () => {
		it("should list share links for owned calendar", async () => {
			const mockCalendar = {
				id: "cal-1",
				name: "Test Calendar",
				userId: "anon-test123",
			};

			const mockLinks = [
				{
					id: "link-1",
					token: "token-1",
					name: "Link 1",
					isActive: true,
					expiresAt: null,
					accessCount: 5,
					lastAccessedAt: new Date(),
					createdAt: new Date(),
				},
			];

			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendar,
			);
			(
				prisma.calendarShareLink.findMany as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockLinks);

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.list({ calendarId: "cal-1" });

			expect(result).toHaveLength(1);
			expect(result[0].token).toBe("token-1");
		});

		it("should throw NOT_FOUND for non-owned calendar", async () => {
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				null,
			);

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.list({ calendarId: "non-owned-cal" }),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("update", () => {
		it("should update share link properties", async () => {
			const mockShareLink = {
				id: "link-1",
				calendarId: "cal-1",
				token: "token-1",
			};
			const mockCalendar = {
				id: "cal-1",
				userId: "anon-test123",
			};

			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockShareLink);
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendar,
			);
			(
				prisma.calendarShareLink.update as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				...mockShareLink,
				name: "Updated Name",
				isActive: false,
				expiresAt: null,
				accessCount: 0,
				lastAccessedAt: null,
				createdAt: new Date(),
			});

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.update({
				id: "link-1",
				name: "Updated Name",
				isActive: false,
			});

			expect(result.name).toBe("Updated Name");
		});

		it("should throw NOT_FOUND for non-existent share link", async () => {
			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.update({ id: "non-existent", name: "Test" }),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("delete", () => {
		it("should delete share link", async () => {
			const mockShareLink = {
				id: "link-1",
				calendarId: "cal-1",
			};
			const mockCalendar = {
				id: "cal-1",
				userId: "anon-test123",
			};

			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockShareLink);
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendar,
			);
			(
				prisma.calendarShareLink.delete as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockShareLink);

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.delete({ id: "link-1" });

			expect(result.success).toBe(true);
			expect(prisma.calendarShareLink.delete).toHaveBeenCalledWith({
				where: { id: "link-1" },
			});
		});
	});

	describe("getByToken", () => {
		it("should return ICS content for valid share token", async () => {
			const mockShareLink = {
				id: "link-1",
				calendarId: "cal-1",
				isActive: true,
				expiresAt: null,
			};
			const mockCalendar = {
				id: "cal-1",
				name: "Test Calendar",
				events: [],
			};

			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockShareLink);
			(
				prisma.calendar.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockCalendar);
			(
				prisma.calendarShareLink.update as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockShareLink);

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.getByToken({ token: "valid-token" });

			expect(result.icsContent).toBeDefined();
			expect(result.calendarName).toBe("Test Calendar");
		});

		it("should throw NOT_FOUND for unknown token", async () => {
			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.getByToken({ token: "unknown-token" }),
			).rejects.toThrow(TRPCError);
		});

		it("should throw FORBIDDEN for disabled share link", async () => {
			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "link-1",
				isActive: false,
			});

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.getByToken({ token: "disabled-token" }),
			).rejects.toThrow(TRPCError);
		});

		it("should throw FORBIDDEN for expired share link", async () => {
			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "link-1",
				isActive: true,
				expiresAt: new Date("2020-01-01"),
			});

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.getByToken({ token: "expired-token" }),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("getInfoByToken", () => {
		it("should return calendar info without ICS content", async () => {
			const mockShareLink = {
				id: "link-1",
				calendarId: "cal-1",
				isActive: true,
				expiresAt: null,
				name: "Share Name",
			};
			const mockCalendar = {
				name: "Test Calendar",
				color: "#3B82F6",
				_count: { events: 10 },
			};

			(
				prisma.calendarShareLink.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockShareLink);
			(
				prisma.calendar.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockCalendar);

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.getInfoByToken({ token: "valid-token" });

			expect(result.calendarName).toBe("Test Calendar");
			expect(result.calendarColor).toBe("#3B82F6");
			expect(result.eventCount).toBe(10);
		});
	});

	describe("bundle.create", () => {
		it("should create bundle from calendar IDs", async () => {
			const mockCalendars = [
				{ id: "cal-1", userId: "anon-test123" },
				{ id: "cal-2", userId: "anon-test123" },
			];

			(prisma.calendar.findMany as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockCalendars) // First call for ownership check
				.mockResolvedValueOnce(mockCalendars.map((c) => ({ id: c.id }))); // Bundle limit check

			(
				prisma.calendarShareBundle.count as ReturnType<typeof vi.fn>
			).mockResolvedValue(0);
			(
				prisma.calendarShareBundle.create as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "bundle-1",
				token: "bundle-token",
				name: "2 calendars - Jan 1, 2024",
				isActive: true,
				expiresAt: null,
				removeDuplicates: false,
				calendars: [{ calendarId: "cal-1" }, { calendarId: "cal-2" }],
				createdAt: new Date(),
			});

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.bundle.create({
				calendarIds: ["cal-1", "cal-2"],
			});

			expect(result.token).toBe("bundle-token");
			expect(result.calendarCount).toBe(2);
		});

		it("should create bundle from group", async () => {
			const mockGroup = {
				id: "group-1",
				userId: "anon-test123",
				calendars: [
					{ calendarId: "cal-1", order: 0 },
					{ calendarId: "cal-2", order: 1 },
				],
			};
			const mockCalendars = [
				{ id: "cal-1", userId: "anon-test123" },
				{ id: "cal-2", userId: "anon-test123" },
			];

			(
				prisma.calendarGroup.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockGroup);
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockCalendars)
				.mockResolvedValueOnce(mockCalendars.map((c) => ({ id: c.id })));
			(
				prisma.calendarShareBundle.count as ReturnType<typeof vi.fn>
			).mockResolvedValue(0);
			(
				prisma.calendarShareBundle.create as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "bundle-1",
				token: "bundle-token",
				name: "Group Bundle",
				isActive: true,
				expiresAt: null,
				removeDuplicates: false,
				calendars: [{ calendarId: "cal-1" }, { calendarId: "cal-2" }],
				createdAt: new Date(),
			});

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.bundle.create({
				groupId: "group-1",
				name: "Group Bundle",
			});

			expect(result.token).toBe("bundle-token");
		});

		it("should throw NOT_FOUND for non-owned calendar", async () => {
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ id: "cal-1" },
			]); // Only 1 found, but 2 requested

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.bundle.create({
					calendarIds: ["cal-1", "cal-2"],
				}),
			).rejects.toThrow(TRPCError);
		});

		it("should throw FORBIDDEN when at bundle limit", async () => {
			const mockCalendars = [{ id: "cal-1", userId: "anon-test123" }];

			(prisma.calendar.findMany as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockCalendars)
				.mockResolvedValueOnce(mockCalendars.map((c) => ({ id: c.id })));
			(
				prisma.calendarShareBundle.count as ReturnType<typeof vi.fn>
			).mockResolvedValue(20); // At limit

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.bundle.create({
					calendarIds: ["cal-1"],
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("bundle.list", () => {
		it("should list bundles for user", async () => {
			const mockCalendars = [{ id: "cal-1" }, { id: "cal-2" }];
			const mockBundles = [
				{
					id: "bundle-1",
					token: "token-1",
					name: "Bundle 1",
					isActive: true,
					expiresAt: null,
					removeDuplicates: false,
					accessCount: 3,
					lastAccessedAt: new Date(),
					createdAt: new Date(),
					calendars: [{ calendarId: "cal-1" }],
				},
			];

			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendars,
			);
			(
				prisma.calendarShareBundle.findMany as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBundles);

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.bundle.list();

			expect(result).toHaveLength(1);
			expect(result[0].token).toBe("token-1");
		});
	});

	describe("bundle.update", () => {
		it("should update bundle properties", async () => {
			const mockBundle = {
				id: "bundle-1",
				calendars: [{ calendarId: "cal-1" }],
			};
			const mockCalendars = [{ id: "cal-1", userId: "anon-test123" }];

			(
				prisma.calendarShareBundle.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBundle);
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendars,
			);
			(
				prisma.calendarShareBundle.update as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "bundle-1",
				token: "token-1",
				name: "Updated Bundle",
				isActive: false,
				expiresAt: null,
				removeDuplicates: true,
				createdAt: new Date(),
			});

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.bundle.update({
				id: "bundle-1",
				name: "Updated Bundle",
				isActive: false,
				removeDuplicates: true,
			});

			expect(result.name).toBe("Updated Bundle");
		});

		it("should throw FORBIDDEN for non-owned bundle", async () => {
			const mockBundle = {
				id: "bundle-1",
				calendars: [{ calendarId: "cal-1" }],
			};

			(
				prisma.calendarShareBundle.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBundle);
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				[],
			); // No owned calendars found

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.bundle.update({
					id: "bundle-1",
					name: "Test",
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("bundle.delete", () => {
		it("should delete bundle", async () => {
			const mockBundle = {
				id: "bundle-1",
				calendars: [{ calendarId: "cal-1" }],
			};
			const mockCalendars = [{ id: "cal-1", userId: "anon-test123" }];

			(
				prisma.calendarShareBundle.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBundle);
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendars,
			);
			(
				prisma.calendarShareBundle.delete as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBundle);

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.bundle.delete({ id: "bundle-1" });

			expect(result.success).toBe(true);
		});
	});

	describe("bundle.getByToken", () => {
		it("should return merged ICS for valid bundle token", async () => {
			const mockBundle = {
				id: "bundle-1",
				name: "Test Bundle",
				isActive: true,
				expiresAt: null,
				removeDuplicates: false,
				calendars: [{ calendarId: "cal-1", order: 0 }],
			};
			const mockCalendars = [
				{
					id: "cal-1",
					name: "Calendar 1",
					events: [
						{
							id: "event-1",
							title: "Event 1",
							startDate: new Date(),
							endDate: new Date(),
							attendees: [],
							alarms: [],
							categories: [],
							resources: [],
							recurrenceDates: [],
						},
					],
				},
			];

			(
				prisma.calendarShareBundle.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBundle);
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendars,
			);
			(
				prisma.calendarShareBundle.update as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBundle);

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.bundle.getByToken({ token: "valid-token" });

			expect(result.icsContent).toBeDefined();
			expect(result.bundleName).toBe("Test Bundle");
			expect(result.eventCount).toBe(1);
		});

		it("should throw NOT_FOUND for unknown bundle token", async () => {
			(
				prisma.calendarShareBundle.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.bundle.getByToken({ token: "unknown-token" }),
			).rejects.toThrow(TRPCError);
		});

		it("should throw FORBIDDEN for disabled bundle", async () => {
			(
				prisma.calendarShareBundle.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "bundle-1",
				isActive: false,
				calendars: [],
			});

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.bundle.getByToken({ token: "disabled-token" }),
			).rejects.toThrow(TRPCError);
		});

		it("should throw FORBIDDEN for expired bundle", async () => {
			(
				prisma.calendarShareBundle.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				id: "bundle-1",
				isActive: true,
				expiresAt: new Date("2020-01-01"),
				calendars: [],
			});

			const caller = shareRouter.createCaller(anonymousContext);

			await expect(
				caller.bundle.getByToken({ token: "expired-token" }),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("bundle.getInfoByToken", () => {
		it("should return bundle info without ICS content", async () => {
			const mockBundle = {
				id: "bundle-1",
				name: "Test Bundle",
				isActive: true,
				expiresAt: null,
				removeDuplicates: false,
				calendars: [{ calendarId: "cal-1", order: 0 }],
			};
			const mockCalendars = [
				{
					id: "cal-1",
					name: "Calendar 1",
					color: "#FF0000",
					_count: { events: 5 },
				},
			];

			(
				prisma.calendarShareBundle.findUnique as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBundle);
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendars,
			);

			const caller = shareRouter.createCaller(anonymousContext);
			const result = await caller.bundle.getInfoByToken({
				token: "valid-token",
			});

			expect(result.bundleName).toBe("Test Bundle");
			expect(result.calendarCount).toBe(1);
			expect(result.totalEvents).toBe(5);
			expect(result.calendars[0].name).toBe("Calendar 1");
		});
	});
});
