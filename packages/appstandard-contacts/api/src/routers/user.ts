import { protectedProcedure, router } from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { TRPCError } from "@trpc/server";
import { getUserUsage } from "../middleware";
import { exportDataRateLimit } from "../middleware/rate-limit";

export const userRouter = router({
	/**
	 * Get current user's usage information
	 * Authenticated users have generous limits (100 address books, 2000 contacts)
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
				addressBookCount: usage.addressBookCount,
				maxAddressBooks: usage.maxAddressBooks,
				maxContactsPerBook: usage.maxContactsPerBook,
			},
		};
	}),

	/**
	 * Export all user data (RGPD - Right to Data Portability)
	 * Returns a JSON structure with all user's address books, contacts, groups, and share links
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

			// Fetch all address books with contacts
			const addressBooks = await prisma.addressBook.findMany({
				where: { userId },
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
						orderBy: {
							formattedName: "asc",
						},
					},
				},
				orderBy: {
					createdAt: "asc",
				},
			});

			// Fetch address book groups
			const groups = await prisma.addressBookGroup.findMany({
				where: { userId },
				include: {
					addressBooks: {
						orderBy: {
							order: "asc",
						},
					},
				},
				orderBy: {
					createdAt: "asc",
				},
			});

			// Get address book IDs for share links and bundles
			const addressBookIds = addressBooks.map((book) => book.id);

			// Fetch share links for user's address books
			const shareLinks = await prisma.addressBookShareLink.findMany({
				where: {
					addressBookId: { in: addressBookIds },
				},
				orderBy: {
					createdAt: "asc",
				},
			});

			// Fetch share bundles where user owns all address books
			const bundleAddressBooks =
				await prisma.addressBookShareBundleBook.findMany({
					where: {
						addressBookId: { in: addressBookIds },
					},
					include: {
						bundle: {
							include: {
								addressBooks: true,
							},
						},
					},
				});

			// Filter bundles where ALL address books belong to the user
			const userBundles = bundleAddressBooks
				.map((ba) => ba.bundle)
				.filter((bundle, index, self) => {
					// Deduplicate by bundle ID
					return self.findIndex((b) => b.id === bundle.id) === index;
				})
				.filter((bundle) => {
					// Check if all address books in bundle belong to user
					const allAddressBookIds = bundle.addressBooks.map(
						(a) => a.addressBookId,
					);
					return allAddressBookIds.every((id) => addressBookIds.includes(id));
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
					addressBooks: bundle.addressBooks.map((a) => ({
						addressBookId: a.addressBookId,
						order: a.order,
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
				addressBooks: addressBooks.map((book) => ({
					id: book.id,
					name: book.name,
					color: book.color,
					sourceUrl: book.sourceUrl,
					lastSyncedAt: book.lastSyncedAt?.toISOString() ?? null,
					createdAt: book.createdAt.toISOString(),
					updatedAt: book.updatedAt.toISOString(),
					contacts: book.contacts.map((contact) => ({
						id: contact.id,
						formattedName: contact.formattedName,
						familyName: contact.familyName,
						givenName: contact.givenName,
						additionalName: contact.additionalName,
						namePrefix: contact.namePrefix,
						nameSuffix: contact.nameSuffix,
						nickname: contact.nickname,
						photoUrl: contact.photoUrl,
						birthday: contact.birthday?.toISOString() ?? null,
						anniversary: contact.anniversary?.toISOString() ?? null,
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
						revision: contact.revision?.toISOString() ?? null,
						emails: contact.emails.map((e) => ({
							email: e.email,
							type: e.type,
							isPrimary: e.isPrimary,
						})),
						phones: contact.phones.map((p) => ({
							number: p.number,
							type: p.type,
							isPrimary: p.isPrimary,
						})),
						addresses: contact.addresses.map((a) => ({
							type: a.type,
							streetAddress: a.streetAddress,
							locality: a.locality,
							region: a.region,
							postalCode: a.postalCode,
							country: a.country,
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
						createdAt: contact.createdAt.toISOString(),
						updatedAt: contact.updatedAt.toISOString(),
					})),
				})),
				groups: groups.map((group) => ({
					id: group.id,
					name: group.name,
					description: group.description,
					color: group.color,
					createdAt: group.createdAt.toISOString(),
					updatedAt: group.updatedAt.toISOString(),
					addressBooks: group.addressBooks.map((a) => ({
						addressBookId: a.addressBookId,
						order: a.order,
					})),
				})),
				shareLinks: shareLinks.map((link) => ({
					id: link.id,
					addressBookId: link.addressBookId,
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
