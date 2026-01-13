# Rate Limiting Documentation

AppStandard implements Redis-backed distributed rate limiting to protect against abuse and ensure fair usage.

## Overview

- **Backend**: Redis (required in production)
- **Fallback**: In-memory store (development only)
- **Algorithm**: Fixed window counter with automatic expiration
- **Headers**: Standard `X-RateLimit-*` headers on all responses

## Rate Limit Headers

All responses include rate limit information:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in the window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds to wait (only on 429 responses) |

## Endpoint Limits

### Authentication Endpoints

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/auth/*` (general) | 10 requests | 1 minute | Prevent brute force |
| `/api/auth/sign-up` | 5 requests | 1 minute | Prevent account creation abuse |
| `/api/auth/forgot-password` | 3 requests | 1 hour | Prevent email spam |
| `/api/auth/change-password` | 10 requests | 1 hour | Security-sensitive operation |
| `/api/auth/email-verification/resend` | 1 request | 30 seconds | Prevent email spam |
| `/api/auth/delete-account` | 1 request | 1 hour | Irreversible action protection |

### Profile Endpoints

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `user.updateProfile` | 20 requests | 1 hour | General abuse prevention |
| `user.exportData` (GDPR) | 5 requests | 24 hours | Resource-intensive operation |

### API Endpoints (tRPC)

| Category | Default Limit | Window |
|----------|---------------|--------|
| Read operations | 100 requests | 1 minute |
| Write operations | 60 requests | 1 minute |
| Bulk operations | 20 requests | 1 minute |
| Import from URL | 10 requests | 1 minute |

## Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| `429 Too Many Requests` | Rate limit exceeded | Wait for `Retry-After` seconds |
| `503 Service Unavailable` | Rate limiting service down | Retry after 60 seconds |

## Example 429 Response

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

## Security Features

### Fail-Closed in Production

In production, if Redis is unavailable, requests are **blocked** (503 response) rather than allowed through. This prevents attackers from bypassing rate limits by overwhelming the system.

### IP Detection

The middleware uses a secure IP detection strategy:
1. Takes the **last** IP from `X-Forwarded-For` (most trusted in proxy chain)
2. Falls back to `X-Real-IP` header
3. Validates IP format to prevent header injection

### Logging

All rate limit violations are logged as security events with:
- Client IP address
- Request path
- Correlation ID (if present)
- Timestamp

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REDIS_URL` | Redis connection string | Yes (production) |

### Redis Key Format

Rate limit keys follow this pattern:
```
{prefix}:{endpoint}:{ip}
```

Example: `ratelimit:auth:192.168.1.1`

## Client Best Practices

1. **Respect `Retry-After`**: Don't retry until the header indicates
2. **Implement exponential backoff**: For 503 errors
3. **Monitor remaining requests**: Use `X-RateLimit-Remaining`
4. **Cache responses**: Reduce unnecessary requests

### JavaScript Example

```javascript
async function fetchWithRateLimit(url, options = {}) {
  const response = await fetch(url, options);

  // Check if rate limited
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    console.log(`Rate limited. Waiting ${retryAfter}s...`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return fetchWithRateLimit(url, options); // Retry
  }

  // Log remaining quota
  const remaining = response.headers.get('X-RateLimit-Remaining');
  if (remaining && parseInt(remaining) < 10) {
    console.warn(`Low rate limit quota: ${remaining} remaining`);
  }

  return response;
}
```

## Monitoring

Rate limit events can be monitored via:
- Application logs (security events)
- Redis key inspection
- Custom metrics endpoint (if configured)

## Increasing Limits

If you need higher rate limits for legitimate use cases:
1. Contact support with your use case
2. Consider using authenticated requests (higher limits)
3. Implement client-side caching to reduce requests
