# @appstandard/react-utils

React utilities: hooks, query keys, error handling.

## Installation

```bash
bun add @appstandard/react-utils
```

**Peer deps:** `react` >= 18, `@tanstack/react-query` >= 5

## Quick usage

```typescript
import { 
  useDebounce, 
  useLocalStorage,
  useIsMobile,
  createQueryKeys,
  cn,
  getErrorMessage,
} from '@appstandard/react-utils';
```

## Hooks

```typescript
// Debounce
const debouncedValue = useDebounce(value, 300);

// localStorage with sync
const [theme, setTheme] = useLocalStorage('theme', 'light');

// Responsive
const isMobile = useIsMobile();
const isDesktop = useIsDesktop();

// Previous value
const prevCount = usePrevious(count);

// Check if mounted (avoids setState on unmount)
const isMounted = useMounted();
```

## Query Keys

```typescript
import { createQueryKeys } from '@appstandard/react-utils';

// Factory to create query keys by domain
const userKeys = createQueryKeys('user');
// userKeys.all        => ['user']
// userKeys.list()     => ['user', 'list']
// userKeys.detail(id) => ['user', 'detail', id]

// Usage with React Query
useQuery({ queryKey: userKeys.list() });
useQuery({ queryKey: userKeys.detail(id) });
```

## Error handling

```typescript
import { getErrorMessage, isNetworkError, logErrorInDev } from '@appstandard/react-utils';

try {
  await api();
} catch (error) {
  const message = getErrorMessage(error);
  if (isNetworkError(error)) { /* offline */ }
  logErrorInDev(error); // Log only in dev
}
```

## Styling

```typescript
import { cn } from '@appstandard/react-utils';

// Merge Tailwind classes with conflict resolution
<div className={cn('px-4', isActive && 'bg-blue-500', className)} />
```

## See also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Global project architecture
- [@appstandard/core](../core/README.md) - Business logic and types

## License

AGPL-3.0
