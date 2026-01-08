# Tasks Web

React frontend for AppStandard Tasks.

## Tech Stack

- React 19 with React Compiler
- TanStack Router & Query
- tRPC client
- Tailwind CSS 4
- Vite 7

## Development

```bash
# From monorepo root
bun run dev:tasks

# Or directly
bun run dev  # Starts on port 3004
```

## Environment

Copy `.env.example` to `.env` and configure:

```env
VITE_SERVER_URL=http://localhost:3002
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
