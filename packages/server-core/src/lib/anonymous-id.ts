/**
 * Secure anonymous ID management with HMAC signature
 * SECURITY: Anonymous IDs are server-generated and cryptographically signed
 * to prevent client-side forgery and ID spoofing.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getSecret } from "./secrets";

const ANON_ID_LENGTH = 32;
const SIGNATURE_LENGTH = 32; // 16 bytes = 32 hex chars
const COOKIE_NAME = "anon_id";

// Flag to track if we've already warned about missing dedicated secret
let warnedAboutMissingDedicatedSecret = false;

/**
 * Get the signing secret from environment/Docker secrets
 * SECURITY: In production, a dedicated ANON_ID_SECRET is recommended
 * to ensure secret rotation can be done independently.
 */
function getSigningSecret(): string {
	const isProduction = process.env["NODE_ENV"] === "production";

	// Try dedicated secret first (recommended)
	const dedicatedSecret = getSecret("ANON_ID_SECRET");
	if (dedicatedSecret) {
		return dedicatedSecret;
	}

	// Fall back to BETTER_AUTH_SECRET
	const authSecret =
		getSecret("BETTER_AUTH_SECRET") || process.env["BETTER_AUTH_SECRET"];

	if (!authSecret) {
		if (isProduction) {
			throw new Error(
				"ANON_ID_SECRET or BETTER_AUTH_SECRET required for anonymous ID signing",
			);
		}
		// In development, use a static secret (not secure, but allows testing)
		return "dev-secret-do-not-use-in-production-32chars";
	}

	// SECURITY: Warn in production if using shared secret (only once)
	if (isProduction && !warnedAboutMissingDedicatedSecret) {
		warnedAboutMissingDedicatedSecret = true;
		// biome-ignore lint/suspicious/noConsole: intentional security warning for ops monitoring
		console.warn(
			"[SECURITY] ANON_ID_SECRET not configured. Using BETTER_AUTH_SECRET as fallback. " +
				"Consider setting a dedicated ANON_ID_SECRET for independent secret rotation.",
		);
	}

	return authSecret;
}

/**
 * Generate a cryptographically secure random ID
 */
function generateRandomId(): string {
	return randomBytes(ANON_ID_LENGTH / 2).toString("hex");
}

/**
 * Create HMAC signature for an anonymous ID
 */
function createSignature(anonId: string): string {
	const secret = getSigningSecret();
	const hmac = createHmac("sha256", secret);
	hmac.update(anonId);
	return hmac.digest("hex").substring(0, SIGNATURE_LENGTH);
}

/**
 * Verify the signature of an anonymous ID
 * Uses Node's built-in timingSafeEqual for cryptographically secure comparison
 */
function verifySignature(anonId: string, signature: string): boolean {
	const expectedSignature = createSignature(anonId);

	// Length check must come first, but we use constant-time comparison
	if (signature.length !== expectedSignature.length) {
		return false;
	}

	// Use Node's built-in timing-safe comparison to prevent timing attacks
	const sigBuffer = Buffer.from(signature, "utf8");
	const expectedBuffer = Buffer.from(expectedSignature, "utf8");

	return timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Generate a new signed anonymous ID
 * Format: anon-{randomId}.{signature}
 */
export function generateSignedAnonymousId(): string {
	const randomPart = generateRandomId();
	const anonId = `anon-${randomPart}`;
	const signature = createSignature(anonId);
	return `${anonId}.${signature}`;
}

/**
 * Validate and extract the anonymous ID from a signed value
 * Returns null if invalid or tampered
 */
export function validateSignedAnonymousId(signedValue: string): string | null {
	if (!signedValue || typeof signedValue !== "string") {
		return null;
	}

	// Expected format: anon-{randomId}.{signature}
	const parts = signedValue.split(".");
	if (parts.length !== 2) {
		return null;
	}

	const [anonId, signature] = parts;

	// Validate format
	if (!anonId || !signature) {
		return null;
	}

	// Validate anon ID format: anon-{32 hex chars}
	if (!/^anon-[a-f0-9]{32}$/.test(anonId)) {
		return null;
	}

	// Validate signature length
	if (signature.length !== SIGNATURE_LENGTH) {
		return null;
	}

	// Verify cryptographic signature
	if (!verifySignature(anonId, signature)) {
		return null;
	}

	return anonId;
}

/**
 * Check if a raw anonymous ID (without signature) is valid format
 * This is for backwards compatibility during migration
 */
export function isValidAnonymousIdFormat(id: string): boolean {
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

export const ANON_COOKIE_NAME = COOKIE_NAME;

/**
 * Cookie options for secure anonymous ID storage
 */
export const ANON_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env["NODE_ENV"] === "production",
	sameSite: "lax" as const, // Allow cross-origin for initial page loads
	path: "/",
	maxAge: 60 * 60 * 24 * 365, // 1 year
} as const;
