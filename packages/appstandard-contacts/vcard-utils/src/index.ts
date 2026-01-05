/**
 * @appstandard-contacts/vcard-utils
 * Pure vCard utilities for parsing and generating contact files (RFC 6350)
 */

// Generator
export { generateVCardFile } from "./generator";

// Parser
export { parseVCardFile } from "./parser";
// Types
export type {
	AddressTypeValue,
	ContactInput,
	ContactKindValue,
	EmailTypeValue,
	GenderValue,
	GeneratorOptions,
	IMServiceValue,
	ParsedAddress,
	ParsedContact,
	ParsedEmail,
	ParsedIM,
	ParsedPhone,
	ParsedRelation,
	ParseResult,
	PhoneTypeValue,
	RelationTypeValue,
} from "./types";
// Utilities
