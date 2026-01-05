/**
 * PWA Update Prompt for Tasks app
 * Uses the shared PWAUpdatePrompt from @appstandard/ui with app-specific logger
 */

import {
	PWAUpdatePrompt as BasePWAUpdatePrompt,
	checkForPWAUpdates,
	type RegisterSWFunction,
} from "@appstandard/ui";
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

export function PWAUpdatePrompt() {
	const [registerSW, setRegisterSW] = useState<RegisterSWFunction | undefined>(
		undefined,
	);

	useEffect(() => {
		// Dynamically import the virtual module to get the registerSW function
		import("virtual:pwa-register")
			.then((mod) => {
				setRegisterSW(() => mod.registerSW);
			})
			.catch(() => {
				// PWA not available in dev mode or not configured
			});
	}, []);

	return <BasePWAUpdatePrompt logger={logger} registerSW={registerSW} />;
}

// Re-export for backwards compatibility
export { checkForPWAUpdates as checkForUpdates };
