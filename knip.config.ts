import type { KnipConfig } from "knip";

const config: KnipConfig = {
	workspaces: {
		"apps/calendar-web": {
			entry: ["src/main.tsx"],
			project: ["src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
		},
		"apps/calendar-server": {
			project: ["src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
		},
		"apps/contacts-web": {
			entry: ["src/main.tsx"],
			project: ["src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
		},
		"apps/contacts-server": {
			project: ["src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
		},
		"apps/tasks-web": {
			entry: ["src/main.tsx"],
			project: ["src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
		},
		"apps/tasks-server": {
			project: ["src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
		},
		"apps/landing": {
			entry: ["src/main.tsx"],
			project: ["src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
		},
		"packages/*": {
			project: ["src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
		},
		"packages/config": {
			entry: [],
			project: [],
		},
		"packages/appstandard-contacts/*": {
			project: ["src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
		},
		"packages/appstandard-tasks/*": {
			project: ["src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
		},
	},
	ignore: [
		"**/routeTree.gen.ts",
		"**/*.config.ts",
		"**/tsdown.config.ts",
		"**/knip.config.ts",
		// Codacy config files
		".codacy/**",
		// Components kept for planned features
		"**/command-palette.tsx",
		"**/page-transition.tsx",
		"**/success-animation.tsx",
		"**/empty-state.tsx",
		// Error boundary component kept for production error handling
		"**/recoverable-error-boundary.tsx",
		// Group card components for planned group functionality
		"**/group-card.tsx",
		// Server utilities kept for future use / reference
		"apps/calendar-server/src/lib/secrets.ts",
		// ICS utils internal files (re-exported via barrel files)
		"packages/ics-utils/src/alarm/parser.ts",
		"packages/ics-utils/src/date/format.ts",
		"packages/ics-utils/src/date/parse.ts",
		"packages/ics-utils/src/duration/format.ts",
		"packages/ics-utils/src/duration/parse.ts",
		"packages/ics-utils/src/generator/ics-generator.ts",
		"packages/ics-utils/src/parser/ics-parser.ts",
	],
	ignoreBinaries: ["tsc"],
	ignoreIssues: {
		// ========== PACKAGES - Public API exports ==========
		// Core package - all exports are public API
		"packages/core/src/**/*.ts": ["exports", "types"],

		// ICS utils package - all exports are public API
		"packages/ics-utils/src/**/*.ts": ["exports", "types"],

		// API-core package - all exports are public API
		"packages/api-core/src/**/*.ts": ["exports", "types"],

		// Server-core package - all exports are public API
		"packages/server-core/src/**/*.ts": ["exports", "types"],

		// API package - all exports are public API
		"packages/api/src/**/*.ts": ["exports", "types"],

		// Schemas package - all exports are public API
		"packages/schemas/src/**/*.ts": ["exports", "types"],

		// DB package - all exports are public API
		"packages/db/src/**/*.ts": ["exports", "types"],

		// React utils package - all exports are public API
		"packages/react-utils/src/**/*.ts": ["exports", "types"],

		// UI package - all exports are public API
		"packages/ui/src/**/*.tsx": ["exports", "types"],
		"packages/ui/src/**/*.ts": ["exports", "types"],

		// AppStandard Contacts packages - in development, all exports are public API
		"packages/appstandard-contacts/api/src/**/*.ts": ["exports", "types"],
		"packages/appstandard-contacts/core/src/**/*.ts": ["exports", "types"],
		"packages/appstandard-contacts/schemas/src/**/*.ts": ["exports", "types"],
		"packages/appstandard-contacts/vcard-utils/src/**/*.ts": [
			"exports",
			"types",
		],

		// AppStandard Tasks packages - in development, all exports are public API
		"packages/appstandard-tasks/api/src/**/*.ts": ["exports", "types"],
		"packages/appstandard-tasks/core/src/**/*.ts": ["exports", "types"],
		"packages/appstandard-tasks/schemas/src/**/*.ts": ["exports", "types"],
		"packages/appstandard-tasks/todo-utils/src/**/*.ts": ["exports", "types"],

		// ========== APPS - Server exports ==========
		// Server entry points - default export is the Hono app instance
		"apps/calendar-server/src/index.ts": ["exports"],
		"apps/contacts-server/src/index.ts": ["exports"],
		"apps/tasks-server/src/index.ts": ["exports"],
		// Logger utilities exported for external API use
		"apps/calendar-server/src/lib/logger.ts": ["exports", "types"],
		// PWA update utilities exported for manual trigger capability
		"apps/calendar-web/src/components/pwa-update-prompt.tsx": ["exports"],
		"apps/contacts-web/src/components/pwa-update-prompt.tsx": ["exports"],
		"apps/tasks-web/src/components/pwa-update-prompt.tsx": ["exports"],
		// Event form constants exported for validation
		"apps/calendar-web/src/lib/event-form-constants.ts": ["exports"],
		// Template selector components exported for reusability
		"apps/calendar-web/src/components/template-selector.tsx": ["exports"],
		// Parse tRPC errors utilities exported for reusability
		"apps/calendar-web/src/lib/parse-trpc-errors.ts": ["exports"],
		// Query keys utilities exported for reusability
		"apps/calendar-web/src/lib/query-keys.ts": ["exports"],
		// Rate limit utilities exported for graceful shutdown
		"apps/calendar-server/src/middleware/rate-limit.ts": ["exports"],
		// Utility functions exported for external use
		"apps/calendar-web/src/lib/search-params.ts": ["exports", "types"],
		"apps/calendar-web/src/lib/storage.ts": ["exports"],
		"apps/contacts-web/src/lib/storage.ts": ["exports"],
		"apps/tasks-web/src/lib/storage.ts": ["exports"],
		// Type exports for external use
		"apps/calendar-web/src/components/event-form-extended.tsx": ["types"],
		"apps/calendar-web/src/components/event-list-view.tsx": ["types"],
		"apps/calendar-web/src/components/recurrence-builder.tsx": ["types"],
		"apps/calendar-web/src/lib/alarm-parser.ts": ["types"],
		"apps/calendar-web/src/lib/error-handler/index.ts": ["types"],
		"apps/calendar-web/src/lib/event-presets.ts": ["types"],
		"apps/calendar-web/src/routes/__root.tsx": ["types"],
		"apps/contacts-web/src/routes/__root.tsx": ["types"],
		"apps/tasks-web/src/routes/__root.tsx": ["types"],
		// Landing page routes - Route exports used by TanStack Router
		"apps/landing/src/routes/__root.tsx": ["exports"],
		"apps/landing/src/routes/index.tsx": ["exports"],
		// Filter components exported for composition
		"apps/contacts-web/src/components/contact-filters.tsx": [
			"exports",
			"types",
		],
		"apps/tasks-web/src/components/task-filters.tsx": ["exports", "types"],
		// React hooks exported for reusability
		"apps/contacts-web/src/hooks/use-address-books.ts": ["exports"],
		"apps/contacts-web/src/hooks/use-contacts.ts": ["exports"],
		"apps/tasks-web/src/hooks/use-task-lists.ts": ["exports"],
		// Storage hooks exported for reusability
		"apps/calendar-web/src/hooks/use-storage.ts": ["exports"],
		"apps/contacts-web/src/hooks/use-storage.ts": ["exports"],
		"apps/tasks-web/src/hooks/use-storage.ts": ["exports"],
		// Export utilities exported for reusability
		"apps/calendar-web/src/lib/calendar-export.ts": ["exports"],
		"apps/contacts-web/src/lib/address-book-export.ts": ["exports"],
		"apps/tasks-web/src/lib/task-list-export.ts": ["exports"],
	},
	ignoreDependencies: [
		// ===== Build/dev tools (used in vite/tsconfig) =====
		"babel-plugin-react-compiler",
		"postcss",
		"tailwindcss",

		// ===== Runtime dependencies (used via re-exports or env loading) =====
		"better-auth", // Auth library used via re-exports
		"@prisma/client", // Database client used via @appstandard/db
		"dotenv", // Environment loading in server startup
		"hono", // Server framework used in server apps

		// ===== Workspace config package =====
		"@appstandard/config", // TypeScript config extends

		// ===== CSS-imported dependencies (not detected by knip) =====
		"tw-animate-css",
		"@fontsource-variable/jetbrains-mono",
		"@fontsource-variable/sora",

		// ===== React form (used in form components) =====
		"@tanstack/react-form",

		// ===== Packages re-exported =====
		"@appstandard/core", // Core types re-exported
		"@appstandard/react-utils", // React utilities
		"@tanstack/react-query", // Used as peer dep
		"@trpc/client", // Used via tRPC setup

		// ===== CLI tools =====
		"lint-staged", // Used via husky pre-commit hook

		// ===== Misc =====
		"@noble/hashes", // Used in seed files
		"bun-osv-scanner", // Used in bunfig.toml
	],
};

export default config;
