/**
 * Test setup file for jsdom environment
 * Ensures document and window are available for React Testing Library
 *
 * Usage in vitest.config.ts:
 *   setupFiles: ["@appstandard/react-utils/testing/test-setup"]
 */

// @ts-expect-error - jsdom types are not available, but the module works at runtime
import { JSDOM } from "jsdom";

// Setup DOM before tests run
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
	url: "http://localhost",
	pretendToBeVisual: true,
});

global.document = dom.window.document;
global.window = dom.window as any;
global.navigator = dom.window.navigator;

// Mock window.matchMedia for media query hooks (useMediaQuery, useIsMobile, etc.)
(global.window as any).matchMedia = (query: string) => ({
	matches: false,
	media: query,
	onchange: null,
	addListener: () => {},
	removeListener: () => {},
	addEventListener: () => {},
	removeEventListener: () => {},
	dispatchEvent: () => true,
});
