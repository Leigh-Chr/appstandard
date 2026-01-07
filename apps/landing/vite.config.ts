import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	return {
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
		plugins: [
			tailwindcss(),
			tanstackRouter(),
			react(),
			// Bundle analyzer (run with ANALYZE=true bun run build)
			env["ANALYZE"] === "true" &&
				visualizer({
					open: true,
					filename: "dist/stats.html",
					gzipSize: true,
					brotliSize: true,
				}),
		].filter(Boolean),
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
	};
});
