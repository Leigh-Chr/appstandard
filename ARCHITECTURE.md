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

**Note:** The `*-utils` packages (ics-utils, vcard-utils, todo-utils) and `core` are leaf packages with NO internal dependencies - they only depend on external libraries.

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
| `@appstandard/core` | Yes | `date-fns`, `dequal` |
| `@appstandard/react-utils` | Yes | Peer: `react`, `@tanstack/react-query` |
| `@appstandard-contacts/vcard-utils` | Yes | Minimal deps |
| `@appstandard-tasks/todo-utils` | Yes | Minimal deps |

## Package Contents

See individual package READMEs in `packages/*/README.md` for detailed API documentation.

## Principles

1. **Single source of truth** - Domain types in `*/core/constants/*-enums.ts`
2. **Pure functions** - No side effects in `core` and `*-utils` packages
3. **No over-engineering** - One function per need, no unnecessary converters
4. **Tree-shakeable** - Granular imports possible
5. **Shared infrastructure** - Common patterns extracted to `api-core` and `server-core`

## See Also

- [README.md](README.md) - Project overview
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- Package documentation in `packages/*/README.md`
