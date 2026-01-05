/**
 * Hook to check server availability
 * Separates server status checking logic from components
 */

import { useCallback, useEffect, useState } from "react";

export type ServerStatus = "checking" | "online" | "offline";

export interface ServerStatusState {
	status: ServerStatus;
	lastChecked: Date | null;
	isOnline: boolean;
	isOffline: boolean;
	isChecking: boolean;
	refetch: () => Promise<void>;
}

export interface ServerStatusOptions {
	/**
	 * Server URL to check. Defaults to VITE_SERVER_URL env var
	 */
	serverUrl?: string;
	/**
	 * Check interval in milliseconds. Defaults to 30000 (30 seconds)
	 */
	checkInterval?: number;
	/**
	 * Request timeout in milliseconds. Defaults to 5000 (5 seconds)
	 */
	timeout?: number;
	/**
	 * Whether to start checking immediately. Defaults to true
	 */
	enabled?: boolean;
}

const DEFAULT_CHECK_INTERVAL = 30000;
const DEFAULT_TIMEOUT = 5000;

/**
 * Get server URL from environment or options
 */
function getServerUrl(serverUrl?: string): string {
	if (serverUrl) return serverUrl;

	if (typeof import.meta !== "undefined" && import.meta.env) {
		return import.meta.env["VITE_SERVER_URL"] || "http://localhost:3000";
	}

	return "http://localhost:3000";
}

/**
 * Hook to monitor server status
 * @param options - Configuration options
 */
export function useServerStatus(
	options: ServerStatusOptions = {},
): ServerStatusState {
	const {
		serverUrl,
		checkInterval = DEFAULT_CHECK_INTERVAL,
		timeout = DEFAULT_TIMEOUT,
		enabled = true,
	} = options;

	const [status, setStatus] = useState<ServerStatus>("checking");
	const [lastChecked, setLastChecked] = useState<Date | null>(null);

	const url = getServerUrl(serverUrl);

	const checkServer = useCallback(async () => {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			const response = await fetch(`${url}/`, {
				signal: controller.signal,
				method: "GET",
			});

			clearTimeout(timeoutId);

			if (response.ok) {
				setStatus("online");
				setLastChecked(new Date());
			} else {
				setStatus("offline");
				setLastChecked(new Date());
			}
		} catch (_error) {
			setStatus("offline");
			setLastChecked(new Date());
		}
	}, [url, timeout]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		// Initial check
		checkServer();

		// Periodic checks
		const interval = setInterval(checkServer, checkInterval);

		return () => {
			clearInterval(interval);
		};
	}, [checkServer, checkInterval, enabled]);

	return {
		status,
		lastChecked,
		isOnline: status === "online",
		isOffline: status === "offline",
		isChecking: status === "checking",
		refetch: checkServer,
	};
}

/**
 * Factory to create a server status hook with preset configuration
 * Useful for apps with fixed server URLs
 */
export function createServerStatusHook(defaultOptions: ServerStatusOptions) {
	return function useConfiguredServerStatus(
		options?: Partial<ServerStatusOptions>,
	): ServerStatusState {
		return useServerStatus({ ...defaultOptions, ...options });
	};
}
