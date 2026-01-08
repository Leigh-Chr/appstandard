# AppStandard

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3-black?logo=bun&logoColor=white)](https://bun.sh/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**AppStandard** is a suite of web applications for personal productivity, built with modern technologies and a focus on open standards.

## Products

| Product | Description | Format |
|---------|-------------|--------|
| **AppStandard Calendar** | Calendar management and event organization | ICS (RFC 5545) |
| **AppStandard Tasks** | Todo lists and task management | iCalendar VTODO |
| **AppStandard Contacts** | Address book and contact management | vCard (RFC 6350) |

Each product is designed to work with standard file formats, ensuring data portability and interoperability with other applications.

## Features

### AppStandard Calendar

- **Import .ics files** - Import calendars from any source
- **Import from URL** - Sync with Google Calendar, iCloud, Outlook, etc.
- **Manual refresh** - Refresh imported calendars on demand
- **Create calendars** - Create new calendars to organize events
- **Merge calendars** - Combine multiple calendars with duplicate detection
- **Export .ics** - Export in standard format compatible with all calendar apps
- **Clean duplicates** - Automatically remove duplicate events
- **List & calendar views** - Display events in list or monthly calendar view
- **Date filters** - Filter by Today, This week, This month, or All
- **Search & sort** - Search by keyword, sort by date, name, or duration
- **Event management** - Create, edit, and delete events

### AppStandard Tasks

- **Import todo files** - Import tasks from iCalendar VTODO format
- **Create task lists** - Organize tasks into lists
- **Task management** - Create, edit, complete, and delete tasks
- **Export** - Export in standard VTODO format

### AppStandard Contacts

- **Import vCard files** - Import contacts from any source
- **Create address books** - Organize contacts into address books
- **Contact management** - Create, edit, and delete contacts
- **Export vCard** - Export in standard vCard format

### Common Features (All Products)

- **Anonymous mode** - Use without creating an account
- **Authentication** - Optional account for cloud synchronization
- **Multi-device sync** - Access data from any device (authenticated users)
- **Collaboration** - Shared groups with invitations and member management
- **PWA support** - Install as a Progressive Web App

## Tech Stack

- **TypeScript** - Type safety end-to-end
- **TanStack Router** - Type-safe routing
- **TailwindCSS** - Modern and responsive UI
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight and performant server framework
- **tRPC** - Type-safe APIs end-to-end
- **Bun** - Runtime and package manager
- **Prisma** - TypeScript-first ORM
- **PostgreSQL** - Database
- **Better-Auth** - Authentication
- **Biome** - Linting and formatting
- **PWA** - Progressive Web App support
- **Turborepo** - Optimized monorepo
- **Sentry** - Error and performance monitoring

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (version 1.3.1 or higher)
- [Docker](https://www.docker.com/) (optional, for local PostgreSQL)

### Installation

1. Clone the repository and install dependencies:

```bash
bun install
```

### Database Configuration

This project uses PostgreSQL with Prisma.

#### Option 1: PostgreSQL with Docker (recommended)

```bash
# Start PostgreSQL locally
docker compose -f docker-compose.dev.yml up -d

# Configure the environment variable
DATABASE_URL="postgresql://appstandard:appstandard_dev@localhost:5432/appstandard_dev"
```

#### Option 2: Existing PostgreSQL

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

#### Initialize the database

```bash
bun run db:push      # Generate Prisma client and push schema
bun run db:seed      # (Optional) Seed with test data
bun run db:studio    # (Optional) Open Prisma Studio
```

### Environment Configuration

Each server application requires its own `.env` file. Example for Calendar:

**Backend** (`apps/calendar-server/.env`):
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=3000
CORS_ORIGIN=http://localhost:3001
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379  # Optional

# Email (for verification)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@appstandard.io
```

**Frontend** (`apps/calendar-web/.env`):
```env
VITE_SERVER_URL=http://localhost:3000
```

Repeat for Tasks and Contacts with their respective ports:

| Application | Frontend | Backend |
|-------------|----------|---------|
| Calendar | 3001 | 3000 |
| Tasks | 3004 | 3002 |
| Contacts | 3005 | 3003 |
| Landing | 3010 | - |

### Starting

```bash
# All apps
bun run dev

# Specific products
bun run dev:calendar    # Calendar web + server (3001, 3000)
bun run dev:tasks       # Tasks web + server (3004, 3002)
bun run dev:contacts    # Contacts web + server (3005, 3003)
bun run dev:landing     # Landing page only (3010)
```

## Docker

The project is fully dockerized to facilitate deployment.

**Quick start:**
```bash
# Development (PostgreSQL Docker + Local Apps)
docker compose -f docker-compose.dev.yml up -d  # Start PostgreSQL and Redis
bun install && bun run db:push                  # Install deps and init DB
bun run dev                                     # Start all apps

# Production (Everything in Docker)
cp docker.env.example .env
# Edit .env with your values
docker compose up -d --build
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Docker deployment guide.

## User Guide

### Anonymous Mode (without account)

1. Open the application in your browser
2. An anonymous ID is automatically generated and stored in localStorage
3. Your data is saved on the server but linked to your anonymous ID
4. You can use all features without creating an account

**Important - Anonymous Mode Limitations:**
- Your data is linked to your browser via an anonymous ID stored in localStorage
- If you clear browser data or use private browsing, you will lose access to your data
- Anonymous data not accessed for 60 days is automatically deleted
- For permanent backup and multi-device access, create an account

### Authenticated Mode (with account)

1. Create an account via the login page
2. Your data is saved on the server
3. You can access your data from any device

### User Limits

| Feature | Anonymous | Authenticated |
|---------|-----------|---------------|
| Collections | 5 | 150 |
| Items per collection | 250 | 3,000 |
| Groups | 3 | 100 |
| Collections per group | 10 | 30 |

## Security

- **Rate limiting**: 100 requests/minute (general), 10 requests/minute (auth)
- **HTTP security headers** configured automatically
- **Input validation** (max file size: 5MB)
- **SSRF protection** for external URL imports

See [SECURITY.md](./SECURITY.md) for full security documentation.

## Production

To deploy in production, consult the complete guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Production Checklist

- [ ] Environment variables configured
- [ ] `CORS_ORIGIN` defined (required, do not use `*`)
- [ ] `BETTER_AUTH_SECRET` generated (min 32 characters)
- [ ] Database initialized
- [ ] Build completed (`bun run build`)
- [ ] SSL/TLS certificate configured
- [ ] Health check accessible (`/health`)

## Troubleshooting

### Backend server won't start

- Check that the port is not already in use
- Make sure the database is properly configured: `bun run db:push`
- Check the terminal logs for errors

### Frontend cannot connect to backend

- Check that `VITE_SERVER_URL` points to the correct backend URL
- Make sure the backend server is started
- Check the browser console for CORS errors

### Data doesn't persist (anonymous mode)

- Check that localStorage is enabled in your browser
- Data is stored locally, it will not be available on another browser or device
- For multi-device persistence, create an account

## Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | This file - Overview and quick start |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Package architecture and dependency diagram |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Complete production deployment guide (Docker, manual, monitoring) |
| [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) | VPS initial setup and deployment guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Project contribution guide |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community code of conduct |
| [SECURITY.md](SECURITY.md) | Security policy and vulnerability reporting |
| [AUTHENTICATION.md](AUTHENTICATION.md) | Authentication flow and configuration |

### Package Documentation

| Package | Description |
|---------|-------------|
| [@appstandard/core](packages/core/README.md) | Calendar business logic and shared types |
| [@appstandard/ics-utils](packages/ics-utils/README.md) | ICS file parsing and generation |
| [@appstandard/react-utils](packages/react-utils/README.md) | React hooks and utilities |
| [@appstandard/api](packages/api/README.md) | Calendar tRPC API and routers |
| [@appstandard/auth](packages/auth/README.md) | Better-Auth configuration |
| [@appstandard/db](packages/db/README.md) | Prisma client and DB schemas |
| [@appstandard/schemas](packages/schemas/README.md) | Calendar Zod validation schemas |

## Contributing

Contributions are welcome! See the [contribution guide](CONTRIBUTING.md) to get started.

## License

This project is licensed under **AGPL v3** (GNU Affero General Public License v3) - see the [LICENSE](LICENSE) file for details.

### What AGPL v3 Means

AGPL v3 is a copyleft license that ensures cooperation with the community. Key points:

- **Code is freely viewable and modifiable** - You can study, modify, and use the code
- **Private instances are allowed** - You can run AppStandard locally or in a private environment
- **Contributions are welcome** - Pull Requests are encouraged
- **Modified versions must share their source code** - If you modify and deploy AppStandard publicly, you must share your modifications
- **Commercial use requires source code sharing** - Commercial use is allowed, but modifications must be shared

### Usage Policy

While AppStandard is licensed under AGPL v3, the maintainer requests that:

- **Public Instances**: Only the official instance operated by the maintainer should be publicly accessible. If you wish to operate a public instance, please contact the maintainer first to discuss.

- **Commercial Use**: Commercial use of this software is discouraged without prior authorization. If you wish to use this software commercially, please contact the maintainer to discuss licensing options.

- **Contributions**: All contributions are welcome via Pull Requests. The maintainer reserves the right to accept or reject any contribution to maintain project quality and direction.

These requests are not legally binding but are community guidelines that we ask users to respect.
