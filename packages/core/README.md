# @appstandard/core

Business logic and types for calendar management. Framework-independent package.

## Installation

```bash
bun add @appstandard/core
```

## Quick usage

```typescript
import {
  type EventFormData,
  initializeFormData,
  validateEventForm,
  transformEventFormData,
  FIELD_LIMITS,
  applyPreset,
} from '@appstandard/core';

// Initialize an empty form
const formData = initializeFormData();

// Apply a preset
const withPreset = applyPreset('meeting', { 
  startDate: '2024-01-15T10:00',
  title: 'Team meeting'
});

// Validate
const result = validateEventForm(formData);
if (!result.valid) {
  console.log(result.errors);
}

// Transform for API
const apiData = transformEventFormData(formData, 'calendar-id');
```

## API

### Types

| Type | Description |
|------|-------------|
| `EventFormData` | Event form data |
| `EventEntity` | Persisted event entity |
| `CalendarEntity` | Calendar entity |
| `AttendeeData` | Attendee data |
| `AlarmData` | Alarm data |

### Validation

```typescript
import { validateEventForm, isValidEmail, isValidUrl } from '@appstandard/core';

validateEventForm(data)     // Complete validation
isValidEmail('a@b.com')     // true
isValidUrl('https://...')   // true
isValidHexColor('#FF0000')  // true
```

### Utilities

```typescript
import { 
  parseTags, addTag, removeTag,      // Tag management
  deepEqual,                          // Comparison
  normalizeDate, formatEventDuration, // Dates
  initializeFormData,                 // Form initialization
  transformEventFormData,             // API transformation
} from '@appstandard/core';
```

### Constants

```typescript
import { 
  FIELD_LIMITS,           // { TITLE: 255, DESCRIPTION: 10000, ... }
  EVENT_PRESETS,          // Presets: meeting, call, birthday, task...
  EVENT_STATUS_VALUES,    // ['CONFIRMED', 'TENTATIVE', 'CANCELLED']
  isValidEventStatus,     // Validator
} from '@appstandard/core';
```

### User limits

```typescript
import {
  ANONYMOUS_LIMITS,       // { calendars: 5, eventsPerCalendar: 250, groups: 3, calendarsPerGroup: 10 }
  AUTHENTICATED_LIMITS,   // { calendars: 150, eventsPerCalendar: 3000, groups: 100, calendarsPerGroup: 30 }
  hasReachedCalendarLimit,
  hasReachedEventLimit,
  hasReachedGroupLimit,
  getMaxCalendars,
  getMaxEventsPerCalendar,
  getMaxGroups,
  getMaxCalendarsPerGroup,
} from '@appstandard/core';

// Check if limit reached
hasReachedCalendarLimit(isAuth, currentCount)  // boolean
hasReachedEventLimit(isAuth, currentCount)     // boolean
hasReachedGroupLimit(isAuth, currentCount)     // boolean

// Get limits
getMaxCalendars(isAuth)           // 5 or 150
getMaxEventsPerCalendar(isAuth)   // 250 or 3000
getMaxGroups(isAuth)              // 3 or 100
getMaxCalendarsPerGroup(isAuth)   // 10 or 30
```

### Recurrence (RRULE)

```typescript
import { parseRRule, buildRRule } from '@appstandard/core';

parseRRule('FREQ=WEEKLY;BYDAY=MO,WE')
// { frequency: 'WEEKLY', byDay: ['MO', 'WE'] }

buildRRule({ frequency: 'MONTHLY', count: 6 })
// 'FREQ=MONTHLY;COUNT=6'
```

## See also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Global project architecture
- [@appstandard/schemas](../schemas/README.md) - Zod validation schemas
- [@appstandard/ics-utils](../ics-utils/README.md) - ICS utilities

## License

AGPL-3.0
