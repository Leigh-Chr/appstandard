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
	/** UX-004: Number of pending operations in sync queue */
	pendingCount?: number;
	/** Custom message template for pending operations (use {count} placeholder) */
	pendingMessage?: string;
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
 * UX-004: Shows pending sync queue count when operations are waiting
 */
export function OfflineBanner({
	message = "You're offline - showing cached data",
	className,
	pendingCount,
	pendingMessage = "{count} pending change(s) will sync when online",
}: OfflineBannerProps) {
	const isOnline = useOnlineStatus();

	if (isOnline) {
		return null;
	}

	// UX-004: Format pending message with count
	const hasPendingOperations = pendingCount !== undefined && pendingCount > 0;
	const formattedPendingMessage = hasPendingOperations
		? pendingMessage.replace("{count}", String(pendingCount))
		: null;

	return (
		<div
			role="alert"
			aria-live="polite"
			className={cn(
				"flex flex-col items-center justify-center gap-1 bg-amber-500/90 px-4 py-2 text-center text-sm text-white sm:flex-row sm:gap-2",
				className,
			)}
		>
			<div className="flex items-center gap-2">
				<WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
				<span>{message}</span>
			</div>
			{/* UX-004: Show pending operations count */}
			{formattedPendingMessage && (
				<span className="text-white/90 text-xs sm:ml-2 sm:border-white/30 sm:border-l sm:pl-2 sm:text-sm">
					{formattedPendingMessage}
				</span>
			)}
		</div>
	);
}
