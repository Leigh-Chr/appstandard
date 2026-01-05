import { randomBytes } from "node:crypto";
import {
	authOrAnonProcedure,
	publicProcedure,
	router,
} from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { TRPCError } from "@trpc/server";
import z from "zod";

/**
 * Generate a secure random token for share links
 * Uses URL-safe base64 encoding
 */
function generateShareToken(): string {
	return randomBytes(32).toString("base64url");
}

export const shareRouter = router({
	/**
	 * PUBLIC: Detect share type by token (without throwing errors)
	 */
	detectType: publicProcedure
		.input(z.object({ token: z.string() }))
		.query(async ({ input }) => {
			// Try to find a single task list share link
			const shareLink = await prisma.taskListShareLink.findUnique({
				where: { token: input.token },
				select: {
					id: true,
					isActive: true,
					expiresAt: true,
				},
			});

			if (shareLink) {
				if (!shareLink.isActive) {
					return { type: null, reason: "disabled" as const };
				}
				if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
					return { type: null, reason: "expired" as const };
				}
				return { type: "single" as const };
			}

			// Try to find a bundle
			const bundle = await prisma.taskListShareBundle.findUnique({
				where: { token: input.token },
				select: {
					id: true,
					isActive: true,
					expiresAt: true,
				},
			});

			if (bundle) {
				if (!bundle.isActive) {
					return { type: null, reason: "disabled" as const };
				}
				if (bundle.expiresAt && bundle.expiresAt < new Date()) {
					return { type: null, reason: "expired" as const };
				}
				return { type: "bundle" as const };
			}

			return { type: null, reason: "not_found" as const };
		}),

	/**
	 * Create a new share link for a task list
	 */
	create: authOrAnonProcedure
		.input(
			z.object({
				taskListId: z.string(),
				name: z.string().max(100).optional(),
				expiresAt: z.string().datetime().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const taskList = await prisma.taskList.findFirst({
				where: {
					id: input.taskListId,
					userId: ctx.userId,
				},
			});

			if (!taskList) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task list not found",
				});
			}

			// Count existing share links
			const shareLinkCount = await prisma.taskListShareLink.count({
				where: { taskListId: input.taskListId },
			});

			const MAX_SHARE_LINKS = 10;
			if (shareLinkCount >= MAX_SHARE_LINKS) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: `Limit reached: maximum ${MAX_SHARE_LINKS} share links per task list.`,
				});
			}

			const token = generateShareToken();

			const shareLink = await prisma.taskListShareLink.create({
				data: {
					taskListId: input.taskListId,
					token,
					name: input.name || null,
					expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
				},
			});

			return {
				id: shareLink.id,
				token: shareLink.token,
				name: shareLink.name,
				isActive: shareLink.isActive,
				expiresAt: shareLink.expiresAt,
				createdAt: shareLink.createdAt,
			};
		}),

	/**
	 * List all share links for a task list
	 */
	list: authOrAnonProcedure
		.input(z.object({ taskListId: z.string() }))
		.query(async ({ ctx, input }) => {
			const taskList = await prisma.taskList.findFirst({
				where: {
					id: input.taskListId,
					userId: ctx.userId,
				},
			});

			if (!taskList) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task list not found",
				});
			}

			const shareLinks = await prisma.taskListShareLink.findMany({
				where: { taskListId: input.taskListId },
				orderBy: { createdAt: "desc" },
			});

			return shareLinks.map((link) => ({
				id: link.id,
				token: link.token,
				name: link.name,
				isActive: link.isActive,
				expiresAt: link.expiresAt,
				accessCount: link.accessCount,
				lastAccessedAt: link.lastAccessedAt,
				createdAt: link.createdAt,
			}));
		}),

	/**
	 * Update a share link
	 */
	update: authOrAnonProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().max(100).optional().nullable(),
				isActive: z.boolean().optional(),
				expiresAt: z.string().datetime().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const shareLink = await prisma.taskListShareLink.findUnique({
				where: { id: input.id },
				include: { taskList: true },
			});

			if (!shareLink) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Share link not found",
				});
			}

			if (shareLink.taskList.userId !== ctx.userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update this share link",
				});
			}

			const updateData: {
				name?: string | null;
				isActive?: boolean;
				expiresAt?: Date | null;
			} = {};

			if (input.name !== undefined) updateData.name = input.name;
			if (input.isActive !== undefined) updateData.isActive = input.isActive;
			if (input.expiresAt !== undefined) {
				updateData.expiresAt = input.expiresAt
					? new Date(input.expiresAt)
					: null;
			}

			const updated = await prisma.taskListShareLink.update({
				where: { id: input.id },
				data: updateData,
			});

			return {
				id: updated.id,
				token: updated.token,
				name: updated.name,
				isActive: updated.isActive,
				expiresAt: updated.expiresAt,
				accessCount: updated.accessCount,
				createdAt: updated.createdAt,
			};
		}),

	/**
	 * Delete a share link
	 */
	delete: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const shareLink = await prisma.taskListShareLink.findUnique({
				where: { id: input.id },
				include: { taskList: true },
			});

			if (!shareLink) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Share link not found",
				});
			}

			if (shareLink.taskList.userId !== ctx.userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to delete this share link",
				});
			}

			await prisma.taskListShareLink.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	/**
	 * PUBLIC: Access a shared task list by token
	 * Returns ICS content for download
	 */
	getByToken: publicProcedure
		.input(z.object({ token: z.string() }))
		.query(async ({ input }) => {
			const shareLink = await prisma.taskListShareLink.findUnique({
				where: { token: input.token },
			});

			if (!shareLink) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Share link not found or expired",
				});
			}

			if (!shareLink.isActive) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This share link has been disabled",
				});
			}

			if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This share link has expired",
				});
			}

			const taskList = await prisma.taskList.findUnique({
				where: { id: shareLink.taskListId },
				include: {
					tasks: {
						include: {
							attendees: true,
							alarms: true,
							categories: true,
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

			// Update access stats (fire and forget)
			prisma.taskListShareLink
				.update({
					where: { id: shareLink.id },
					data: {
						accessCount: { increment: 1 },
						lastAccessedAt: new Date(),
					},
				})
				.catch(() => {});

			// Import the generator
			const { generateTodoFile } = await import(
				"@appstandard-tasks/todo-utils"
			);

			const tasksForExport = taskList.tasks.map((task) => ({
				uid: task.uid || task.id,
				summary: task.title,
				description: task.description || undefined,
				dtstart: task.startDate || undefined,
				due: task.dueDate || undefined,
				completed: task.completedAt || undefined,
				status: task.status as
					| "NEEDS-ACTION"
					| "IN-PROCESS"
					| "COMPLETED"
					| "CANCELLED"
					| undefined,
				percentComplete: task.percentComplete || undefined,
				priority: task.priority || undefined,
				location: task.location || undefined,
				url: task.url || undefined,
				class: task.class as "PUBLIC" | "PRIVATE" | "CONFIDENTIAL" | undefined,
				rrule: task.rrule || undefined,
				relatedTo: task.relatedTo || undefined,
				geoLatitude: task.geoLatitude || undefined,
				geoLongitude: task.geoLongitude || undefined,
				organizerName: task.organizerName || undefined,
				organizerEmail: task.organizerEmail || undefined,
				categories: task.categories.map((c) => c.category),
				attendees: task.attendees.map((a) => ({
					email: a.email,
					name: a.name || undefined,
					role: a.role as
						| "CHAIR"
						| "REQ-PARTICIPANT"
						| "OPT-PARTICIPANT"
						| "NON-PARTICIPANT"
						| undefined,
					status: a.status as
						| "NEEDS-ACTION"
						| "ACCEPTED"
						| "DECLINED"
						| "TENTATIVE"
						| "DELEGATED"
						| undefined,
					rsvp: a.rsvp || undefined,
				})),
				alarms: task.alarms.map((a) => ({
					trigger: a.trigger,
					action: a.action as "DISPLAY" | "EMAIL" | "AUDIO" | undefined,
					description: a.description || undefined,
				})),
			}));

			const icsContent = generateTodoFile(tasksForExport, {
				calendarName: taskList.name,
			});

			return {
				icsContent,
				taskListName: taskList.name,
				taskCount: taskList.tasks.length,
			};
		}),

	/**
	 * PUBLIC: Get task list info by token
	 */
	getInfoByToken: publicProcedure
		.input(z.object({ token: z.string() }))
		.query(async ({ input }) => {
			const shareLink = await prisma.taskListShareLink.findUnique({
				where: { token: input.token },
			});

			if (!shareLink) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Share link not found or expired",
				});
			}

			if (!shareLink.isActive) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This share link has been disabled",
				});
			}

			if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This share link has expired",
				});
			}

			const taskList = await prisma.taskList.findUnique({
				where: { id: shareLink.taskListId },
				select: {
					name: true,
					color: true,
					_count: { select: { tasks: true } },
				},
			});

			if (!taskList) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task list not found",
				});
			}

			return {
				taskListName: taskList.name,
				taskListColor: taskList.color,
				taskCount: taskList._count.tasks,
				shareName: shareLink.name,
			};
		}),

	// ========== BUNDLE ENDPOINTS ==========
	bundle: {
		/**
		 * Create a new share bundle
		 */
		create: authOrAnonProcedure
			.input(
				z
					.object({
						groupId: z.string().optional(),
						taskListIds: z.array(z.string()).min(1).max(15).optional(),
						name: z.string().max(200).optional(),
						expiresAt: z.string().datetime().optional(),
						removeDuplicates: z.boolean().default(false),
					})
					.refine(
						(data) =>
							data.groupId || (data.taskListIds && data.taskListIds.length > 0),
						{
							message: "Either groupId or taskListIds must be provided",
						},
					),
			)
			.mutation(async ({ ctx, input }) => {
				let taskListIds: string[];

				if (input.groupId) {
					const group = await prisma.taskListGroup.findFirst({
						where: {
							id: input.groupId,
							userId: ctx.userId,
						},
						include: {
							taskLists: { orderBy: { order: "asc" } },
						},
					});

					if (!group) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Group not found",
						});
					}

					taskListIds = group.taskLists.map((tl) => tl.taskListId);
				} else {
					taskListIds = input.taskListIds || [];
				}

				if (taskListIds.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No task lists to share",
					});
				}

				// Verify ownership
				const ownedTaskLists = await prisma.taskList.findMany({
					where: {
						id: { in: taskListIds },
						userId: ctx.userId,
					},
				});

				if (ownedTaskLists.length !== taskListIds.length) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "One or more task lists not found",
					});
				}

				const token = generateShareToken();
				const bundleName =
					input.name?.trim() ||
					`${taskListIds.length} task lists - ${new Date().toLocaleDateString()}`;

				const bundle = await prisma.taskListShareBundle.create({
					data: {
						token,
						name: bundleName,
						groupId: input.groupId || null,
						expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
						removeDuplicates: input.removeDuplicates,
						taskLists: {
							create: taskListIds.map((taskListId, index) => ({
								taskListId,
								order: index,
							})),
						},
					},
					include: { taskLists: true },
				});

				return {
					id: bundle.id,
					token: bundle.token,
					name: bundle.name,
					isActive: bundle.isActive,
					expiresAt: bundle.expiresAt,
					removeDuplicates: bundle.removeDuplicates,
					taskListCount: bundle.taskLists.length,
					createdAt: bundle.createdAt,
				};
			}),

		/**
		 * List all share bundles
		 */
		list: authOrAnonProcedure.query(async ({ ctx }) => {
			const userTaskLists = await prisma.taskList.findMany({
				where: { userId: ctx.userId },
				select: { id: true },
			});

			const userTaskListIds = userTaskLists.map((tl) => tl.id);

			const bundles = await prisma.taskListShareBundle.findMany({
				where: {
					taskLists: {
						some: { taskListId: { in: userTaskListIds } },
					},
				},
				include: { taskLists: true },
				orderBy: { createdAt: "desc" },
			});

			const ownedBundles = bundles.filter((bundle) =>
				bundle.taskLists.every((tl) => userTaskListIds.includes(tl.taskListId)),
			);

			return ownedBundles.map((bundle) => ({
				id: bundle.id,
				token: bundle.token,
				name: bundle.name,
				isActive: bundle.isActive,
				expiresAt: bundle.expiresAt,
				removeDuplicates: bundle.removeDuplicates,
				accessCount: bundle.accessCount,
				lastAccessedAt: bundle.lastAccessedAt,
				createdAt: bundle.createdAt,
				taskListCount: bundle.taskLists.length,
			}));
		}),

		/**
		 * Update a bundle
		 */
		update: authOrAnonProcedure
			.input(
				z.object({
					id: z.string(),
					name: z.string().max(200).optional(),
					isActive: z.boolean().optional(),
					expiresAt: z.string().datetime().nullable().optional(),
					removeDuplicates: z.boolean().optional(),
				}),
			)
			.mutation(async ({ ctx, input }) => {
				const bundle = await prisma.taskListShareBundle.findUnique({
					where: { id: input.id },
					include: { taskLists: true },
				});

				if (!bundle) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Bundle not found",
					});
				}

				// Verify ownership
				const userTaskLists = await prisma.taskList.findMany({
					where: {
						id: { in: bundle.taskLists.map((tl) => tl.taskListId) },
						userId: ctx.userId,
					},
				});

				if (userTaskLists.length !== bundle.taskLists.length) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to update this bundle",
					});
				}

				const updateData: {
					name?: string;
					isActive?: boolean;
					expiresAt?: Date | null;
					removeDuplicates?: boolean;
				} = {};

				if (input.name !== undefined) updateData.name = input.name.trim();
				if (input.isActive !== undefined) updateData.isActive = input.isActive;
				if (input.expiresAt !== undefined) {
					updateData.expiresAt = input.expiresAt
						? new Date(input.expiresAt)
						: null;
				}
				if (input.removeDuplicates !== undefined) {
					updateData.removeDuplicates = input.removeDuplicates;
				}

				const updated = await prisma.taskListShareBundle.update({
					where: { id: input.id },
					data: updateData,
				});

				return {
					id: updated.id,
					token: updated.token,
					name: updated.name,
					isActive: updated.isActive,
					expiresAt: updated.expiresAt,
					removeDuplicates: updated.removeDuplicates,
					createdAt: updated.createdAt,
				};
			}),

		/**
		 * Delete a bundle
		 */
		delete: authOrAnonProcedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ ctx, input }) => {
				const bundle = await prisma.taskListShareBundle.findUnique({
					where: { id: input.id },
					include: { taskLists: true },
				});

				if (!bundle) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Bundle not found",
					});
				}

				// Verify ownership
				const userTaskLists = await prisma.taskList.findMany({
					where: {
						id: { in: bundle.taskLists.map((tl) => tl.taskListId) },
						userId: ctx.userId,
					},
				});

				if (userTaskLists.length !== bundle.taskLists.length) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to delete this bundle",
					});
				}

				await prisma.taskListShareBundle.delete({
					where: { id: input.id },
				});

				return { success: true };
			}),

		/**
		 * PUBLIC: Get bundle by token
		 */
		getByToken: publicProcedure
			.input(z.object({ token: z.string() }))
			.query(async ({ input }) => {
				const bundle = await prisma.taskListShareBundle.findUnique({
					where: { token: input.token },
					include: {
						taskLists: { orderBy: { order: "asc" } },
					},
				});

				if (!bundle) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Bundle not found or expired",
					});
				}

				if (!bundle.isActive) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "This share bundle has been disabled",
					});
				}

				if (bundle.expiresAt && bundle.expiresAt < new Date()) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "This share bundle has expired",
					});
				}

				const taskListIds = bundle.taskLists.map((tl) => tl.taskListId);
				const taskLists = await prisma.taskList.findMany({
					where: { id: { in: taskListIds } },
					include: {
						tasks: {
							include: {
								attendees: true,
								alarms: true,
								categories: true,
							},
						},
					},
				});

				if (taskLists.length === 0) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "This bundle is no longer available",
					});
				}

				// Update access stats
				prisma.taskListShareBundle
					.update({
						where: { id: bundle.id },
						data: {
							accessCount: { increment: 1 },
							lastAccessedAt: new Date(),
						},
					})
					.catch(() => {});

				const { generateTodoFile } = await import(
					"@appstandard-tasks/todo-utils"
				);

				const allTasks = taskLists.flatMap((taskList) =>
					taskList.tasks.map((task) => ({
						uid: task.uid || task.id,
						summary: task.title,
						description: task.description || undefined,
						dtstart: task.startDate || undefined,
						due: task.dueDate || undefined,
						completed: task.completedAt || undefined,
						status: task.status as
							| "NEEDS-ACTION"
							| "IN-PROCESS"
							| "COMPLETED"
							| "CANCELLED"
							| undefined,
						percentComplete: task.percentComplete || undefined,
						priority: task.priority || undefined,
						location: task.location || undefined,
						categories: task.categories.map((c) => c.category),
						attendees: task.attendees.map((a) => ({
							email: a.email,
							name: a.name || undefined,
						})),
						alarms: task.alarms.map((a) => ({
							trigger: a.trigger,
							action: a.action as "DISPLAY" | "EMAIL" | "AUDIO" | undefined,
						})),
					})),
				);

				// TODO: Implement duplicate removal if bundle.removeDuplicates

				const icsContent = generateTodoFile(allTasks, {
					calendarName: bundle.name || "Shared Tasks",
				});

				return {
					icsContent,
					bundleName: bundle.name,
					taskCount: allTasks.length,
					taskListCount: taskLists.length,
				};
			}),

		/**
		 * PUBLIC: Get bundle info by token
		 */
		getInfoByToken: publicProcedure
			.input(z.object({ token: z.string() }))
			.query(async ({ input }) => {
				const bundle = await prisma.taskListShareBundle.findUnique({
					where: { token: input.token },
					include: { taskLists: true },
				});

				if (!bundle) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Bundle not found or expired",
					});
				}

				if (!bundle.isActive) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "This share bundle has been disabled",
					});
				}

				if (bundle.expiresAt && bundle.expiresAt < new Date()) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "This share bundle has expired",
					});
				}

				const taskListIds = bundle.taskLists.map((tl) => tl.taskListId);
				const taskLists = await prisma.taskList.findMany({
					where: { id: { in: taskListIds } },
					select: {
						id: true,
						name: true,
						color: true,
						_count: { select: { tasks: true } },
					},
				});

				const totalTasks = taskLists.reduce(
					(sum, tl) => sum + tl._count.tasks,
					0,
				);

				return {
					bundleName: bundle.name,
					taskListCount: taskLists.length,
					totalTasks,
					removeDuplicates: bundle.removeDuplicates,
					taskLists: taskLists.map((tl) => ({
						id: tl.id,
						name: tl.name,
						color: tl.color,
						taskCount: tl._count.tasks,
					})),
				};
			}),
	},
});
