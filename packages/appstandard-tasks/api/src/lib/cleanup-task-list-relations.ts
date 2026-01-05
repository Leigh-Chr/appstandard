/**
 * Cleanup utilities for task list relations before deletion
 * Handles TaskListShareLink, TaskShareBundleTaskList, and TaskListGroupMember
 * These relations don't have Prisma foreign keys, so they must be cleaned up manually
 */

import type { Prisma } from "@appstandard/db";
import prisma from "@appstandard/db";

type PrismaTransactionClient = Omit<
	Prisma.TransactionClient,
	"$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

/**
 * Cleanup all relations for task lists before deletion
 * Handles TaskListShareLink, TaskShareBundleTaskList, and TaskListGroupMember
 * Uses transaction to ensure atomicity
 *
 * @param taskListIds - Array of task list IDs to clean up relations for
 * @param tx - Optional Prisma transaction client. If provided, uses existing transaction. Otherwise creates a new one.
 * @param logger - Optional logger function for logging operations. If not provided, no logging is performed.
 */
export async function cleanupTaskListRelations(
	taskListIds: string[],
	tx?: PrismaTransactionClient,
	logger?: {
		info: (message: string, data?: unknown) => void;
	},
): Promise<void> {
	if (taskListIds.length === 0) {
		return;
	}

	// Type for bundle data with included relations
	type BundleData = {
		bundle: {
			id: string;
			token: string;
			name: string | null;
			taskLists: Array<{ taskListId: string }>;
		};
		taskListIds: string[];
	};

	/**
	 * Build a map of bundles grouped by bundleId
	 */
	const buildBundlesMap = async (
		client: PrismaTransactionClient,
		taskListIds: string[],
	): Promise<Map<string, BundleData>> => {
		const bundleTaskLists = await client.taskShareBundleTaskList.findMany({
			where: { taskListId: { in: taskListIds } },
			include: {
				bundle: {
					include: {
						taskLists: true,
					},
				},
			},
		});

		const bundlesMap = new Map<string, BundleData>();

		for (const bt of bundleTaskLists) {
			if (!bundlesMap.has(bt.bundleId)) {
				bundlesMap.set(bt.bundleId, {
					bundle: bt.bundle,
					taskListIds: [],
				});
			}
			const bundleData = bundlesMap.get(bt.bundleId);
			if (bundleData) {
				bundleData.taskListIds.push(bt.taskListId);
			}
		}

		return bundlesMap;
	};

	/**
	 * Process a single bundle: delete it entirely or remove task list links
	 */
	const processBundle = async (
		client: PrismaTransactionClient,
		bundleId: string,
		bundle: BundleData["bundle"],
		bundleTaskListIds: string[],
		taskListIds: string[],
	) => {
		const allTaskListIds = bundle.taskLists.map((tl) => tl.taskListId);
		const remainingTaskLists = allTaskListIds.filter(
			(id) => !taskListIds.includes(id),
		);

		if (remainingTaskLists.length === 0) {
			// All task lists in bundle are being deleted → delete entire bundle
			// TaskShareBundleTaskList will be deleted via CASCADE
			await client.taskListShareBundle.delete({
				where: { id: bundleId },
			});
			if (logger) {
				logger.info("Deleted share bundle (all task lists deleted)", {
					bundleId,
				});
			}
		} else {
			// Some task lists remain → delete only the TaskShareBundleTaskList links
			await client.taskShareBundleTaskList.deleteMany({
				where: {
					bundleId,
					taskListId: { in: bundleTaskListIds },
				},
			});
			if (logger) {
				logger.info("Removed task lists from share bundle (bundle kept)", {
					bundleId,
					removedCount: bundleTaskListIds.length,
				});
			}
		}
	};

	/**
	 * Handle TaskShareBundleTaskList cleanup
	 * Groups bundles and deletes either the entire bundle or just the task list links
	 */
	const cleanupShareBundles = async (
		client: PrismaTransactionClient,
		taskListIds: string[],
	) => {
		const bundlesMap = await buildBundlesMap(client, taskListIds);

		for (const [
			bundleId,
			{ bundle, taskListIds: bundleTaskListIds },
		] of bundlesMap) {
			await processBundle(
				client,
				bundleId,
				bundle,
				bundleTaskListIds,
				taskListIds,
			);
		}
	};

	const cleanup = async (client: PrismaTransactionClient) => {
		// 1. Delete TaskListShareLink
		await client.taskListShareLink.deleteMany({
			where: { taskListId: { in: taskListIds } },
		});

		// 2. Handle TaskShareBundleTaskList and bundles
		await cleanupShareBundles(client, taskListIds);

		// 3. Delete TaskListGroupMember
		await client.taskListGroupMember.deleteMany({
			where: { taskListId: { in: taskListIds } },
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
