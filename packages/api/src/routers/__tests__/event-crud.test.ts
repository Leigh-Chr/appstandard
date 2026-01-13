/**
 * TEST-003: Event CRUD unit tests
 */

import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth first to prevent better-auth-harmony/validator from loading
vi.mock("@appstandard/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn().mockResolvedValue(null),
		},
	},
}));

// Mock Prisma (must be before importing from @appstandard/db)
vi.mock("@appstandard/db", () => ({
	default: {
		calendar: {
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			findUniqueOrThrow: vi.fn(),
		},
		event: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			updateMany: vi.fn(),
			count: vi.fn(),
		},
		eventAttendee: {
			findMany: vi.fn(),
			deleteMany: vi.fn(),
		},
		eventAlarm: {
			findMany: vi.fn(),
			deleteMany: vi.fn(),
		},
		eventCategory: {
			findMany: vi.fn(),
			deleteMany: vi.fn(),
		},
		eventResource: {
			findMany: vi.fn(),
			deleteMany: vi.fn(),
		},
		recurrenceDate: {
			findMany: vi.fn(),
			deleteMany: vi.fn(),
		},
		$queryRaw: vi.fn(),
		$transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
			fn({
				event: {
					update: vi.fn(),
				},
				eventAttendee: { deleteMany: vi.fn() },
				eventAlarm: { deleteMany: vi.fn() },
				eventCategory: { deleteMany: vi.fn() },
				eventResource: { deleteMany: vi.fn() },
				recurrenceDate: { deleteMany: vi.fn() },
			}),
		),
	},
	Prisma: {
		sql: vi.fn(),
		empty: "",
	},
}));

import prisma from "@appstandard/db";
import type { Context } from "../../context";
import { eventRouter } from "../event";

// Mock middleware
vi.mock("../../middleware", () => ({
	checkEventLimit: vi.fn(),
	verifyCalendarAccess: vi.fn(),
}));

// Mock event access module
vi.mock("../event/access", () => ({
	verifyCalendarAccess: vi.fn(),
	verifyCalendarAccessForList: vi.fn(),
	verifyEventAccess: vi.fn(),
}));

// Mock event validation module
vi.mock("../event/validation", () => ({
	validateUidChange: vi.fn(),
	validateRelatedToChange: vi.fn(),
}));

// Mock event updates module
vi.mock("../event/updates", () => ({
	updateEventAttendees: vi.fn(),
	updateEventAlarms: vi.fn(),
	updateEventCategories: vi.fn(),
	updateEventResources: vi.fn(),
	updateEventRecurrenceDates: vi.fn(),
}));

describe("eventRouter", () => {
	const mockContext: Context = {
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

	describe("list", () => {
		it("should return events for a calendar", async () => {
			const mockEvents = [
				{
					id: "event-1",
					calendarId: "cal-1",
					title: "Test Event",
					startDate: new Date("2024-01-15T10:00:00Z"),
					endDate: new Date("2024-01-15T11:00:00Z"),
					description: null,
					location: null,
					status: "CONFIRMED",
					attendees: [],
					alarms: [],
					categories: [],
					resources: [],
				},
			];

			(prisma.event.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockEvents,
			);

			const caller = eventRouter.createCaller(mockContext);
			const result = await caller.list({ calendarId: "cal-1" });

			expect(result.events).toHaveLength(1);
			expect(result.events[0].title).toBe("Test Event");
		});

		it("should support date filtering", async () => {
			(prisma.event.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const caller = eventRouter.createCaller(mockContext);
			await caller.list({
				calendarId: "cal-1",
				filterDateFrom: new Date("2024-01-01"),
				filterDateTo: new Date("2024-12-31"),
			});

			expect(prisma.event.findMany).toHaveBeenCalled();
		});

		it("should support keyword filtering", async () => {
			(prisma.event.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const caller = eventRouter.createCaller(mockContext);
			await caller.list({
				calendarId: "cal-1",
				filterKeyword: "meeting",
			});

			expect(prisma.event.findMany).toHaveBeenCalled();
		});

		it("should support pagination", async () => {
			const mockEvents = [
				{
					id: "event-1",
					calendarId: "cal-1",
					title: "Event 1",
					startDate: new Date(),
					endDate: new Date(),
					attendees: [],
					alarms: [],
					categories: [],
					resources: [],
				},
				{
					id: "event-2",
					calendarId: "cal-1",
					title: "Event 2",
					startDate: new Date(),
					endDate: new Date(),
					attendees: [],
					alarms: [],
					categories: [],
					resources: [],
				},
			];

			(prisma.event.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockEvents,
			);

			const caller = eventRouter.createCaller(mockContext);
			const result = await caller.list({
				calendarId: "cal-1",
				limit: 10,
				cursor: "event-0",
			});

			expect(result.events).toHaveLength(2);
		});
	});

	describe("getById", () => {
		it("should return event by ID", async () => {
			const mockEvent = {
				id: "event-1",
				calendarId: "cal-1",
				title: "Test Event",
				startDate: new Date(),
				endDate: new Date(),
				calendar: { id: "cal-1", userId: "anon-test123" },
				attendees: [],
				alarms: [],
				categories: [],
				resources: [],
				recurrenceDates: [],
			};

			(prisma.event.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockEvent,
			);
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				{
					id: "cal-1",
					userId: "anon-test123",
				},
			);

			const caller = eventRouter.createCaller(mockContext);
			const result = await caller.getById({ id: "event-1" });

			expect(result.title).toBe("Test Event");
		});

		it("should throw NOT_FOUND for non-existent event", async () => {
			(prisma.event.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				null,
			);

			const caller = eventRouter.createCaller(mockContext);

			await expect(caller.getById({ id: "non-existent" })).rejects.toThrow(
				TRPCError,
			);
		});
	});

	describe("create", () => {
		it("should create a new event", async () => {
			const mockCalendar = {
				id: "cal-1",
				name: "Test Calendar",
				color: "#FF0000",
				userId: "anon-test123",
			};

			const mockCreatedEvent = {
				id: "new-event-1",
				calendarId: "cal-1",
				title: "New Event",
				startDate: new Date("2024-01-20T10:00:00Z"),
				endDate: new Date("2024-01-20T11:00:00Z"),
				attendees: [],
				alarms: [],
				categories: [],
				resources: [],
				recurrenceDates: [],
			};

			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendar,
			);
			(prisma.event.create as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCreatedEvent,
			);

			const caller = eventRouter.createCaller(mockContext);
			const result = await caller.create({
				calendarId: "cal-1",
				title: "New Event",
				startDate: new Date("2024-01-20T10:00:00Z"),
				endDate: new Date("2024-01-20T11:00:00Z"),
			});

			expect(result.title).toBe("New Event");
			expect(prisma.event.create).toHaveBeenCalled();
		});

		it("should validate calendar ownership", async () => {
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				null,
			);

			const caller = eventRouter.createCaller(mockContext);

			await expect(
				caller.create({
					calendarId: "non-existent-cal",
					title: "New Event",
					startDate: new Date(),
					endDate: new Date(),
				}),
			).rejects.toThrow(TRPCError);
		});

		it("should reject duplicate UID within same calendar", async () => {
			const mockCalendar = {
				id: "cal-1",
				name: "Test Calendar",
				userId: "anon-test123",
			};

			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockCalendar,
			);
			(prisma.event.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
				id: "existing-event",
				uid: "duplicate-uid",
			});

			const caller = eventRouter.createCaller(mockContext);

			await expect(
				caller.create({
					calendarId: "cal-1",
					title: "New Event",
					startDate: new Date(),
					endDate: new Date(),
					uid: "duplicate-uid",
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("delete", () => {
		it("should delete an event", async () => {
			(prisma.event.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
				id: "event-1",
			});

			const caller = eventRouter.createCaller(mockContext);
			const result = await caller.delete({ id: "event-1" });

			expect(result.success).toBe(true);
			expect(prisma.event.delete).toHaveBeenCalledWith({
				where: { id: "event-1" },
			});
		});
	});

	describe("duplicate", () => {
		it("should duplicate an event", async () => {
			const sourceEvent = {
				id: "event-1",
				calendarId: "cal-1",
				title: "Original Event",
				startDate: new Date("2024-01-20T10:00:00Z"),
				endDate: new Date("2024-01-20T11:00:00Z"),
				description: "Description",
				location: "Location",
				status: "CONFIRMED",
				calendar: { id: "cal-1", name: "Calendar", color: "#FF0000" },
				attendees: [],
				alarms: [],
				categories: [],
				resources: [],
				recurrenceDates: [],
			};

			const duplicatedEvent = {
				...sourceEvent,
				id: "duplicated-event",
			};

			(prisma.event.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				sourceEvent,
			);
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				{
					id: "cal-1",
					userId: "anon-test123",
				},
			);
			(prisma.event.create as ReturnType<typeof vi.fn>).mockResolvedValue(
				duplicatedEvent,
			);

			const caller = eventRouter.createCaller(mockContext);
			await caller.duplicate({ id: "event-1" });

			expect(prisma.event.create).toHaveBeenCalled();
		});

		it("should apply day offset when duplicating", async () => {
			const sourceEvent = {
				id: "event-1",
				calendarId: "cal-1",
				title: "Original Event",
				startDate: new Date("2024-01-20T10:00:00Z"),
				endDate: new Date("2024-01-20T11:00:00Z"),
				calendar: { id: "cal-1", name: "Calendar", color: "#FF0000" },
				attendees: [],
				alarms: [],
				categories: [],
				resources: [],
				recurrenceDates: [],
			};

			(prisma.event.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				sourceEvent,
			);
			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				{
					id: "cal-1",
					userId: "anon-test123",
				},
			);
			(prisma.event.create as ReturnType<typeof vi.fn>).mockImplementation(
				({ data }) => ({
					id: "duplicated-event",
					...data,
				}),
			);

			const caller = eventRouter.createCaller(mockContext);
			await caller.duplicate({ id: "event-1", dayOffset: 7 });

			const createCall = (prisma.event.create as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			const newStartDate = new Date(createCall.data.startDate);
			const expectedDate = new Date("2024-01-27T10:00:00Z");

			expect(newStartDate.toISOString()).toBe(expectedDate.toISOString());
		});
	});

	describe("bulkDelete", () => {
		it("should delete multiple events", async () => {
			const mockEvents = [
				{ id: "event-1", calendarId: "cal-1", calendar: { id: "cal-1" } },
				{ id: "event-2", calendarId: "cal-1", calendar: { id: "cal-1" } },
			];

			(prisma.event.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockEvents,
			);
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ id: "cal-1", userId: "anon-test123" },
			]);
			(prisma.event.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({
				count: 2,
			});

			const caller = eventRouter.createCaller(mockContext);
			const result = await caller.bulkDelete({
				eventIds: ["event-1", "event-2"],
			});

			expect(result.deletedCount).toBe(2);
		});

		it("should only delete events user has access to", async () => {
			const mockEvents = [
				{ id: "event-1", calendarId: "cal-1", calendar: { id: "cal-1" } },
				{
					id: "event-2",
					calendarId: "cal-other",
					calendar: { id: "cal-other" },
				},
			];

			(prisma.event.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockEvents,
			);
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ id: "cal-1", userId: "anon-test123" },
			]);
			(prisma.event.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({
				count: 1,
			});

			const caller = eventRouter.createCaller(mockContext);
			const result = await caller.bulkDelete({
				eventIds: ["event-1", "event-2"],
			});

			expect(result.deletedCount).toBe(1);
			expect(result.requestedCount).toBe(2);
		});
	});

	describe("bulkMove", () => {
		it("should move events to another calendar", async () => {
			const mockEvents = [
				{ id: "event-1", calendarId: "cal-1", calendar: { id: "cal-1" } },
			];

			(prisma.calendar.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
				{
					id: "cal-2",
					name: "Target Calendar",
					color: "#00FF00",
					userId: "anon-test123",
				},
			);
			(prisma.event.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockEvents,
			);
			(prisma.calendar.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ id: "cal-1", userId: "anon-test123" },
			]);
			(prisma.event.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
				count: 1,
			});

			const caller = eventRouter.createCaller(mockContext);
			const result = await caller.bulkMove({
				eventIds: ["event-1"],
				targetCalendarId: "cal-2",
			});

			expect(result.movedCount).toBe(1);
			expect(result.targetCalendarName).toBe("Target Calendar");
		});
	});
});
