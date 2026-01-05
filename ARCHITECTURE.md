# AppStandard Architecture

This document describes the technical architecture of the project and the relationships between packages.

## Overview

AppStandard is a **monorepo** managed with Turborepo, containing multiple productivity applications:

### Applications
| App | Frontend | Backend | Description |
|-----|----------|---------|-------------|
| Landing | `apps/landing` | - | Landing page presenting all products |
| Calendar | `apps/calendar-web` | `apps/calendar-server` | ICS calendar management |
| Tasks | `apps/tasks-web` | `apps/tasks-server` | Todo/task management |
| Contacts | `apps/contacts-web` | `apps/contacts-server` | vCard contact management |

### Shared Packages
- **13 packages** in `packages/` providing shared infrastructure and domain logic

## Package Structure

```
packages/
├── config/              # Shared TypeScript configuration
├── ics-utils/           # ICS parsing/generation (0 internal deps)
├── core/                # Calendar business logic
├── schemas/             # Calendar Zod validation schemas
├── react-utils/         # React hooks and utilities
├── ui/                  # Shared UI components (shadcn/ui)
├── db/                  # Prisma client and database schemas
├── auth/                # Better-Auth configuration
├── api-core/            # Shared tRPC infrastructure
├── server-core/         # Shared server middleware
├── api/                 # Calendar tRPC routers
├── appstandard-contacts/  # Contacts domain packages
│   ├── api/             # Contacts tRPC routers
│   ├── core/            # Contacts business logic
│   ├── schemas/         # Contacts Zod schemas
│   └── vcard-utils/     # vCard parsing/generation
└── appstandard-tasks/     # Tasks domain packages
    ├── api/             # Tasks tRPC routers
    ├── core/            # Tasks business logic
    ├── schemas/         # Tasks Zod schemas
    └── todo-utils/      # iCalendar VTODO parsing/generation
```

## Dependency Diagram

```
                           ┌──────────────────┐
                           │   Frontend Apps   │
                           │  (calendar-web,   │
                           │   tasks-web,      │
                           │   contacts-web)   │
                           └────────┬─────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
     ┌───────────┐           ┌──────────┐            ┌──────────┐
     │react-utils│           │    ui    │            │ Product  │
     └─────┬─────┘           └──────────┘            │   APIs   │
           │                                          └────┬─────┘
           │                                               │
           │         ┌─────────────────────────────────────┤
           │         │                                     │
           │         ▼                                     ▼
           │   ┌──────────┐                         ┌──────────┐
           │   │ api-core │                         │ schemas  │
           │   └────┬─────┘                         │(product) │
           │        │                               └──────────┘
           │        │
           │   ┌────┴────┬──────────┬──────────┐
           │   │         │          │          │
           │   ▼         ▼          ▼          ▼
           │ ┌────┐  ┌──────┐  ┌──────┐  ┌───────────┐
           │ │auth│  │  db  │  │ core │  │server-core│
           │ └──┬─┘  └───┬──┘  │(prod)│  └───────────┘
           │    │        │     └───┬──┘
           │    │        │         │
           └────┴────────┴─────────┘
                         │
                         ▼
                 ┌─────────────┐
                 │  *-utils    │
                 │ (ics-utils, │
                 │ vcard-utils,│
                 │ todo-utils) │
                 └─────────────┘
```

### Backend Apps Dependencies
```
apps/calendar-server → @appstandard/api, server-core, auth, db
apps/tasks-server    → @appstandard-tasks/api, server-core, auth, db
apps/contacts-server → @appstandard-contacts/api, server-core, auth, db
```

## Publishable Packages

| Package | Publishable to npm | Dependencies |
|---------|-------------------|--------------|
| `@appstandard/ics-utils` | Yes | `ical.js` only |
| `@appstandard/core` | Yes | `date-fns` only |
| `@appstandard/react-utils` | Yes | Peer: `react`, `@tanstack/react-query` |
| `@appstandard-contacts/vcard-utils` | Yes | Minimal deps |
| `@appstandard-tasks/todo-utils` | Yes | Minimal deps |

## Package Contents

### Infrastructure Packages

#### `@appstandard/config`
- `tsconfig.base.json` - Shared TypeScript configuration

#### `@appstandard/db`
- Prisma client configured with PostgreSQL adapter
- Models: `Calendar`, `Event`, `Attendee`, `Alarm`, `User`, `Session`, `Contact`, `AddressBook`, `Task`, `TaskList`, `Group`, `Share`

#### `@appstandard/auth`
- Better-Auth configuration with Prisma adapter
- Email verification, password reset
- Secure cookie management

#### `@appstandard/api-core`
- `publicProcedure` - Truly public endpoints (health check, public shares)
- `authOrAnonProcedure` - Requires session OR anonymous ID
- `protectedProcedure` - Requires authenticated session only
- Shared context creation

#### `@appstandard/server-core`
- Rate limiting middleware (Redis or in-memory)
- Logging utilities
- Environment middleware

#### `@appstandard/ui`
- Shared UI components based on shadcn/ui
- Tailwind CSS integration

#### `@appstandard/react-utils`
- **Hooks**: `useDebounce`, `useLocalStorage`, `useIsMobile`, `usePrevious`, `useMounted`
- **Query**: `createQueryKeys()` - Generic factory for query keys
- **Error**: `getErrorMessage()`, `isNetworkError()`, `logErrorInDev()`
- **Style**: `cn()` (Tailwind class merge)

### Calendar Domain

#### `@appstandard/ics-utils`
- `parseIcsFile()` - Parse ICS files
- `generateIcsFile()` - Generate ICS files
- `formatDateToICS()` / `parseDateFromICS()` - Date conversion
- `formatDuration()` / `parseDuration()` - ISO 8601 durations
- `formatAlarmTrigger()` / `parseAlarmTrigger()` - Alarm triggers

#### `@appstandard/core`
- **Types**: `EventFormData`, `EventEntity`, `CalendarEntity`, `AttendeeData`, `AlarmData`
- **Validation**: `validateEventForm()`, `isValidEmail()`, `isValidUrl()`
- **Utils**: `deepEqual()`, `parseTags()`, `normalizeDate()`, `formatEventDuration()`
- **Form**: `initializeFormData()`, `transformEventFormData()`
- **Constants**: `FIELD_LIMITS`, `EVENT_PRESETS`, `EVENT_STATUS_VALUES`
- **Recurrence**: `parseRRule()`, `buildRRule()`

#### `@appstandard/schemas`
- **Events**: `eventCreateSchema`, `eventUpdateSchema`, `eventFormDataSchema`
- **Entities**: `attendeeSchema`, `alarmSchema`
- **RFC 5545**: `rruleSchema`, `geoCoordinatesSchema`, `recurrenceIdSchema`
- **Constants**: `FIELD_LIMITS`

#### `@appstandard/api`
- `calendarRouter`: Calendar CRUD, ICS import/export, merge, groups
- `eventRouter`: Event CRUD
- `shareRouter`: Share links and bundles
- `userRouter`: User profile and usage
- `dashboardRouter`: Calendar analytics

### Contacts Domain

#### `@appstandard-contacts/vcard-utils`
- vCard 3.0/4.0 parsing and generation
- Contact data normalization

#### `@appstandard-contacts/core`
- **Types**: `ContactFormData`, `AddressBookEntity`
- **Constants**: `VCARD_ENUMS`, `FIELD_LIMITS`

#### `@appstandard-contacts/schemas`
- `contactCreateSchema`, `contactUpdateSchema`
- `addressBookSchema`

#### `@appstandard-contacts/api`
- `addressBookRouter`: Address book CRUD
- `contactRouter`: Contact CRUD
- `shareRouter`, `userRouter`, `dashboardRouter`

### Tasks Domain

#### `@appstandard-tasks/todo-utils`
- iCalendar VTODO parsing and generation
- Task data normalization

#### `@appstandard-tasks/core`
- **Types**: `TaskFormData`, `TaskListEntity`
- **Constants**: `TODO_ENUMS`, `FIELD_LIMITS`

#### `@appstandard-tasks/schemas`
- `taskCreateSchema`, `taskUpdateSchema`
- `taskListSchema`

#### `@appstandard-tasks/api`
- `taskListRouter`: Task list CRUD
- `taskRouter`: Task CRUD
- `shareRouter`, `userRouter`, `dashboardRouter`

## Principles

1. **Single source of truth** - Domain types in `*/core/constants/*-enums.ts`
2. **Pure functions** - No side effects in `core` and `*-utils` packages
3. **No over-engineering** - One function per need, no unnecessary converters
4. **Tree-shakeable** - Granular imports possible
5. **Shared infrastructure** - Common patterns extracted to `api-core` and `server-core`

## Authentication

The applications support two user modes:
- **Authenticated**: User with account (Better-Auth session)
- **Anonymous**: Unique ID stored client-side (`anon-xxx`)

tRPC procedures use the following pattern:
```typescript
// Public endpoints (health check, etc.)
publicProcedure.query(...)

// Endpoints requiring identification (session OR anonymous)
authOrAnonProcedure.query(...)  // ctx.userId guaranteed

// Endpoints requiring an account (session only)
protectedProcedure.query(...)   // ctx.session guaranteed
```

## See Also

- [README.md](README.md) - Project overview
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- Package documentation in `packages/*/README.md`
