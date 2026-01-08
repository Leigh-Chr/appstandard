/**
 * Anonymous ID middleware
 * SECURITY: Manages server-generated, cryptographically signed anonymous IDs
 * to prevent ID spoofing attacks.
 */

import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
	ANON_COOKIE_NAME,
	ANON_COOKIE_OPTIONS,
	generateSignedAnonymousId,
	validateSignedAnonymousId,
} from "../lib/anonymous-id";
import { logger, logSecurityEvent } from "../lib/logger";

/**
 * Extract and validate anonymous ID from request
 * Returns the anonymous ID if valid, null otherwise
 */
export function getAnonymousIdFromRequest(c: Context): string | null {
	// 1. Try signed cookie first (secure, preferred)
	const cookieValue = getCookie(c, ANON_COOKIE_NAME);
	if (cookieValue) {
		const validatedId = validateSignedAnonymousId(cookieValue);
		if (validatedId) {
			return validatedId;
		}
		// Cookie exists but invalid - log and continue
		logSecurityEvent("invalid_anonymous_id_cookie", {
			ip: c.req.header("x-forwarded-for") || "unknown",
			reason: "Cookie signature validation failed",
		});
	}

	// 2. No valid cookie - return null
	// SECURITY: We no longer accept x-anonymous-id header to prevent spoofing
	return null;
}

/**
 * Middleware to manage anonymous ID cookies
 * - Validates existing signed cookies
 * - Generates new signed ID if needed
 * - Sets secure HttpOnly cookie
 */
export function anonymousIdMiddleware(): MiddlewareHandler {
	return async (c, next) => {
		// Check for existing valid cookie
		const cookieValue = getCookie(c, ANON_COOKIE_NAME);

		if (cookieValue) {
			const validatedId = validateSignedAnonymousId(cookieValue);
			if (validatedId) {
				// Valid signed cookie exists - proceed
				return next();
			}

			// Invalid cookie - log potential attack
			logSecurityEvent("invalid_anonymous_id_attempt", {
				ip: c.req.header("x-forwarded-for") || "unknown",
				path: c.req.path,
				reason: "Invalid or tampered anonymous ID cookie",
			});
		}

		// Generate new signed anonymous ID
		const newSignedId = generateSignedAnonymousId();

		// Set secure cookie
		setCookie(c, ANON_COOKIE_NAME, newSignedId, {
			...ANON_COOKIE_OPTIONS,
			secure: process.env["NODE_ENV"] === "production",
		});

		// Only log in development to avoid noise
		if (process.env["NODE_ENV"] !== "production") {
			logger.info("Generated new anonymous ID", {
				path: c.req.path,
			});
		}

		return next();
	};
}

/**
 * Export for use in context creation
 */
export { ANON_COOKIE_NAME };
