/**
 * Storage hook for authentication status
 */

import { authClient } from "@/lib/auth-client";

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
	const session = authClient.useSession();
	return !!session.data;
}
