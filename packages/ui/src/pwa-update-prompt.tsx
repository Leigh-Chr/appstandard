/**
 * PWA Update Prompt component
 * Handles service worker updates and offline readiness notifications
 * This is a UI wrapper - actual SW registration happens in each app
 */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface PWALogger {
	error: (message: string, error?: unknown) => void;
}

export interface RegisterSWOptions {
	immediate?: boolean | undefined;
	onRegisteredSW?: (
		swUrl: string,
		registration?: ServiceWorkerRegistration,
	) => void;
	onNeedRefresh?: () => void;
	onOfflineReady?: () => void;
	onRegisterError?: (error: Error) => void;
}

export type RegisterSWFunction = (options: RegisterSWOptions) => void;

export interface PWAUpdatePromptProps {
	/** Optional logger for error reporting */
	logger?: PWALogger | undefined;
	/** Update check interval in milliseconds (default: 1 hour) */
	updateInterval?: number | undefined;
	/** Service worker registration function (from virtual:pwa-register) */
	registerSW?: RegisterSWFunction | undefined;
}

/**
 * PWA Update Prompt component that shows toast notifications for SW updates
 * If registerSW is not provided, falls back to native navigator.serviceWorker
 */
export function PWAUpdatePrompt({
	logger,
	updateInterval = 60 * 60 * 1000,
	registerSW: registerSWProp,
}: PWAUpdatePromptProps = {}) {
	const [registration, setRegistration] =
		useState<ServiceWorkerRegistration | null>(null);
	const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
		null,
	);
	const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		// If registerSW is provided (from virtual:pwa-register), use it
		if (registerSWProp) {
			registerSWProp({
				immediate: true,
				onRegisteredSW(_swUrl: string, r?: ServiceWorkerRegistration) {
					if (r) {
						setRegistration(r);
						updateIntervalRef.current = setInterval(() => {
							r.update();
						}, updateInterval);
					}
				},
				onNeedRefresh() {
					toast.info("New version available", {
						description: "An update is available. Click to refresh.",
						duration: Number.POSITIVE_INFINITY,
						action: {
							label: "Refresh",
							onClick: () => {
								if (waitingWorker) {
									waitingWorker.postMessage({ type: "SKIP_WAITING" });
								}
								window.location.reload();
							},
						},
					});
				},
				onOfflineReady() {
					toast.success("Application ready", {
						description: "The application is ready to work offline.",
						duration: 4000,
					});
				},
				onRegisterError(error: Error) {
					logger?.error("SW registration error", error);
				},
			});
		} else {
			// Fallback: use native service worker API
			const setupNativeServiceWorker = async () => {
				if (!("serviceWorker" in navigator)) {
					return;
				}

				try {
					const r = await navigator.serviceWorker.ready;
					setRegistration(r);

					// Check for updates periodically
					updateIntervalRef.current = setInterval(() => {
						r.update();
					}, updateInterval);
				} catch (error) {
					logger?.error("Failed to get service worker", error);
				}
			};

			setupNativeServiceWorker();
		}

		// Listen for controllerchange to reload when new SW takes over
		const handleControllerChange = (): void => {
			window.location.reload();
		};

		navigator.serviceWorker?.addEventListener(
			"controllerchange",
			handleControllerChange,
		);

		return () => {
			if (updateIntervalRef.current) {
				clearInterval(updateIntervalRef.current);
				updateIntervalRef.current = null;
			}
			navigator.serviceWorker?.removeEventListener(
				"controllerchange",
				handleControllerChange,
			);
		};
	}, [waitingWorker, updateInterval, logger, registerSWProp]);

	// Listen for waiting service worker
	useEffect(() => {
		if (registration) {
			const handleStateChange = (): void => {
				if (registration.waiting) {
					setWaitingWorker(registration.waiting);
				}
			};

			registration.addEventListener("updatefound", () => {
				const newWorker = registration.installing;
				if (newWorker) {
					newWorker.addEventListener("statechange", handleStateChange);
				}
			});

			// Check if there's already a waiting worker
			if (registration.waiting) {
				setWaitingWorker(registration.waiting);
			}
		}
	}, [registration]);

	return null; // This component renders nothing, uses toast for UI
}

/**
 * Manual update check function
 * Can be used to trigger an update check programmatically
 */
export async function checkForPWAUpdates(): Promise<void> {
	const registrations = await navigator.serviceWorker?.getRegistrations();
	if (registrations) {
		for (const registration of registrations) {
			await registration.update();
		}
	}
}
