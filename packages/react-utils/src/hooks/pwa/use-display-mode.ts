/**
 * Display Mode hook for PWA
 * Detects the current display mode (browser, standalone, fullscreen, etc.)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/display-mode
 */

import { useEffect, useState } from "react";

export type DisplayMode =
	| "browser"
	| "standalone"
	| "fullscreen"
	| "minimal-ui"
	| "window-controls-overlay"
	| "picture-in-picture";

export interface UseDisplayModeReturn {
	/** Current display mode */
	displayMode: DisplayMode;
	/** Whether the app is running as an installed PWA (not in browser) */
	isInstalled: boolean;
	/** Whether Window Controls Overlay is active */
	isWindowControlsOverlay: boolean;
	/** Whether the app is in fullscreen mode */
	isFullscreen: boolean;
}

/**
 * Hook to detect the current display mode
 *
 * @example
 * ```tsx
 * function Header() {
 *   const { isInstalled, isWindowControlsOverlay } = useDisplayMode();
 *
 *   return (
 *     <header className={isWindowControlsOverlay ? 'wco-header' : ''}>
 *       {!isInstalled && <InstallButton />}
 *     </header>
 *   );
 * }
 * ```
 */
export function useDisplayMode(): UseDisplayModeReturn {
	const [displayMode, setDisplayMode] = useState<DisplayMode>(() =>
		getDisplayMode(),
	);

	useEffect(() => {
		// Create media query matchers for each display mode
		const modes: DisplayMode[] = [
			"standalone",
			"fullscreen",
			"minimal-ui",
			"window-controls-overlay",
			"picture-in-picture",
		];

		const mediaQueries = modes.map((mode) => ({
			mode,
			mql: window.matchMedia(`(display-mode: ${mode})`),
		}));

		const handleChange = () => {
			setDisplayMode(getDisplayMode());
		};

		// Add listeners
		for (const { mql } of mediaQueries) {
			mql.addEventListener("change", handleChange);
		}

		// Check initial state
		handleChange();

		return () => {
			for (const { mql } of mediaQueries) {
				mql.removeEventListener("change", handleChange);
			}
		};
	}, []);

	return {
		displayMode,
		isInstalled: displayMode !== "browser",
		isWindowControlsOverlay: displayMode === "window-controls-overlay",
		isFullscreen: displayMode === "fullscreen",
	};
}

/**
 * Get the current display mode
 */
function getDisplayMode(): DisplayMode {
	if (typeof window === "undefined") {
		return "browser";
	}

	// Check in order of specificity
	if (window.matchMedia("(display-mode: window-controls-overlay)").matches) {
		return "window-controls-overlay";
	}
	if (window.matchMedia("(display-mode: fullscreen)").matches) {
		return "fullscreen";
	}
	if (window.matchMedia("(display-mode: standalone)").matches) {
		return "standalone";
	}
	if (window.matchMedia("(display-mode: minimal-ui)").matches) {
		return "minimal-ui";
	}
	if (window.matchMedia("(display-mode: picture-in-picture)").matches) {
		return "picture-in-picture";
	}

	// Also check iOS Safari standalone mode
	if (
		"standalone" in window.navigator &&
		(window.navigator as Navigator & { standalone: boolean }).standalone
	) {
		return "standalone";
	}

	return "browser";
}

/**
 * Check if app is installed without using a hook
 */
export function isAppInstalled(): boolean {
	return getDisplayMode() !== "browser";
}

/**
 * Check if Window Controls Overlay is active
 */
export function isWindowControlsOverlayActive(): boolean {
	return getDisplayMode() === "window-controls-overlay";
}
