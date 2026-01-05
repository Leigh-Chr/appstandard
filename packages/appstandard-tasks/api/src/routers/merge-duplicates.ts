/**
 * Task list merge and duplicate cleaning operations
 */

import { authOrAnonProcedure, router } from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { deduplicateTasks, getDuplicateIds } from "../lib/duplicate-detection";
import { buildOwnershipFilter, verifyTaskListAccess } from "../middleware";

export const mergeDuplicatesRouter = router({
	/**
	 * Merge multiple task lists into a new one
	 */
	merge: authOrAnonProcedure
		.input(
			z.object({
				taskListIds: z.array(z.string()).min(2).max(10),
				name: z.string().min(1).max(200),
				removeDuplicates: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Fetch all task lists
			const taskLists = await prisma.taskList.findMany({
				where: {
					id: { in: input.taskListIds },
					...buildOwnershipFilter(ctx),
				},
				include: {
					tasks: true,
				},
			});

			if (taskLists.length !== input.taskListIds.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "One or more task lists not found",
				});
			}

			// Collect all tasks
			const allTasks = taskLists.flatMap((list) => list.tasks);

			// Remove duplicates if requested
			let tasksToMerge = allTasks;
			if (input.removeDuplicates) {
				const { unique } = deduplicateTasks(allTasks, {
					useUid: true,
					useTitle: true,
					dateTolerance: 60000, // 1 minute tolerance
				});
				tasksToMerge = unique;
			}

			// Create merged task list
			const mergedTaskList = await prisma.taskList.create({
				data: {
					name: input.name,
					userId: ctx.session?.user?.id || ctx.anonymousId || null,
				},
			});

			// Create all tasks
			if (tasksToMerge.length > 0) {
				await prisma.task.createMany({
					data: tasksToMerge.map((task) => ({
						taskListId: mergedTaskList.id,
						title: task.title,
						description: task.description,
						status: task.status,
						priority: task.priority,
						percentComplete: task.percentComplete,
						startDate: task.startDate,
						dueDate: task.dueDate,
						completedAt: task.completedAt,
						location: task.location,
						geoLatitude: task.geoLatitude,
						geoLongitude: task.geoLongitude,
						organizerName: task.organizerName,
						organizerEmail: task.organizerEmail,
						uid: task.uid,
						dtstamp: task.dtstamp,
						created: task.created,
						lastModified: task.lastModified,
						sequence: task.sequence,
						class: task.class,
						url: task.url,
						comment: task.comment,
						rrule: task.rrule,
						color: task.color,
					})),
				});
			}

			return {
				taskList: mergedTaskList,
				mergedTasks: tasksToMerge.length,
				removedDuplicates: allTasks.length - tasksToMerge.length,
			};
		}),

	/**
	 * Clean duplicates from a task list
	 */
	cleanDuplicates: authOrAnonProcedure
		.input(z.object({ taskListId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.taskListId, ctx);

			const taskList = await prisma.taskList.findUnique({
				where: { id: input.taskListId },
				include: {
					tasks: true,
				},
			});

			if (!taskList) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied to this task list",
				});
			}

			// Detect duplicates
			const duplicateIds = getDuplicateIds(taskList.tasks, {
				useUid: true,
				useTitle: true,
				dateTolerance: 60000, // 1 minute tolerance
			});

			// Delete duplicates
			if (duplicateIds.length > 0) {
				await prisma.task.deleteMany({
					where: {
						id: { in: duplicateIds },
					},
				});
			}

			return {
				removedCount: duplicateIds.length,
				remainingTasks: taskList.tasks.length - duplicateIds.length,
			};
		}),

	/**
	 * Detect potential duplicates without removing them
	 */
	detectDuplicates: authOrAnonProcedure
		.input(z.object({ taskListId: z.string() }))
		.query(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.taskListId, ctx);

			const taskList = await prisma.taskList.findUnique({
				where: { id: input.taskListId },
				include: {
					tasks: {
						select: {
							id: true,
							uid: true,
							title: true,
							dueDate: true,
							startDate: true,
							status: true,
						},
					},
				},
			});

			if (!taskList) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task list not found",
				});
			}

			const { duplicates } = deduplicateTasks(taskList.tasks, {
				useUid: true,
				useTitle: true,
				dateTolerance: 60000,
			});

			return {
				totalTasks: taskList.tasks.length,
				duplicateCount: duplicates.length,
				duplicates: duplicates.map((t) => ({
					id: t.id,
					title: t.title,
					dueDate: t.dueDate,
					status: t.status,
				})),
			};
		}),
});
