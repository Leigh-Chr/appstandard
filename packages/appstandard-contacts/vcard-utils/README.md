# @appstandard-contacts/vcard-utils

TypeScript utilities for parsing and generating vCard files according to RFC 6350.

[![npm version](https://img.shields.io/npm/v/@appstandard-contacts/vcard-utils.svg)](https://www.npmjs.com/package/@appstandard-contacts/vcard-utils)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

## Features

- Parse vCard 3.0 and 4.0 files into typed JavaScript objects
- Generate valid vCard files from contact data
- Full support for common vCard properties
- Multiple phone, email, and address support
- Photo and organization handling
- Zero external dependencies
- TypeScript-first with full type definitions

## Installation

```bash
npm install @appstandard-contacts/vcard-utils
# or
bun add @appstandard-contacts/vcard-utils
# or
pnpm add @appstandard-contacts/vcard-utils
```

## Quick Start

```typescript
import { parseVCardFile, generateVCardFile } from '@appstandard-contacts/vcard-utils';

// Parse a vCard file
const { contacts, errors } = parseVCardFile(vcardContent);
console.log(contacts[0].fullName);
console.log(contacts[0].emails);

// Generate a vCard file
const vcard = generateVCardFile({
  contacts: [{
    fullName: 'John Doe',
    emails: [{ value: 'john@example.com', type: 'work' }],
    phones: [{ value: '+1234567890', type: 'cell' }],
  }]
});
```

## API Reference

### Parser

```typescript
import { parseVCardFile } from '@appstandard-contacts/vcard-utils';

const result = parseVCardFile(vcardString);
// Returns: { contacts: ParsedContact[], errors: string[] }
```

### Generator

```typescript
import { generateVCardFile } from '@appstandard-contacts/vcard-utils';

const vcard = generateVCardFile({
  contacts: [{
    fullName: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    nickname: 'Janie',
    emails: [
      { value: 'jane@work.com', type: 'work' },
      { value: 'jane@home.com', type: 'home' },
    ],
    phones: [
      { value: '+1234567890', type: 'cell' },
      { value: '+0987654321', type: 'work' },
    ],
    addresses: [{
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      type: 'home',
    }],
    organization: 'Acme Corp',
    title: 'Software Engineer',
    birthday: new Date('1990-01-15'),
    note: 'Met at conference',
    photo: 'https://example.com/photo.jpg',
  }]
});
```

## Types

```typescript
import type {
  ParsedContact,
  ParsedEmail,
  ParsedPhone,
  ParsedAddress,
  ParsedIM,
  ParsedRelation,
  ContactInput,
  GeneratorOptions,
  ParseResult,
  PhoneTypeValue,
  EmailTypeValue,
  AddressTypeValue,
  ContactKindValue,
  GenderValue,
} from '@appstandard-contacts/vcard-utils';
```

### ParsedContact

```typescript
interface ParsedContact {
  uid?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  prefix?: string;
  suffix?: string;
  nickname?: string;
  emails: ParsedEmail[];
  phones: ParsedPhone[];
  addresses: ParsedAddress[];
  organization?: string;
  title?: string;
  department?: string;
  birthday?: Date;
  anniversary?: Date;
  note?: string;
  photo?: string;
  url?: string;
  imAccounts: ParsedIM[];
  relations: ParsedRelation[];
  categories?: string[];
  gender?: GenderValue;
  kind?: ContactKindValue;
}
```

### ParsedEmail

```typescript
interface ParsedEmail {
  value: string;
  type?: EmailTypeValue; // 'home' | 'work' | 'other'
  primary?: boolean;
}
```

### ParsedPhone

```typescript
interface ParsedPhone {
  value: string;
  type?: PhoneTypeValue; // 'cell' | 'home' | 'work' | 'fax' | 'pager' | 'other'
  primary?: boolean;
}
```

### ParsedAddress

```typescript
interface ParsedAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  type?: AddressTypeValue; // 'home' | 'work' | 'other'
  primary?: boolean;
}
```

## Subpath Exports

For tree-shaking, you can import specific modules:

```typescript
import { parseVCardFile } from '@appstandard-contacts/vcard-utils/parser';
import { generateVCardFile } from '@appstandard-contacts/vcard-utils/generator';
```

## License

AGPL-3.0 - See [LICENSE](https://github.com/Leigh-Chr/appstandard/blob/master/LICENSE) for details.

## Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/Leigh-Chr/appstandard/blob/master/CONTRIBUTING.md).
