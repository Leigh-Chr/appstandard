/**
 * Centralized React Query keys
 * Eliminates magic strings and provides type-safe query key management
 */

export const QUERY_KEYS = {
	// Task list queries
	taskList: {
		all: [["taskList"]] as const,
		list: [["taskList", "list"]] as const,
		byId: (id: string) => [["taskList", "getById"], { id }] as const,
		usage: [["taskList", "getUsage"]] as const,
	},

	// Dashboard queries
	dashboard: {
		all: [["dashboard"]] as const,
		stats: (period: string) => [["dashboard", "getStats"], { period }] as const,
	},

	// Task queries
	task: {
		all: [["task"]] as const,
		list: (taskListId?: string) =>
			taskListId
				? ([["task", "list"], { taskListId }] as const)
				: ([["task", "list"]] as const),
		byId: (id: string) => [["task", "getById"], { id }] as const,
	},

	// Share link queries
	share: {
		all: [["share"]] as const,
		list: [["share", "list"]] as const,
		byTaskList: (taskListId: string) =>
			[["share", "list"], { taskListId }] as const,
		byToken: (token: string) => [["share", "getByToken"], { token }] as const,
		infoByToken: (token: string) =>
			[["share", "getInfoByToken"], { token }] as const,
	},

	// Auth queries
	auth: {
		session: [["auth", "session"]] as const,
		privateData: [["privateData"]] as const,
	},

	// Task group queries
	taskGroup: {
		all: [["task", "group"]] as const,
		byId: (id: string) => [["task", "group", "getById"], { id }] as const,
		byTaskListId: (taskListId: string) =>
			[["task", "group", "getByTaskListId"], { taskListId }] as const,
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
