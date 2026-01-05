import {
	buildOwnershipFilterFromContext,
	type Context,
	isAnonymousUserFromContext,
	isAuthenticatedUserFromContext,
} from "@appstandard/api-core";
import prisma from "@appstandard/db";
import {
	getMaxAddressBooks,
	getMaxContactsPerBook,
} from "@appstandard-contacts/core";
import { TRPCError } from "@trpc/server";

// Re-export from api-core for backwards compatibility
export const buildOwnershipFilter = buildOwnershipFilterFromContext;
export const isAnonymousUser = isAnonymousUserFromContext;
export const isAuthenticatedUser = isAuthenticatedUserFromContext;

/**
 * Verify address book access
 */
export async function verifyAddressBookAccess(
	addressBookId: string,
	ctx: Context,
): Promise<{ id: string; userId: string | null }> {
	const addressBook = await prisma.addressBook.findUnique({
		where: { id: addressBookId },
		select: { id: true, userId: true },
	});

	if (!addressBook) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Address book not found",
		});
	}

	const ownershipFilter = buildOwnershipFilter(ctx);
	const isOwner =
		ownershipFilter.OR?.some(
			(condition) =>
				"userId" in condition && condition.userId === addressBook.userId,
		) ?? false;

	if (!isOwner && addressBook.userId !== null) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Access denied to this address book",
		});
	}

	return addressBook;
}

/**
 * Verify contact access
 */
export async function verifyContactAccess(
	contactId: string,
	ctx: Context,
): Promise<{ id: string; addressBookId: string }> {
	const contact = await prisma.contact.findUnique({
		where: { id: contactId },
		select: {
			id: true,
			addressBookId: true,
			addressBook: {
				select: { userId: true },
			},
		},
	});

	if (!contact) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Contact not found",
		});
	}

	const ownershipFilter = buildOwnershipFilter(ctx);
	const isOwner =
		ownershipFilter.OR?.some(
			(condition) =>
				"userId" in condition &&
				condition.userId === contact.addressBook.userId,
		) ?? false;

	if (!isOwner && contact.addressBook.userId !== null) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Access denied to this contact",
		});
	}

	return { id: contact.id, addressBookId: contact.addressBookId };
}

/**
 * Get user usage statistics
 */
export async function getUserUsage(ctx: Context): Promise<{
	isAuthenticated: boolean;
	addressBookCount: number;
	maxAddressBooks: number;
	maxContactsPerBook: number;
} | null> {
	if (!ctx.userId) {
		return null;
	}

	const isAuth = isAuthenticatedUser(ctx);

	const addressBookCount = await prisma.addressBook.count({
		where: { userId: ctx.userId },
	});

	return {
		isAuthenticated: isAuth,
		addressBookCount,
		maxAddressBooks: getMaxAddressBooks(isAuth),
		maxContactsPerBook: getMaxContactsPerBook(isAuth),
	};
}

/**
 * Check address book limit and throw if exceeded
 */
export async function checkAddressBookLimit(ctx: Context): Promise<void> {
	if (!ctx.userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User context not available",
		});
	}

	const isAuth = isAuthenticatedUser(ctx);
	const maxAddressBooks = getMaxAddressBooks(isAuth);

	const addressBookCount = await prisma.addressBook.count({
		where: { userId: ctx.userId },
	});

	if (addressBookCount >= maxAddressBooks) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: `Address book limit reached: maximum ${maxAddressBooks} address books allowed`,
		});
	}
}
