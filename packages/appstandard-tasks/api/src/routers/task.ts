import { authOrAnonProcedure, router } from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { taskCreateSchema, taskUpdateSchema } from "@appstandard-tasks/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { verifyTaskAccess, verifyTaskListAccess } from "../middleware";

/**
 * Transform task categories string to array
 */
function parseCategories(categories: string | null | undefined): string[] {
	if (!categories) return [];
	return categories
		.split(",")
		.map((c) => c.trim())
		.filter((c) => c.length > 0);
}

export const taskRouter = router({
	/**
	 * List all tasks in a task list
	 */
	list: authOrAnonProcedure
		.input(
			z.object({
				taskListId: z.string(),
				status: z
					.enum(["NEEDS_ACTION", "IN_PROCESS", "COMPLETED", "CANCELLED"])
					.optional(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.taskListId, ctx);

			const tasks = await prisma.task.findMany({
				where: {
					taskListId: input.taskListId,
					...(input.status && { status: input.status }),
				},
				orderBy: [
					{ priority: "asc" },
					{ dueDate: "asc" },
					{ createdAt: "desc" },
				],
				take: input.limit,
				skip: input.offset,
				include: {
					_count: {
						select: { subtasks: true },
					},
				},
			});

			return tasks.map((task) => ({
				id: task.id,
				taskListId: task.taskListId,
				title: task.title,
				description: task.description,
				status: task.status,
				priority: task.priority,
				percentComplete: task.percentComplete,
				startDate: task.startDate,
				dueDate: task.dueDate,
				completedAt: task.completedAt,
				location: task.location,
				color: task.color,
				relatedTo: task.relatedTo,
				subtaskCount: task._count.subtasks,
				createdAt: task.createdAt,
				updatedAt: task.updatedAt,
			}));
		}),

	/**
	 * Get a single task by ID
	 */
	getById: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			await verifyTaskAccess(input.id, ctx);

			const task = await prisma.task.findUnique({
				where: { id: input.id },
				include: {
					attendees: true,
					alarms: true,
					categories: true,
					subtasks: {
						select: {
							id: true,
							title: true,
							status: true,
							priority: true,
							dueDate: true,
						},
					},
				},
			});

			if (!task) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task not found",
				});
			}

			return task;
		}),

	/**
	 * Create a new task
	 */
	create: authOrAnonProcedure
		.input(taskCreateSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.taskListId, ctx);

			const categories = parseCategories(input.categories);

			const task = await prisma.task.create({
				data: {
					taskListId: input.taskListId,
					title: input.title,
					description: input.description,
					status: input.status || "NEEDS_ACTION",
					priority: input.priority,
					percentComplete: input.percentComplete,
					startDate: input.startDate,
					dueDate: input.dueDate,
					completedAt: input.completedAt,
					location: input.location,
					geoLatitude: input.geoLatitude,
					geoLongitude: input.geoLongitude,
					organizerName: input.organizerName,
					organizerEmail: input.organizerEmail,
					uid: input.uid,
					class: input.class,
					url: input.url,
					comment: input.comment,
					rrule: input.rrule,
					recurrenceId: input.recurrenceId,
					relatedTo: input.relatedTo,
					color: input.color,
					// Create categories
					categories: {
						create: categories.map((category) => ({ category })),
					},
					// Create attendees
					...(input.attendees
						? {
								attendees: {
									create: input.attendees.map((a) => ({
										email: a.email,
										rsvp: a.rsvp ?? false,
										...(a.name !== undefined ? { name: a.name } : {}),
										...(a.role !== undefined ? { role: a.role } : {}),
										...(a.status !== undefined ? { status: a.status } : {}),
									})),
								},
							}
						: {}),
					// Create alarms
					...(input.alarms
						? {
								alarms: {
									create: input.alarms.map((a) => ({
										trigger: a.trigger,
										action: a.action,
										...(a.summary !== undefined ? { summary: a.summary } : {}),
										...(a.description !== undefined
											? { description: a.description }
											: {}),
										...(a.duration !== undefined
											? { duration: a.duration }
											: {}),
										...(a.repeat !== undefined ? { repeat: a.repeat } : {}),
									})),
								},
							}
						: {}),
				},
			});

			return task;
		}),

	/**
	 * Update a task
	 */
	update: authOrAnonProcedure
		.input(taskUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyTaskAccess(input.id, ctx);

			const categories = input.categories
				? parseCategories(input.categories)
				: undefined;

			const task = await prisma.task.update({
				where: { id: input.id },
				data: {
					...(input.title !== undefined && { title: input.title }),
					...(input.description !== undefined && {
						description: input.description,
					}),
					...(input.status !== undefined && { status: input.status }),
					...(input.priority !== undefined && { priority: input.priority }),
					...(input.percentComplete !== undefined && {
						percentComplete: input.percentComplete,
					}),
					...(input.startDate !== undefined && { startDate: input.startDate }),
					...(input.dueDate !== undefined && { dueDate: input.dueDate }),
					...(input.completedAt !== undefined && {
						completedAt: input.completedAt,
					}),
					...(input.location !== undefined && { location: input.location }),
					...(input.geoLatitude !== undefined && {
						geoLatitude: input.geoLatitude,
					}),
					...(input.geoLongitude !== undefined && {
						geoLongitude: input.geoLongitude,
					}),
					...(input.color !== undefined && { color: input.color }),
					...(input.url !== undefined && { url: input.url }),
					...(input.relatedTo !== undefined && { relatedTo: input.relatedTo }),
					// Update categories if provided
					...(categories !== undefined && {
						categories: {
							deleteMany: {},
							create: categories.map((category) => ({ category })),
						},
					}),
				},
			});

			return task;
		}),

	/**
	 * Delete a task
	 */
	delete: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await verifyTaskAccess(input.id, ctx);

			await prisma.task.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	/**
	 * Mark task as completed
	 */
	complete: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await verifyTaskAccess(input.id, ctx);

			const task = await prisma.task.update({
				where: { id: input.id },
				data: {
					status: "COMPLETED",
					completedAt: new Date(),
					percentComplete: 100,
				},
			});

			return task;
		}),

	/**
	 * Reopen a completed task
	 */
	reopen: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await verifyTaskAccess(input.id, ctx);

			const task = await prisma.task.update({
				where: { id: input.id },
				data: {
					status: "NEEDS_ACTION",
					completedAt: null,
					percentComplete: 0,
				},
			});

			return task;
		}),

	/**
	 * Bulk delete multiple tasks
	 */
	bulkDelete: authOrAnonProcedure
		.input(
			z.object({
				taskIds: z.array(z.string()).min(1).max(100),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Get all tasks and verify they belong to task lists the user owns
			const tasks = await prisma.task.findMany({
				where: { id: { in: input.taskIds } },
				include: { taskList: true },
			});

			if (tasks.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No tasks found",
				});
			}

			// Get unique task list IDs
			const taskListIds = [...new Set(tasks.map((t) => t.taskListId))];

			// Verify access to all task lists
			const accessibleTaskLists = await prisma.taskList.findMany({
				where: {
					id: { in: taskListIds },
					userId: ctx.userId,
				},
			});

			const accessibleTaskListIds = new Set(
				accessibleTaskLists.map((tl) => tl.id),
			);

			// Filter to only tasks the user has access to
			const accessibleTaskIds = tasks
				.filter((t) => accessibleTaskListIds.has(t.taskListId))
				.map((t) => t.id);

			if (accessibleTaskIds.length === 0) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to these tasks",
				});
			}

			// Delete accessible tasks
			const result = await prisma.task.deleteMany({
				where: { id: { in: accessibleTaskIds } },
			});

			return {
				deletedCount: result.count,
				requestedCount: input.taskIds.length,
			};
		}),

	/**
	 * Duplicate a task
	 */
	duplicate: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await verifyTaskAccess(input.id, ctx);

			// Get the original task with all related data
			const original = await prisma.task.findUnique({
				where: { id: input.id },
				include: {
					categories: true,
					attendees: true,
					alarms: true,
				},
			});

			if (!original) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task not found",
				});
			}

			// Create a duplicate
			const duplicate = await prisma.task.create({
				data: {
					taskListId: original.taskListId,
					title: `${original.title} (copy)`,
					description: original.description,
					status: "NEEDS_ACTION", // Reset status for the copy
					priority: original.priority,
					percentComplete: 0, // Reset progress
					startDate: original.startDate,
					dueDate: original.dueDate,
					location: original.location,
					geoLatitude: original.geoLatitude,
					geoLongitude: original.geoLongitude,
					organizerName: original.organizerName,
					organizerEmail: original.organizerEmail,
					class: original.class,
					url: original.url,
					comment: original.comment,
					rrule: original.rrule,
					relatedTo: original.relatedTo,
					color: original.color,
					// Duplicate categories
					categories: {
						create: original.categories.map((c) => ({ category: c.category })),
					},
					// Duplicate attendees
					attendees: {
						create: original.attendees.map((a) => ({
							name: a.name,
							email: a.email,
							role: a.role,
							status: a.status,
							rsvp: a.rsvp,
						})),
					},
					// Duplicate alarms
					alarms: {
						create: original.alarms.map((a) => ({
							trigger: a.trigger,
							action: a.action,
							summary: a.summary,
							description: a.description,
							duration: a.duration,
							repeat: a.repeat,
						})),
					},
				},
			});

			return duplicate;
		}),

	/**
	 * Bulk move tasks to another task list
	 */
	bulkMove: authOrAnonProcedure
		.input(
			z.object({
				taskIds: z.array(z.string()).min(1).max(100),
				targetTaskListId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify access to target task list
			const targetTaskList = await prisma.taskList.findFirst({
				where: {
					id: input.targetTaskListId,
					userId: ctx.userId,
				},
			});

			if (!targetTaskList) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Destination task list not found",
				});
			}

			// Get all tasks
			const tasks = await prisma.task.findMany({
				where: { id: { in: input.taskIds } },
				include: { taskList: true },
			});

			if (tasks.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No tasks found",
				});
			}

			// Get source task list IDs
			const sourceTaskListIds = [...new Set(tasks.map((t) => t.taskListId))];

			// Verify access to all source task lists
			const accessibleTaskLists = await prisma.taskList.findMany({
				where: {
					id: { in: sourceTaskListIds },
					userId: ctx.userId,
				},
			});

			const accessibleTaskListIds = new Set(
				accessibleTaskLists.map((tl) => tl.id),
			);

			// Filter to only tasks the user has access to
			const accessibleTaskIds = tasks
				.filter((t) => accessibleTaskListIds.has(t.taskListId))
				.map((t) => t.id);

			if (accessibleTaskIds.length === 0) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to these tasks",
				});
			}

			// Move tasks to target task list
			const result = await prisma.task.updateMany({
				where: { id: { in: accessibleTaskIds } },
				data: { taskListId: input.targetTaskListId },
			});

			return {
				movedCount: result.count,
				requestedCount: input.taskIds.length,
				targetTaskListId: input.targetTaskListId,
				targetTaskListName: targetTaskList.name,
			};
		}),
});
