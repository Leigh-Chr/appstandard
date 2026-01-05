/**
 * Cleanup utilities for address book relations before deletion
 * Handles AddressBookShareLink, AddressBookShareBundleBook, and AddressBookGroupMember
 * These relations don't have Prisma foreign keys, so they must be cleaned up manually
 */

import type { Prisma } from "@appstandard/db";
import prisma from "@appstandard/db";

type PrismaTransactionClient = Omit<
	Prisma.TransactionClient,
	"$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

/**
 * Cleanup all relations for address books before deletion
 * Handles AddressBookShareLink, AddressBookShareBundleBook, and AddressBookGroupMember
 * Uses transaction to ensure atomicity
 *
 * @param addressBookIds - Array of address book IDs to clean up relations for
 * @param tx - Optional Prisma transaction client. If provided, uses existing transaction. Otherwise creates a new one.
 * @param logger - Optional logger function for logging operations. If not provided, no logging is performed.
 */
export async function cleanupAddressBookRelations(
	addressBookIds: string[],
	tx?: PrismaTransactionClient,
	logger?: {
		info: (message: string, data?: unknown) => void;
	},
): Promise<void> {
	if (addressBookIds.length === 0) {
		return;
	}

	// Type for bundle data with included relations
	type BundleData = {
		bundle: {
			id: string;
			token: string;
			name: string | null;
			addressBooks: Array<{ addressBookId: string }>;
		};
		addressBookIds: string[];
	};

	/**
	 * Build a map of bundles grouped by bundleId
	 */
	const buildBundlesMap = async (
		client: PrismaTransactionClient,
		addressBookIds: string[],
	): Promise<Map<string, BundleData>> => {
		const bundleAddressBooks = await client.addressBookShareBundleBook.findMany(
			{
				where: { addressBookId: { in: addressBookIds } },
				include: {
					bundle: {
						include: {
							addressBooks: true,
						},
					},
				},
			},
		);

		const bundlesMap = new Map<string, BundleData>();

		for (const ba of bundleAddressBooks) {
			if (!bundlesMap.has(ba.bundleId)) {
				bundlesMap.set(ba.bundleId, {
					bundle: ba.bundle,
					addressBookIds: [],
				});
			}
			const bundleData = bundlesMap.get(ba.bundleId);
			if (bundleData) {
				bundleData.addressBookIds.push(ba.addressBookId);
			}
		}

		return bundlesMap;
	};

	/**
	 * Process a single bundle: delete it entirely or remove address book links
	 */
	const processBundle = async (
		client: PrismaTransactionClient,
		bundleId: string,
		bundle: BundleData["bundle"],
		bundleAddressBookIds: string[],
		addressBookIds: string[],
	) => {
		const allAddressBookIds = bundle.addressBooks.map((ab) => ab.addressBookId);
		const remainingAddressBooks = allAddressBookIds.filter(
			(id) => !addressBookIds.includes(id),
		);

		if (remainingAddressBooks.length === 0) {
			// All address books in bundle are being deleted → delete entire bundle
			// AddressBookShareBundleBook will be deleted via CASCADE
			await client.addressBookShareBundle.delete({
				where: { id: bundleId },
			});
			if (logger) {
				logger.info("Deleted share bundle (all address books deleted)", {
					bundleId,
				});
			}
		} else {
			// Some address books remain → delete only the AddressBookShareBundleBook links
			await client.addressBookShareBundleBook.deleteMany({
				where: {
					bundleId,
					addressBookId: { in: bundleAddressBookIds },
				},
			});
			if (logger) {
				logger.info("Removed address books from share bundle (bundle kept)", {
					bundleId,
					removedCount: bundleAddressBookIds.length,
				});
			}
		}
	};

	/**
	 * Handle AddressBookShareBundleBook cleanup
	 * Groups bundles and deletes either the entire bundle or just the address book links
	 */
	const cleanupShareBundles = async (
		client: PrismaTransactionClient,
		addressBookIds: string[],
	) => {
		const bundlesMap = await buildBundlesMap(client, addressBookIds);

		for (const [
			bundleId,
			{ bundle, addressBookIds: bundleAddressBookIds },
		] of bundlesMap) {
			await processBundle(
				client,
				bundleId,
				bundle,
				bundleAddressBookIds,
				addressBookIds,
			);
		}
	};

	const cleanup = async (client: PrismaTransactionClient) => {
		// 1. Delete AddressBookShareLink
		await client.addressBookShareLink.deleteMany({
			where: { addressBookId: { in: addressBookIds } },
		});

		// 2. Handle AddressBookShareBundleBook and bundles
		await cleanupShareBundles(client, addressBookIds);

		// 3. Delete AddressBookGroupMember
		await client.addressBookGroupMember.deleteMany({
			where: { addressBookId: { in: addressBookIds } },
		});
	};

	// If transaction client is provided, use it directly
	// Otherwise, create a new transaction
	if (tx) {
		await cleanup(tx);
	} else {
		await prisma.$transaction(async (transactionClient) => {
			await cleanup(transactionClient);
		});
	}
}
