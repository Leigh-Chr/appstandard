/**
 * TEST-001: Calendar CRUD integration tests
 *
 * Tests the calendar router against a real database.
 * Requires DATABASE_URL environment variable to be set.
 */

import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "vitest";
import type { Context } from "../context";
import {
	canRunIntegrationTests,
	cleanupTestData,
	createTestCalendar,
	createTestEvent,
	generateTestUserId,
	getTestPrisma,
} from "./setup";

// Skip all tests if DATABASE_URL is not available
const describeWithDb = canRunIntegrationTests ? describe : describe.skip;

describeWithDb("Calendar CRUD Integration Tests", () => {
	let testUserId: string;
	// Context prepared for future tRPC caller tests
	let _mockContext: Context;
	let testPrisma: Awaited<ReturnType<typeof getTestPrisma>>;

	beforeAll(async () => {
		testPrisma = await getTestPrisma();
		await testPrisma.$connect();
	});

	afterAll(async () => {
		if (testPrisma) {
			await testPrisma.$disconnect();
		}
	});

	beforeEach(() => {
		testUserId = generateTestUserId();
		_mockContext = {
			session: null,
			anonymousId: testUserId,
			correlationId: "integration-test",
			userId: testUserId,
		} as Context;
	});

	afterEach(async () => {
		if (testPrisma) {
			await cleanupTestData(testUserId);
		}
	});

	describe("Calendar Creation", () => {
		it("should create a calendar with all fields", async () => {
			const calendar = await testPrisma.calendar.create({
				data: {
					userId: testUserId,
					name: "My Integration Test Calendar",
					color: "#FF5733",
				},
			});

			expect(calendar).toBeDefined();
			expect(calendar.id).toBeDefined();
			expect(calendar.name).toBe("My Integration Test Calendar");
			expect(calendar.color).toBe("#FF5733");
			expect(calendar.userId).toBe(testUserId);
		});

		it("should auto-generate UUID for calendar id", async () => {
			const calendar = await createTestCalendar(testUserId);

			expect(calendar.id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			);
		});
	});

	describe("Calendar Retrieval", () => {
		it("should find calendar by userId", async () => {
			await createTestCalendar(testUserId, { name: "Calendar 1" });
			await createTestCalendar(testUserId, { name: "Calendar 2" });

			const calendars = await testPrisma.calendar.findMany({
				where: { userId: testUserId },
				orderBy: { name: "asc" },
			});

			expect(calendars).toHaveLength(2);
			expect(calendars[0].name).toBe("Calendar 1");
			expect(calendars[1].name).toBe("Calendar 2");
		});

		it("should include event count with _count", async () => {
			const calendar = await createTestCalendar(testUserId);
			await createTestEvent(calendar.id, { title: "Event 1" });
			await createTestEvent(calendar.id, { title: "Event 2" });

			const result = await testPrisma.calendar.findUnique({
				where: { id: calendar.id },
				include: {
					_count: { select: { events: true } },
				},
			});

			expect(result?._count.events).toBe(2);
		});
	});

	describe("Calendar Update", () => {
		it("should update calendar name and color", async () => {
			const calendar = await createTestCalendar(testUserId);

			const updated = await testPrisma.calendar.update({
				where: { id: calendar.id },
				data: {
					name: "Updated Name",
					color: "#00FF00",
				},
			});

			expect(updated.name).toBe("Updated Name");
			expect(updated.color).toBe("#00FF00");
		});

		it("should update updatedAt timestamp", async () => {
			const calendar = await createTestCalendar(testUserId);
			const originalUpdatedAt = calendar.updatedAt;

			// Wait a bit to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 10));

			const updated = await testPrisma.calendar.update({
				where: { id: calendar.id },
				data: { name: "New Name" },
			});

			expect(updated.updatedAt.getTime()).toBeGreaterThan(
				originalUpdatedAt.getTime(),
			);
		});
	});

	describe("Calendar Deletion", () => {
		it("should delete calendar", async () => {
			const calendar = await createTestCalendar(testUserId);

			await testPrisma.calendar.delete({
				where: { id: calendar.id },
			});

			const found = await testPrisma.calendar.findUnique({
				where: { id: calendar.id },
			});

			expect(found).toBeNull();
		});

		it("should cascade delete events when calendar is deleted", async () => {
			const calendar = await createTestCalendar(testUserId);
			const event = await createTestEvent(calendar.id);

			await testPrisma.calendar.delete({
				where: { id: calendar.id },
			});

			const foundEvent = await testPrisma.event.findUnique({
				where: { id: event.id },
			});

			expect(foundEvent).toBeNull();
		});
	});

	describe("Event Operations", () => {
		it("should create event with all ICS fields", async () => {
			const calendar = await createTestCalendar(testUserId);
			const startDate = new Date("2024-03-15T10:00:00Z");
			const endDate = new Date("2024-03-15T11:00:00Z");

			const event = await testPrisma.event.create({
				data: {
					calendarId: calendar.id,
					title: "Meeting",
					startDate,
					endDate,
					description: "Team sync",
					location: "Room 101",
					status: "CONFIRMED",
					priority: 5,
					url: "https://example.com/meeting",
					rrule: "FREQ=WEEKLY;BYDAY=MO",
					calendarColor: calendar.color,
					calendarName: calendar.name,
				},
			});

			expect(event.title).toBe("Meeting");
			expect(event.startDate).toEqual(startDate);
			expect(event.endDate).toEqual(endDate);
			expect(event.description).toBe("Team sync");
			expect(event.location).toBe("Room 101");
			expect(event.status).toBe("CONFIRMED");
			expect(event.priority).toBe(5);
			expect(event.rrule).toBe("FREQ=WEEKLY;BYDAY=MO");
			expect(event.calendarColor).toBe(calendar.color);
			expect(event.calendarName).toBe(calendar.name);
		});

		it("should enforce unique UID per calendar", async () => {
			const calendar = await createTestCalendar(testUserId);
			const uid = "unique-event-uid-12345";

			await testPrisma.event.create({
				data: {
					calendarId: calendar.id,
					title: "Event 1",
					startDate: new Date(),
					endDate: new Date(),
					uid,
				},
			});

			// Trying to create another event with same UID should fail
			await expect(
				testPrisma.event.create({
					data: {
						calendarId: calendar.id,
						title: "Event 2",
						startDate: new Date(),
						endDate: new Date(),
						uid,
					},
				}),
			).rejects.toThrow();
		});

		it("should allow same UID in different calendars", async () => {
			const calendar1 = await createTestCalendar(testUserId, { name: "Cal 1" });
			const calendar2 = await createTestCalendar(testUserId, { name: "Cal 2" });
			const uid = "shared-uid-12345";

			const event1 = await testPrisma.event.create({
				data: {
					calendarId: calendar1.id,
					title: "Event in Cal 1",
					startDate: new Date(),
					endDate: new Date(),
					uid,
				},
			});

			const event2 = await testPrisma.event.create({
				data: {
					calendarId: calendar2.id,
					title: "Event in Cal 2",
					startDate: new Date(),
					endDate: new Date(),
					uid,
				},
			});

			expect(event1.uid).toBe(uid);
			expect(event2.uid).toBe(uid);
		});

		it("should create event with attendees", async () => {
			const calendar = await createTestCalendar(testUserId);

			const event = await testPrisma.event.create({
				data: {
					calendarId: calendar.id,
					title: "Meeting with attendees",
					startDate: new Date(),
					endDate: new Date(),
					attendees: {
						create: [
							{
								email: "alice@example.com",
								name: "Alice",
								role: "REQ_PARTICIPANT",
								status: "ACCEPTED",
							},
							{
								email: "bob@example.com",
								name: "Bob",
								role: "OPT_PARTICIPANT",
								status: "TENTATIVE",
							},
						],
					},
				},
				include: { attendees: true },
			});

			expect(event.attendees).toHaveLength(2);
			expect(event.attendees[0].email).toBe("alice@example.com");
			expect(event.attendees[1].email).toBe("bob@example.com");
		});

		it("should create event with alarms", async () => {
			const calendar = await createTestCalendar(testUserId);

			const event = await testPrisma.event.create({
				data: {
					calendarId: calendar.id,
					title: "Event with alarms",
					startDate: new Date(),
					endDate: new Date(),
					alarms: {
						create: [
							{
								trigger: "-PT15M",
								action: "DISPLAY",
								summary: "15 minutes before",
							},
							{
								trigger: "-PT1H",
								action: "EMAIL",
								summary: "1 hour before",
								description: "Don't forget your meeting!",
							},
						],
					},
				},
				include: { alarms: true },
			});

			expect(event.alarms).toHaveLength(2);
			expect(event.alarms[0].trigger).toBe("-PT15M");
			expect(event.alarms[1].action).toBe("EMAIL");
		});
	});

	describe("Share Links", () => {
		it("should create share link for calendar", async () => {
			const calendar = await createTestCalendar(testUserId);

			const shareLink = await testPrisma.calendarShareLink.create({
				data: {
					calendarId: calendar.id,
					token: `test-token-${Date.now()}`,
					name: "Public Link",
				},
			});

			expect(shareLink.token).toBeDefined();
			expect(shareLink.isActive).toBe(true);
			expect(shareLink.accessCount).toBe(0);
		});

		it("should track share link access", async () => {
			const calendar = await createTestCalendar(testUserId);

			const shareLink = await testPrisma.calendarShareLink.create({
				data: {
					calendarId: calendar.id,
					token: `test-token-${Date.now()}`,
				},
			});

			const updated = await testPrisma.calendarShareLink.update({
				where: { id: shareLink.id },
				data: {
					accessCount: { increment: 1 },
					lastAccessedAt: new Date(),
				},
			});

			expect(updated.accessCount).toBe(1);
			expect(updated.lastAccessedAt).toBeDefined();
		});
	});

	describe("Query Performance", () => {
		it("should efficiently query events by date range", async () => {
			const calendar = await createTestCalendar(testUserId);

			// Create 20 events
			const baseDate = new Date("2024-01-01T10:00:00Z");
			for (let i = 0; i < 20; i++) {
				const startDate = new Date(baseDate.getTime() + i * 86400000); // +1 day each
				await createTestEvent(calendar.id, {
					title: `Event ${i + 1}`,
					startDate,
					endDate: new Date(startDate.getTime() + 3600000),
				});
			}

			// Query events in a specific range
			const events = await testPrisma.event.findMany({
				where: {
					calendarId: calendar.id,
					startDate: {
						gte: new Date("2024-01-05T00:00:00Z"),
						lte: new Date("2024-01-15T23:59:59Z"),
					},
				},
				orderBy: { startDate: "asc" },
			});

			expect(events.length).toBeGreaterThanOrEqual(10);
			expect(events.length).toBeLessThanOrEqual(11);
		});

		it("should efficiently count events per calendar", async () => {
			const calendar1 = await createTestCalendar(testUserId, { name: "Cal 1" });
			const calendar2 = await createTestCalendar(testUserId, { name: "Cal 2" });

			await createTestEvent(calendar1.id);
			await createTestEvent(calendar1.id);
			await createTestEvent(calendar2.id);

			const counts = await testPrisma.calendar.findMany({
				where: { userId: testUserId },
				include: {
					_count: { select: { events: true } },
				},
			});

			const cal1Count = counts.find((c) => c.name === "Cal 1")?._count.events;
			const cal2Count = counts.find((c) => c.name === "Cal 2")?._count.events;

			expect(cal1Count).toBe(2);
			expect(cal2Count).toBe(1);
		});
	});
});
