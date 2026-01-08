import path from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// React Compiler configuration
// See: https://react.dev/reference/react-compiler/configuration
// Note: The compiler may silently skip components it can't optimize.
// In dev mode, we log these events for visibility.
const ReactCompilerConfig = {
	// Skip components with errors instead of failing the build
	panicThreshold: "none",
	// Log compilation events in development for debugging
	logger: {
		logEvent(
			filename: string,
			event: { kind: string; fnName?: string; detail?: string },
		) {
			// Only log in development and only for failures/skips
			if (
				process.env["NODE_ENV"] !== "production" &&
				(event.kind === "CompileError" || event.kind === "CompileSkip")
			) {
				const name = event.fnName ? ` (${event.fnName})` : "";
				const detail = event.detail ? `: ${event.detail}` : "";
				console.warn(
					`[React Compiler] ${event.kind}${name} in ${filename}${detail}`,
				);
			}
		},
	},
};

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd(), "");

	return {
		server: {
			port: 3001,
			strictPort: true,
			hmr: {
				protocol: "ws",
				host: "localhost",
			},
			proxy: {
				"/trpc": {
					target: env["VITE_SERVER_URL"] || "http://localhost:3000",
					changeOrigin: true,
					secure: false,
				},
				"/api": {
					target: env["VITE_SERVER_URL"] || "http://localhost:3000",
					changeOrigin: true,
					secure: false,
				},
			},
		},
		preview: {
			port: 3001,
			strictPort: true,
		},
		plugins: [
			tailwindcss(),
			tanstackRouter(),
			react({
				babel: {
					// Re-enabled: React Compiler is NOT the source of debug code
					plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
				},
			}),
			// Debug code removal disabled - CSP allows 127.0.0.1:7242 to prevent errors
			// ...(mode === "production" ? [removeDebugCode()] : []),
			VitePWA({
				registerType: "autoUpdate",
				includeAssets: [
					"favicon.ico",
					"apple-touch-icon-180x180.png",
					"pwa-64x64.png",
					"pwa-192x192.png",
					"pwa-512x512.png",
					"maskable-icon-512x512.png",
					"og-image.png",
					"robots.txt",
					"sitemap.xml",
					"offline.html",
				],
				manifest: {
					id: "/",
					name: "AppStandard Calendar",
					short_name: "AppStandard Calendar",
					description:
						"Import, create, edit, and merge your ICS calendars. Compatible with Google Calendar, Apple Calendar, Outlook.",
					theme_color: "#2a2218",
					background_color: "#2a2218",
					display: "standalone",
					display_override: ["window-controls-overlay", "standalone"],
					orientation: "any",
					scope: "/",
					start_url: "/",
					lang: "en",
					categories: ["productivity", "utilities"],
					icons: [
						{
							src: "pwa-64x64.png",
							sizes: "64x64",
							type: "image/png",
						},
						{
							src: "pwa-192x192.png",
							sizes: "192x192",
							type: "image/png",
						},
						{
							src: "pwa-512x512.png",
							sizes: "512x512",
							type: "image/png",
						},
						{
							src: "pwa-512x512.png",
							sizes: "512x512",
							type: "image/png",
							purpose: "any",
						},
						{
							src: "maskable-icon-512x512.png",
							sizes: "512x512",
							type: "image/png",
							purpose: "maskable",
						},
					],
					shortcuts: [
						{
							name: "New calendar",
							short_name: "New",
							description: "Create a new calendar",
							url: "/calendars/new",
							icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
						},
						{
							name: "My calendars",
							short_name: "Calendars",
							description: "View all my calendars",
							url: "/calendars",
							icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
						},
					],
					// Screenshots for app store listings and install prompts
					screenshots: [
						{
							src: "screenshots/desktop-calendar.svg",
							sizes: "1280x720",
							type: "image/svg+xml",
							form_factor: "wide",
							label: "Monthly calendar view on desktop",
						},
						{
							src: "screenshots/mobile-calendar.svg",
							sizes: "750x1334",
							type: "image/svg+xml",
							form_factor: "narrow",
							label: "Calendar view on mobile",
						},
					],
					// Launch handler - focus existing window if app is already open
					launch_handler: {
						client_mode: ["focus-existing", "auto"],
					},
					// File handlers - open .ics files directly with the app
					file_handlers: [
						{
							action: "/calendars/import",
							accept: {
								"text/calendar": [".ics", ".ical", ".ifb", ".icalendar"],
							},
						},
					],
					// Protocol handlers - handle webcal:// URLs
					protocol_handlers: [
						{
							protocol: "web+webcal",
							url: "/calendars/subscribe?url=%s",
						},
						{
							protocol: "web+ical",
							url: "/calendars/import?url=%s",
						},
					],
					// Share target - receive shared files
					share_target: {
						action: "/calendars/import",
						method: "POST",
						enctype: "multipart/form-data",
						params: {
							title: "title",
							text: "text",
							url: "url",
							files: [
								{
									name: "file",
									accept: ["text/calendar", ".ics"],
								},
							],
						},
					},
				},
				pwaAssets: { disabled: false, config: true },
				devOptions: {
					enabled: mode === "development",
					suppressWarnings: true,
					type: "module",
				},
				workbox: {
					// Exclude HTML from precache to always get fresh CSP headers
					globPatterns: ["**/*.{js,css,ico,png,svg,woff,woff2,html}"],
					cleanupOutdatedCaches: true,
					clientsClaim: true,
					skipWaiting: true,
					// Enable navigation preload for faster page loads
					navigationPreload: true,
					// Increase limit to accommodate large JS bundle (current ~2.1MB)
					maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
					// Force cache version update - increment when CSP or other server headers change
					cacheId: "appstandard-calendar-v3",
					// SPA fallback - serves index.html for all navigation requests (client-side routing)
					navigateFallback: "/index.html",
					navigateFallbackDenylist: [/^\/api/, /^\/trpc/],
					runtimeCaching: [
						{
							// Cache API calls with network-first strategy
							urlPattern: /^.*\/trpc\/.*/,
							handler: "NetworkFirst",
							options: {
								cacheName: "api-cache",
								networkTimeoutSeconds: 5,
								expiration: {
									maxEntries: 100,
									maxAgeSeconds: 60 * 60 * 24, // 24 hours
								},
								cacheableResponse: {
									statuses: [0, 200],
								},
							},
						},
						{
							// Always fetch HTML from network to get fresh CSP headers
							urlPattern: /\.html$/,
							handler: "NetworkFirst",
							options: {
								cacheName: "html-cache",
								expiration: {
									maxEntries: 10,
									maxAgeSeconds: 60 * 60, // 1 hour
								},
								networkTimeoutSeconds: 10,
							},
						},
						// Note: Fonts are self-hosted via @fontsource-variable, no external font caching needed
					],
				},
			}),
			// Sentry plugin for source maps upload (only in production builds)
			sentryVitePlugin({
				org: env["SENTRY_ORG"],
				project: env["SENTRY_PROJECT"],
				authToken: env["SENTRY_AUTH_TOKEN"],
				sourcemaps: {
					filesToDeleteAfterUpload: ["./dist/**/*.map"],
				},
				// Disable plugin if no auth token (local development)
				disable: !env["SENTRY_AUTH_TOKEN"],
			}),
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
			// CRITICAL: Deduplicate React to prevent "Invalid hook call" errors
			// This ensures all dependencies use the same React instance
			dedupe: ["react", "react-dom"],
		},
		optimizeDeps: {
			// SIMPLIFIED: Only pre-bundle React to ensure single instance
			// Let Vite handle Radix UI dependencies automatically
			// This avoids complex dependency resolution issues
			include: ["react", "react-dom"],
		},
		build: {
			sourcemap: true, // Required for Sentry source maps
			minify: "esbuild", // Fast minification (swc not available in Vite 7)
			cssCodeSplit: true, // Split CSS for better caching
			chunkSizeWarningLimit: 1600, // Warn if chunk exceeds 1.6MB (optimized via lazy routes from 2.4MB to 1.55MB)
			target: "esnext", // Modern browsers only
			rollupOptions: {
				output: {
					// Manual chunks for better caching and parallel loading
					manualChunks: {
						// React core - rarely changes
						"react-vendor": ["react", "react-dom"],
						// TanStack ecosystem - changes occasionally
						"tanstack-vendor": [
							"@tanstack/react-query",
							"@tanstack/react-router",
							"@tanstack/react-form",
						],
						// Animation library
						motion: ["motion"],
						// Date utilities
						"date-fns": ["date-fns"],
					},
				},
			},
		},
	};
});
