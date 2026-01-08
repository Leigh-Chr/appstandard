/**
 * PWA Install Prompt component
 * Shows a custom install banner/button for the PWA
 *
 * Uses the beforeinstallprompt event to provide a custom install experience
 */

import { Download, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./button";

/**
 * BeforeInstallPromptEvent interface
 * Not all browsers expose this type, so we define it ourselves
 */
interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
	prompt(): Promise<void>;
}

export interface InstallPromptProps {
	/** Text to show on the install button */
	buttonText?: string;
	/** Description text for the banner */
	description?: string;
	/** Whether to show as a banner (default) or just a button */
	variant?: "banner" | "button";
	/** Callback when app is installed */
	onInstalled?: () => void;
	/** Callback when user dismisses the prompt */
	onDismissed?: () => void;
	/** Custom class name */
	className?: string;
}

/**
 * InstallPrompt component
 * Automatically shows when the app is installable
 *
 * @example
 * ```tsx
 * // As a banner at the bottom of the page
 * <InstallPrompt
 *   description="Install AppStandard for a better experience"
 *   onInstalled={() => console.log('App installed!')}
 * />
 *
 * // As a simple button
 * <InstallPrompt variant="button" buttonText="Install App" />
 * ```
 */
export function InstallPrompt({
	buttonText = "Install",
	description = "Install this app for a better experience",
	variant = "banner",
	onInstalled,
	onDismissed,
	className = "",
}: InstallPromptProps) {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isInstalled, setIsInstalled] = useState(false);
	const [isDismissed, setIsDismissed] = useState(false);

	useEffect(() => {
		// Check if already installed (running in standalone mode)
		const isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			("standalone" in window.navigator &&
				(window.navigator as Navigator & { standalone: boolean }).standalone);

		if (isStandalone) {
			setIsInstalled(true);
			return;
		}

		// Check if user previously dismissed
		const wasDismissed = localStorage.getItem("pwa-install-dismissed");
		if (wasDismissed) {
			setIsDismissed(true);
		}

		// Listen for the beforeinstallprompt event
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
		};

		// Listen for successful installation
		const handleAppInstalled = () => {
			setIsInstalled(true);
			setDeferredPrompt(null);
			onInstalled?.();
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
	}, [onInstalled]);

	const handleInstall = useCallback(async () => {
		if (!deferredPrompt) return;

		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			onInstalled?.();
		}

		setDeferredPrompt(null);
	}, [deferredPrompt, onInstalled]);

	const handleDismiss = useCallback(() => {
		setIsDismissed(true);
		localStorage.setItem("pwa-install-dismissed", "true");
		onDismissed?.();
	}, [onDismissed]);

	// Don't render if installed, dismissed, or not available
	if (isInstalled || isDismissed || !deferredPrompt) {
		return null;
	}

	// Button variant
	if (variant === "button") {
		return (
			<Button
				onClick={handleInstall}
				variant="outline"
				size="sm"
				className={`install-button ${className}`}
			>
				<Download className="mr-2 h-4 w-4" />
				{buttonText}
			</Button>
		);
	}

	// Banner variant (default)
	return (
		<div
			className={`pwa-install-prompt fixed right-0 bottom-0 left-0 z-50 border-t bg-card p-4 shadow-lg ${className}`}
		>
			<div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Download className="h-5 w-5 text-primary" />
					</div>
					<p className="text-muted-foreground text-sm">{description}</p>
				</div>
				<div className="flex items-center gap-2">
					<Button onClick={handleInstall} size="sm">
						{buttonText}
					</Button>
					<Button
						onClick={handleDismiss}
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						aria-label="Dismiss"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

/**
 * Hook to check if the app can be installed
 * Useful for conditionally showing install-related UI
 */
export function useCanInstall(): boolean {
	const [canInstall, setCanInstall] = useState(false);

	useEffect(() => {
		const isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			("standalone" in window.navigator &&
				(window.navigator as Navigator & { standalone: boolean }).standalone);

		if (isStandalone) {
			return;
		}

		const handleBeforeInstallPrompt = () => {
			setCanInstall(true);
		};

		const handleAppInstalled = () => {
			setCanInstall(false);
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

	return canInstall;
}

/**
 * Reset the dismissed state (useful for settings page)
 */
export function resetInstallPrompt(): void {
	localStorage.removeItem("pwa-install-dismissed");
}
