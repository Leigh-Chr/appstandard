/**
 * Search params schemas for URL state management
 * Uses Zod for validation with fallback defaults
 *
 * Benefits of URL search params:
 * - Shareable URLs (users can share filtered views)
 * - Browser back/forward navigation works correctly
 * - State persists on page refresh
 * - SEO friendly (for public pages)
 *
 * Using @tanstack/zod-adapter's fallback() for graceful error handling:
 * - Invalid URL params fall back to defaults instead of throwing
 * - Users can't break the app by manually editing URLs
 */

import { fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

// ============================================================================
// Login Page Search Params
// Used in /login
// ============================================================================

const loginModes = ["signin", "signup"] as const;

export const loginSearchSchema = z.object({
	/** Display mode: sign in or sign up form */
	mode: fallback(z.enum(loginModes), "signup").default("signup"),
	/** Redirect URL after successful authentication */
	redirect: z.string().optional().catch(undefined),
});

type LoginSearch = z.infer<typeof loginSearchSchema>;

export const loginDefaults: LoginSearch = {
	mode: "signup",
	redirect: undefined,
};

// ============================================================================
// Address Books List Search Params
// Used in /contacts
// ============================================================================

const addressBooksListSortOptions = [
	"name",
	"updatedAt",
	"createdAt",
	"contactCount",
] as const;

const addressBooksListSortDirections = ["asc", "desc"] as const;

export const addressBooksListSearchSchema = z.object({
	/** Search keyword for address book names */
	q: fallback(z.string(), "").default(""),
	/** Sort by field */
	sortBy: fallback(z.enum(addressBooksListSortOptions), "updatedAt").default(
		"updatedAt",
	),
	/** Sort direction */
	sortDirection: fallback(
		z.enum(addressBooksListSortDirections),
		"desc",
	).default("desc"),
});

type AddressBooksListSearch = z.infer<typeof addressBooksListSearchSchema>;

export const addressBooksListDefaults: AddressBooksListSearch = {
	q: "",
	sortBy: "updatedAt",
	sortDirection: "desc",
};

// ============================================================================
// Address Book Detail View Search Params
// Used in /contacts/$addressBookId
// ============================================================================

/** View modes for address book detail */
const addressBookViewModes = ["list", "grid"] as const;

/** Sort options for contacts */
const contactSortOptions = ["name", "organization", "updated"] as const;
export type ContactSortBy = (typeof contactSortOptions)[number];

/** Sort direction */
const sortDirections = ["asc", "desc"] as const;
export type SortDirection = (typeof sortDirections)[number];

export const addressBookViewSearchSchema = z.object({
	/** View mode: list or grid */
	view: fallback(z.enum(addressBookViewModes), "list").default("list"),
	/** Search keyword */
	q: fallback(z.string(), "").default(""),
	/** Sort by field */
	sortBy: fallback(z.enum(contactSortOptions), "name").default("name"),
	/** Sort direction */
	sortDirection: fallback(z.enum(sortDirections), "asc").default("asc"),
});

type AddressBookViewSearch = z.infer<typeof addressBookViewSearchSchema>;

export const addressBookViewDefaults: AddressBookViewSearch = {
	view: "list",
	q: "",
	sortBy: "name",
	sortDirection: "asc",
};
