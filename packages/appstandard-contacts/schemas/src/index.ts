/**
 * @appstandard-contacts/schemas
 * Zod validation schemas for AppStandard Contacts
 */

// Common schemas

// Type exports
export type {
	AddressBookCreate,
	AddressBookUpdate,
	AddressType,
	ContactAddress,
	ContactCreate,
	ContactEmail,
	ContactFormData,
	ContactIM,
	ContactKind,
	ContactPhone,
	ContactRelation,
	ContactUpdate,
	EmailType,
	Gender,
	IMService,
	PhoneType,
	RelationType,
} from "./contact-schemas";

// Contact schemas
export {
	addressBookCreateSchema,
	addressBookUpdateSchema,
	contactCreateSchema,
	contactUpdateSchema,
} from "./contact-schemas";
// Field limits

// Validation types
export type { ValidationErrors } from "./validation-types";
