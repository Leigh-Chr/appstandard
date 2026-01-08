/**
 * Redis-based rate limiting middleware
 * Supports distributed rate limiting across multiple instances
 */

import type { Context } from "hono";
import Redis from "ioredis";
import { getLogContext, logger, logSecurityEvent } from "../lib/logger";
import { env as rateLimitEnv } from "./env";

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Initialize Redis client
 * Falls back to in-memory if Redis is not available
 */
function getRedisClient(): Redis | null {
	if (redisClient) {
		return redisClient;
	}

	const redisUrl = rateLimitEnv.REDIS_URL;
	if (!redisUrl) {
		return null;
	}

	try {
		redisClient = new Redis(redisUrl, {
			maxRetriesPerRequest: 3,
			retryStrategy: (times: number) => {
				const delay = Math.min(times * 50, 2000);
				return delay;
			},
			enableReadyCheck: true,
			lazyConnect: true,
		});

		redisClient.on("error", (err: Error) => {
			logger.error("[Redis] Connection error", err);
		});

		redisClient.on("connect", () => {
			logger.info("[Redis] Connected successfully");
		});

		return redisClient;
	} catch (error) {
		logger.error("[Redis] Failed to initialize", error);
		return null;
	}
}

// Fallback in-memory store (only used if Redis is unavailable)
type RateLimitStore = Map<string, { count: number; resetAt: number }>;
const fallbackStore: RateLimitStore = new Map();

// Cleanup old entries every 5 minutes (fallback only)
setInterval(
	() => {
		if (redisClient) return; // Only cleanup if using fallback

		const now = Date.now();
		for (const [key, value] of fallbackStore.entries()) {
			if (value.resetAt < now) {
				fallbackStore.delete(key);
			}
		}
	},
	5 * 60 * 1000,
);

/**
 * Get client IP from request
 * SECURITY: Takes the LAST IP from X-Forwarded-For to prevent IP spoofing.
 * In a properly configured proxy chain, the last IP is the one added by
 * the trusted reverse proxy closest to our server.
 *
 * Example: Client spoofs "1.1.1.1" → Real IP: 2.2.2.2
 * X-Forwarded-For: "1.1.1.1, 2.2.2.2" → We take 2.2.2.2
 */
function getClientIP(request: Request): string {
	// Try X-Forwarded-For first (standard header for proxies)
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		// Split and get the LAST IP (rightmost = closest to our server = most trusted)
		const ips = forwarded.split(",").map((ip) => ip.trim());
		const lastIP = ips[ips.length - 1];
		if (lastIP && isValidIP(lastIP)) {
			return lastIP;
		}
	}

	// Try X-Real-IP (nginx-style header, typically set by the last proxy)
	const realIP = request.headers.get("x-real-ip");
	if (realIP && isValidIP(realIP.trim())) {
		return realIP.trim();
	}

	// Fallback (won't work in all environments, but better than nothing)
	return "unknown";
}

/**
 * Basic IP validation to prevent header injection
 */
function isValidIP(ip: string): boolean {
	// IPv4 pattern
	const ipv4Pattern =
		/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	// IPv6 pattern (simplified, accepts common formats)
	const ipv6Pattern = /^[a-fA-F0-9:]+$/;

	return ipv4Pattern.test(ip) || (ipv6Pattern.test(ip) && ip.includes(":"));
}

/**
 * Check rate limit using Redis
 */
async function checkRateLimitRedis(
	key: string,
	maxRequests: number,
	windowMs: number,
	redisKeyPrefix: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
	const client = getRedisClient();
	if (!client) {
		throw new Error("Redis client not available");
	}

	const now = Date.now();
	const windowKey = `${redisKeyPrefix}:${key}`;

	try {
		// Use Redis INCR with expiration
		const count = await client.incr(windowKey);

		// Set expiration on first request
		if (count === 1) {
			await client.pexpire(windowKey, windowMs);
		}

		// Get TTL to calculate actual reset time
		const ttl = await client.pttl(windowKey);
		const actualResetAt = now + (ttl > 0 ? ttl : windowMs);

		if (count > maxRequests) {
			return {
				allowed: false,
				remaining: 0,
				resetAt: actualResetAt,
			};
		}

		return {
			allowed: true,
			remaining: Math.max(0, maxRequests - count),
			resetAt: actualResetAt,
		};
	} catch (error) {
		logger.error("[Redis] Rate limit check failed", error);
		// Fall through to fallback
		throw error;
	}
}

/**
 * Check rate limit using fallback in-memory store
 */
function checkRateLimitFallback(
	key: string,
	maxRequests: number,
	windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
	const now = Date.now();
	const record = fallbackStore.get(key);

	if (!record || record.resetAt < now) {
		// New window or expired, reset
		const resetAt = now + windowMs;
		fallbackStore.set(key, { count: 1, resetAt });
		return { allowed: true, remaining: maxRequests - 1, resetAt };
	}

	if (record.count >= maxRequests) {
		// Limit exceeded
		return {
			allowed: false,
			remaining: 0,
			resetAt: record.resetAt,
		};
	}

	// Increment count
	record.count++;
	return {
		allowed: true,
		remaining: maxRequests - record.count,
		resetAt: record.resetAt,
	};
}

/**
 * Check rate limit (Redis required in production, fallback in development)
 * SECURITY: In production, Redis is required for distributed rate limiting.
 * In-memory fallback is only allowed in development for convenience.
 */
async function checkRateLimit(
	key: string,
	maxRequests: number,
	windowMs: number,
	redisKeyPrefix: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
	const isProduction = process.env["NODE_ENV"] === "production";
	const client = getRedisClient();

	if (client) {
		try {
			// Ensure connection is ready
			if (client.status !== "ready") {
				await client.connect();
			}
			return await checkRateLimitRedis(
				key,
				maxRequests,
				windowMs,
				redisKeyPrefix,
			);
		} catch (error) {
			// SECURITY: In production, fail if Redis is unavailable
			// This prevents bypass by overwhelming the in-memory fallback
			if (isProduction) {
				logger.error("[Rate Limit] Redis unavailable in production", error);
				throw error;
			}
			// In development, allow fallback for convenience
			logger.warn("[Rate Limit] Redis unavailable, using fallback", error);
			return checkRateLimitFallback(key, maxRequests, windowMs);
		}
	}

	// SECURITY: In production, require Redis to be configured
	if (isProduction) {
		logger.error(
			"[Rate Limit] REDIS_URL not configured in production. Distributed rate limiting is required.",
		);
		throw new Error("REDIS_URL required in production for rate limiting");
	}

	// In development, allow in-memory fallback
	return checkRateLimitFallback(key, maxRequests, windowMs);
}

/**
 * Build rate limit error response
 */
function buildRateLimitErrorResponse(
	c: Context,
	result: { resetAt: number },
	maxRequests: number,
	keyPrefix: string,
	ip: string,
) {
	const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
	const correlationId = c.req.header("x-correlation-id");

	// Log security event with correlation ID
	logSecurityEvent("rate_limit_exceeded", {
		ip,
		path: c.req.path,
		...(correlationId ? { correlationId } : {}),
		reason: keyPrefix
			? `${keyPrefix} rate limit exceeded`
			: "General rate limit exceeded",
	});

	return c.json(
		{
			error: "Too Many Requests",
			message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
			retryAfter,
		},
		429,
		{
			"Retry-After": String(retryAfter),
			"X-RateLimit-Limit": String(maxRequests),
			"X-RateLimit-Remaining": "0",
			"X-RateLimit-Reset": String(result.resetAt),
		},
	);
}

/**
 * Handle rate limit errors
 */
function handleRateLimitError(c: Context, error: unknown): void {
	const correlationId = c.req.header("x-correlation-id");
	const context = correlationId ? getLogContext(correlationId) : undefined;
	logger.error("[Rate Limit] Error", error, context);
}

/**
 * Rate limit middleware for Hono
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param keyPrefix - Optional prefix for the rate limit key (to have separate limits)
 * @param redisKeyPrefix - Prefix for Redis keys (default: "ratelimit")
 */
export function rateLimit(
	maxRequests: number,
	windowMs = 60000,
	keyPrefix = "",
	redisKeyPrefix = "ratelimit",
) {
	return async (c: Context, next: () => Promise<void>) => {
		const ip = getClientIP(c.req.raw);

		// Skip rate limiting for unknown IPs (development)
		if (ip === "unknown") {
			return next();
		}

		const key = keyPrefix ? `${keyPrefix}:${ip}` : ip;

		try {
			const result = await checkRateLimit(
				key,
				maxRequests,
				windowMs,
				redisKeyPrefix,
			);

			if (!result.allowed) {
				return buildRateLimitErrorResponse(
					c,
					result,
					maxRequests,
					keyPrefix,
					ip,
				);
			}

			// Add rate limit headers
			c.header("X-RateLimit-Limit", String(maxRequests));
			c.header("X-RateLimit-Remaining", String(result.remaining));
			c.header("X-RateLimit-Reset", String(result.resetAt));

			return next();
		} catch (error) {
			// SECURITY: Fail-closed - block request if rate limiting fails
			// This prevents attackers from bypassing rate limits by causing errors
			handleRateLimitError(c, error);

			logSecurityEvent("rate_limit_error_blocked", {
				ip,
				path: c.req.path,
				reason: "Rate limiting service unavailable - request blocked",
			});

			return c.json(
				{
					error: "Service Unavailable",
					message:
						"Rate limiting service temporarily unavailable. Please try again later.",
				},
				503,
				{
					"Retry-After": "60",
				},
			);
		}
	};
}

/**
 * Strict rate limit for authentication endpoints
 * 10 attempts per minute (to prevent brute force attacks)
 */
export function authRateLimit(redisKeyPrefix = "ratelimit") {
	return rateLimit(10, 60000, "auth", redisKeyPrefix);
}

/**
 * Very strict rate limit for signup
 * 5 signups per minute per IP (to prevent abuse)
 */
export function signupRateLimit(redisKeyPrefix = "ratelimit") {
	return rateLimit(5, 60000, "signup", redisKeyPrefix);
}

/**
 * Rate limit for email verification resend
 * 1 request every 30 seconds per IP
 * This prevents spam while allowing reasonable retry attempts
 * Note: This is a sliding window, so users can send 1 email every 30 seconds
 */
export function emailVerificationResendRateLimit(redisKeyPrefix = "ratelimit") {
	// 1 request per 30 seconds (30000ms)
	return rateLimit(1, 30000, "email-verification-resend", redisKeyPrefix);
}

/**
 * Rate limit for account deletion
 * 1 request per hour (very strict - irreversible action)
 */
export function deleteAccountRateLimit(redisKeyPrefix = "ratelimit") {
	// 1 request per hour (3600000ms)
	return rateLimit(1, 3600000, "delete-account", redisKeyPrefix);
}

/**
 * Rate limit for data export (RGPD)
 * 5 requests per day per user
 */
export function exportDataRateLimit(redisKeyPrefix = "ratelimit") {
	// 5 requests per day (86400000ms = 24 hours)
	return rateLimit(5, 86400000, "export-data", redisKeyPrefix);
}

/**
 * Rate limit for password reset request
 * 3 requests per hour per IP (prevents account enumeration and abuse)
 * This endpoint sends emails, so we need to be strict to prevent spam
 */
export function passwordResetRequestRateLimit(redisKeyPrefix = "ratelimit") {
	// 3 requests per hour (3600000ms)
	return rateLimit(3, 3600000, "password-reset-request", redisKeyPrefix);
}

/**
 * Rate limit for password change
 * 10 requests per hour (security-sensitive operation)
 */
export function changePasswordRateLimit(redisKeyPrefix = "ratelimit") {
	// 10 requests per hour (3600000ms)
	return rateLimit(10, 3600000, "change-password", redisKeyPrefix);
}

/**
 * Rate limit for profile update
 * 20 requests per hour (less critical, but still should be limited)
 */
export function updateProfileRateLimit(redisKeyPrefix = "ratelimit") {
	// 20 requests per hour (3600000ms)
	return rateLimit(20, 3600000, "update-profile", redisKeyPrefix);
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
	if (redisClient) {
		await redisClient.quit();
		redisClient = null;
	}
}
