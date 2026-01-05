import {
	buildOwnershipFilterFromContext,
	type Context,
	isAnonymousUserFromContext,
	isAuthenticatedUserFromContext,
} from "@appstandard/api-core";
import prisma from "@appstandard/db";
import { getMaxTaskLists, getMaxTasksPerList } from "@appstandard-tasks/core";
import { TRPCError } from "@trpc/server";

// Re-export from api-core for backwards compatibility
export const buildOwnershipFilter = buildOwnershipFilterFromContext;
export const isAnonymousUser = isAnonymousUserFromContext;
export const isAuthenticatedUser = isAuthenticatedUserFromContext;

/**
 * Verify task list access
 */
export async function verifyTaskListAccess(
	taskListId: string,
	ctx: Context,
): Promise<{ id: string; userId: string | null }> {
	const taskList = await prisma.taskList.findUnique({
		where: { id: taskListId },
		select: { id: true, userId: true },
	});

	if (!taskList) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Task list not found",
		});
	}

	const ownershipFilter = buildOwnershipFilter(ctx);
	const isOwner =
		ownershipFilter.OR?.some(
			(condition) =>
				"userId" in condition && condition.userId === taskList.userId,
		) ?? false;

	if (!isOwner && taskList.userId !== null) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Access denied to this task list",
		});
	}

	return taskList;
}

/**
 * Verify task access
 */
export async function verifyTaskAccess(
	taskId: string,
	ctx: Context,
): Promise<{ id: string; taskListId: string }> {
	const task = await prisma.task.findUnique({
		where: { id: taskId },
		select: {
			id: true,
			taskListId: true,
			taskList: {
				select: { userId: true },
			},
		},
	});

	if (!task) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Task not found",
		});
	}

	const ownershipFilter = buildOwnershipFilter(ctx);
	const isOwner =
		ownershipFilter.OR?.some(
			(condition) =>
				"userId" in condition && condition.userId === task.taskList.userId,
		) ?? false;

	if (!isOwner && task.taskList.userId !== null) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Access denied to this task",
		});
	}

	return { id: task.id, taskListId: task.taskListId };
}

/**
 * Get user usage statistics
 */
export async function getUserUsage(ctx: Context): Promise<{
	isAuthenticated: boolean;
	taskListCount: number;
	maxTaskLists: number;
	maxTasksPerList: number;
} | null> {
	if (!ctx.userId) {
		return null;
	}

	const isAuth = isAuthenticatedUser(ctx);

	const taskListCount = await prisma.taskList.count({
		where: { userId: ctx.userId },
	});

	return {
		isAuthenticated: isAuth,
		taskListCount,
		maxTaskLists: getMaxTaskLists(isAuth),
		maxTasksPerList: getMaxTasksPerList(isAuth),
	};
}

/**
 * Check task list limit and throw if exceeded
 */
export async function checkTaskListLimit(ctx: Context): Promise<void> {
	if (!ctx.userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User context not available",
		});
	}

	const isAuth = isAuthenticatedUser(ctx);
	const maxTaskLists = getMaxTaskLists(isAuth);

	const taskListCount = await prisma.taskList.count({
		where: { userId: ctx.userId },
	});

	if (taskListCount >= maxTaskLists) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: `Task list limit reached: maximum ${maxTaskLists} task lists allowed`,
		});
	}
}
