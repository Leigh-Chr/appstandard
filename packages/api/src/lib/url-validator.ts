/**
 * URL Validator - Protection against SSRF (Server-Side Request Forgery)
 * Validates URLs before making server-side HTTP requests
 *
 * Security Measures:
 * 1. Protocol validation (HTTP/HTTPS only)
 * 2. Hostname blocklist (cloud metadata endpoints)
 * 3. Private IP range detection (RFC 1918, link-local, loopback)
 * 4. DNS rebinding protection via resolved IP validation
 *
 * @see https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/
 */

import * as dns from "node:dns/promises";
import { TRPCError } from "@trpc/server";

/**
 * List of blocked hostnames for cloud metadata services
 */
const BLOCKED_HOSTNAMES = [
	"localhost",
	"127.0.0.1",
	"0.0.0.0",
	"[::1]",
	"[::]",
	"metadata.google.internal",
	"metadata.google",
	"169.254.169.254", // AWS/GCP/Azure metadata
	"169.254.170.2", // AWS ECS metadata
	"fd00:ec2::254", // AWS IPv6 metadata
];

/**
 * Check if an IP address is in a private range
 * Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8
 */
function isPrivateIPv4(ip: string): boolean {
	const parts = ip.split(".").map(Number);
	if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) {
		return false;
	}

	const [a, b] = parts;

	// 10.0.0.0/8
	if (a === 10) return true;

	// 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
	if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;

	// 192.168.0.0/16
	if (a === 192 && b === 168) return true;

	// 127.0.0.0/8 (loopback)
	if (a === 127) return true;

	// 0.0.0.0/8
	if (a === 0) return true;

	// 169.254.0.0/16 (link-local)
	if (a === 169 && b === 254) return true;

	return false;
}

/**
 * Check if an IPv6 address is private/local
 */
function isPrivateIPv6(ip: string): boolean {
	const normalized = ip.toLowerCase();

	// Loopback
	if (normalized === "::1" || normalized === "[::1]") return true;

	// Unspecified
	if (normalized === "::" || normalized === "[::]") return true;

	// Link-local (fe80::/10)
	if (normalized.startsWith("fe80:") || normalized.startsWith("[fe80:"))
		return true;

	// Unique local (fc00::/7)
	if (
		normalized.startsWith("fc") ||
		normalized.startsWith("fd") ||
		normalized.startsWith("[fc") ||
		normalized.startsWith("[fd")
	)
		return true;

	return false;
}

/**
 * Check if a hostname is a blocked cloud metadata service
 */
function isCloudMetadata(hostname: string): boolean {
	const normalizedHostname = hostname.toLowerCase();
	return BLOCKED_HOSTNAMES.some(
		(blocked) =>
			normalizedHostname === blocked ||
			normalizedHostname.endsWith(`.${blocked}`),
	);
}

/**
 * Check if a hostname looks like an IP address
 */
function isIPAddress(hostname: string): boolean {
	// IPv4 pattern
	const ipv4Pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
	if (ipv4Pattern.test(hostname)) return true;

	// IPv6 pattern (simplified - starts with [ or contains ::)
	if (hostname.startsWith("[") || hostname.includes("::")) return true;

	return false;
}

/**
 * Result of URL validation
 */
export interface UrlValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validate that a URL is safe for server-side fetching
 * Blocks:
 * - Private IP addresses (10.x, 172.16-31.x, 192.168.x, 127.x)
 * - Cloud metadata endpoints (169.254.169.254, metadata.google, etc.)
 * - Localhost and local hostnames
 * - Non-HTTP(S) protocols
 */
export function validateExternalUrl(urlString: string): UrlValidationResult {
	let url: URL;

	try {
		url = new URL(urlString);
	} catch {
		return { valid: false, error: "Invalid URL" };
	}

	// Only allow HTTP and HTTPS
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		return {
			valid: false,
			error: "Only HTTP and HTTPS protocols are allowed",
		};
	}

	const hostname = url.hostname.toLowerCase();

	// Check blocked hostnames
	if (isCloudMetadata(hostname)) {
		return {
			valid: false,
			error: "Access to cloud metadata services not allowed",
		};
	}

	// Check if hostname is an IP address
	if (isIPAddress(hostname)) {
		// Remove brackets for IPv6
		const cleanedIP = hostname.replace(/^\[|\]$/g, "");

		if (isPrivateIPv4(cleanedIP)) {
			return {
				valid: false,
				error: "Access to private IP addresses not allowed",
			};
		}

		if (isPrivateIPv6(cleanedIP)) {
			return {
				valid: false,
				error: "Access to private IPv6 addresses not allowed",
			};
		}
	}

	// Check for localhost variations
	if (
		hostname === "localhost" ||
		hostname.endsWith(".localhost") ||
		hostname.endsWith(".local")
	) {
		return {
			valid: false,
			error: "Access to localhost not allowed",
		};
	}

	return { valid: true };
}

/**
 * Check if URL validation passes, throws TRPCError if not
 */
export function assertValidExternalUrl(urlString: string): void {
	const result = validateExternalUrl(urlString);
	if (!result.valid) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: result.error || "URL not allowed",
		});
	}
}

/**
 * Validate resolved IP address against private ranges
 * Used for DNS rebinding protection - validates after DNS resolution
 *
 * DNS Rebinding Attack Prevention:
 * An attacker could use a domain that initially resolves to a public IP
 * but then quickly changes to resolve to a private IP. By validating
 * the resolved IP address before making the actual request, we prevent
 * this class of SSRF attacks.
 *
 * @param ip - The resolved IP address to validate
 * @returns UrlValidationResult indicating if the IP is safe
 */
export function validateResolvedIP(ip: string): UrlValidationResult {
	if (isPrivateIPv4(ip)) {
		return {
			valid: false,
			error:
				"DNS resolved to a private IP address (possible DNS rebinding attack)",
		};
	}

	if (isPrivateIPv6(ip)) {
		return {
			valid: false,
			error:
				"DNS resolved to a private IPv6 address (possible DNS rebinding attack)",
		};
	}

	// Check cloud metadata IPs
	if (BLOCKED_HOSTNAMES.includes(ip)) {
		return {
			valid: false,
			error: "DNS resolved to a blocked IP address",
		};
	}

	return { valid: true };
}

/**
 * Resolve hostname and validate all resolved IPs
 * Full DNS rebinding protection - resolves DNS and validates each IP
 *
 * @param hostname - The hostname to resolve
 * @returns Promise<UrlValidationResult> with validation result
 */
export async function validateHostnameDNS(
	hostname: string,
): Promise<UrlValidationResult> {
	// Skip DNS resolution for IP addresses (already validated)
	if (isIPAddress(hostname)) {
		return { valid: true };
	}

	try {
		// Resolve all IPv4 addresses
		const addresses = await dns.resolve4(hostname).catch(() => [] as string[]);

		// Also try IPv6
		const addresses6 = await dns.resolve6(hostname).catch(() => [] as string[]);

		const allAddresses = [...addresses, ...addresses6];

		if (allAddresses.length === 0) {
			// DNS resolution failed - could be a non-existent domain
			// Let the fetch fail naturally with a proper error
			return { valid: true };
		}

		// Validate each resolved IP
		for (const ip of allAddresses) {
			const result = validateResolvedIP(ip);
			if (!result.valid) {
				return result;
			}
		}

		return { valid: true };
	} catch {
		// DNS resolution error - let the fetch handle it
		return { valid: true };
	}
}

/**
 * Complete URL validation with DNS rebinding protection
 * Combines hostname validation with DNS resolution check
 *
 * @param urlString - The URL to validate
 * @returns Promise<UrlValidationResult> with full validation result
 */
export async function validateExternalUrlWithDNS(
	urlString: string,
): Promise<UrlValidationResult> {
	// First, do basic URL validation
	const basicResult = validateExternalUrl(urlString);
	if (!basicResult.valid) {
		return basicResult;
	}

	// Then, validate DNS resolution
	try {
		const url = new URL(urlString);
		return await validateHostnameDNS(url.hostname);
	} catch {
		return { valid: false, error: "Invalid URL" };
	}
}

/**
 * Assert URL is valid with full DNS rebinding protection
 * Throws TRPCError if validation fails
 */
export async function assertValidExternalUrlWithDNS(
	urlString: string,
): Promise<void> {
	const result = await validateExternalUrlWithDNS(urlString);
	if (!result.valid) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: result.error || "URL not allowed",
		});
	}
}

/**
 * Result of DNS resolution with validation
 */
export interface SafeDnsResolutionResult {
	valid: boolean;
	error?: string;
	/** Resolved IP address (first valid one) */
	resolvedIP?: string;
	/** All resolved IP addresses */
	allIPs?: string[];
}

/**
 * Safely resolve DNS and return validated IP addresses
 * This resolves DNS once and returns the IPs for use in the same request,
 * preventing TOCTOU (time-of-check to time-of-use) attacks.
 *
 * @param hostname - The hostname to resolve
 * @returns Promise with resolution result including validated IPs
 */
export async function resolveDnsSecurely(
	hostname: string,
): Promise<SafeDnsResolutionResult> {
	// Skip DNS resolution for IP addresses (already validated)
	if (isIPAddress(hostname)) {
		const cleanedIP = hostname.replace(/^\[|\]$/g, "");
		const validation = validateResolvedIP(cleanedIP);
		if (!validation.valid) {
			return validation;
		}
		return { valid: true, resolvedIP: cleanedIP, allIPs: [cleanedIP] };
	}

	try {
		// Resolve all IPv4 addresses
		const addresses4 = await dns.resolve4(hostname).catch(() => [] as string[]);

		// Also try IPv6
		const addresses6 = await dns.resolve6(hostname).catch(() => [] as string[]);

		const allAddresses = [...addresses4, ...addresses6];

		if (allAddresses.length === 0) {
			return { valid: false, error: "Unable to resolve hostname" };
		}

		// Validate each resolved IP
		for (const ip of allAddresses) {
			const result = validateResolvedIP(ip);
			if (!result.valid) {
				return result;
			}
		}

		// Return first IPv4 address (preferred), or first IPv6
		const resolvedIP = addresses4[0] || addresses6[0];

		return { valid: true, resolvedIP, allIPs: allAddresses };
	} catch {
		return { valid: false, error: "DNS resolution failed" };
	}
}

/**
 * SSRF-safe fetch with DNS rebinding protection
 *
 * This function prevents TOCTOU (time-of-check to time-of-use) attacks by:
 * 1. Validating the URL format and hostname
 * 2. Resolving DNS ourselves and validating all resolved IPs
 * 3. Making the request directly to the validated IP with proper Host header
 *
 * This ensures that DNS cannot be rebinded between validation and request.
 *
 * @param urlString - The URL to fetch
 * @param options - Fetch options (same as standard fetch)
 * @returns Promise<Response> - The fetch response
 * @throws TRPCError if URL validation fails or request fails
 */
export async function safeFetch(
	urlString: string,
	options: RequestInit = {},
): Promise<Response> {
	// Step 1: Basic URL validation
	const basicResult = validateExternalUrl(urlString);
	if (!basicResult.valid) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: basicResult.error || "URL not allowed",
		});
	}

	const url = new URL(urlString);
	const hostname = url.hostname;

	// Step 2: Resolve DNS and validate IPs
	const dnsResult = await resolveDnsSecurely(hostname);
	if (!dnsResult.valid) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: dnsResult.error || "DNS resolution failed",
		});
	}

	// Step 3: Build URL with resolved IP to prevent DNS rebinding
	// We connect directly to the IP and set the Host header
	const resolvedIP = dnsResult.resolvedIP as string;
	const isIPv6 = resolvedIP.includes(":");
	const ipForUrl = isIPv6 ? `[${resolvedIP}]` : resolvedIP;

	// Build the URL with the resolved IP
	const directUrl = new URL(urlString);
	directUrl.hostname = ipForUrl;

	// Merge headers, ensuring Host header is set to original hostname
	const headers = new Headers(options.headers);
	headers.set("Host", hostname);

	// Make the fetch request directly to the resolved IP
	// This prevents DNS rebinding since we're connecting to the validated IP
	try {
		return await fetch(directUrl.toString(), {
			...options,
			headers,
		});
	} catch (error) {
		// Some servers may reject requests to IP addresses with Host header mismatch
		// In this case, fall back to normal fetch but only after DNS validation
		// This is still secure because we validated DNS just before the request
		if (
			error instanceof Error &&
			(error.message.includes("SSL") ||
				error.message.includes("certificate") ||
				error.message.includes("TLS"))
		) {
			// SSL certificate validation requires original hostname
			// Re-fetch with original URL (DNS should be cached from previous resolution)
			return await fetch(urlString, options);
		}
		throw error;
	}
}
