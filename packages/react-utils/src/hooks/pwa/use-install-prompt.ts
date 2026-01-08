/**
 * Install Prompt hook for PWA
 * Handles the beforeinstallprompt event for custom install UI
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
 */

import { useCallback, useEffect, useState } from "react";

/**
 * BeforeInstallPromptEvent interface
 * Not all browsers expose this type, so we define it ourselves
 */
interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
	prompt(): Promise<void>;
}

export interface UseInstallPromptReturn {
	/** Whether the install prompt is available */
	canInstall: boolean;
	/** Whether the app is already installed (running in standalone mode) */
	isInstalled: boolean;
	/** Whether the app was just installed in this session */
	wasJustInstalled: boolean;
	/** Trigger the install prompt. Returns true if user accepted */
	install: () => Promise<boolean>;
	/** Dismiss the install prompt without showing it */
	dismiss: () => void;
}

/**
 * Hook to handle PWA installation prompt
 *
 * @example
 * ```tsx
 * function InstallButton() {
 *   const { canInstall, isInstalled, install } = useInstallPrompt();
 *
 *   if (isInstalled) return null;
 *   if (!canInstall) return null;
 *
 *   return (
 *     <button onClick={install}>
 *       Install App
 *     </button>
 *   );
 * }
 * ```
 */
export function useInstallPrompt(): UseInstallPromptReturn {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isInstalled, setIsInstalled] = useState(false);
	const [wasJustInstalled, setWasJustInstalled] = useState(false);

	useEffect(() => {
		// Check if already installed (running in standalone mode)
		const isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			// iOS Safari
			("standalone" in window.navigator &&
				(window.navigator as Navigator & { standalone: boolean }).standalone);

		if (isStandalone) {
			setIsInstalled(true);
			return;
		}

		// Listen for the beforeinstallprompt event
		const handleBeforeInstallPrompt = (e: Event) => {
			// Prevent the default browser install prompt
			e.preventDefault();
			// Save the event for later use
			setDeferredPrompt(e as BeforeInstallPromptEvent);
		};

		// Listen for successful installation
		const handleAppInstalled = () => {
			setIsInstalled(true);
			setWasJustInstalled(true);
			setDeferredPrompt(null);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	const install = useCallback(async (): Promise<boolean> => {
		if (!deferredPrompt) {
			return false;
		}

		// Show the install prompt
		await deferredPrompt.prompt();

		// Wait for the user to respond
		const { outcome } = await deferredPrompt.userChoice;

		// Clear the deferred prompt - it can only be used once
		setDeferredPrompt(null);

		return outcome === "accepted";
	}, [deferredPrompt]);

	const dismiss = useCallback(() => {
		setDeferredPrompt(null);
	}, []);

	return {
		canInstall: deferredPrompt !== null && !isInstalled,
		isInstalled,
		wasJustInstalled,
		install,
		dismiss,
	};
}

/**
 * Check if the app is installed (running in standalone mode)
 */
export function isAppInstalled(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		("standalone" in window.navigator &&
			(window.navigator as Navigator & { standalone: boolean }).standalone)
	);
}
