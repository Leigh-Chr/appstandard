/**
 * Address book merge and duplicate cleaning operations
 */

import { authOrAnonProcedure, router } from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { TRPCError } from "@trpc/server";
import z from "zod";
import {
	deduplicateContacts,
	getDuplicateIds,
} from "../lib/duplicate-detection";
import { buildOwnershipFilter, verifyAddressBookAccess } from "../middleware";

export const mergeDuplicatesRouter = router({
	/**
	 * Merge multiple address books into a new one
	 */
	merge: authOrAnonProcedure
		.input(
			z.object({
				addressBookIds: z.array(z.string()).min(2).max(10),
				name: z.string().min(1).max(200),
				removeDuplicates: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Fetch all address books with contacts
			const addressBooks = await prisma.addressBook.findMany({
				where: {
					id: { in: input.addressBookIds },
					...buildOwnershipFilter(ctx),
				},
				include: {
					contacts: {
						include: {
							emails: true,
							phones: true,
						},
					},
				},
			});

			if (addressBooks.length !== input.addressBookIds.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "One or more address books not found",
				});
			}

			// Collect all contacts
			const allContacts = addressBooks.flatMap((book) => book.contacts);

			// Remove duplicates if requested
			let contactsToMerge = allContacts;
			if (input.removeDuplicates) {
				const { unique } = deduplicateContacts(allContacts, {
					useUid: true,
					useName: true,
					useEmail: true,
				});
				contactsToMerge = unique;
			}

			// Create merged address book
			const mergedAddressBook = await prisma.addressBook.create({
				data: {
					name: input.name,
					userId: ctx.session?.user?.id || ctx.anonymousId || null,
				},
			});

			// Create all contacts
			if (contactsToMerge.length > 0) {
				await prisma.contact.createMany({
					data: contactsToMerge.map((contact) => ({
						addressBookId: mergedAddressBook.id,
						formattedName: contact.formattedName,
						familyName: contact.familyName,
						givenName: contact.givenName,
						additionalName: contact.additionalName,
						namePrefix: contact.namePrefix,
						nameSuffix: contact.nameSuffix,
						nickname: contact.nickname,
						photoUrl: contact.photoUrl,
						birthday: contact.birthday,
						anniversary: contact.anniversary,
						gender: contact.gender,
						organization: contact.organization,
						title: contact.title,
						role: contact.role,
						geoLatitude: contact.geoLatitude,
						geoLongitude: contact.geoLongitude,
						timezone: contact.timezone,
						note: contact.note,
						url: contact.url,
						kind: contact.kind,
						uid: contact.uid,
						revision: contact.revision,
					})),
				});
			}

			return {
				addressBook: mergedAddressBook,
				mergedContacts: contactsToMerge.length,
				removedDuplicates: allContacts.length - contactsToMerge.length,
			};
		}),

	/**
	 * Clean duplicates from an address book
	 */
	cleanDuplicates: authOrAnonProcedure
		.input(z.object({ addressBookId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.addressBookId, ctx);

			const addressBook = await prisma.addressBook.findUnique({
				where: { id: input.addressBookId },
				include: {
					contacts: {
						include: {
							emails: true,
							phones: true,
						},
					},
				},
			});

			if (!addressBook) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied to this address book",
				});
			}

			// Detect duplicates
			const duplicateIds = getDuplicateIds(addressBook.contacts, {
				useUid: true,
				useName: true,
				useEmail: true,
			});

			// Delete duplicates
			if (duplicateIds.length > 0) {
				await prisma.contact.deleteMany({
					where: {
						id: { in: duplicateIds },
					},
				});
			}

			return {
				removedCount: duplicateIds.length,
				remainingContacts: addressBook.contacts.length - duplicateIds.length,
			};
		}),

	/**
	 * Detect potential duplicates without removing them
	 */
	detectDuplicates: authOrAnonProcedure
		.input(z.object({ addressBookId: z.string() }))
		.query(async ({ ctx, input }) => {
			await verifyAddressBookAccess(input.addressBookId, ctx);

			const addressBook = await prisma.addressBook.findUnique({
				where: { id: input.addressBookId },
				include: {
					contacts: {
						select: {
							id: true,
							uid: true,
							formattedName: true,
							organization: true,
							emails: {
								select: { email: true },
							},
							phones: {
								select: { number: true },
							},
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

			const { duplicates } = deduplicateContacts(addressBook.contacts, {
				useUid: true,
				useName: true,
				useEmail: true,
			});

			return {
				totalContacts: addressBook.contacts.length,
				duplicateCount: duplicates.length,
				duplicates: duplicates.map((c) => ({
					id: c.id,
					formattedName: c.formattedName,
					emails: c.emails?.map((e) => e.email) || [],
				})),
			};
		}),
});
