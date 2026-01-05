import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/parser/index.ts",
		"src/generator/index.ts",
		"src/utils/index.ts",
	],
	format: ["esm"],
	dts: true,
	clean: false,
	sourcemap: true,
});
