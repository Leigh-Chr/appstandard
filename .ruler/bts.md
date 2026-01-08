# AppStandard Project Rules

This is an AppStandard project - a multi-product monorepo for productivity tools built on iCalendar and vCard standards.

## Documentation Reference

**IMPORTANT**: Always consult the following documentation files for complete project information:

### Core Documentation
- **`README.md`** - Project overview, features, getting started, stack, scripts
- **`ARCHITECTURE.md`** - Package structure, dependency diagram, package contents
- **`DEPLOYMENT.md`** - Production deployment guide, environment variables, monitoring
- **`VPS_DEPLOYMENT.md`** - VPS initial setup and deployment guide
- **`CONTRIBUTING.md`** - Contribution guidelines, code standards, PR process
- **`SECURITY.md`** - Security policy, vulnerability reporting, security measures
- **`AUTHENTICATION.md`** - Authentication flow, anonymous users, Better-Auth configuration

### Package Documentation
Each package has its own README with detailed API documentation in `packages/*/README.md`.

## Monorepo & Build System

This is a **Turborepo monorepo** managed with **Bun workspaces**:

### Package Manager
- **Bun 1.3.5+** - Runtime and package manager
- **Catalog System** - Shared dependencies defined in root `package.json` under `workspaces.catalog`
- Use `catalog:` prefix in package.json dependencies (e.g., `"zod": "catalog:"`)

### Turborepo Configuration
- **Remote Cache**: Enabled with signature verification (requires `TURBO_TOKEN` and `TURBO_TEAM` env vars)
- **Task Caching**: All tasks (build, test, lint, typecheck) are cached with granular inputs/outputs
- **Configuration**: See `turbo.json` for task definitions

### TypeScript Project References
- **Root Config**: `tsconfig.json` orchestrates all project references
- **Base Config**: `packages/config/tsconfig.base.json` - Shared configuration for all packages
- **Incremental Builds**: Each package has `composite: true` for faster builds
- **Package DB**: Skips typecheck (Prisma generated files), uses `skipLibCheck: true`

## Project Structure

This is a **Turborepo monorepo** with the following structure:

```
appstandard/
├── apps/
│   ├── landing/             # Landing page (React + Vite)
│   ├── calendar-web/        # Calendar frontend (React + TanStack Router)
│   ├── calendar-server/     # Calendar API server (Hono + tRPC)
│   ├── tasks-web/           # Tasks frontend (React + TanStack Router)
│   ├── tasks-server/        # Tasks API server (Hono + tRPC)
│   ├── contacts-web/        # Contacts frontend (React + TanStack Router)
│   └── contacts-server/     # Contacts API server (Hono + tRPC)
├── packages/
│   ├── config/              # Shared TypeScript configuration
│   ├── api/                 # Calendar tRPC routers
│   ├── api-core/            # Shared tRPC infrastructure
│   ├── auth/                # Better-Auth configuration
│   ├── core/                # Calendar business logic and types
│   ├── db/                  # Prisma client and database schemas
│   ├── ics-utils/           # ICS parsing and generation
│   ├── react-utils/         # React hooks and utilities
│   ├── schemas/             # Calendar Zod validation schemas
│   ├── server-core/         # Shared server middleware
│   ├── ui/                  # Shared UI components
│   ├── appstandard-contacts/  # Contacts packages (api, core, schemas, vcard-utils)
│   └── appstandard-tasks/     # Tasks packages (api, core, schemas, todo-utils)
```

## Key Architecture Principles

1. **Single source of truth** - Domain types in `*/core/constants/*-enums.ts`
2. **Pure functions** - No side effects in `core` and `*-utils` packages
3. **No over-engineering** - One function per need
4. **Tree-shakeable** - Granular imports possible
5. **Shared infrastructure** - Common patterns in `api-core` and `server-core`

## Dependency Graph

```
apps/calendar-web → react-utils, schemas, api, ui
apps/calendar-server → api, server-core, auth, db
apps/tasks-web → react-utils, @appstandard-tasks/schemas, @appstandard-tasks/api, ui
apps/tasks-server → @appstandard-tasks/api, server-core, auth, db
api → api-core, auth, db, schemas, ics-utils, core
auth → db
react-utils → (peer: react)
core → ics-utils (0 internal dependencies)
```

## Available Scripts

### Development
- `bun run dev` - Start all apps in development mode
- `bun run dev:calendar` - Start calendar web + server
- `bun run dev:tasks` - Start tasks web + server
- `bun run dev:contacts` - Start contacts web + server
- `bun run dev:landing` - Start landing page

### Build & Type Checking
- `bun run build` - Build all apps for production
- `bun run check-types` - Check TypeScript types across all packages
- `bun run check` - Run Biome linting and formatting
- `bun run clean` - Clean all build artifacts and caches

### Database Commands
All database operations run from the root:
- `bun run db:push` - Push schema changes to database (dev)
- `bun run db:studio` - Open Prisma Studio
- `bun run db:generate` - Generate Prisma client
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed test data (dev only)

**Important**: Database schema is located in `packages/db/prisma/schema/` (not in apps/)

## Database Schema

The database uses **PostgreSQL** with Prisma. Schema files are in:
- `packages/db/prisma/schema/schema.prisma` - Main config (generator, datasource)
- `packages/db/prisma/schema/auth.prisma` - Better-Auth tables
- `packages/db/prisma/schema/calendar.prisma` - Calendar tables
- `packages/db/prisma/schema/contacts.prisma` - Contacts tables
- `packages/db/prisma/schema/tasks.prisma` - Tasks tables
- `packages/db/prisma/schema/group.prisma` - Shared group tables
- `packages/db/prisma/schema/share.prisma` - Shared share tables

## API Structure

### tRPC Procedures
- `publicProcedure` - Accessible without authentication (health check, public shares)
- `authOrAnonProcedure` - Requires session OR anonymous ID (most endpoints)
- `protectedProcedure` - Requires authentication (user settings only)

### Context
The tRPC context includes:
- `session` - Better-Auth session (null if anonymous)
- `anonymousId` - Anonymous user ID from header `x-anonymous-id`
- `userId` - `session.user.id` or `anonymousId`

## Code Standards

### Style & Linting
- Uses **Biome** for linting and formatting
- Auto-formatted on commit via Husky + lint-staged
- Run `bun run check` to verify and auto-fix
- **Knip** configured to detect unused code and dependencies

### Naming Conventions
- **Files**: `kebab-case.ts` for files, `PascalCase.tsx` for React components
- **Variables/Functions**: `camelCase`
- **Types/Interfaces**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE`

### TypeScript
- **Strict Mode**: All strict options enabled
- **`exactOptionalPropertyTypes`**: Currently disabled; may be enabled later
- **Environment Variables**: Use bracket notation (`process.env["KEY"]`) not dot notation
- Use explicit types, avoid `any`
- Prefer `interface` over `type` for objects
- Use Zod schemas from `@appstandard/schemas` for validation

### Commits
Follow conventional commits:
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
```

## Environment Variables

### Backend (`.env` per server)
```env
PORT=3000                           # 3000=calendar, 3002=tasks, 3003=contacts
DATABASE_URL=postgresql://user:pass@localhost:5432/db
CORS_ORIGIN=http://localhost:3001   # Must match frontend port
BETTER_AUTH_SECRET=min-32-chars-secret
BETTER_AUTH_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379    # Optional (rate limiting)
```

### Frontend (`.env` per app)
```env
VITE_SERVER_URL=http://localhost:3000  # Match backend port
```

## Development Ports

| Application | Frontend | Backend | CORS Origin |
|-------------|----------|---------|-------------|
| Landing Page          | 3010     | -       | -           |
| AppStandard Calendar  | 3001     | 3000    | 3001        |
| AppStandard Tasks     | 3004     | 3002    | 3004        |
| AppStandard Contacts  | 3005     | 3003    | 3005        |

## When in Doubt

1. **Read the documentation** - Check the relevant README.md file
2. **Check ARCHITECTURE.md** - Understand package relationships
3. **Look at existing code** - Follow established patterns
4. **Ask questions** - Open an issue with label `question`

---

**Remember**: This project has comprehensive documentation. Always refer to the documentation files listed at the top of this file for complete and up-to-date information.
