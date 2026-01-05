import {
	authOrAnonProcedure,
	router,
	TRANSACTION_OPTIONS,
} from "@appstandard/api-core";
import prisma from "@appstandard/db";
import {
	taskListCreateSchema,
	taskListUpdateSchema,
} from "@appstandard-tasks/schemas";
import {
	generateTodoFile,
	parseTodoFile,
	type TaskInput,
	type TaskStatus as TodoStatus,
} from "@appstandard-tasks/todo-utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cleanupTaskListRelations } from "../lib/cleanup-task-list-relations";
import {
	buildOwnershipFilter,
	getUserUsage,
	verifyTaskListAccess,
} from "../middleware";

/**
 * Map database status to ICS status
 */
function mapStatusToIcs(status: string | null): TodoStatus | undefined {
	switch (status) {
		case "NEEDS_ACTION":
			return "NEEDS-ACTION";
		case "IN_PROCESS":
			return "IN-PROCESS";
		case "COMPLETED":
			return "COMPLETED";
		case "CANCELLED":
			return "CANCELLED";
		default:
			return undefined;
	}
}

/**
 * Map ICS status to database status
 */
function mapStatusFromIcs(
	status: TodoStatus | undefined,
): "NEEDS_ACTION" | "IN_PROCESS" | "COMPLETED" | "CANCELLED" {
	switch (status) {
		case "NEEDS-ACTION":
			return "NEEDS_ACTION";
		case "IN-PROCESS":
			return "IN_PROCESS";
		case "COMPLETED":
			return "COMPLETED";
		case "CANCELLED":
			return "CANCELLED";
		default:
			return "NEEDS_ACTION";
	}
}

/**
 * Map parsed class string to TaskClass enum
 */
function mapClassFromIcs(
	classValue: string | undefined,
): "PUBLIC" | "PRIVATE" | "CONFIDENTIAL" | undefined {
	if (!classValue) return undefined;
	const upper = classValue.toUpperCase();
	if (upper === "PUBLIC" || upper === "PRIVATE" || upper === "CONFIDENTIAL") {
		return upper;
	}
	return undefined;
}

/**
 * Map parsed role string to AttendeeRole enum
 */
function mapRoleFromIcs(
	role: string | undefined,
):
	| "CHAIR"
	| "REQ_PARTICIPANT"
	| "OPT_PARTICIPANT"
	| "NON_PARTICIPANT"
	| undefined {
	if (!role) return undefined;
	const upper = role.toUpperCase().replace(/-/g, "_");
	switch (upper) {
		case "CHAIR":
			return "CHAIR";
		case "REQ_PARTICIPANT":
			return "REQ_PARTICIPANT";
		case "OPT_PARTICIPANT":
			return "OPT_PARTICIPANT";
		case "NON_PARTICIPANT":
			return "NON_PARTICIPANT";
		default:
			return undefined;
	}
}

/**
 * Map parsed action string to AlarmAction enum
 */
function mapActionFromIcs(
	action: string | undefined,
): "DISPLAY" | "EMAIL" | "AUDIO" {
	if (!action) return "DISPLAY";
	const upper = action.toUpperCase();
	if (upper === "DISPLAY" || upper === "EMAIL" || upper === "AUDIO") {
		return upper;
	}
	return "DISPLAY"; // Default to DISPLAY
}

/**
 * Map parsed attendee status to AttendeeStatus enum
 */
function mapAttendeeStatusFromIcs(
	status: string | undefined,
):
	| "NEEDS_ACTION"
	| "ACCEPTED"
	| "DECLINED"
	| "TENTATIVE"
	| "DELEGATED"
	| undefined {
	if (!status) return undefined;
	const upper = status.toUpperCase().replace(/-/g, "_");
	switch (upper) {
		case "NEEDS_ACTION":
			return "NEEDS_ACTION";
		case "ACCEPTED":
			return "ACCEPTED";
		case "DECLINED":
			return "DECLINED";
		case "TENTATIVE":
			return "TENTATIVE";
		case "DELEGATED":
			return "DELEGATED";
		default:
			return undefined;
	}
}

export const taskListRouter = router({
	/**
	 * List all task lists for the current user
	 */
	list: authOrAnonProcedure.query(async ({ ctx }) => {
		const taskLists = await prisma.taskList.findMany({
			where: buildOwnershipFilter(ctx),
			include: {
				_count: {
					select: { tasks: true },
				},
				// Include upcoming tasks for preview (up to 3, ordered by due date)
				tasks: {
					where: {
						status: { not: "COMPLETED" },
					},
					orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
					take: 3,
					select: {
						id: true,
						title: true,
						dueDate: true,
						priority: true,
						status: true,
					},
				},
			},
			orderBy: { updatedAt: "desc" },
		});

		// Also get completed count for each list
		const completedCounts = await prisma.task.groupBy({
			by: ["taskListId"],
			where: {
				taskListId: { in: taskLists.map((l) => l.id) },
				status: "COMPLETED",
			},
			_count: true,
		});

		const completedCountMap = new Map(
			completedCounts.map((c) => [c.taskListId, c._count]),
		);

		return taskLists.map((list) => ({
			id: list.id,
			name: list.name,
			color: list.color,
			sourceUrl: list.sourceUrl,
			lastSyncedAt: list.lastSyncedAt,
			taskCount: list._count.tasks,
			completedCount: completedCountMap.get(list.id) || 0,
			createdAt: list.createdAt,
			updatedAt: list.updatedAt,
			// Preview of upcoming tasks
			tasks: list.tasks.map((task) => ({
				id: task.id,
				title: task.title,
				dueDate: task.dueDate,
				priority: task.priority,
				status: task.status,
			})),
		}));
	}),

	/**
	 * Get a single task list by ID
	 */
	getById: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.id, ctx);

			const taskList = await prisma.taskList.findUnique({
				where: { id: input.id },
				include: {
					_count: {
						select: { tasks: true },
					},
				},
			});

			if (!taskList) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task list not found",
				});
			}

			return {
				id: taskList.id,
				name: taskList.name,
				color: taskList.color,
				sourceUrl: taskList.sourceUrl,
				lastSyncedAt: taskList.lastSyncedAt,
				taskCount: taskList._count.tasks,
				createdAt: taskList.createdAt,
				updatedAt: taskList.updatedAt,
			};
		}),

	/**
	 * Create a new task list
	 */
	create: authOrAnonProcedure
		.input(taskListCreateSchema)
		.mutation(async ({ ctx, input }) => {
			const taskList = await prisma.taskList.create({
				data: {
					name: input.name,
					userId: ctx.userId,
					...(input.color !== undefined ? { color: input.color } : {}),
					...(input.sourceUrl !== undefined
						? { sourceUrl: input.sourceUrl }
						: {}),
				},
			});

			return taskList;
		}),

	/**
	 * Update a task list
	 */
	update: authOrAnonProcedure
		.input(taskListUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.id, ctx);

			const taskList = await prisma.taskList.update({
				where: { id: input.id },
				data: {
					...(input.name !== undefined && { name: input.name }),
					...(input.color !== undefined && { color: input.color }),
					...(input.sourceUrl !== undefined && { sourceUrl: input.sourceUrl }),
				},
			});

			return taskList;
		}),

	/**
	 * Delete a task list
	 */
	delete: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.id, ctx);

			// Use transaction to ensure atomicity of cleanup and deletion
			await prisma.$transaction(async (tx) => {
				// Cleanup all relations (TaskListShareLink, TaskShareBundleTaskList, TaskListGroupMember)
				await cleanupTaskListRelations([input.id], tx);
				// Delete task list (Tasks will be deleted via CASCADE)
				await tx.taskList.delete({
					where: { id: input.id },
				});
			}, TRANSACTION_OPTIONS);

			return { success: true };
		}),

	/**
	 * Bulk delete multiple task lists
	 */
	bulkDelete: authOrAnonProcedure
		.input(
			z.object({
				taskListIds: z.array(z.string()).min(1).max(100),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Get all task lists and verify they belong to the user
			const taskLists = await prisma.taskList.findMany({
				where: {
					id: { in: input.taskListIds },
					...buildOwnershipFilter(ctx),
				},
			});

			if (taskLists.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No task lists found",
				});
			}

			// Get accessible task list IDs
			const accessibleTaskListIds = taskLists.map((tl) => tl.id);

			// Use transaction to ensure atomicity of cleanup and deletion
			const result = await prisma.$transaction(async (tx) => {
				// Cleanup all relations (TaskListShareLink, TaskShareBundleTaskList, TaskListGroupMember)
				await cleanupTaskListRelations(accessibleTaskListIds, tx);
				// Delete task lists (Tasks will be deleted via CASCADE)
				return await tx.taskList.deleteMany({
					where: { id: { in: accessibleTaskListIds } },
				});
			}, TRANSACTION_OPTIONS);

			return {
				deletedCount: result.count,
				requestedCount: input.taskListIds.length,
			};
		}),

	/**
	 * Export a task list to ICS format
	 */
	exportIcs: authOrAnonProcedure
		.input(
			z.object({
				id: z.string(),
				status: z
					.enum(["NEEDS_ACTION", "IN_PROCESS", "COMPLETED", "CANCELLED"])
					.optional(),
				statuses: z
					.array(
						z.enum(["NEEDS_ACTION", "IN_PROCESS", "COMPLETED", "CANCELLED"]),
					)
					.optional(),
				priorities: z.array(z.enum(["high", "medium", "low"])).optional(),
				dueDateFrom: z.string().optional(),
				dueDateTo: z.string().optional(),
				completedOnly: z.boolean().optional(),
				incompleteOnly: z.boolean().optional(),
				futureOnly: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.id, ctx);

			// Build priority filter (high: 1-3, medium: 4-6, low: 7-9)
			const priorityRanges: Array<{ gte: number; lte: number }> = [];
			if (input.priorities) {
				for (const p of input.priorities) {
					if (p === "high") priorityRanges.push({ gte: 1, lte: 3 });
					if (p === "medium") priorityRanges.push({ gte: 4, lte: 6 });
					if (p === "low") priorityRanges.push({ gte: 7, lte: 9 });
				}
			}

			const taskList = await prisma.taskList.findUnique({
				where: { id: input.id },
				include: {
					tasks: {
						where: {
							// Single status (backwards compatible)
							...(input.status && { status: input.status }),
							// Multiple statuses
							...(input.statuses &&
								input.statuses.length > 0 && {
									status: { in: input.statuses },
								}),
							// Priority ranges
							...(priorityRanges.length > 0 && {
								OR: priorityRanges.map((range) => ({
									priority: { gte: range.gte, lte: range.lte },
								})),
							}),
							// Due date range
							...(input.dueDateFrom && {
								dueDate: { gte: new Date(input.dueDateFrom) },
							}),
							...(input.dueDateTo && {
								dueDate: { lte: new Date(input.dueDateTo) },
							}),
							// Completed/incomplete filters
							...(input.completedOnly && { status: "COMPLETED" }),
							...(input.incompleteOnly && {
								status: { not: "COMPLETED" },
							}),
							// Future only
							...(input.futureOnly && {
								dueDate: { gte: new Date() },
							}),
						},
						include: {
							categories: true,
							attendees: true,
							alarms: true,
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

			// Convert tasks to TaskInput format
			const tasksForExport: TaskInput[] = taskList.tasks.map((task) => ({
				uid: task.uid || undefined,
				summary: task.title,
				description: task.description || undefined,
				location: task.location || undefined,
				url: task.url || undefined,
				status: mapStatusToIcs(task.status),
				priority: task.priority || undefined,
				percentComplete: task.percentComplete || undefined,
				dtstart: task.startDate || undefined,
				due: task.dueDate || undefined,
				completed: task.completedAt || undefined,
				categories:
					task.categories.length > 0
						? task.categories.map((c) => c.category)
						: undefined,
				geoLatitude: task.geoLatitude || undefined,
				geoLongitude: task.geoLongitude || undefined,
				organizerName: task.organizerName || undefined,
				organizerEmail: task.organizerEmail || undefined,
				rrule: task.rrule || undefined,
				relatedTo: task.relatedTo || undefined,
				class: task.class || undefined,
				attendees:
					task.attendees.length > 0
						? task.attendees.map((a) => ({
								name: a.name || undefined,
								email: a.email,
								role: a.role || undefined,
								status: a.status || undefined,
								rsvp: a.rsvp,
							}))
						: undefined,
				alarms:
					task.alarms.length > 0
						? task.alarms.map((a) => ({
								trigger: a.trigger,
								action: a.action || undefined,
								description: a.description || undefined,
							}))
						: undefined,
			}));

			const icsContent = generateTodoFile(tasksForExport, {
				calendarName: taskList.name,
				prodId: "-//AppStandard Tasks//AppStandard Tasks//EN",
			});

			return {
				icsContent,
				taskListName: taskList.name,
				taskCount: tasksForExport.length,
			};
		}),

	/**
	 * Import tasks from ICS file content
	 */
	importIcs: authOrAnonProcedure
		.input(
			z.object({
				id: z.string(),
				icsContent: z.string(),
				replaceExisting: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await verifyTaskListAccess(input.id, ctx);

			const { tasks: parsedTasks, errors } = parseTodoFile(input.icsContent);

			if (parsedTasks.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						errors.length > 0
							? `Failed to parse ICS file: ${errors.join(", ")}`
							: "No tasks found in ICS file",
				});
			}

			// If replaceExisting, delete all existing tasks first
			if (input.replaceExisting) {
				await prisma.task.deleteMany({
					where: { taskListId: input.id },
				});
			}

			// Create tasks from parsed data
			const createdTasks = await Promise.all(
				parsedTasks.map(async (parsedTask) => {
					const categories = parsedTask.categories || [];

					return prisma.task.create({
						data: {
							taskListId: input.id,
							uid: parsedTask.uid,
							title: parsedTask.summary,
							description: parsedTask.description,
							location: parsedTask.location,
							url: parsedTask.url,
							status: mapStatusFromIcs(parsedTask.status),
							priority: parsedTask.priority,
							percentComplete: parsedTask.percentComplete,
							startDate: parsedTask.dtstart,
							dueDate: parsedTask.due,
							completedAt: parsedTask.completed,
							geoLatitude: parsedTask.geoLatitude,
							geoLongitude: parsedTask.geoLongitude,
							organizerName: parsedTask.organizerName,
							organizerEmail: parsedTask.organizerEmail,
							rrule: parsedTask.rrule,
							relatedTo: parsedTask.relatedTo,
							class: mapClassFromIcs(parsedTask.class),
							comment: parsedTask.comment,
							categories: {
								create: categories.map((category) => ({ category })),
							},
							...(parsedTask.attendees
								? {
										attendees: {
											create: parsedTask.attendees.map((a) => ({
												email: a.email,
												rsvp: a.rsvp ?? false,
												...(a.name !== undefined ? { name: a.name } : {}),
												...(mapRoleFromIcs(a.role) !== undefined
													? { role: mapRoleFromIcs(a.role) }
													: {}),
												...(mapAttendeeStatusFromIcs(a.status) !== undefined
													? { status: mapAttendeeStatusFromIcs(a.status) }
													: {}),
											})),
										},
									}
								: {}),
							...(parsedTask.alarms
								? {
										alarms: {
											create: parsedTask.alarms.map((a) => ({
												trigger: a.trigger,
												action: mapActionFromIcs(a.action),
												...(a.summary !== undefined
													? { summary: a.summary }
													: {}),
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
				}),
			);

			return {
				success: true,
				importedCount: createdTasks.length,
				errors: errors.length > 0 ? errors : undefined,
			};
		}),

	/**
	 * Get usage statistics for the current user
	 * Works for both authenticated and anonymous users
	 */
	getUsage: authOrAnonProcedure.query(async ({ ctx }) => {
		const usage = await getUserUsage(ctx);
		if (!usage) {
			return {
				taskListCount: 0,
				maxTaskLists: 10,
				taskCounts: {} as Record<string, number>,
				maxTasksPerTaskList: 500,
			};
		}

		// Get task counts per task list
		const taskLists = await prisma.taskList.findMany({
			where: buildOwnershipFilter(ctx),
			select: {
				id: true,
				_count: { select: { tasks: true } },
			},
		});

		const taskCounts: Record<string, number> = {};
		for (const list of taskLists) {
			taskCounts[list.id] = list._count.tasks;
		}

		return {
			taskListCount: usage.taskListCount,
			maxTaskLists: usage.maxTaskLists,
			taskCounts,
			maxTasksPerTaskList: usage.maxTasksPerList,
		};
	}),
});
