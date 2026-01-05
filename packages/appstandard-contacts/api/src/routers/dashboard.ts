/**
 * AppStandard Contacts Dashboard Analytics
 * Provides insights, statistics, and contact health metrics
 */

import { authOrAnonProcedure, router } from "@appstandard/api-core";
import prisma from "@appstandard/db";
import {
	addDays,
	addMonths,
	addWeeks,
	addYears,
	endOfDay,
	endOfMonth,
	endOfWeek,
	endOfYear,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
	subMonths,
} from "date-fns";
import z from "zod";
import { isAuthenticatedUser } from "../middleware";

// Period calculation helpers
function getPeriodDates(period: string, now: Date) {
	switch (period) {
		case "today":
			return {
				start: startOfDay(now),
				end: endOfDay(now),
				previousStart: startOfDay(addDays(now, -1)),
				previousEnd: endOfDay(addDays(now, -1)),
			};
		case "week":
			return {
				start: startOfWeek(now, { weekStartsOn: 1 }),
				end: endOfWeek(now, { weekStartsOn: 1 }),
				previousStart: startOfWeek(addWeeks(now, -1), { weekStartsOn: 1 }),
				previousEnd: endOfWeek(addWeeks(now, -1), { weekStartsOn: 1 }),
			};
		case "month":
			return {
				start: startOfMonth(now),
				end: endOfMonth(now),
				previousStart: startOfMonth(addMonths(now, -1)),
				previousEnd: endOfMonth(addMonths(now, -1)),
			};
		case "year":
			return {
				start: startOfYear(now),
				end: endOfYear(now),
				previousStart: startOfYear(addYears(now, -1)),
				previousEnd: endOfYear(addYears(now, -1)),
			};
		default:
			return {
				start: startOfWeek(now, { weekStartsOn: 1 }),
				end: endOfWeek(now, { weekStartsOn: 1 }),
				previousStart: startOfWeek(addWeeks(now, -1), { weekStartsOn: 1 }),
				previousEnd: endOfWeek(addWeeks(now, -1), { weekStartsOn: 1 }),
			};
	}
}

export const dashboardRouter = router({
	getStats: authOrAnonProcedure
		.input(
			z.object({
				period: z.enum(["today", "week", "month", "year"]).default("month"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.userId;
			const now = new Date();
			const periodDates = getPeriodDates(input.period, now);

			// Get user's address books
			const userAddressBooks = await prisma.addressBook.findMany({
				where: { userId },
				select: {
					id: true,
					name: true,
					color: true,
				},
			});

			const addressBookIds = userAddressBooks.map((ab) => ab.id);

			if (addressBookIds.length === 0) {
				// Return empty state
				return {
					period: {
						start: periodDates.start,
						end: periodDates.end,
						label: input.period,
					},
					hero: {
						totalContacts: 0,
						contactsAddedPeriod: 0,
						contactsAddedPreviousPeriod: 0,
						contactsWithEmail: 0,
						contactsWithPhone: 0,
						upcomingBirthdays: 0,
					},
					birthdays: [],
					recentlyAdded: [],
					byCategory: [],
					byOrganization: [],
					byAddressBook: [],
					addressBooks: [],
					completeness: {
						withEmail: 0,
						withPhone: 0,
						withAddress: 0,
						withPhoto: 0,
						withOrganization: 0,
						fullyComplete: 0,
					},
					health: {
						contactsWithoutEmail: 0,
						contactsWithoutPhone: 0,
						contactsWithoutName: 0,
						oldContacts: 0,
						emptyAddressBooks: 0,
						potentialDuplicates: 0,
					},
					sharing: {
						activeLinks: 0,
						activeBundles: 0,
						sharedGroups: 0,
						pendingInvitations: 0,
					},
				};
			}

			// ===== HERO METRICS =====
			const totalContacts = await prisma.contact.count({
				where: { addressBookId: { in: addressBookIds } },
			});

			// Contacts added this period
			const contactsAddedPeriod = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					createdAt: { gte: periodDates.start, lte: periodDates.end },
				},
			});

			// Contacts added previous period
			const contactsAddedPreviousPeriod = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					createdAt: {
						gte: periodDates.previousStart,
						lte: periodDates.previousEnd,
					},
				},
			});

			// Contacts with email
			const contactsWithEmail = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					emails: { some: {} },
				},
			});

			// Contacts with phone
			const contactsWithPhone = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					phones: { some: {} },
				},
			});

			// Upcoming birthdays (next 30 days)
			const thirtyDaysLater = addDays(now, 30);
			const todayMonth = now.getMonth() + 1;
			const todayDay = now.getDate();
			const endMonth = thirtyDaysLater.getMonth() + 1;
			const endDay = thirtyDaysLater.getDate();

			// Get contacts with birthdays
			const contactsWithBirthday = await prisma.contact.findMany({
				where: {
					addressBookId: { in: addressBookIds },
					birthday: { not: null },
				},
				select: {
					id: true,
					formattedName: true,
					birthday: true,
					addressBook: { select: { name: true, color: true } },
				},
			});

			// Filter upcoming birthdays
			const upcomingBirthdayContacts = contactsWithBirthday.filter((c) => {
				if (!c.birthday) return false;
				const bMonth = c.birthday.getMonth() + 1;
				const bDay = c.birthday.getDate();

				// Same month comparison
				if (bMonth === todayMonth && bDay >= todayDay) return true;
				if (bMonth === endMonth && bDay <= endDay) return true;
				// If we're crossing year boundary
				if (todayMonth > endMonth) {
					return bMonth >= todayMonth || bMonth <= endMonth;
				}
				// Normal case: birthday month is between today and end
				return bMonth > todayMonth && bMonth < endMonth;
			});

			const birthdays = upcomingBirthdayContacts
				.map((c) => ({
					id: c.id,
					formattedName: c.formattedName,
					birthday: c.birthday,
					addressBookName: c.addressBook.name,
					addressBookColor: c.addressBook.color,
				}))
				.slice(0, 10);

			// ===== RECENTLY ADDED =====
			const recentContacts = await prisma.contact.findMany({
				where: {
					addressBookId: { in: addressBookIds },
				},
				select: {
					id: true,
					formattedName: true,
					organization: true,
					createdAt: true,
					addressBook: { select: { name: true, color: true } },
					emails: { select: { email: true }, take: 1 },
				},
				orderBy: { createdAt: "desc" },
				take: 10,
			});

			const recentlyAdded = recentContacts.map((c) => ({
				id: c.id,
				formattedName: c.formattedName,
				organization: c.organization,
				email: c.emails[0]?.email || null,
				createdAt: c.createdAt,
				addressBookName: c.addressBook.name,
				addressBookColor: c.addressBook.color,
			}));

			// ===== BY CATEGORY =====
			const contactsWithCategories = await prisma.contact.findMany({
				where: { addressBookId: { in: addressBookIds } },
				include: { categories: { select: { category: true } } },
			});

			const categoryCount = new Map<string, number>();
			for (const contact of contactsWithCategories) {
				for (const cat of contact.categories) {
					categoryCount.set(
						cat.category,
						(categoryCount.get(cat.category) || 0) + 1,
					);
				}
			}

			const byCategory = Array.from(categoryCount.entries())
				.map(([category, count]) => ({ category, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);

			// ===== BY ORGANIZATION =====
			const orgCounts = await prisma.contact.groupBy({
				by: ["organization"],
				where: {
					addressBookId: { in: addressBookIds },
					organization: { not: null },
				},
				_count: { organization: true },
				orderBy: { _count: { organization: "desc" } },
				take: 10,
			});

			const byOrganization = orgCounts
				.filter((o) => o.organization)
				.map((o) => ({
					organization: o.organization as string,
					count: o._count.organization,
				}));

			// ===== BY ADDRESS BOOK =====
			const addressBookCounts = await prisma.contact.groupBy({
				by: ["addressBookId"],
				where: { addressBookId: { in: addressBookIds } },
				_count: { addressBookId: true },
			});

			const byAddressBook = userAddressBooks
				.map((ab) => ({
					addressBookId: ab.id,
					addressBookName: ab.name,
					addressBookColor: ab.color,
					contactCount:
						addressBookCounts.find((c) => c.addressBookId === ab.id)?._count
							.addressBookId || 0,
				}))
				.sort((a, b) => b.contactCount - a.contactCount);

			// ===== ADDRESS BOOKS =====
			const addressBooksWithStats = await Promise.all(
				userAddressBooks.map(async (ab) => {
					const contactCount = await prisma.contact.count({
						where: { addressBookId: ab.id },
					});
					return {
						id: ab.id,
						name: ab.name,
						color: ab.color,
						contactCount,
					};
				}),
			);

			// ===== COMPLETENESS =====
			const withEmail = contactsWithEmail;
			const withPhone = contactsWithPhone;

			const withAddress = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					addresses: { some: {} },
				},
			});

			const withPhoto = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					photoUrl: { not: null },
				},
			});

			const withOrganization = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					organization: { not: null },
				},
			});

			// Fully complete: has email, phone, and either address or organization
			const fullyComplete = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					emails: { some: {} },
					phones: { some: {} },
					OR: [{ addresses: { some: {} } }, { organization: { not: null } }],
				},
			});

			// ===== HEALTH =====
			const contactsWithoutEmail = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					emails: { none: {} },
				},
			});

			const contactsWithoutPhone = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					phones: { none: {} },
				},
			});

			const contactsWithoutName = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					formattedName: "",
				},
			});

			const sixMonthsAgo = subMonths(now, 6);
			const oldContacts = await prisma.contact.count({
				where: {
					addressBookId: { in: addressBookIds },
					updatedAt: { lt: sixMonthsAgo },
				},
			});

			const emptyAddressBooks = await prisma.addressBook.count({
				where: {
					id: { in: addressBookIds },
					contacts: { none: {} },
				},
			});

			// Potential duplicates (same formatted name)
			const potentialDuplicatesResult = await prisma.$queryRaw<
				{ count: bigint }[]
			>`
				SELECT COUNT(*) as count FROM (
					SELECT c1.id
					FROM contact c1
					JOIN contact c2 ON c1.id < c2.id
					WHERE c1."addressBookId" = ANY(${addressBookIds})
					AND c2."addressBookId" = ANY(${addressBookIds})
					AND LOWER(c1."formattedName") = LOWER(c2."formattedName")
					AND c1."formattedName" != ''
					LIMIT 100
				) as duplicates
			`;
			const potentialDuplicates = Number(
				potentialDuplicatesResult[0]?.count || 0,
			);

			// ===== SHARING =====
			const activeLinks = await prisma.addressBookShareLink.count({
				where: {
					addressBookId: { in: addressBookIds },
					isActive: true,
					OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
				},
			});

			const activeBundles = await prisma.addressBookShareBundle.count({
				where: {
					addressBooks: { some: { addressBookId: { in: addressBookIds } } },
					isActive: true,
					OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
				},
			});

			let sharedGroups = 0;
			let pendingInvitations = 0;

			if (isAuthenticatedUser(ctx) && ctx.session?.user?.id) {
				sharedGroups = await prisma.addressBookGroup.count({
					where: {
						members: {
							some: {
								userId: ctx.session.user.id,
								acceptedAt: { not: null },
							},
						},
					},
				});

				pendingInvitations = await prisma.addressBookGroupMember2.count({
					where: {
						userId: ctx.session.user.id,
						acceptedAt: null,
					},
				});
			}

			return {
				period: {
					start: periodDates.start,
					end: periodDates.end,
					label: input.period,
				},
				hero: {
					totalContacts,
					contactsAddedPeriod,
					contactsAddedPreviousPeriod,
					contactsWithEmail,
					contactsWithPhone,
					upcomingBirthdays: upcomingBirthdayContacts.length,
				},
				birthdays,
				recentlyAdded,
				byCategory,
				byOrganization,
				byAddressBook,
				addressBooks: addressBooksWithStats,
				completeness: {
					withEmail,
					withPhone,
					withAddress,
					withPhoto,
					withOrganization,
					fullyComplete,
				},
				health: {
					contactsWithoutEmail,
					contactsWithoutPhone,
					contactsWithoutName,
					oldContacts,
					emptyAddressBooks,
					potentialDuplicates,
				},
				sharing: {
					activeLinks,
					activeBundles,
					sharedGroups,
					pendingInvitations,
				},
			};
		}),
});
