import type { AppRouter } from "@appstandard-contacts/api";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import type { TRPCClientError } from "@trpc/client";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { handleTRPCError } from "@/lib/error-handler";

/**
 * Check if error is a network error
 */
function isNetworkErrorType(error: unknown): boolean {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		return (
			error.name === "NetworkError" ||
			error.name === "TypeError" ||
			message.includes("network") ||
			message.includes("fetch")
		);
	}
	return false;
}

/**
 * Handle UNAUTHORIZED errors
 * SECURITY: Anonymous IDs are now server-managed via secure cookies
 */
function handleUnauthorizedError(): boolean {
	// Anonymous IDs are now server-managed, no client-side action needed
	// The cookie will be present if the user has visited any page
	return true;
}

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			// Check if this query should suppress error logging
			const suppressErrorLog =
				query.meta &&
				typeof query.meta === "object" &&
				"suppressErrorLog" in query.meta
					? (query.meta as { suppressErrorLog?: boolean }).suppressErrorLog ===
						true
					: false;

			// Handle network errors first (even without data property)
			if (isNetworkErrorType(error)) {
				handleTRPCError(error as TRPCClientError<AppRouter>, {
					fallbackTitle: "Network Error",
					fallbackDescription:
						"Unable to contact the server. Make sure the server is running and check your connection.",
					showToast: !suppressErrorLog,
					logError: !suppressErrorLog,
				});
				return;
			}

			// Handle tRPC errors with data property
			if (error && typeof error === "object" && "data" in error) {
				const trpcError = error as TRPCClientError<AppRouter>;

				// For UNAUTHORIZED errors in anonymous mode, ensure anonymous ID exists
				if (
					trpcError.data?.code === "UNAUTHORIZED" &&
					handleUnauthorizedError()
				) {
					// Retry the query after ensuring anonymous ID exists
					// The query will be retried automatically by React Query
					return;
				}

				// If error logging is suppressed, skip logging and toasts
				if (suppressErrorLog) {
					return;
				}

				handleTRPCError(trpcError, {
					fallbackTitle: "Request error",
					fallbackDescription: "An error occurred while retrieving data.",
					showToast: true,
				});
				return;
			}

			// Log other errors in development mode (unless suppressed)
			if (import.meta.env.DEV && !suppressErrorLog) {
				console.error("Query error:", error);
			}
		},
	}),
	defaultOptions: {
		queries: {
			retry: (failureCount, error: unknown) => {
				// Extract error code if available
				const errorData =
					error &&
					typeof error === "object" &&
					"data" in error &&
					error.data &&
					typeof error.data === "object" &&
					"code" in error.data
						? (error.data as { code: string })
						: null;

				// Special handling for UNAUTHORIZED errors in anonymous mode
				if (errorData?.code === "UNAUTHORIZED" && failureCount < 1) {
					// Anonymous IDs are now server-managed via cookies
					// Retry once in case of timing issues with cookie setting
					return true;
				}

				// PERF-011: Don't retry rate limit errors - respect server's backoff
				if (errorData?.code === "TOO_MANY_REQUESTS") {
					return false;
				}

				// Don't retry client errors (4xx) - these are user errors, not transient
				if (errorData?.code) {
					const clientErrorCodes = [
						"BAD_REQUEST",
						"UNAUTHORIZED",
						"FORBIDDEN",
						"NOT_FOUND",
						"CONFLICT",
					];
					if (clientErrorCodes.includes(errorData.code)) {
						return false;
					}
				}

				// Retry server errors and network errors (max 3 times)
				return failureCount < 3;
			},
			// Exponential backoff: 1s, 2s, 4s (max 30s)
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
		mutations: {
			// Mutations should not be retried automatically
			// User actions should be explicit and not retried without user consent
			retry: false,
		},
	},
});

// Validate environment configuration
const envServerUrl = import.meta.env["VITE_SERVER_URL"];
const serverUrl = envServerUrl || "http://localhost:3003";

// Warn in development if VITE_SERVER_URL is not configured
if (import.meta.env.DEV && !envServerUrl) {
	console.warn(
		"[AppStandard Contacts] VITE_SERVER_URL not configured. Using default: http://localhost:3003\n" +
			"Create apps/contacts-web/.env with:\n" +
			"VITE_SERVER_URL=http://localhost:3003",
	);
}

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${serverUrl}/trpc`,
			fetch(url, options) {
				// SECURITY: Anonymous IDs are now managed via secure HttpOnly cookies
				// set by the server. No need to send headers from client side.
				// The cookie is automatically sent with credentials: "include"

				// nosemgrep: codacy.tools-configs.rules_lgpl_javascript_ssrf_rule-node-ssrf
				// URL is from environment config (VITE_SERVER_URL), not user input
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
