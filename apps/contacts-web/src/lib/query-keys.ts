/**
 * Centralized React Query keys
 * Eliminates magic strings and provides type-safe query key management
 */

export const QUERY_KEYS = {
	// Address book queries
	addressBook: {
		all: [["addressBook"]] as const,
		list: [["addressBook", "list"]] as const,
		byId: (id: string) => [["addressBook", "getById"], { id }] as const,
		usage: [["addressBook", "getUsage"]] as const,
	},

	// Dashboard queries
	dashboard: {
		all: [["dashboard"]] as const,
		stats: (period: string) => [["dashboard", "getStats"], { period }] as const,
	},

	// Contact queries
	contact: {
		all: [["contact"]] as const,
		list: (addressBookId?: string) =>
			addressBookId
				? ([["contact", "list"], { addressBookId }] as const)
				: ([["contact", "list"]] as const),
		byId: (id: string) => [["contact", "getById"], { id }] as const,
		search: (query: string) => [["contact", "search"], { query }] as const,
	},

	// Share link queries
	share: {
		all: [["share"]] as const,
		list: [["share", "list"]] as const,
		byAddressBook: (addressBookId: string) =>
			[["share", "list"], { addressBookId }] as const,
		byToken: (token: string) => [["share", "getByToken"], { token }] as const,
		infoByToken: (token: string) =>
			[["share", "getInfoByToken"], { token }] as const,
	},

	// Auth queries
	auth: {
		session: [["auth", "session"]] as const,
		privateData: [["privateData"]] as const,
	},

	// Contact group queries
	contactGroup: {
		all: [["contact", "group"]] as const,
		byId: (id: string) => [["contact", "group", "getById"], { id }] as const,
		byAddressBookId: (addressBookId: string) =>
			[["contact", "group", "getByAddressBookId"], { addressBookId }] as const,
	},

	// Collaboration group queries (shared with other users)
	group: {
		all: [["group"]] as const,
		byId: (id: string) => [["group", "getById"], { id }] as const,
		listMembers: (groupId: string) =>
			[["group", "listMembers"], { groupId }] as const,
	},

	// Share bundle queries
	shareBundle: {
		all: [["share", "bundle", "list"]] as const,
		byId: (id: string) => [["share", "bundle", "getById"], { id }] as const,
	},
} as const;
