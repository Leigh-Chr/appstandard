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
			// Try to find a single address book share link
			const shareLink = await prisma.addressBookShareLink.findUnique({
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
			const bundle = await prisma.addressBookShareBundle.findUnique({
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
	 * Create a new share link for an address book
	 */
	create: authOrAnonProcedure
		.input(
			z.object({
				addressBookId: z.string(),
				name: z.string().max(100).optional(),
				expiresAt: z.string().datetime().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const addressBook = await prisma.addressBook.findFirst({
				where: {
					id: input.addressBookId,
					userId: ctx.userId,
				},
			});

			if (!addressBook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Address book not found",
				});
			}

			// Count existing share links
			const shareLinkCount = await prisma.addressBookShareLink.count({
				where: { addressBookId: input.addressBookId },
			});

			const MAX_SHARE_LINKS = 10;
			if (shareLinkCount >= MAX_SHARE_LINKS) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: `Limit reached: maximum ${MAX_SHARE_LINKS} share links per address book.`,
				});
			}

			const token = generateShareToken();

			const shareLink = await prisma.addressBookShareLink.create({
				data: {
					addressBookId: input.addressBookId,
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
	 * List all share links for an address book
	 */
	list: authOrAnonProcedure
		.input(z.object({ addressBookId: z.string() }))
		.query(async ({ ctx, input }) => {
			const addressBook = await prisma.addressBook.findFirst({
				where: {
					id: input.addressBookId,
					userId: ctx.userId,
				},
			});

			if (!addressBook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Address book not found",
				});
			}

			const shareLinks = await prisma.addressBookShareLink.findMany({
				where: { addressBookId: input.addressBookId },
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
			const shareLink = await prisma.addressBookShareLink.findUnique({
				where: { id: input.id },
				include: { addressBook: true },
			});

			if (!shareLink) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Share link not found",
				});
			}

			if (shareLink.addressBook.userId !== ctx.userId) {
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

			const updated = await prisma.addressBookShareLink.update({
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
			const shareLink = await prisma.addressBookShareLink.findUnique({
				where: { id: input.id },
				include: { addressBook: true },
			});

			if (!shareLink) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Share link not found",
				});
			}

			if (shareLink.addressBook.userId !== ctx.userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to delete this share link",
				});
			}

			await prisma.addressBookShareLink.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	/**
	 * PUBLIC: Access a shared address book by token
	 * Returns vCard content for download
	 */
	getByToken: publicProcedure
		.input(z.object({ token: z.string() }))
		.query(async ({ input }) => {
			const shareLink = await prisma.addressBookShareLink.findUnique({
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

			const addressBook = await prisma.addressBook.findUnique({
				where: { id: shareLink.addressBookId },
				include: {
					contacts: {
						include: {
							emails: true,
							phones: true,
							addresses: true,
							imHandles: true,
							categories: true,
							relations: true,
						},
					},
				},
			});

			if (!addressBook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Address book not found",
				});
			}

			// Update access stats (fire and forget)
			prisma.addressBookShareLink
				.update({
					where: { id: shareLink.id },
					data: {
						accessCount: { increment: 1 },
						lastAccessedAt: new Date(),
					},
				})
				.catch(() => {});

			// Import the generator
			const { generateVCardFile } = await import(
				"@appstandard-contacts/vcard-utils"
			);

			const contactsForExport = addressBook.contacts.map((contact) => ({
				uid: contact.uid || contact.id,
				formattedName: contact.formattedName,
				familyName: contact.familyName || undefined,
				givenName: contact.givenName || undefined,
				additionalName: contact.additionalName || undefined,
				namePrefix: contact.namePrefix || undefined,
				nameSuffix: contact.nameSuffix || undefined,
				nickname: contact.nickname || undefined,
				photoUrl: contact.photoUrl || undefined,
				birthday: contact.birthday || undefined,
				anniversary: contact.anniversary || undefined,
				gender: contact.gender || undefined,
				organization: contact.organization || undefined,
				title: contact.title || undefined,
				role: contact.role || undefined,
				geoLatitude: contact.geoLatitude || undefined,
				geoLongitude: contact.geoLongitude || undefined,
				timezone: contact.timezone || undefined,
				url: contact.url || undefined,
				note: contact.note || undefined,
				kind: contact.kind?.toLowerCase() as
					| "individual"
					| "group"
					| "org"
					| "location"
					| undefined,
				emails: contact.emails.map((e) => ({
					email: e.email,
					type: e.type || undefined,
					isPrimary: e.isPrimary,
				})),
				phones: contact.phones.map((p) => ({
					number: p.number,
					type: p.type || undefined,
					isPrimary: p.isPrimary,
				})),
				addresses: contact.addresses.map((a) => ({
					type: a.type || undefined,
					poBox: a.poBox || undefined,
					extendedAddress: a.extendedAddress || undefined,
					streetAddress: a.streetAddress || undefined,
					locality: a.locality || undefined,
					region: a.region || undefined,
					postalCode: a.postalCode || undefined,
					country: a.country || undefined,
					isPrimary: a.isPrimary,
				})),
				imHandles: contact.imHandles.map((im) => ({
					handle: im.handle,
					service: im.service,
				})),
				categories: contact.categories.map((c) => c.category),
				relations: contact.relations.map((r) => ({
					relatedName: r.relatedName,
					relationType: r.relationType,
				})),
			}));

			const vcardContent = generateVCardFile({ contacts: contactsForExport });

			return {
				vcardContent,
				addressBookName: addressBook.name,
				contactCount: addressBook.contacts.length,
			};
		}),

	/**
	 * PUBLIC: Get address book info by token
	 */
	getInfoByToken: publicProcedure
		.input(z.object({ token: z.string() }))
		.query(async ({ input }) => {
			const shareLink = await prisma.addressBookShareLink.findUnique({
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

			const addressBook = await prisma.addressBook.findUnique({
				where: { id: shareLink.addressBookId },
				select: {
					name: true,
					color: true,
					_count: { select: { contacts: true } },
				},
			});

			if (!addressBook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Address book not found",
				});
			}

			return {
				addressBookName: addressBook.name,
				addressBookColor: addressBook.color,
				contactCount: addressBook._count.contacts,
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
						addressBookIds: z.array(z.string()).min(1).max(15).optional(),
						name: z.string().max(200).optional(),
						expiresAt: z.string().datetime().optional(),
						removeDuplicates: z.boolean().default(false),
					})
					.refine(
						(data) =>
							data.groupId ||
							(data.addressBookIds && data.addressBookIds.length > 0),
						{
							message: "Either groupId or addressBookIds must be provided",
						},
					),
			)
			.mutation(async ({ ctx, input }) => {
				let addressBookIds: string[];

				if (input.groupId) {
					const group = await prisma.addressBookGroup.findFirst({
						where: {
							id: input.groupId,
							userId: ctx.userId,
						},
						include: {
							addressBooks: { orderBy: { order: "asc" } },
						},
					});

					if (!group) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Group not found",
						});
					}

					addressBookIds = group.addressBooks.map((ab) => ab.addressBookId);
				} else {
					addressBookIds = input.addressBookIds || [];
				}

				if (addressBookIds.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No address books to share",
					});
				}

				// Verify ownership
				const ownedAddressBooks = await prisma.addressBook.findMany({
					where: {
						id: { in: addressBookIds },
						userId: ctx.userId,
					},
				});

				if (ownedAddressBooks.length !== addressBookIds.length) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "One or more address books not found",
					});
				}

				const token = generateShareToken();
				const bundleName =
					input.name?.trim() ||
					`${addressBookIds.length} address books - ${new Date().toLocaleDateString()}`;

				const bundle = await prisma.addressBookShareBundle.create({
					data: {
						token,
						name: bundleName,
						groupId: input.groupId || null,
						expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
						removeDuplicates: input.removeDuplicates,
						addressBooks: {
							create: addressBookIds.map((addressBookId, index) => ({
								addressBookId,
								order: index,
							})),
						},
					},
					include: { addressBooks: true },
				});

				return {
					id: bundle.id,
					token: bundle.token,
					name: bundle.name,
					isActive: bundle.isActive,
					expiresAt: bundle.expiresAt,
					removeDuplicates: bundle.removeDuplicates,
					addressBookCount: bundle.addressBooks.length,
					createdAt: bundle.createdAt,
				};
			}),

		/**
		 * List all share bundles
		 */
		list: authOrAnonProcedure.query(async ({ ctx }) => {
			const userAddressBooks = await prisma.addressBook.findMany({
				where: { userId: ctx.userId },
				select: { id: true },
			});

			const userAddressBookIds = userAddressBooks.map((ab) => ab.id);

			const bundles = await prisma.addressBookShareBundle.findMany({
				where: {
					addressBooks: {
						some: { addressBookId: { in: userAddressBookIds } },
					},
				},
				include: { addressBooks: true },
				orderBy: { createdAt: "desc" },
			});

			const ownedBundles = bundles.filter((bundle) =>
				bundle.addressBooks.every((ab) =>
					userAddressBookIds.includes(ab.addressBookId),
				),
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
				addressBookCount: bundle.addressBooks.length,
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
				const bundle = await prisma.addressBookShareBundle.findUnique({
					where: { id: input.id },
					include: { addressBooks: true },
				});

				if (!bundle) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Bundle not found",
					});
				}

				// Verify ownership
				const userAddressBooks = await prisma.addressBook.findMany({
					where: {
						id: { in: bundle.addressBooks.map((ab) => ab.addressBookId) },
						userId: ctx.userId,
					},
				});

				if (userAddressBooks.length !== bundle.addressBooks.length) {
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

				const updated = await prisma.addressBookShareBundle.update({
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
				const bundle = await prisma.addressBookShareBundle.findUnique({
					where: { id: input.id },
					include: { addressBooks: true },
				});

				if (!bundle) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Bundle not found",
					});
				}

				// Verify ownership
				const userAddressBooks = await prisma.addressBook.findMany({
					where: {
						id: { in: bundle.addressBooks.map((ab) => ab.addressBookId) },
						userId: ctx.userId,
					},
				});

				if (userAddressBooks.length !== bundle.addressBooks.length) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to delete this bundle",
					});
				}

				await prisma.addressBookShareBundle.delete({
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
				const bundle = await prisma.addressBookShareBundle.findUnique({
					where: { token: input.token },
					include: {
						addressBooks: { orderBy: { order: "asc" } },
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

				const addressBookIds = bundle.addressBooks.map(
					(ab) => ab.addressBookId,
				);
				const addressBooks = await prisma.addressBook.findMany({
					where: { id: { in: addressBookIds } },
					include: {
						contacts: {
							include: {
								emails: true,
								phones: true,
								addresses: true,
								imHandles: true,
								categories: true,
								relations: true,
							},
						},
					},
				});

				if (addressBooks.length === 0) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "This bundle is no longer available",
					});
				}

				// Update access stats
				prisma.addressBookShareBundle
					.update({
						where: { id: bundle.id },
						data: {
							accessCount: { increment: 1 },
							lastAccessedAt: new Date(),
						},
					})
					.catch(() => {});

				const { generateVCardFile } = await import(
					"@appstandard-contacts/vcard-utils"
				);

				const allContacts = addressBooks.flatMap((addressBook) =>
					addressBook.contacts.map((contact) => ({
						uid: contact.uid || contact.id,
						formattedName: contact.formattedName,
						familyName: contact.familyName || undefined,
						givenName: contact.givenName || undefined,
						additionalName: contact.additionalName || undefined,
						namePrefix: contact.namePrefix || undefined,
						nameSuffix: contact.nameSuffix || undefined,
						nickname: contact.nickname || undefined,
						photoUrl: contact.photoUrl || undefined,
						birthday: contact.birthday || undefined,
						anniversary: contact.anniversary || undefined,
						gender: contact.gender || undefined,
						organization: contact.organization || undefined,
						title: contact.title || undefined,
						role: contact.role || undefined,
						url: contact.url || undefined,
						note: contact.note || undefined,
						kind: contact.kind?.toLowerCase() as
							| "individual"
							| "group"
							| "org"
							| "location"
							| undefined,
						emails: contact.emails.map((e) => ({
							email: e.email,
							type: e.type || undefined,
							isPrimary: e.isPrimary,
						})),
						phones: contact.phones.map((p) => ({
							number: p.number,
							type: p.type || undefined,
							isPrimary: p.isPrimary,
						})),
						addresses: contact.addresses.map((a) => ({
							type: a.type || undefined,
							poBox: a.poBox || undefined,
							extendedAddress: a.extendedAddress || undefined,
							streetAddress: a.streetAddress || undefined,
							locality: a.locality || undefined,
							region: a.region || undefined,
							postalCode: a.postalCode || undefined,
							country: a.country || undefined,
							isPrimary: a.isPrimary,
						})),
						imHandles: contact.imHandles.map((im) => ({
							handle: im.handle,
							service: im.service,
						})),
						categories: contact.categories.map((c) => c.category),
						relations: contact.relations.map((r) => ({
							relatedName: r.relatedName,
							relationType: r.relationType,
						})),
					})),
				);

				const vcardContent = generateVCardFile({ contacts: allContacts });

				return {
					vcardContent,
					bundleName: bundle.name,
					contactCount: allContacts.length,
					addressBookCount: addressBooks.length,
				};
			}),

		/**
		 * PUBLIC: Get bundle info by token
		 */
		getInfoByToken: publicProcedure
			.input(z.object({ token: z.string() }))
			.query(async ({ input }) => {
				const bundle = await prisma.addressBookShareBundle.findUnique({
					where: { token: input.token },
					include: { addressBooks: true },
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

				const addressBookIds = bundle.addressBooks.map(
					(ab) => ab.addressBookId,
				);
				const addressBooks = await prisma.addressBook.findMany({
					where: { id: { in: addressBookIds } },
					select: {
						id: true,
						name: true,
						color: true,
						_count: { select: { contacts: true } },
					},
				});

				const totalContacts = addressBooks.reduce(
					(sum, ab) => sum + ab._count.contacts,
					0,
				);

				return {
					bundleName: bundle.name,
					addressBookCount: addressBooks.length,
					totalContacts,
					removeDuplicates: bundle.removeDuplicates,
					addressBooks: addressBooks.map((ab) => ({
						id: ab.id,
						name: ab.name,
						color: ab.color,
						contactCount: ab._count.contacts,
					})),
				};
			}),
	},
});
