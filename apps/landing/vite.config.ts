import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 3010,
		strictPort: true,
		hmr: {
			protocol: "ws",
			host: "localhost",
		},
	},
	preview: {
		port: 3010,
		strictPort: true,
	},
	plugins: [tailwindcss(), tanstackRouter(), react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		dedupe: ["react", "react-dom"],
	},
	optimizeDeps: {
		include: ["react", "react-dom"],
	},
	build: {
		minify: "esbuild",
		cssCodeSplit: true,
		target: "esnext",
	},
});
