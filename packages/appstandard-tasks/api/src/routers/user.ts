import { protectedProcedure, router } from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { TRPCError } from "@trpc/server";
import { getUserUsage } from "../middleware";
import { exportDataRateLimit } from "../middleware/rate-limit";

export const userRouter = router({
	/**
	 * Get current user's usage information
	 * Authenticated users have generous limits (100 task lists, 2000 tasks)
	 */
	getUsage: protectedProcedure.query(async ({ ctx }) => {
		const usage = await getUserUsage(ctx);
		if (!usage) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Unable to fetch usage statistics",
			});
		}

		return {
			isAuthenticated: usage.isAuthenticated,
			usage: {
				taskListCount: usage.taskListCount,
				maxTaskLists: usage.maxTaskLists,
				maxTasksPerList: usage.maxTasksPerList,
			},
		};
	}),

	/**
	 * Export all user data (RGPD - Right to Data Portability)
	 * Returns a JSON structure with all user's task lists, tasks, groups, and share links
	 */
	exportData: protectedProcedure
		.use(exportDataRateLimit)
		.query(async ({ ctx }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be authenticated to export your data",
				});
			}

			const userId = ctx.session.user.id;

			// Fetch user data
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					name: true,
					email: true,
					emailVerified: true,
					image: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Fetch all task lists with tasks
			const taskLists = await prisma.taskList.findMany({
				where: { userId },
				include: {
					tasks: {
						include: {
							attendees: true,
							alarms: true,
							categories: true,
							recurrenceDates: true,
						},
						orderBy: {
							dueDate: "asc",
						},
					},
				},
				orderBy: {
					createdAt: "asc",
				},
			});

			// Fetch task list groups
			const groups = await prisma.taskListGroup.findMany({
				where: { userId },
				include: {
					taskLists: {
						orderBy: {
							order: "asc",
						},
					},
				},
				orderBy: {
					createdAt: "asc",
				},
			});

			// Get task list IDs for share links and bundles
			const taskListIds = taskLists.map((list) => list.id);

			// Fetch share links for user's task lists
			const shareLinks = await prisma.taskListShareLink.findMany({
				where: {
					taskListId: { in: taskListIds },
				},
				orderBy: {
					createdAt: "asc",
				},
			});

			// Fetch share bundles where user owns all task lists
			const bundleTaskLists = await prisma.taskShareBundleTaskList.findMany({
				where: {
					taskListId: { in: taskListIds },
				},
				include: {
					bundle: {
						include: {
							taskLists: true,
						},
					},
				},
			});

			// Filter bundles where ALL task lists belong to the user
			const userBundles = bundleTaskLists
				.map((bt) => bt.bundle)
				.filter((bundle, index, self) => {
					// Deduplicate by bundle ID
					return self.findIndex((b) => b.id === bundle.id) === index;
				})
				.filter((bundle) => {
					// Check if all task lists in bundle belong to user
					const allTaskListIds = bundle.taskLists.map((t) => t.taskListId);
					return allTaskListIds.every((id) => taskListIds.includes(id));
				})
				.map((bundle) => ({
					id: bundle.id,
					token: bundle.token,
					name: bundle.name,
					groupId: bundle.groupId,
					isActive: bundle.isActive,
					expiresAt: bundle.expiresAt?.toISOString() ?? null,
					removeDuplicates: bundle.removeDuplicates,
					accessCount: bundle.accessCount,
					lastAccessedAt: bundle.lastAccessedAt?.toISOString() ?? null,
					createdAt: bundle.createdAt.toISOString(),
					updatedAt: bundle.updatedAt.toISOString(),
					taskLists: bundle.taskLists.map((t) => ({
						taskListId: t.taskListId,
						order: t.order,
					})),
				}));

			// Build export structure
			const exportData = {
				exportDate: new Date().toISOString(),
				version: "1.0",
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					emailVerified: user.emailVerified,
					image: user.image,
					createdAt: user.createdAt.toISOString(),
					updatedAt: user.updatedAt.toISOString(),
				},
				taskLists: taskLists.map((list) => ({
					id: list.id,
					name: list.name,
					color: list.color,
					sourceUrl: list.sourceUrl,
					lastSyncedAt: list.lastSyncedAt?.toISOString() ?? null,
					createdAt: list.createdAt.toISOString(),
					updatedAt: list.updatedAt.toISOString(),
					tasks: list.tasks.map((task) => ({
						id: task.id,
						title: task.title,
						description: task.description,
						status: task.status,
						priority: task.priority,
						percentComplete: task.percentComplete,
						startDate: task.startDate?.toISOString() ?? null,
						dueDate: task.dueDate?.toISOString() ?? null,
						completedAt: task.completedAt?.toISOString() ?? null,
						location: task.location,
						geoLatitude: task.geoLatitude,
						geoLongitude: task.geoLongitude,
						organizerName: task.organizerName,
						organizerEmail: task.organizerEmail,
						uid: task.uid,
						dtstamp: task.dtstamp?.toISOString() ?? null,
						created: task.created?.toISOString() ?? null,
						lastModified: task.lastModified?.toISOString() ?? null,
						sequence: task.sequence,
						class: task.class,
						url: task.url,
						comment: task.comment,
						rrule: task.rrule,
						recurrenceId: task.recurrenceId,
						relatedTo: task.relatedTo,
						color: task.color,
						attendees: task.attendees.map((a) => ({
							name: a.name,
							email: a.email,
							role: a.role,
							status: a.status,
							rsvp: a.rsvp,
						})),
						alarms: task.alarms.map((a) => ({
							trigger: a.trigger,
							action: a.action,
							summary: a.summary,
							description: a.description,
							duration: a.duration,
							repeat: a.repeat,
						})),
						categories: task.categories.map((c) => c.category),
						recurrenceDates: task.recurrenceDates.map((rd) => ({
							date: rd.date.toISOString(),
							type: rd.type,
						})),
						createdAt: task.createdAt.toISOString(),
						updatedAt: task.updatedAt.toISOString(),
					})),
				})),
				groups: groups.map((group) => ({
					id: group.id,
					name: group.name,
					description: group.description,
					color: group.color,
					createdAt: group.createdAt.toISOString(),
					updatedAt: group.updatedAt.toISOString(),
					taskLists: group.taskLists.map((t) => ({
						taskListId: t.taskListId,
						order: t.order,
					})),
				})),
				shareLinks: shareLinks.map((link) => ({
					id: link.id,
					taskListId: link.taskListId,
					token: link.token,
					name: link.name,
					isActive: link.isActive,
					expiresAt: link.expiresAt?.toISOString() ?? null,
					accessCount: link.accessCount,
					lastAccessedAt: link.lastAccessedAt?.toISOString() ?? null,
					createdAt: link.createdAt.toISOString(),
					updatedAt: link.updatedAt.toISOString(),
				})),
				shareBundles: userBundles,
			};

			return exportData;
		}),
});
