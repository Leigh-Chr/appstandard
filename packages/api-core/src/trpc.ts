/**
 * Shared tRPC initialization and procedures
 * Used by all API packages
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import type { Context } from "./context";

const isProduction = process.env["NODE_ENV"] === "production";

/**
 * Initialize tRPC with the shared context type
 */
export const t = initTRPC.context<Context>().create({
	errorFormatter({ shape, error }) {
		// Handle internal server errors in production
		if (isProduction && error.code === "INTERNAL_SERVER_ERROR") {
			return {
				...shape,
				message: "An internal error occurred",
				data: {
					...shape.data,
					stack: undefined,
				},
			};
		}

		// Flatten Zod validation errors for better client-side handling
		const zodError =
			error.cause instanceof ZodError ? error.cause.flatten() : null;

		return {
			...shape,
			data: {
				...shape.data,
				zodError,
			},
		};
	},
});

/**
 * Router factory
 */
export const router = t.router;

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Authenticated or Anonymous procedure
 * Requires either a session or anonymous ID
 */
export const authOrAnonProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User ID required. Please authenticate or provide anonymous ID.",
		});
	}
	return next({
		ctx: {
			...ctx,
			userId: ctx.userId,
		},
	});
});

/**
 * Protected procedure - requires authenticated session only
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});
