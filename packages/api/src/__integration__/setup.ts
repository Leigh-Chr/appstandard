/**
 * TEST-001: Integration test setup
 *
 * This module provides helpers for running integration tests against a real database.
 * Uses unique user IDs for test isolation.
 *
 * Requires DATABASE_URL environment variable to be set.
 * Tests will be skipped if no database is available.
 */

// Check if DATABASE_URL is available BEFORE importing anything that uses it
const DATABASE_URL =
	process.env["DATABASE_URL"] || process.env["DATABASE_URL_TEST"];

// Flag to indicate if integration tests should run
export const canRunIntegrationTests = !!DATABASE_URL;

// Type for the Prisma client
type PrismaClientType = Awaited<typeof import("@appstandard/db")>["default"];

// Cached prisma instance
let prismaInstance: PrismaClientType | null = null;

/**
 * Get the Prisma client for integration tests
 * Dynamically imports to avoid env validation errors when DATABASE_URL is not set
 */
export async function getTestPrisma(): Promise<PrismaClientType> {
	if (!canRunIntegrationTests) {
		throw new Error("DATABASE_URL is not set - integration tests cannot run");
	}
	if (!prismaInstance) {
		const db = await import("@appstandard/db");
		prismaInstance = db.default;
	}
	return prismaInstance;
}

// Test context type
export interface TestContext {
	userId: string;
	anonymousId: string;
}

/**
 * Generate a unique test user ID
 */
export function generateTestUserId(): string {
	return `test-user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Generate a unique anonymous ID
 */
export function generateAnonId(): string {
	return `anon-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Clean up test data for a specific user
 */
export async function cleanupTestData(userId: string): Promise<void> {
	const prisma = await getTestPrisma();

	// Get user's calendar IDs first (needed for models without calendar relation)
	const userCalendars = await prisma.calendar.findMany({
		where: { userId },
		select: { id: true },
	});
	const calendarIds = userCalendars.map((c) => c.id);

	// Delete in order respecting foreign keys
	await prisma.calendarShareLink.deleteMany({
		where: {
			calendarId: { in: calendarIds },
		},
	});
	await prisma.calendarGroupMember.deleteMany({
		where: {
			calendarId: { in: calendarIds },
		},
	});
	await prisma.calendarGroup.deleteMany({ where: { userId } });
	await prisma.eventAttendee.deleteMany({
		where: {
			event: {
				calendar: {
					userId,
				},
			},
		},
	});
	await prisma.eventAlarm.deleteMany({
		where: {
			event: {
				calendar: {
					userId,
				},
			},
		},
	});
	await prisma.eventCategory.deleteMany({
		where: {
			event: {
				calendar: {
					userId,
				},
			},
		},
	});
	await prisma.eventResource.deleteMany({
		where: {
			event: {
				calendar: {
					userId,
				},
			},
		},
	});
	await prisma.recurrenceDate.deleteMany({
		where: {
			event: {
				calendar: {
					userId,
				},
			},
		},
	});
	await prisma.event.deleteMany({
		where: {
			calendar: {
				userId,
			},
		},
	});
	await prisma.calendar.deleteMany({ where: { userId } });
}

/**
 * Create a test calendar
 */
export async function createTestCalendar(
	userId: string,
	data: { name?: string; color?: string } = {},
) {
	const prisma = await getTestPrisma();
	return prisma.calendar.create({
		data: {
			userId,
			name: data.name || "Test Calendar",
			color: data.color || "#3B82F6",
		},
	});
}

/**
 * Create a test event
 */
export async function createTestEvent(
	calendarId: string,
	data: {
		title?: string;
		startDate?: Date;
		endDate?: Date;
		description?: string;
	} = {},
) {
	const prisma = await getTestPrisma();
	const startDate = data.startDate || new Date();
	const endDate = data.endDate || new Date(startDate.getTime() + 3600000); // +1 hour

	return prisma.event.create({
		data: {
			calendarId,
			title: data.title || "Test Event",
			startDate,
			endDate,
			description: data.description,
		},
	});
}
