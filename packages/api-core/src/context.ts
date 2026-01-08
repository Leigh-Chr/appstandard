/**
 * Shared context creation for all API packages
 * SECURITY: Anonymous IDs are now server-generated and cryptographically signed
 */

import { auth } from "@appstandard/auth";
import { getAnonymousIdFromRequest } from "@appstandard/server-core";
import type { Context as HonoContext } from "hono";

export interface CreateContextOptions {
	context: HonoContext;
}

/**
 * Validate anonymous ID format
 * Must match: anon-[a-zA-Z0-9_-]{21,64} (legacy) or anon-[a-f0-9]{32} (new)
 * @deprecated Use server-side validation via signed cookies instead
 */
export function isValidAnonymousId(id: string): boolean {
	// New format: anon-{32 hex chars}
	if (/^anon-[a-f0-9]{32}$/.test(id)) {
		return true;
	}
	// Legacy format: anon-{21-64 alphanumeric chars}
	if (/^anon-[a-zA-Z0-9_-]{21,64}$/.test(id)) {
		return true;
	}
	return false;
}

/**
 * Create context for tRPC procedures
 * Extracts session, anonymous ID, and correlation ID from request
 *
 * SECURITY: Anonymous IDs are extracted from cryptographically signed cookies
 * set by the server. Client headers (x-anonymous-id) are ignored to prevent
 * ID spoofing attacks.
 */
export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	// SECURITY: Get anonymous ID from signed cookie only (not from headers)
	// This prevents attackers from spoofing anonymous IDs
	const anonymousId = getAnonymousIdFromRequest(context);

	// Extract correlation ID from header (set by correlationIdMiddleware)
	const correlationId = context.req.header("x-correlation-id");

	return {
		session,
		anonymousId,
		correlationId,
		// Use userId if authenticated, otherwise use anonymousId
		userId: session?.user?.id || anonymousId,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
