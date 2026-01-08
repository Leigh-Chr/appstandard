# Contacts Web

React frontend for AppStandard Contacts.

## Tech Stack

- React 19 with React Compiler
- TanStack Router & Query
- tRPC client
- Tailwind CSS 4
- Vite 7

## Development

```bash
# From monorepo root
bun run dev:contacts

# Or directly
bun run dev  # Starts on port 3005
```

## Environment

Copy `.env.example` to `.env` and configure:

```env
VITE_SERVER_URL=http://localhost:3003
```

## Structure

```
src/
├── components/     # UI components
├── hooks/          # Custom React hooks
├── routes/         # TanStack Router pages
├── utils/          # Utilities and tRPC client
└── main.tsx        # Entry point
```

See [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for full documentation.
