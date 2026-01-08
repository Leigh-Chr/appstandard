/**
 * Offline Banner Component
 * Shows a subtle banner when the user is offline
 */

import { cn } from "@appstandard/react-utils";
import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export interface OfflineBannerProps {
	/** Custom message to display */
	message?: string;
	/** Additional class names */
	className?: string;
}

/**
 * Hook to detect online/offline status
 */
function useOnlineStatus() {
	const [isOnline, setIsOnline] = useState(() =>
		typeof navigator !== "undefined" ? navigator.onLine : true,
	);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return isOnline;
}

/**
 * Banner that appears when the user is offline
 * Automatically hides when back online
 */
export function OfflineBanner({
	message = "You're offline - showing cached data",
	className,
}: OfflineBannerProps) {
	const isOnline = useOnlineStatus();

	if (isOnline) {
		return null;
	}

	return (
		<div
			role="alert"
			aria-live="polite"
			className={cn(
				"flex items-center justify-center gap-2 bg-amber-500/90 px-4 py-2 text-center text-sm text-white",
				className,
			)}
		>
			<WifiOff className="h-4 w-4" aria-hidden="true" />
			<span>{message}</span>
		</div>
	);
}
