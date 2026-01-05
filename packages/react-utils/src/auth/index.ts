/**
 * Auth client factory for AppStandard applications
 * Creates a Better-Auth client configured for the app
 */

import type { auth } from "@appstandard/auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";

export type AuthClient = ReturnType<typeof createBetterAuthClient>;

/**
 * Create an auth client for the application
 * @param serverUrl - The server URL (defaults to VITE_SERVER_URL env var)
 */
export function createAuthClient(serverUrl?: string): AuthClient {
	const baseURL =
		serverUrl ??
		(typeof import.meta !== "undefined" && import.meta.env
			? import.meta.env["VITE_SERVER_URL"]
			: undefined);

	if (!baseURL) {
		throw new Error(
			"Server URL is required. Set VITE_SERVER_URL or pass serverUrl parameter.",
		);
	}

	return createBetterAuthClient({
		baseURL,
		plugins: [inferAdditionalFields<typeof auth>()],
	});
}

/**
 * Pre-configured auth client using VITE_SERVER_URL
 * Use createAuthClient() for custom configuration
 */
export const authClient = createBetterAuthClient({
	baseURL:
		typeof import.meta !== "undefined" && import.meta.env
			? import.meta.env["VITE_SERVER_URL"]
			: "",
	plugins: [inferAdditionalFields<typeof auth>()],
});
