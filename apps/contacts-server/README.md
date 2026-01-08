# Contacts Server

Hono API server for AppStandard Contacts.

## Tech Stack

- Bun runtime
- Hono web framework
- tRPC for type-safe APIs
- Prisma ORM
- Better-Auth authentication

## Development

```bash
# From monorepo root
bun run dev:contacts

# Or directly
bun run dev  # Starts on port 3003
```

## Environment

Copy `.env.example` to `.env` and configure:

```env
PORT=3003
DATABASE_URL=postgresql://user:pass@localhost:5432/appstandard
CORS_ORIGIN=http://localhost:3005
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3003
```

## API

The server exposes tRPC routers at `/trpc/*` and auth endpoints at `/api/auth/*`.

See [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for full documentation.
