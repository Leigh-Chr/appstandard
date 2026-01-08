# @appstandard/ics-utils

TypeScript utilities for parsing and generating ICS (iCalendar) files according to RFC 5545.

[![npm version](https://img.shields.io/npm/v/@appstandard/ics-utils.svg)](https://www.npmjs.com/package/@appstandard/ics-utils)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

## Features

- Parse ICS files into typed JavaScript objects
- Generate valid ICS files from event data
- Full support for recurring events (RRULE)
- Alarm/reminder handling (VALARM)
- Attendee management
- Date and duration utilities
- Zero configuration required
- TypeScript-first with full type definitions

## Installation

```bash
npm install @appstandard/ics-utils
# or
bun add @appstandard/ics-utils
# or
pnpm add @appstandard/ics-utils
```

## Quick Start

```typescript
import { parseIcsFile, generateIcsFile } from '@appstandard/ics-utils';

// Parse an ICS file
const { events, errors } = parseIcsFile(icsContent);
console.log(events[0].title);
console.log(events[0].startDate);

// Generate an ICS file
const ics = generateIcsFile({
  calendarName: 'My Calendar',
  events: [{
    title: 'Team Meeting',
    startDate: new Date('2024-01-15T10:00:00Z'),
    endDate: new Date('2024-01-15T11:00:00Z'),
    description: 'Weekly sync',
    location: 'Conference Room A',
  }]
});
```

## API Reference

### Parser

```typescript
import { parseIcsFile } from '@appstandard/ics-utils';

const result = parseIcsFile(icsString);
// Returns: { events: ParsedEvent[], errors: string[] }
```

### Generator

```typescript
import { generateIcsFile } from '@appstandard/ics-utils';

const ics = generateIcsFile({
  calendarName: 'My Calendar',
  events: [{
    title: 'Event Title',
    startDate: new Date(),
    endDate: new Date(),
    // Optional fields:
    description: 'Event description',
    location: 'Event location',
    uid: 'unique-id',
    rrule: 'FREQ=WEEKLY;COUNT=10',
    alarms: [{ trigger: '-PT15M', action: 'DISPLAY' }],
    attendees: [{ email: 'attendee@example.com' }],
  }]
});
```

### Date Utilities

```typescript
import {
  formatDateToICS,
  parseDateFromICS,
  formatDateOnlyToICS,
  isValidIcsDate
} from '@appstandard/ics-utils';

// Format JavaScript Date to ICS format
formatDateToICS(new Date());           // '20240115T100000Z'

// Parse ICS date string to JavaScript Date
parseDateFromICS('20240115T100000Z');  // Date object

// Format date-only (for all-day events)
formatDateOnlyToICS(new Date());       // '20240115'

// Validate ICS date format
isValidIcsDate('20240115T100000Z');    // true
```

### Duration Utilities

```typescript
import {
  formatDuration,
  parseDuration,
  durationToMinutes,
  isValidDuration
} from '@appstandard/ics-utils';

// Format to ISO 8601 duration
formatDuration(15, 'minutes');  // 'PT15M'
formatDuration(2, 'hours');     // 'PT2H'
formatDuration(1, 'days');      // 'P1D'

// Parse ISO 8601 duration
parseDuration('PT15M');         // { value: 15, unit: 'minutes' }
parseDuration('PT2H');          // { value: 2, unit: 'hours' }

// Convert to minutes
durationToMinutes('PT2H');      // 120

// Validate duration format
isValidDuration('PT15M');       // true
```

### Alarm Utilities

```typescript
import {
  parseAlarmTrigger,
  formatAlarmTrigger
} from '@appstandard/ics-utils';

// Parse alarm trigger
parseAlarmTrigger('-PT15M');
// { when: 'before', value: 15, unit: 'minutes' }

parseAlarmTrigger('PT30M');
// { when: 'after', value: 30, unit: 'minutes' }

// Format alarm trigger
formatAlarmTrigger('before', 15, 'minutes');  // '-PT15M'
formatAlarmTrigger('after', 1, 'hours');      // 'PT1H'
```

## Types

```typescript
import type {
  ParsedEvent,
  ParsedAlarm,
  ParsedAttendee,
  EventInput,
  GeneratorOptions,
  ParseResult,
  AlarmTrigger,
  DurationUnit,
} from '@appstandard/ics-utils';
```

### ParsedEvent

```typescript
interface ParsedEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  rrule?: string;
  recurrenceId?: Date;
  exdates?: Date[];
  alarms: ParsedAlarm[];
  attendees: ParsedAttendee[];
  organizer?: { name?: string; email: string };
  status?: string;
  categories?: string[];
  created?: Date;
  lastModified?: Date;
}
```

## Subpath Exports

For tree-shaking, you can import specific modules:

```typescript
import { parseIcsFile } from '@appstandard/ics-utils/parser';
import { generateIcsFile } from '@appstandard/ics-utils/generator';
import { formatDateToICS } from '@appstandard/ics-utils/date';
import { formatDuration } from '@appstandard/ics-utils/duration';
import { parseAlarmTrigger } from '@appstandard/ics-utils/alarm';
```

## License

AGPL-3.0 - See [LICENSE](https://github.com/Leigh-Chr/appstandard/blob/master/LICENSE) for details.

## Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/Leigh-Chr/appstandard/blob/master/CONTRIBUTING.md).
