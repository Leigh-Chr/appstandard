/**
 * Storage hook for authentication status
 */

import { authClient } from "@appstandard/react-utils";

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
	const session = authClient.useSession();
	return !!session.data;
}
