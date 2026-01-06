import { authOrAnonProcedure, router } from "@appstandard/api-core";
import prisma from "@appstandard/db";
import {
	contactCreateSchema,
	contactUpdateSchema,
} from "@appstandard-contacts/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { verifyAddressBookAccess, verifyContactAccess } from "../middleware";

/**
 * Transform categories string to array
 */
function parseCategories(categories: string | null | undefined): string[] {
	if (!categories) return [];
	return categories
		.split(",")
		.map((c) => c.trim())
		.filter((c) => c.length > 0);
}

export const contactRouter = router({
	/**
	 * List all contacts in an address book
	 */
	list: authOrAnonProcedure
		.input(
			z.object({
				addressBookId: z.string(),
				search: z.string().optional(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.addressBookId, ctx);

			const contacts = await prisma.contact.findMany({
				where: {
					addressBookId: input.addressBookId,
					...(input.search && {
						OR: [
							{
								formattedName: { contains: input.search, mode: "insensitive" },
							},
							{ organization: { contains: input.search, mode: "insensitive" } },
							{
								emails: {
									some: {
										email: { contains: input.search, mode: "insensitive" },
									},
								},
							},
						],
					}),
				},
				orderBy: { formattedName: "asc" },
				take: input.limit,
				skip: input.offset,
				include: {
					emails: { where: { isPrimary: true }, take: 1 },
					phones: { where: { isPrimary: true }, take: 1 },
					addresses: { where: { isPrimary: true }, take: 1 },
					categories: true,
					_count: {
						select: {
							emails: true,
							phones: true,
							addresses: true,
							imHandles: true,
							relations: true,
						},
					},
				},
			});

			return contacts.map((contact) => ({
				id: contact.id,
				addressBookId: contact.addressBookId,
				formattedName: contact.formattedName,
				nickname: contact.nickname,
				organization: contact.organization,
				title: contact.title,
				role: contact.role,
				photoUrl: contact.photoUrl,
				birthday: contact.birthday,
				note: contact.note,
				url: contact.url,
				primaryEmail: contact.emails[0]?.email,
				primaryPhone: contact.phones[0]?.number,
				primaryAddress: contact.addresses[0]
					? {
							locality: contact.addresses[0].locality,
							country: contact.addresses[0].country,
						}
					: null,
				categories: contact.categories,
				// Counts for card display
				emailCount: contact._count.emails,
				phoneCount: contact._count.phones,
				addressCount: contact._count.addresses,
				imHandleCount: contact._count.imHandles,
				relationCount: contact._count.relations,
				createdAt: contact.createdAt,
				updatedAt: contact.updatedAt,
			}));
		}),

	/**
	 * Get a single contact by ID
	 */
	getById: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			await verifyContactAccess(input.id, ctx);

			const contact = await prisma.contact.findUnique({
				where: { id: input.id },
				include: {
					emails: true,
					phones: true,
					addresses: true,
					imHandles: true,
					categories: true,
					relations: true,
				},
			});

			if (!contact) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Contact not found",
				});
			}

			return contact;
		}),

	/**
	 * Create a new contact
	 */
	create: authOrAnonProcedure
		.input(contactCreateSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.addressBookId, ctx);

			const categories = parseCategories(input.categories);

			const contact = await prisma.contact.create({
				data: {
					addressBookId: input.addressBookId,
					formattedName: input.formattedName,
					familyName: input.familyName,
					givenName: input.givenName,
					additionalName: input.additionalName,
					namePrefix: input.namePrefix,
					nameSuffix: input.nameSuffix,
					nickname: input.nickname,
					photoUrl: input.photoUrl,
					birthday: input.birthday,
					anniversary: input.anniversary,
					gender: input.gender,
					organization: input.organization,
					title: input.title,
					role: input.role,
					geoLatitude: input.geoLatitude,
					geoLongitude: input.geoLongitude,
					timezone: input.timezone,
					note: input.note,
					url: input.url,
					kind: input.kind || "INDIVIDUAL",
					uid: input.uid,
					// Create categories
					categories: {
						create: categories.map((category) => ({ category })),
					},
					// Create emails
					...(input.emails
						? {
								emails: {
									create: input.emails.map((e) => ({
										email: e.email,
										isPrimary: e.isPrimary ?? false,
										...(e.type !== undefined ? { type: e.type } : {}),
									})),
								},
							}
						: {}),
					// Create phones
					...(input.phones
						? {
								phones: {
									create: input.phones.map((p) => ({
										number: p.number,
										isPrimary: p.isPrimary ?? false,
										...(p.type !== undefined ? { type: p.type } : {}),
									})),
								},
							}
						: {}),
					// Create addresses
					...(input.addresses
						? {
								addresses: {
									create: input.addresses.map((a) => ({
										isPrimary: a.isPrimary ?? false,
										...(a.type !== undefined ? { type: a.type } : {}),
										...(a.streetAddress !== undefined
											? { streetAddress: a.streetAddress }
											: {}),
										...(a.locality !== undefined
											? { locality: a.locality }
											: {}),
										...(a.region !== undefined ? { region: a.region } : {}),
										...(a.postalCode !== undefined
											? { postalCode: a.postalCode }
											: {}),
										...(a.country !== undefined ? { country: a.country } : {}),
									})),
								},
							}
						: {}),
					// Create IM handles
					...(input.imHandles
						? {
								imHandles: {
									create: input.imHandles.map((im) => ({
										handle: im.handle,
										service: im.service ?? null,
									})),
								},
							}
						: {}),
					// Create relations
					...(input.relations
						? {
								relations: {
									create: input.relations.map((r) => ({
										relatedName: r.relatedName,
										relationType: r.relationType ?? null,
									})),
								},
							}
						: {}),
				},
			});

			return contact;
		}),

	/**
	 * Update a contact
	 */
	update: authOrAnonProcedure
		.input(contactUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyContactAccess(input.id, ctx);

			const categories = input.categories
				? parseCategories(input.categories)
				: undefined;

			const contact = await prisma.contact.update({
				where: { id: input.id },
				data: {
					...(input.formattedName !== undefined && {
						formattedName: input.formattedName,
					}),
					...(input.familyName !== undefined && {
						familyName: input.familyName,
					}),
					...(input.givenName !== undefined && { givenName: input.givenName }),
					...(input.additionalName !== undefined && {
						additionalName: input.additionalName,
					}),
					...(input.namePrefix !== undefined && {
						namePrefix: input.namePrefix,
					}),
					...(input.nameSuffix !== undefined && {
						nameSuffix: input.nameSuffix,
					}),
					...(input.nickname !== undefined && { nickname: input.nickname }),
					...(input.photoUrl !== undefined && { photoUrl: input.photoUrl }),
					...(input.birthday !== undefined && { birthday: input.birthday }),
					...(input.anniversary !== undefined && {
						anniversary: input.anniversary,
					}),
					...(input.gender !== undefined && { gender: input.gender }),
					...(input.organization !== undefined && {
						organization: input.organization,
					}),
					...(input.title !== undefined && { title: input.title }),
					...(input.role !== undefined && { role: input.role }),
					...(input.geoLatitude !== undefined && {
						geoLatitude: input.geoLatitude,
					}),
					...(input.geoLongitude !== undefined && {
						geoLongitude: input.geoLongitude,
					}),
					...(input.timezone !== undefined && { timezone: input.timezone }),
					...(input.note !== undefined && { note: input.note }),
					...(input.url !== undefined && { url: input.url }),
					...(input.kind !== undefined && { kind: input.kind }),
					// Update categories if provided
					...(categories !== undefined && {
						categories: {
							deleteMany: {},
							create: categories.map((category) => ({ category })),
						},
					}),
				},
			});

			return contact;
		}),

	/**
	 * Delete a contact
	 */
	delete: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await verifyContactAccess(input.id, ctx);

			await prisma.contact.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	/**
	 * Search contacts across all address books
	 */
	search: authOrAnonProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().min(1).max(50).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const contacts = await prisma.contact.findMany({
				where: {
					addressBook: {
						userId: ctx.userId,
					},
					OR: [
						{ formattedName: { contains: input.query, mode: "insensitive" } },
						{ organization: { contains: input.query, mode: "insensitive" } },
						{
							emails: {
								some: { email: { contains: input.query, mode: "insensitive" } },
							},
						},
						{
							phones: {
								some: { number: { contains: input.query } },
							},
						},
					],
				},
				take: input.limit,
				orderBy: { formattedName: "asc" },
				include: {
					emails: { where: { isPrimary: true }, take: 1 },
					phones: { where: { isPrimary: true }, take: 1 },
				},
			});

			return contacts.map((contact) => ({
				id: contact.id,
				addressBookId: contact.addressBookId,
				formattedName: contact.formattedName,
				organization: contact.organization,
				photoUrl: contact.photoUrl,
				primaryEmail: contact.emails[0]?.email,
				primaryPhone: contact.phones[0]?.number,
			}));
		}),

	/**
	 * Duplicate a contact
	 */
	duplicate: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await verifyContactAccess(input.id, ctx);

			// Get the original contact with all related data
			const original = await prisma.contact.findUnique({
				where: { id: input.id },
				include: {
					emails: true,
					phones: true,
					addresses: true,
					imHandles: true,
					categories: true,
					relations: true,
				},
			});

			if (!original) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Contact not found",
				});
			}

			// Create a duplicate
			const duplicate = await prisma.contact.create({
				data: {
					addressBookId: original.addressBookId,
					formattedName: `${original.formattedName} (copy)`,
					familyName: original.familyName,
					givenName: original.givenName,
					additionalName: original.additionalName,
					namePrefix: original.namePrefix,
					nameSuffix: original.nameSuffix,
					nickname: original.nickname,
					photoUrl: original.photoUrl,
					birthday: original.birthday,
					anniversary: original.anniversary,
					gender: original.gender,
					organization: original.organization,
					title: original.title,
					role: original.role,
					geoLatitude: original.geoLatitude,
					geoLongitude: original.geoLongitude,
					timezone: original.timezone,
					note: original.note,
					url: original.url,
					kind: original.kind,
					// Duplicate categories
					categories: {
						create: original.categories.map((c) => ({ category: c.category })),
					},
					// Duplicate emails
					emails: {
						create: original.emails.map((e) => ({
							email: e.email,
							type: e.type,
							isPrimary: e.isPrimary,
						})),
					},
					// Duplicate phones
					phones: {
						create: original.phones.map((p) => ({
							number: p.number,
							type: p.type,
							isPrimary: p.isPrimary,
						})),
					},
					// Duplicate addresses
					addresses: {
						create: original.addresses.map((a) => ({
							type: a.type,
							streetAddress: a.streetAddress,
							locality: a.locality,
							region: a.region,
							postalCode: a.postalCode,
							country: a.country,
							isPrimary: a.isPrimary,
						})),
					},
					// Duplicate IM handles
					imHandles: {
						create: original.imHandles.map((im) => ({
							handle: im.handle,
							service: im.service,
						})),
					},
					// Duplicate relations
					relations: {
						create: original.relations.map((r) => ({
							relatedName: r.relatedName,
							relationType: r.relationType,
						})),
					},
				},
			});

			return duplicate;
		}),

	/**
	 * Bulk delete multiple contacts
	 */
	bulkDelete: authOrAnonProcedure
		.input(
			z.object({
				contactIds: z.array(z.string()).min(1).max(100),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Get all contacts and verify they belong to address books the user owns
			const contacts = await prisma.contact.findMany({
				where: { id: { in: input.contactIds } },
				include: { addressBook: true },
			});

			if (contacts.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No contacts found",
				});
			}

			// Get unique address book IDs
			const addressBookIds = [...new Set(contacts.map((c) => c.addressBookId))];

			// Verify access to all address books
			const accessibleAddressBooks = await prisma.addressBook.findMany({
				where: {
					id: { in: addressBookIds },
					userId: ctx.userId,
				},
			});

			const accessibleAddressBookIds = new Set(
				accessibleAddressBooks.map((ab) => ab.id),
			);

			// Filter to only contacts the user has access to
			const accessibleContactIds = contacts
				.filter((c) => accessibleAddressBookIds.has(c.addressBookId))
				.map((c) => c.id);

			if (accessibleContactIds.length === 0) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to these contacts",
				});
			}

			// Delete accessible contacts
			const result = await prisma.contact.deleteMany({
				where: { id: { in: accessibleContactIds } },
			});

			return {
				deletedCount: result.count,
				requestedCount: input.contactIds.length,
			};
		}),

	/**
	 * Bulk move contacts to another address book
	 */
	bulkMove: authOrAnonProcedure
		.input(
			z.object({
				contactIds: z.array(z.string()).min(1).max(100),
				targetAddressBookId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify access to target address book
			const targetAddressBook = await prisma.addressBook.findFirst({
				where: {
					id: input.targetAddressBookId,
					userId: ctx.userId,
				},
			});

			if (!targetAddressBook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Destination address book not found",
				});
			}

			// Get all contacts
			const contacts = await prisma.contact.findMany({
				where: { id: { in: input.contactIds } },
				include: { addressBook: true },
			});

			if (contacts.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No contacts found",
				});
			}

			// Get source address book IDs
			const sourceAddressBookIds = [
				...new Set(contacts.map((c) => c.addressBookId)),
			];

			// Verify access to all source address books
			const accessibleAddressBooks = await prisma.addressBook.findMany({
				where: {
					id: { in: sourceAddressBookIds },
					userId: ctx.userId,
				},
			});

			const accessibleAddressBookIds = new Set(
				accessibleAddressBooks.map((ab) => ab.id),
			);

			// Filter to only contacts the user has access to
			const accessibleContactIds = contacts
				.filter((c) => accessibleAddressBookIds.has(c.addressBookId))
				.map((c) => c.id);

			if (accessibleContactIds.length === 0) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to these contacts",
				});
			}

			// Move contacts to target address book
			const result = await prisma.contact.updateMany({
				where: { id: { in: accessibleContactIds } },
				data: { addressBookId: input.targetAddressBookId },
			});

			return {
				movedCount: result.count,
				requestedCount: input.contactIds.length,
				targetAddressBookId: input.targetAddressBookId,
				targetAddressBookName: targetAddressBook.name,
			};
		}),
});
