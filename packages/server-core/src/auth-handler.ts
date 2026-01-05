/**
 * Better-Auth handler factory for Hono applications
 * Provides consistent error handling and Prisma error conversion
 */

import type { auth as BetterAuth } from "@appstandard/auth";
import type { Context } from "hono";
import { handlePrismaErrorForAuth, Sentry } from "./app";
import { logger } from "./lib/logger";

/**
 * Create a Better-Auth handler for Hono
 * Handles authentication requests with proper error handling and Prisma error conversion
 */
export function createAuthHandler(auth: typeof BetterAuth) {
	return async (c: Context) => {
		try {
			const response = await auth.handler(c.req.raw);
			return response;
		} catch (error) {
			logger.error("Better-Auth handler error", error);

			const prismaErrorResponse = handlePrismaErrorForAuth(error);
			if (prismaErrorResponse) {
				return c.json(
					{
						error: {
							message: prismaErrorResponse.body.error,
							status: prismaErrorResponse.status,
							statusText: prismaErrorResponse.body.code || "Error",
						},
					},
					prismaErrorResponse.status as 400 | 404 | 409 | 500,
				);
			}

			Sentry.captureException(error);
			return c.json(
				{
					error: {
						message: "An error occurred during authentication",
						status: 500,
						statusText: "Internal Server Error",
					},
					timestamp: new Date().toISOString(),
				},
				500,
			);
		}
	};
}
