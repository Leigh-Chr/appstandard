# @leigh-chr/vtodo-utils

TypeScript utilities for parsing and generating VTODO (iCalendar) task files according to RFC 5545.

[![npm version](https://img.shields.io/npm/v/@leigh-chr/vtodo-utils.svg)](https://www.npmjs.com/package/@leigh-chr/vtodo-utils)
[![npm downloads](https://img.shields.io/npm/dm/@leigh-chr/vtodo-utils.svg)](https://www.npmjs.com/package/@leigh-chr/vtodo-utils)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## Features

- Parse VTODO/ICS files into typed JavaScript objects
- Generate valid VTODO files from task data
- Full support for task properties (priority, status, due dates)
- Alarm/reminder handling
- Recurring task support (RRULE)
- Compatible with CalDAV servers
- TypeScript-first with full type definitions

## Installation

```bash
npm install @leigh-chr/vtodo-utils
# or
bun add @leigh-chr/vtodo-utils
# or
pnpm add @leigh-chr/vtodo-utils
```

## Quick Start

```typescript
import { parseTodoFile, generateTodoFile } from '@leigh-chr/vtodo-utils';

// Parse a VTODO file
const { tasks, errors } = parseTodoFile(icsContent);
console.log(tasks[0].title);
console.log(tasks[0].status);

// Generate a VTODO file
const ics = generateTodoFile([{
  title: 'Complete project',
  dueDate: new Date('2024-01-20'),
  priority: 'high',
  status: 'needs-action',
}], {
  calendarName: 'My Tasks',
});
```

## API Reference

### Parser

```typescript
import { parseTodoFile } from '@leigh-chr/vtodo-utils';

const result = parseTodoFile(icsString);
// Returns: { tasks: ParsedTask[], errors: string[] }
```

### Generator

```typescript
import { generateTodoFile } from '@leigh-chr/vtodo-utils';

const ics = generateTodoFile(tasks, options);
```

#### Task Input

```typescript
const tasks = [{
  title: 'Task title',
  description: 'Task description',
  dueDate: new Date(),
  startDate: new Date(),
  completedDate: new Date(),
  priority: 'high',      // 'high' | 'medium' | 'low' | 'none'
  status: 'needs-action', // 'needs-action' | 'in-process' | 'completed' | 'cancelled'
  percentComplete: 50,
  categories: ['work', 'urgent'],
  alarms: [{ trigger: '-PT1H', action: 'DISPLAY' }],
  rrule: 'FREQ=DAILY;COUNT=5',
}];

const options = {
  calendarName: 'My Tasks',
};
```

## Types

```typescript
import type {
  ParsedTask,
  ParsedAlarm,
  ParsedAttendee,
  TaskInput,
  GeneratorOptions,
  ParseResult,
  TaskStatus,
  TaskPriority,
} from '@leigh-chr/vtodo-utils';
```

### ParsedTask

```typescript
interface ParsedTask {
  uid: string;
  title: string;
  description?: string;
  dueDate?: Date;
  startDate?: Date;
  completedDate?: Date;
  created?: Date;
  lastModified?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  percentComplete?: number;
  categories?: string[];
  location?: string;
  url?: string;
  alarms: ParsedAlarm[];
  attendees: ParsedAttendee[];
  organizer?: { name?: string; email: string };
  rrule?: string;
  recurrenceId?: Date;
}
```

### TaskStatus

```typescript
type TaskStatus = 'needs-action' | 'in-process' | 'completed' | 'cancelled';
```

### TaskPriority

```typescript
type TaskPriority = 'high' | 'medium' | 'low' | 'none';
```

## Subpath Exports

For tree-shaking, you can import specific modules:

```typescript
import { parseTodoFile } from '@leigh-chr/vtodo-utils/parser';
import { generateTodoFile } from '@leigh-chr/vtodo-utils/generator';
```

## Compatibility

This package generates VTODO components that are compatible with:

- Apple Reminders
- Google Tasks (via CalDAV)
- Thunderbird
- Nextcloud Tasks
- Any CalDAV-compliant server

## License

AGPL-3.0 - See [LICENSE](https://github.com/Leigh-Chr/appstandard/blob/master/LICENSE) for details.

## Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/Leigh-Chr/appstandard/blob/master/CONTRIBUTING.md).
