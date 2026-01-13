# API Changelog

All notable changes to the AppStandard API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `/api/docs` - Lightweight JSON API documentation endpoint
- `/api/openapi.json` - OpenAPI 3.0 specification endpoint

## [1.0.0] - 2026-01-13

### Added

#### Calendar API
- `calendar.create` - Create a new calendar (supports anonymous mode)
- `calendar.list` - List all calendars for the current user
- `calendar.getById` - Get calendar by ID with event counts
- `calendar.update` - Update calendar properties
- `calendar.delete` - Delete a calendar and all its events
- `calendar.importFromUrl` - Import calendar from ICS URL
- `calendar.importFromFile` - Import calendar from uploaded ICS file
- `calendar.exportIcs` - Export calendar as ICS file

#### Event API
- `event.list` - List events for a calendar (supports pagination and date filtering)
- `event.getById` - Get event by ID with attendees and alarms
- `event.create` - Create a new event
- `event.update` - Update event properties
- `event.delete` - Delete an event
- `event.bulkCreate` - Create multiple events at once
- `event.bulkDelete` - Delete multiple events at once

#### Dashboard API
- `dashboard.getStats` - Get comprehensive dashboard statistics
  - Hero metrics (events today, hours occupied, avg duration)
  - Distribution breakdown (day of week, time of day, duration)
  - Upcoming events list
  - Heatmap data for visualization

#### Calendar Groups
- `calendar.group.create` - Create a calendar group
- `calendar.group.list` - List all groups for the current user
- `calendar.group.getById` - Get group details with calendars
- `calendar.group.update` - Update group properties
- `calendar.group.delete` - Delete a group
- `calendar.group.addCalendar` - Add calendar to group
- `calendar.group.removeCalendar` - Remove calendar from group
- `calendar.group.getByCalendarId` - Get groups containing a calendar

#### Share Links
- `share.link.create` - Create a shareable link for a calendar
- `share.link.list` - List share links for a calendar
- `share.link.delete` - Delete a share link
- `share.link.access` - Access shared content via link

#### Share Bundles
- `share.bundle.create` - Create a bundle of multiple calendars
- `share.bundle.list` - List bundles for the current user
- `share.bundle.getById` - Get bundle details
- `share.bundle.update` - Update bundle properties
- `share.bundle.delete` - Delete a bundle
- `share.bundle.access` - Access shared bundle

#### Authentication
- Uses Better-Auth for session management
- Supports anonymous mode with cookie-based identification
- Session cookies with SameSite=lax for CSRF protection

### Security
- Rate limiting on all endpoints (Redis-backed with memory fallback)
- CORS protection (origin validation required in production)
- Content-Length limits on file uploads
- DNS rebinding protection on URL imports
- Timing-safe comparisons for token validation

### Technical Details
- Built with tRPC v11 for type-safe RPC
- PostgreSQL database with Prisma ORM
- Circuit breaker pattern for external requests
- Structured logging with request correlation

---

## Migration Guide

### From Anonymous to Authenticated

When transitioning from anonymous to authenticated usage:

1. Create an account via `/api/auth/sign-up`
2. Your anonymous calendars will be automatically linked to your account
3. Anonymous data limits (5 calendars, 250 events each) are lifted
4. Authenticated limits: 150 calendars, 3,000 events each

### Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Read operations | 60 requests/minute |
| Write operations | 30 requests/minute |
| File imports | 10 requests/minute |
| Authentication | 5 requests/minute |

Note: Rate limit headers are included in responses (`X-RateLimit-*`).

---

## Breaking Changes Policy

We follow semantic versioning for API changes:

- **Major version** (X.0.0): Breaking changes, removed endpoints, changed response schemas
- **Minor version** (0.X.0): New endpoints, new optional fields, deprecations
- **Patch version** (0.0.X): Bug fixes, performance improvements

Deprecated endpoints will be marked in the OpenAPI spec and removed after 6 months.
