/**
 * AppStandard Tasks Dashboard Analytics
 * Provides insights, statistics, and task health metrics
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
	format,
	isToday,
	isTomorrow,
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

// Get day label for upcoming tasks
function getDayLabel(date: Date): string {
	if (isToday(date)) return "Today";
	if (isTomorrow(date)) return "Tomorrow";
	return format(date, "EEEE d MMMM");
}

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

			// Get user's task lists
			const userTaskLists = await prisma.taskList.findMany({
				where: { userId },
				select: {
					id: true,
					name: true,
					color: true,
				},
			});

			const taskListIds = userTaskLists.map((tl) => tl.id);

			if (taskListIds.length === 0) {
				// Return empty state
				return {
					period: {
						start: periodDates.start,
						end: periodDates.end,
						label: input.period,
					},
					hero: {
						tasksDueToday: 0,
						tasksDuePeriod: 0,
						completedPeriod: 0,
						completedPreviousPeriod: 0,
						overdueCount: 0,
						completionRate: 0,
					},
					upcoming: [],
					overdue: [],
					statusBreakdown: {
						needsAction: 0,
						inProcess: 0,
						completed: 0,
						cancelled: 0,
					},
					priorityBreakdown: {
						high: 0,
						medium: 0,
						low: 0,
						none: 0,
					},
					byCategory: [],
					byTaskList: [],
					taskLists: [],
					health: {
						tasksWithoutDueDate: 0,
						tasksWithoutDescription: 0,
						oldTasks: 0,
						emptyTaskLists: 0,
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
			const todayStart = startOfDay(now);
			const todayEnd = endOfDay(now);

			// Tasks due today
			const tasksDueToday = await prisma.task.count({
				where: {
					taskListId: { in: taskListIds },
					dueDate: { gte: todayStart, lte: todayEnd },
					status: { not: "COMPLETED" },
				},
			});

			// Tasks due this period
			const tasksDuePeriod = await prisma.task.count({
				where: {
					taskListId: { in: taskListIds },
					dueDate: { gte: periodDates.start, lte: periodDates.end },
				},
			});

			// Completed this period
			const completedPeriod = await prisma.task.count({
				where: {
					taskListId: { in: taskListIds },
					status: "COMPLETED",
					completedAt: { gte: periodDates.start, lte: periodDates.end },
				},
			});

			// Completed previous period
			const completedPreviousPeriod = await prisma.task.count({
				where: {
					taskListId: { in: taskListIds },
					status: "COMPLETED",
					completedAt: {
						gte: periodDates.previousStart,
						lte: periodDates.previousEnd,
					},
				},
			});

			// Overdue tasks
			const overdueCount = await prisma.task.count({
				where: {
					taskListId: { in: taskListIds },
					dueDate: { lt: todayStart },
					status: { notIn: ["COMPLETED", "CANCELLED"] },
				},
			});

			// Total active tasks this period for completion rate
			const totalActivePeriod = await prisma.task.count({
				where: {
					taskListId: { in: taskListIds },
					OR: [
						{ dueDate: { gte: periodDates.start, lte: periodDates.end } },
						{
							completedAt: { gte: periodDates.start, lte: periodDates.end },
						},
					],
				},
			});

			const completionRate =
				totalActivePeriod > 0
					? Math.round((completedPeriod / totalActivePeriod) * 100)
					: 0;

			// ===== UPCOMING 7 DAYS =====
			const upcomingEnd = addDays(now, 7);
			const upcomingTasks = await prisma.task.findMany({
				where: {
					taskListId: { in: taskListIds },
					dueDate: { gte: todayStart, lte: upcomingEnd },
					status: { notIn: ["COMPLETED", "CANCELLED"] },
				},
				select: {
					id: true,
					title: true,
					dueDate: true,
					priority: true,
					status: true,
					percentComplete: true,
					taskList: { select: { id: true, name: true, color: true } },
				},
				orderBy: { dueDate: "asc" },
				take: 50,
			});

			// Group by date
			const tasksByDate = new Map<
				string,
				{
					date: string;
					dayLabel: string;
					tasks: Array<{
						id: string;
						title: string;
						dueDate: Date | null;
						priority: number | null;
						status: string;
						percentComplete: number | null;
						taskListId: string;
						taskListName: string;
						taskListColor: string | null;
					}>;
				}
			>();

			for (const task of upcomingTasks) {
				if (!task.dueDate) continue;
				const dateKey = format(task.dueDate, "yyyy-MM-dd");
				if (!tasksByDate.has(dateKey)) {
					tasksByDate.set(dateKey, {
						date: dateKey,
						dayLabel: getDayLabel(task.dueDate),
						tasks: [],
					});
				}

				const dayData = tasksByDate.get(dateKey);
				if (!dayData) continue;
				dayData.tasks.push({
					id: task.id,
					title: task.title,
					dueDate: task.dueDate,
					priority: task.priority,
					status: task.status,
					percentComplete: task.percentComplete,
					taskListId: task.taskList.id,
					taskListName: task.taskList.name,
					taskListColor: task.taskList.color,
				});
			}

			const upcoming = Array.from(tasksByDate.values()).sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);

			// ===== OVERDUE TASKS =====
			const overdueTasks = await prisma.task.findMany({
				where: {
					taskListId: { in: taskListIds },
					dueDate: { lt: todayStart },
					status: { notIn: ["COMPLETED", "CANCELLED"] },
				},
				select: {
					id: true,
					title: true,
					dueDate: true,
					priority: true,
					status: true,
					taskList: { select: { name: true, color: true } },
				},
				orderBy: { dueDate: "asc" },
				take: 20,
			});

			const overdue = overdueTasks.map((t) => ({
				id: t.id,
				title: t.title,
				dueDate: t.dueDate,
				priority: t.priority,
				taskListName: t.taskList.name,
				taskListColor: t.taskList.color,
			}));

			// ===== STATUS BREAKDOWN =====
			const statusCounts = await prisma.task.groupBy({
				by: ["status"],
				where: { taskListId: { in: taskListIds } },
				_count: { status: true },
			});

			const statusBreakdown = {
				needsAction:
					statusCounts.find((s) => s.status === "NEEDS_ACTION")?._count
						.status || 0,
				inProcess:
					statusCounts.find((s) => s.status === "IN_PROCESS")?._count.status ||
					0,
				completed:
					statusCounts.find((s) => s.status === "COMPLETED")?._count.status ||
					0,
				cancelled:
					statusCounts.find((s) => s.status === "CANCELLED")?._count.status ||
					0,
			};

			// ===== PRIORITY BREAKDOWN =====
			const allTasks = await prisma.task.findMany({
				where: { taskListId: { in: taskListIds } },
				select: { priority: true },
			});

			const priorityBreakdown = {
				high: allTasks.filter(
					(t) => t.priority && t.priority >= 1 && t.priority <= 3,
				).length,
				medium: allTasks.filter(
					(t) => t.priority && t.priority >= 4 && t.priority <= 6,
				).length,
				low: allTasks.filter(
					(t) => t.priority && t.priority >= 7 && t.priority <= 9,
				).length,
				none: allTasks.filter((t) => !t.priority || t.priority === 0).length,
			};

			// ===== BY CATEGORY =====
			const tasksWithCategories = await prisma.task.findMany({
				where: { taskListId: { in: taskListIds } },
				include: { categories: { select: { category: true } } },
			});

			const categoryCount = new Map<string, number>();
			for (const task of tasksWithCategories) {
				for (const cat of task.categories) {
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

			// ===== BY TASK LIST =====
			const taskListCounts = await prisma.task.groupBy({
				by: ["taskListId"],
				where: { taskListId: { in: taskListIds } },
				_count: { taskListId: true },
			});

			const byTaskList = userTaskLists
				.map((tl) => ({
					taskListId: tl.id,
					taskListName: tl.name,
					taskListColor: tl.color,
					taskCount:
						taskListCounts.find((c) => c.taskListId === tl.id)?._count
							.taskListId || 0,
				}))
				.sort((a, b) => b.taskCount - a.taskCount);

			// ===== TASK LISTS =====
			const taskListsWithStats = await Promise.all(
				userTaskLists.map(async (tl) => {
					const taskCount = await prisma.task.count({
						where: { taskListId: tl.id },
					});
					const completedCount = await prisma.task.count({
						where: { taskListId: tl.id, status: "COMPLETED" },
					});
					return {
						id: tl.id,
						name: tl.name,
						color: tl.color,
						taskCount,
						completedCount,
					};
				}),
			);

			// ===== HEALTH =====
			const tasksWithoutDueDate = await prisma.task.count({
				where: {
					taskListId: { in: taskListIds },
					dueDate: null,
					status: { notIn: ["COMPLETED", "CANCELLED"] },
				},
			});

			const tasksWithoutDescription = await prisma.task.count({
				where: {
					taskListId: { in: taskListIds },
					OR: [{ description: null }, { description: "" }],
				},
			});

			const sixMonthsAgo = subMonths(now, 6);
			const oldTasks = await prisma.task.count({
				where: {
					taskListId: { in: taskListIds },
					status: { notIn: ["COMPLETED", "CANCELLED"] },
					createdAt: { lt: sixMonthsAgo },
				},
			});

			const emptyTaskLists = await prisma.taskList.count({
				where: {
					id: { in: taskListIds },
					tasks: { none: {} },
				},
			});

			// Potential duplicates (same title)
			const potentialDuplicatesResult = await prisma.$queryRaw<
				{ count: bigint }[]
			>`
				SELECT COUNT(*) as count FROM (
					SELECT t1.id
					FROM task t1
					JOIN task t2 ON t1.id < t2.id
					WHERE t1."taskListId" = ANY(${taskListIds})
					AND t2."taskListId" = ANY(${taskListIds})
					AND LOWER(t1.title) = LOWER(t2.title)
					AND t1.title != ''
					LIMIT 100
				) as duplicates
			`;
			const potentialDuplicates = Number(
				potentialDuplicatesResult[0]?.count || 0,
			);

			// ===== SHARING =====
			const activeLinks = await prisma.taskListShareLink.count({
				where: {
					taskListId: { in: taskListIds },
					isActive: true,
					OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
				},
			});

			const activeBundles = await prisma.taskListShareBundle.count({
				where: {
					taskLists: { some: { taskListId: { in: taskListIds } } },
					isActive: true,
					OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
				},
			});

			let sharedGroups = 0;
			let pendingInvitations = 0;

			if (isAuthenticatedUser(ctx) && ctx.session?.user?.id) {
				sharedGroups = await prisma.taskListGroup.count({
					where: {
						members: {
							some: {
								userId: ctx.session.user.id,
								acceptedAt: { not: null },
							},
						},
					},
				});

				pendingInvitations = await prisma.taskListGroupMember2.count({
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
					tasksDueToday,
					tasksDuePeriod,
					completedPeriod,
					completedPreviousPeriod,
					overdueCount,
					completionRate,
				},
				upcoming,
				overdue,
				statusBreakdown,
				priorityBreakdown,
				byCategory,
				byTaskList,
				taskLists: taskListsWithStats,
				health: {
					tasksWithoutDueDate,
					tasksWithoutDescription,
					oldTasks,
					emptyTaskLists,
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
