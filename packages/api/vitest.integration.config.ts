import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.integration.test.ts"],
		testTimeout: 30000,
		hookTimeout: 30000,
		sequence: {
			concurrent: false, // Run tests sequentially to avoid DB conflicts
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"**/*.test.ts",
				"**/__tests__/**",
				"**/*.config.ts",
				"**/dist/**",
			],
		},
	},
});
