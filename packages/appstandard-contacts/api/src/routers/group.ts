/**
 * Address book group management
 * Handles groups, members, and address book organization
 */

import {
	authOrAnonProcedure,
	protectedProcedure,
	router,
} from "@appstandard/api-core";
import prisma from "@appstandard/db";
import {
	ANONYMOUS_LIMITS,
	AUTHENTICATED_LIMITS,
	getMaxGroups,
} from "@appstandard-contacts/core";
import { TRPCError } from "@trpc/server";
import z from "zod";

export const groupRouter = router({
	/**
	 * Create a new address book group
	 */
	create: authOrAnonProcedure
		.input(
			z.object({
				name: z.string().min(1).max(200),
				description: z.string().max(500).optional(),
				color: z
					.string()
					.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
					.optional()
					.nullable(),
				addressBookIds: z.array(z.string()).min(1).max(15),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const isAuth = !!ctx.session?.user?.id;

			// Check group limit
			const groupCount = await prisma.addressBookGroup.count({
				where: { userId: ctx.userId },
			});

			const maxGroups = getMaxGroups(isAuth);
			if (groupCount >= maxGroups) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: `Limit reached: maximum ${maxGroups} groups`,
				});
			}

			// Verify ownership of address books
			const addressBooks = await prisma.addressBook.findMany({
				where: {
					id: { in: input.addressBookIds },
					userId: ctx.userId,
				},
			});

			if (addressBooks.length !== input.addressBookIds.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "One or more address books not found",
				});
			}

			const group = await prisma.addressBookGroup.create({
				data: {
					name: input.name,
					description: input.description || null,
					color: input.color || null,
					userId: ctx.userId,
					addressBooks: {
						create: input.addressBookIds.map((addressBookId, index) => ({
							addressBookId,
							order: index,
						})),
					},
				},
				include: {
					addressBooks: true,
					_count: { select: { members: true } },
				},
			});

			return {
				...group,
				addressBookCount: group.addressBooks.length,
				memberCount: group._count.members,
			};
		}),

	/**
	 * List all groups for current user
	 */
	list: authOrAnonProcedure.query(async ({ ctx }) => {
		const groups = await prisma.addressBookGroup.findMany({
			where: { userId: ctx.userId },
			include: {
				_count: { select: { addressBooks: true, members: true } },
			},
			orderBy: { updatedAt: "desc" },
		});

		// Also get groups where user is a member (authenticated only)
		if (ctx.session?.user?.id) {
			const memberGroups = await prisma.addressBookGroupMember2.findMany({
				where: {
					userId: ctx.session.user.id,
					acceptedAt: { not: null },
				},
				include: {
					group: {
						include: {
							_count: { select: { addressBooks: true, members: true } },
						},
					},
				},
			});

			const groupIds = new Set(groups.map((g) => g.id));
			for (const m of memberGroups) {
				if (!groupIds.has(m.group.id)) {
					groups.push(m.group);
				}
			}
		}

		return groups.map((group) => ({
			id: group.id,
			name: group.name,
			description: group.description,
			color: group.color,
			addressBookCount: group._count.addressBooks,
			memberCount: group._count.members,
			isShared: group._count.members > 0,
			createdAt: group.createdAt,
			updatedAt: group.updatedAt,
		}));
	}),

	/**
	 * Get a group by ID
	 */
	getById: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const group = await prisma.addressBookGroup.findFirst({
				where: {
					id: input.id,
					OR: [
						{ userId: ctx.userId },
						...(ctx.session?.user?.id
							? [
									{
										members: {
											some: {
												userId: ctx.session.user.id,
												acceptedAt: { not: null },
											},
										},
									},
								]
							: []),
					],
				},
				include: {
					addressBooks: {
						orderBy: { order: "asc" },
					},
					members: {
						orderBy: [{ role: "asc" }, { acceptedAt: "asc" }],
					},
				},
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Group not found",
				});
			}

			// Get address book details
			const addressBookIds = group.addressBooks.map((ab) => ab.addressBookId);
			const addressBooks = await prisma.addressBook.findMany({
				where: { id: { in: addressBookIds } },
				include: { _count: { select: { contacts: true } } },
			});

			const addressBooksMap = new Map(addressBooks.map((ab) => [ab.id, ab]));

			return {
				...group,
				addressBooks: group.addressBooks
					.map((member) => {
						const ab = addressBooksMap.get(member.addressBookId);
						if (!ab) return null;
						return {
							id: ab.id,
							name: ab.name,
							color: ab.color,
							contactCount: ab._count.contacts,
							order: member.order,
						};
					})
					.filter((ab): ab is NonNullable<typeof ab> => ab !== null),
			};
		}),

	/**
	 * Update a group
	 */
	update: authOrAnonProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).max(200).optional(),
				description: z.string().max(500).optional().nullable(),
				color: z
					.string()
					.regex(/^#[0-9A-Fa-f]{6}$/)
					.optional()
					.nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const group = await prisma.addressBookGroup.findFirst({
				where: {
					id: input.id,
					userId: ctx.userId,
				},
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Group not found",
				});
			}

			const updateData: {
				name?: string;
				description?: string | null;
				color?: string | null;
			} = {};

			if (input.name !== undefined) updateData.name = input.name;
			if (input.description !== undefined)
				updateData.description = input.description;
			if (input.color !== undefined) updateData.color = input.color;

			return await prisma.addressBookGroup.update({
				where: { id: input.id },
				data: updateData,
			});
		}),

	/**
	 * Delete a group
	 */
	delete: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const group = await prisma.addressBookGroup.findFirst({
				where: {
					id: input.id,
					userId: ctx.userId,
				},
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Group not found",
				});
			}

			await prisma.addressBookGroup.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	/**
	 * Add address books to a group
	 */
	addAddressBooks: authOrAnonProcedure
		.input(
			z.object({
				groupId: z.string(),
				addressBookIds: z.array(z.string()).min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const isAuth = !!ctx.session?.user?.id;

			const group = await prisma.addressBookGroup.findFirst({
				where: {
					id: input.groupId,
					userId: ctx.userId,
				},
				include: { addressBooks: true },
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Group not found",
				});
			}

			// Check limit
			const maxPerGroup = isAuth
				? AUTHENTICATED_LIMITS.addressBooksPerGroup
				: ANONYMOUS_LIMITS.addressBooksPerGroup;

			const newCount = group.addressBooks.length + input.addressBookIds.length;
			if (newCount > maxPerGroup) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: `Limit reached: maximum ${maxPerGroup} address books per group`,
				});
			}

			// Verify ownership
			const addressBooks = await prisma.addressBook.findMany({
				where: {
					id: { in: input.addressBookIds },
					userId: ctx.userId,
				},
			});

			if (addressBooks.length !== input.addressBookIds.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "One or more address books not found",
				});
			}

			// Filter already added
			const existingIds = new Set(
				group.addressBooks.map((ab) => ab.addressBookId),
			);
			const newIds = input.addressBookIds.filter((id) => !existingIds.has(id));

			if (newIds.length === 0) {
				return { addedCount: 0 };
			}

			const maxOrder =
				group.addressBooks.length > 0
					? Math.max(...group.addressBooks.map((ab) => ab.order))
					: -1;

			await prisma.addressBookGroupMember.createMany({
				data: newIds.map((addressBookId, index) => ({
					groupId: input.groupId,
					addressBookId,
					order: maxOrder + 1 + index,
				})),
			});

			return { addedCount: newIds.length };
		}),

	/**
	 * Remove address books from a group
	 */
	removeAddressBooks: authOrAnonProcedure
		.input(
			z.object({
				groupId: z.string(),
				addressBookIds: z.array(z.string()).min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const group = await prisma.addressBookGroup.findFirst({
				where: {
					id: input.groupId,
					userId: ctx.userId,
				},
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Group not found",
				});
			}

			const result = await prisma.addressBookGroupMember.deleteMany({
				where: {
					groupId: input.groupId,
					addressBookId: { in: input.addressBookIds },
				},
			});

			return { removedCount: result.count };
		}),

	// ========== MEMBER MANAGEMENT (authenticated only) ==========

	/**
	 * Invite a member to a group
	 */
	inviteMember: protectedProcedure
		.input(
			z.object({
				groupId: z.string(),
				userEmail: z.string().email(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const inviterId = ctx.session.user.id;

			// Verify ownership
			const group = await prisma.addressBookGroup.findFirst({
				where: {
					id: input.groupId,
					userId: inviterId,
				},
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Group not found or you are not the owner",
				});
			}

			// Find user
			const user = await prisma.user.findFirst({
				where: {
					OR: [
						{ email: input.userEmail },
						{ normalizedEmail: input.userEmail.toLowerCase() },
					],
				},
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (user.id === inviterId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You are already the owner",
				});
			}

			// Check if already member
			const existing = await prisma.addressBookGroupMember2.findUnique({
				where: {
					groupId_userId: { groupId: input.groupId, userId: user.id },
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "User is already a member",
				});
			}

			const member = await prisma.addressBookGroupMember2.create({
				data: {
					groupId: input.groupId,
					userId: user.id,
					role: "MEMBER",
					invitedBy: inviterId,
					acceptedAt: null,
				},
			});

			return {
				id: member.id,
				userId: member.userId,
				role: member.role,
				invitedAt: member.invitedAt,
			};
		}),

	/**
	 * List all members of a group
	 */
	listMembers: protectedProcedure
		.input(z.object({ groupId: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// Verify access (owner or member)
			const group = await prisma.addressBookGroup.findFirst({
				where: {
					id: input.groupId,
					OR: [{ userId }, { members: { some: { userId } } }],
				},
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Group not found or access denied",
				});
			}

			// Get all members with user information
			const members = await prisma.addressBookGroupMember2.findMany({
				where: { groupId: input.groupId },
				orderBy: [
					{ role: "asc" }, // OWNER first
					{ acceptedAt: "asc" },
					{ invitedAt: "asc" },
				],
			});

			// Fetch user information for each member
			const membersWithUserInfo = await Promise.all(
				members.map(async (member) => {
					const user = await prisma.user.findUnique({
						where: { id: member.userId },
						select: { id: true, email: true, name: true },
					});

					const inviter = await prisma.user.findUnique({
						where: { id: member.invitedBy },
						select: { id: true, name: true, email: true },
					});

					return {
						id: member.id,
						userId: member.userId,
						role: member.role,
						invitedBy: member.invitedBy,
						invitedAt: member.invitedAt,
						acceptedAt: member.acceptedAt,
						user: user
							? { id: user.id, email: user.email, name: user.name }
							: null,
						inviter: inviter
							? { id: inviter.id, name: inviter.name, email: inviter.email }
							: null,
					};
				}),
			);

			return membersWithUserInfo;
		}),

	/**
	 * Accept an invitation
	 */
	acceptInvitation: protectedProcedure
		.input(z.object({ groupId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const member = await prisma.addressBookGroupMember2.findUnique({
				where: {
					groupId_userId: { groupId: input.groupId, userId },
				},
			});

			if (!member) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Invitation not found",
				});
			}

			if (member.acceptedAt) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Already accepted",
				});
			}

			const updated = await prisma.addressBookGroupMember2.update({
				where: { id: member.id },
				data: { acceptedAt: new Date() },
				include: { group: { select: { name: true } } },
			});

			return {
				id: updated.id,
				groupId: updated.groupId,
				groupName: updated.group.name,
				acceptedAt: updated.acceptedAt,
			};
		}),

	/**
	 * Remove a member
	 */
	removeMember: protectedProcedure
		.input(
			z.object({
				groupId: z.string(),
				userId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const ownerId = ctx.session.user.id;

			// Verify ownership
			const group = await prisma.addressBookGroup.findFirst({
				where: {
					id: input.groupId,
					userId: ownerId,
				},
			});

			if (!group) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the owner can remove members",
				});
			}

			const member = await prisma.addressBookGroupMember2.findUnique({
				where: {
					groupId_userId: { groupId: input.groupId, userId: input.userId },
				},
			});

			if (!member) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Member not found",
				});
			}

			await prisma.addressBookGroupMember2.delete({
				where: { id: member.id },
			});

			return { success: true };
		}),

	/**
	 * Leave a group
	 */
	leaveGroup: protectedProcedure
		.input(z.object({ groupId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const member = await prisma.addressBookGroupMember2.findUnique({
				where: {
					groupId_userId: { groupId: input.groupId, userId },
				},
			});

			if (!member) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "You are not a member",
				});
			}

			await prisma.addressBookGroupMember2.delete({
				where: { id: member.id },
			});

			return { success: true };
		}),
});
