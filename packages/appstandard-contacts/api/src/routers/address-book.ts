import {
	authOrAnonProcedure,
	router,
	TRANSACTION_OPTIONS,
} from "@appstandard/api-core";
import prisma from "@appstandard/db";
import {
	addressBookCreateSchema,
	addressBookUpdateSchema,
} from "@appstandard-contacts/schemas";
import {
	type ContactInput,
	type ContactKindValue,
	type GenderValue,
	generateVCardFile,
	parseVCardFile,
} from "@appstandard-contacts/vcard-utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cleanupAddressBookRelations } from "../lib/cleanup-address-book-relations";
import {
	buildOwnershipFilter,
	getUserUsage,
	verifyAddressBookAccess,
} from "../middleware";

/**
 * Map database gender to vCard gender
 */
function mapGenderToVCard(gender: string | null): GenderValue | undefined {
	if (!gender) return undefined;
	if (
		gender === "M" ||
		gender === "F" ||
		gender === "O" ||
		gender === "N" ||
		gender === "U"
	) {
		return gender;
	}
	return undefined;
}

/**
 * Map vCard gender to database gender
 */
function mapGenderFromVCard(
	gender: GenderValue | undefined,
): "M" | "F" | "O" | "N" | "U" | undefined {
	return gender;
}

/**
 * Map database kind to vCard kind
 */
function mapKindToVCard(kind: string | null): ContactKindValue | undefined {
	if (!kind) return undefined;
	const lower = kind.toLowerCase();
	if (
		lower === "individual" ||
		lower === "group" ||
		lower === "org" ||
		lower === "location"
	) {
		return lower;
	}
	return undefined;
}

/**
 * Map vCard kind to database kind
 */
function mapKindFromVCard(
	kind: ContactKindValue | undefined,
): "INDIVIDUAL" | "GROUP" | "ORG" | "LOCATION" | undefined {
	if (!kind) return undefined;
	return kind.toUpperCase() as "INDIVIDUAL" | "GROUP" | "ORG" | "LOCATION";
}

export const addressBookRouter = router({
	/**
	 * List all address books for the current user
	 */
	list: authOrAnonProcedure.query(async ({ ctx }) => {
		const addressBooks = await prisma.addressBook.findMany({
			where: buildOwnershipFilter(ctx),
			include: {
				_count: {
					select: { contacts: true },
				},
				// Include recent contacts for preview (up to 3, ordered by name)
				contacts: {
					orderBy: { formattedName: "asc" },
					take: 3,
					select: {
						id: true,
						formattedName: true,
						organization: true,
						photoUrl: true,
					},
				},
			},
			orderBy: { updatedAt: "desc" },
		});

		return addressBooks.map((book) => ({
			id: book.id,
			name: book.name,
			color: book.color,
			sourceUrl: book.sourceUrl,
			lastSyncedAt: book.lastSyncedAt,
			contactCount: book._count.contacts,
			createdAt: book.createdAt,
			updatedAt: book.updatedAt,
			// Preview of contacts
			contacts: book.contacts.map((contact) => ({
				id: contact.id,
				formattedName: contact.formattedName,
				organization: contact.organization,
				photoUrl: contact.photoUrl,
			})),
		}));
	}),

	/**
	 * Get a single address book by ID
	 */
	getById: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.id, ctx);

			const addressBook = await prisma.addressBook.findUnique({
				where: { id: input.id },
				include: {
					_count: {
						select: { contacts: true },
					},
				},
			});

			if (!addressBook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Address book not found",
				});
			}

			return {
				id: addressBook.id,
				name: addressBook.name,
				color: addressBook.color,
				sourceUrl: addressBook.sourceUrl,
				lastSyncedAt: addressBook.lastSyncedAt,
				contactCount: addressBook._count.contacts,
				createdAt: addressBook.createdAt,
				updatedAt: addressBook.updatedAt,
			};
		}),

	/**
	 * Create a new address book
	 */
	create: authOrAnonProcedure
		.input(addressBookCreateSchema)
		.mutation(async ({ ctx, input }) => {
			const addressBook = await prisma.addressBook.create({
				data: {
					name: input.name,
					userId: ctx.userId,
					...(input.color !== undefined ? { color: input.color } : {}),
					...(input.sourceUrl !== undefined
						? { sourceUrl: input.sourceUrl }
						: {}),
				},
			});

			return addressBook;
		}),

	/**
	 * Update an address book
	 */
	update: authOrAnonProcedure
		.input(addressBookUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.id, ctx);

			const addressBook = await prisma.addressBook.update({
				where: { id: input.id },
				data: {
					...(input.name !== undefined && { name: input.name }),
					...(input.color !== undefined && { color: input.color }),
					...(input.sourceUrl !== undefined && { sourceUrl: input.sourceUrl }),
				},
			});

			return addressBook;
		}),

	/**
	 * Delete an address book
	 */
	delete: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.id, ctx);

			// Use transaction to ensure atomicity of cleanup and deletion
			await prisma.$transaction(async (tx) => {
				// Cleanup all relations (AddressBookShareLink, AddressBookShareBundleBook, AddressBookGroupMember)
				await cleanupAddressBookRelations([input.id], tx);
				// Delete address book (Contacts will be deleted via CASCADE)
				await tx.addressBook.delete({
					where: { id: input.id },
				});
			}, TRANSACTION_OPTIONS);

			return { success: true };
		}),

	/**
	 * Bulk delete multiple address books
	 */
	bulkDelete: authOrAnonProcedure
		.input(
			z.object({
				addressBookIds: z.array(z.string()).min(1).max(100),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Get all address books and verify they belong to the user
			const addressBooks = await prisma.addressBook.findMany({
				where: {
					id: { in: input.addressBookIds },
					...buildOwnershipFilter(ctx),
				},
			});

			if (addressBooks.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No address books found",
				});
			}

			// Get accessible address book IDs
			const accessibleAddressBookIds = addressBooks.map((ab) => ab.id);

			// Use transaction to ensure atomicity of cleanup and deletion
			const result = await prisma.$transaction(async (tx) => {
				// Cleanup all relations (AddressBookShareLink, AddressBookShareBundleBook, AddressBookGroupMember)
				await cleanupAddressBookRelations(accessibleAddressBookIds, tx);
				// Delete address books (Contacts will be deleted via CASCADE)
				return await tx.addressBook.deleteMany({
					where: { id: { in: accessibleAddressBookIds } },
				});
			}, TRANSACTION_OPTIONS);

			return {
				deletedCount: result.count,
				requestedCount: input.addressBookIds.length,
			};
		}),

	/**
	 * Get unique categories from an address book
	 */
	getCategories: authOrAnonProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.id, ctx);

			const contacts = await prisma.contact.findMany({
				where: { addressBookId: input.id },
				select: {
					categories: {
						select: { category: true },
					},
				},
			});

			const categories = new Set<string>();
			for (const contact of contacts) {
				for (const cat of contact.categories) {
					categories.add(cat.category);
				}
			}

			return Array.from(categories).sort();
		}),

	/**
	 * Export an address book to vCard format
	 */
	exportVCard: authOrAnonProcedure
		.input(
			z.object({
				id: z.string(),
				categories: z.array(z.string()).optional(),
				withEmailOnly: z.boolean().optional(),
				withPhoneOnly: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.id, ctx);

			const addressBook = await prisma.addressBook.findUnique({
				where: { id: input.id },
				include: {
					contacts: {
						where: {
							// Filter by categories if specified
							...(input.categories &&
								input.categories.length > 0 && {
									categories: {
										some: {
											category: { in: input.categories },
										},
									},
								}),
							// Filter to only contacts with emails
							...(input.withEmailOnly && {
								emails: { some: {} },
							}),
							// Filter to only contacts with phones
							...(input.withPhoneOnly && {
								phones: { some: {} },
							}),
						},
						include: {
							emails: true,
							phones: true,
							addresses: true,
							imHandles: true,
							categories: true,
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

			// Convert contacts to ContactInput format
			const contactsForExport: ContactInput[] = addressBook.contacts.map(
				(contact) => ({
					uid: contact.uid || undefined,
					formattedName: contact.formattedName,
					familyName: contact.familyName || undefined,
					givenName: contact.givenName || undefined,
					additionalName: contact.additionalName || undefined,
					namePrefix: contact.namePrefix || undefined,
					nameSuffix: contact.nameSuffix || undefined,
					nickname: contact.nickname || undefined,
					organization: contact.organization || undefined,
					title: contact.title || undefined,
					role: contact.role || undefined,
					photoUrl: contact.photoUrl || undefined,
					birthday: contact.birthday || undefined,
					anniversary: contact.anniversary || undefined,
					gender: mapGenderToVCard(contact.gender),
					kind: mapKindToVCard(contact.kind),
					note: contact.note || undefined,
					url: contact.url || undefined,
					geoLatitude: contact.geoLatitude || undefined,
					geoLongitude: contact.geoLongitude || undefined,
					timezone: contact.timezone || undefined,
					emails:
						contact.emails.length > 0
							? contact.emails.map((e) => ({
									email: e.email,
									type: e.type || undefined,
									isPrimary: e.isPrimary,
								}))
							: undefined,
					phones:
						contact.phones.length > 0
							? contact.phones.map((p) => ({
									number: p.number,
									type: p.type || undefined,
									isPrimary: p.isPrimary,
								}))
							: undefined,
					addresses:
						contact.addresses.length > 0
							? contact.addresses.map((a) => ({
									type: a.type || undefined,
									streetAddress: a.streetAddress || undefined,
									locality: a.locality || undefined,
									region: a.region || undefined,
									postalCode: a.postalCode || undefined,
									country: a.country || undefined,
									isPrimary: a.isPrimary,
								}))
							: undefined,
					imHandles:
						contact.imHandles.length > 0
							? contact.imHandles.map((im) => ({
									handle: im.handle,
									service: im.service,
								}))
							: undefined,
					categories:
						contact.categories.length > 0
							? contact.categories.map((c) => c.category)
							: undefined,
				}),
			);

			const vcardContent = generateVCardFile({
				contacts: contactsForExport,
				prodId: "-//AppStandard Contacts//AppStandard Contacts//EN",
			});

			return {
				vcardContent,
				addressBookName: addressBook.name,
				contactCount: contactsForExport.length,
			};
		}),

	/**
	 * Import contacts from vCard file content
	 */
	importVCard: authOrAnonProcedure
		.input(
			z.object({
				id: z.string(),
				vcardContent: z.string(),
				replaceExisting: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.id, ctx);

			const { contacts: parsedContacts, errors } = parseVCardFile(
				input.vcardContent,
			);

			if (parsedContacts.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						errors.length > 0
							? `Failed to parse vCard file: ${errors.join(", ")}`
							: "No contacts found in vCard file",
				});
			}

			// If replaceExisting, delete all existing contacts first
			if (input.replaceExisting) {
				await prisma.contact.deleteMany({
					where: { addressBookId: input.id },
				});
			}

			// Create contacts from parsed data
			const createdContacts = await Promise.all(
				parsedContacts.map(async (parsedContact) => {
					return prisma.contact.create({
						data: {
							addressBookId: input.id,
							uid: parsedContact.uid,
							formattedName: parsedContact.formattedName,
							familyName: parsedContact.familyName,
							givenName: parsedContact.givenName,
							additionalName: parsedContact.additionalName,
							namePrefix: parsedContact.namePrefix,
							nameSuffix: parsedContact.nameSuffix,
							nickname: parsedContact.nickname,
							organization: parsedContact.organization,
							title: parsedContact.title,
							role: parsedContact.role,
							photoUrl: parsedContact.photoUrl,
							birthday: parsedContact.birthday,
							anniversary: parsedContact.anniversary,
							gender: mapGenderFromVCard(parsedContact.gender),
							kind: mapKindFromVCard(parsedContact.kind),
							note: parsedContact.note,
							url: parsedContact.url,
							geoLatitude: parsedContact.geoLatitude,
							geoLongitude: parsedContact.geoLongitude,
							timezone: parsedContact.timezone,
							...(parsedContact.emails
								? {
										emails: {
											create: parsedContact.emails.map((e) => ({
												email: e.email,
												isPrimary: e.isPrimary ?? false,
												...(e.type !== undefined ? { type: e.type } : {}),
											})),
										},
									}
								: {}),
							...(parsedContact.phones
								? {
										phones: {
											create: parsedContact.phones.map((p) => ({
												number: p.number,
												isPrimary: p.isPrimary ?? false,
												...(p.type !== undefined ? { type: p.type } : {}),
											})),
										},
									}
								: {}),
							...(parsedContact.addresses
								? {
										addresses: {
											create: parsedContact.addresses.map((a) => ({
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
												...(a.country !== undefined
													? { country: a.country }
													: {}),
											})),
										},
									}
								: {}),
							...(parsedContact.imHandles
								? {
										imHandles: {
											create: parsedContact.imHandles.map((im) => ({
												handle: im.handle,
												service: im.service ?? null,
											})),
										},
									}
								: {}),
							...(parsedContact.categories
								? {
										categories: {
											create: parsedContact.categories.map((category) => ({
												category,
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
				importedCount: createdContacts.length,
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
				addressBookCount: 0,
				maxAddressBooks: 10,
				contactCounts: {} as Record<string, number>,
				maxContactsPerAddressBook: 500,
			};
		}

		// Get contact counts per address book
		const addressBooks = await prisma.addressBook.findMany({
			where: buildOwnershipFilter(ctx),
			select: {
				id: true,
				_count: { select: { contacts: true } },
			},
		});

		const contactCounts: Record<string, number> = {};
		for (const book of addressBooks) {
			contactCounts[book.id] = book._count.contacts;
		}

		return {
			addressBookCount: usage.addressBookCount,
			maxAddressBooks: usage.maxAddressBooks,
			contactCounts,
			maxContactsPerAddressBook: usage.maxContactsPerBook,
		};
	}),
});
