# AppStandard

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.3-black?logo=bun&logoColor=white)](https://bun.sh/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A modern productivity suite built with open standards** - Calendar, Tasks, and Contacts management with ICS/vCard interoperability.

## Project Overview

| Metric | Count |
|--------|-------|
| Applications | 7 (3 frontends, 3 backends, 1 landing) |
| Shared Packages | 13+ |
| Lines of TypeScript | 50,000+ |
| Test Files | 47 |

### Products

| Product | Description | Standard |
|---------|-------------|----------|
| **Calendar** | Event management with recurring events, alarms, and attendees | ICS (RFC 5545) |
| **Tasks** | Todo lists with priorities, due dates, and completion tracking | iCalendar VTODO |
| **Contacts** | Address books with full vCard support | vCard (RFC 6350) |

### Published NPM Packages

Standalone utilities extracted from this project, available on NPM:

| Package | Description | Install |
|---------|-------------|---------|
| [@leigh-chr/ics-utils](https://www.npmjs.com/package/@leigh-chr/ics-utils) | ICS/iCalendar parser & generator | `npm i @leigh-chr/ics-utils` |
| [@leigh-chr/vcard-utils](https://www.npmjs.com/package/@leigh-chr/vcard-utils) | vCard parser & generator | `npm i @leigh-chr/vcard-utils` |
| [@leigh-chr/vtodo-utils](https://www.npmjs.com/package/@leigh-chr/vtodo-utils) | VTODO task parser & generator | `npm i @leigh-chr/vtodo-utils` |

## Architecture

```
appstandard/
├── apps/
│   ├── calendar-web/        # React 19 + TanStack Router
│   ├── calendar-server/     # Hono + tRPC
│   ├── tasks-web/
│   ├── tasks-server/
│   ├── contacts-web/
│   ├── contacts-server/
│   └── landing/             # Marketing site
│
└── packages/
    ├── Core Infrastructure
    │   ├── db/              # Prisma + PostgreSQL
    │   ├── auth/            # Better-Auth (unified)
    │   ├── api-core/        # Shared tRPC procedures
    │   └── server-core/     # Hono middleware, rate limiting
    │
    ├── Shared UI
    │   ├── ui/              # 90+ Radix UI components
    │   └── react-utils/     # Hooks, utilities
    │
    ├── Calendar
    │   ├── api/             # tRPC routers
    │   ├── core/            # Business logic
    │   ├── schemas/         # Zod validation
    │   └── ics-utils/       # ICS parser/generator
    │
    ├── Tasks (@appstandard-tasks/)
    │   ├── api/, core/, schemas/
    │   └── todo-utils/      # VTODO parser/generator
    │
    └── Contacts (@appstandard-contacts/)
        ├── api/, core/, schemas/
        └── vcard-utils/     # vCard parser/generator
```

### Dependency Graph

```
                    ┌─────────────┐
                    │   Frontend  │
                    │  (React 19) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌─────────┐  ┌─────────┐
         │ ui     │  │ react-  │  │ product │
         │        │  │ utils   │  │ api     │
         └────────┘  └─────────┘  └────┬────┘
                                       │
                           ┌───────────┼───────────┐
                           ▼           ▼           ▼
                      ┌────────┐  ┌────────┐  ┌────────┐
                      │api-core│  │  auth  │  │schemas │
                      └───┬────┘  └───┬────┘  └────────┘
                          │           │
                          └─────┬─────┘
                                ▼
                           ┌────────┐
                           │   db   │
                           │(Prisma)│
                           └────────┘
```

## Tech Stack

### Frontend
- **React 19** with React Compiler for automatic memoization
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Vite 7** - Build tooling with HMR

### Backend
- **Bun** - Fast JavaScript runtime
- **Hono** - Lightweight web framework
- **tRPC** - End-to-end type-safe APIs
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Relational database
- **Better-Auth** - Authentication with OAuth support

### Infrastructure
- **Turborepo** - Monorepo build orchestration with remote caching
- **Biome** - Fast linting and formatting
- **Docker** - Containerized deployment
- **Sentry** - Error and performance monitoring

## Features

### All Products
- **Anonymous mode** - Full functionality without account creation
- **Authentication** - OAuth (GitHub, Google) and email/password
- **Multi-device sync** - Real-time data synchronization
- **Collaboration** - Shared groups with role-based permissions
- **PWA support** - Installable Progressive Web Apps
- **Import/Export** - Standard format compatibility (ICS, vCard)

### Calendar-Specific
- Recurring events with RRULE support
- Multiple alarms per event
- Attendee management
- Calendar merging with duplicate detection
- URL import (Google Calendar, iCloud, Outlook)

### Security
- Rate limiting (100 req/min general, 10 req/min auth)
- SSRF protection for URL imports
- Input validation with Zod schemas
- HTTP security headers

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Docker](https://www.docker.com/) (for PostgreSQL)

### Setup

```bash
# Clone and install
git clone https://github.com/Leigh-Chr/appstandard.git
cd appstandard
bun install

# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Initialize database
bun run db:push
bun run db:seed  # Optional: seed test data

# Start development servers
bun run dev
```

### Development Ports

| Application | Frontend | Backend |
|-------------|----------|---------|
| Calendar | 3001 | 3000 |
| Tasks | 3004 | 3002 |
| Contacts | 3005 | 3003 |
| Landing | 3010 | - |

## Scripts

```bash
# Development
bun run dev                # All applications
bun run dev:calendar       # Calendar only
bun run dev:tasks          # Tasks only
bun run dev:contacts       # Contacts only

# Quality
bun run check              # Lint + format (auto-fix)
bun run check-types        # TypeScript validation
bun run test               # Run all tests

# Database
bun run db:push            # Push schema changes
bun run db:studio          # Open Prisma Studio
bun run db:migrate         # Create migration

# Production
bun run build              # Build all packages
```

## User Limits

| Feature | Anonymous | Authenticated |
|---------|-----------|---------------|
| Collections | 5 | 150 |
| Items per collection | 250 | 3,000 |
| Groups | 3 | 100 |
| Collections per group | 10 | 30 |

Anonymous data is auto-deleted after 60 days of inactivity.

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Package structure and dependencies |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Docker and manual deployment |
| [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) | VPS setup guide |
| [AUTHENTICATION.md](AUTHENTICATION.md) | Auth flow and configuration |
| [SECURITY.md](SECURITY.md) | Security policy |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |

## License

**AGPL v3** - See [LICENSE](LICENSE) for details.

This license ensures:
- Code is freely viewable and modifiable
- Private instances are allowed
- Modified public deployments must share source code
- Contributions are welcome via Pull Requests
