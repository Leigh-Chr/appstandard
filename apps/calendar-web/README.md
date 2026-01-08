# Calendar Web

React frontend for AppStandard Calendar.

## Tech Stack

- React 19 with React Compiler
- TanStack Router & Query
- tRPC client
- Tailwind CSS 4
- Vite 7

## Development

```bash
# From monorepo root
bun run dev:calendar-web

# Or directly
bun run dev  # Starts on port 3001
```

## Environment

Copy `.env.example` to `.env` and configure:

```env
VITE_SERVER_URL=http://localhost:3000
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
