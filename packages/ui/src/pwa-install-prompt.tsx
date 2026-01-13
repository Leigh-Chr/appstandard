/**
 * UX-014: PWA Install Prompt hook and component
 * Provides a way to show a custom install button for the PWA
 */

import { useCallback, useEffect, useState } from "react";

// BeforeInstallPromptEvent is not in TypeScript's lib.dom.d.ts
interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

interface PWAInstallState {
	/** Whether the app can be installed */
	canInstall: boolean;
	/** Whether the app is already installed (standalone mode) */
	isInstalled: boolean;
	/** Platform detected (e.g., "web", "chrome", etc.) */
	platform: string | null;
}

interface UsePWAInstallReturn extends PWAInstallState {
	/** Trigger the native install prompt */
	promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

/**
 * Hook to handle PWA installation
 * Returns install state and a function to trigger the install prompt
 */
export function usePWAInstall(): UsePWAInstallReturn {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [installState, setInstallState] = useState<PWAInstallState>({
		canInstall: false,
		isInstalled: false,
		platform: null,
	});

	useEffect(() => {
		// Check if already installed (standalone mode)
		const isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			("standalone" in window.navigator &&
				(window.navigator as { standalone?: boolean }).standalone === true);

		if (isStandalone) {
			setInstallState((prev) => ({ ...prev, isInstalled: true }));
			return;
		}

		// Listen for the beforeinstallprompt event
		const handleBeforeInstallPrompt = (e: Event): void => {
			// Prevent the mini-infobar from appearing on mobile
			e.preventDefault();
			const promptEvent = e as BeforeInstallPromptEvent;
			setDeferredPrompt(promptEvent);
			setInstallState((prev) => ({
				...prev,
				canInstall: true,
				platform: promptEvent.platforms?.[0] || "web",
			}));
		};

		// Listen for successful installation
		const handleAppInstalled = (): void => {
			setDeferredPrompt(null);
			setInstallState((prev) => ({
				...prev,
				canInstall: false,
				isInstalled: true,
			}));
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

	const promptInstall = useCallback(async (): Promise<
		"accepted" | "dismissed" | "unavailable"
	> => {
		if (!deferredPrompt) {
			return "unavailable";
		}

		// Show the install prompt
		await deferredPrompt.prompt();

		// Wait for the user to respond to the prompt
		const { outcome } = await deferredPrompt.userChoice;

		// Clear the deferred prompt since it can only be used once
		setDeferredPrompt(null);
		setInstallState((prev) => ({ ...prev, canInstall: false }));

		return outcome;
	}, [deferredPrompt]);

	return {
		...installState,
		promptInstall,
	};
}

/**
 * Export the hook as the main export
 * Components can use this hook to build their own install UI
 *
 * Example usage:
 * ```tsx
 * function InstallButton() {
 *   const { canInstall, promptInstall } = usePWAInstall();
 *
 *   if (!canInstall) return null;
 *
 *   return (
 *     <Button onClick={promptInstall}>
 *       Install App
 *     </Button>
 *   );
 * }
 * ```
 */
