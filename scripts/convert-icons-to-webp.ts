#!/usr/bin/env bun
/**
 * PERF-012: Convert PNG icons to WebP format
 *
 * This script converts all PNG icons in the public folder to WebP format
 * for better compression while maintaining PNG fallbacks.
 *
 * Usage:
 *   bun scripts/convert-icons-to-webp.ts
 *
 * Prerequisites:
 *   bun add -d sharp
 */
/* biome-ignore-all lint/suspicious/noConsole: CLI script requires console output */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Check if sharp is available
let sharp: typeof import("sharp") | null = null;
try {
	sharp = await import("sharp");
} catch {
	console.error("Error: sharp is not installed.");
	console.error("Please install it first: bun add -d sharp");
	process.exit(1);
}

const PUBLIC_DIRS = [
	"apps/calendar-web/public",
	"apps/contacts-web/public",
	"apps/tasks-web/public",
];

const ICONS_TO_CONVERT = [
	"pwa-64x64.png",
	"pwa-192x192.png",
	"pwa-512x512.png",
	"maskable-icon-512x512.png",
	"apple-touch-icon-180x180.png",
	"logo.png",
];

async function convertToWebP(inputPath: string): Promise<void> {
	const outputPath = inputPath.replace(/\.png$/, ".webp");

	if (existsSync(outputPath)) {
		console.log(`  Skipping ${inputPath} (WebP already exists)`);
		return;
	}

	try {
		if (!sharp) {
			throw new Error("sharp module not loaded");
		}
		await sharp(inputPath)
			.webp({
				quality: 85, // Good balance between quality and size
				lossless: false,
			})
			.toFile(outputPath);

		// Get file sizes for comparison
		const pngStats = Bun.file(inputPath);
		const webpStats = Bun.file(outputPath);
		const pngSize = pngStats.size;
		const webpSize = webpStats.size;
		const savings = ((1 - webpSize / pngSize) * 100).toFixed(1);

		console.log(`  ✓ ${inputPath} → ${outputPath} (${savings}% smaller)`);
	} catch (error) {
		console.error(`  ✗ Failed to convert ${inputPath}:`, error);
	}
}

async function main() {
	console.log("PERF-012: Converting PNG icons to WebP...\n");

	for (const dir of PUBLIC_DIRS) {
		if (!existsSync(dir)) {
			console.log(`Skipping ${dir} (not found)`);
			continue;
		}

		console.log(`Processing ${dir}:`);

		const files = readdirSync(dir);
		const pngFiles = files.filter(
			(f) => f.endsWith(".png") && ICONS_TO_CONVERT.includes(f),
		);

		if (pngFiles.length === 0) {
			console.log("  No icons to convert");
			continue;
		}

		for (const file of pngFiles) {
			await convertToWebP(join(dir, file));
		}

		console.log("");
	}

	console.log("Done! WebP icons have been generated.");
	console.log("\nNote: Update vite.config.ts manifest to reference WebP icons");
	console.log("with PNG fallbacks for older browsers.");
}

main().catch(console.error);
