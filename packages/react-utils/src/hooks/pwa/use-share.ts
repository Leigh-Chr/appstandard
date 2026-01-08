/**
 * Web Share API hook for PWA
 * Provides native sharing capabilities
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
 */

import { useCallback, useMemo } from "react";

export interface ShareData {
	/** Title of the shared content */
	title?: string;
	/** Description text */
	text?: string;
	/** URL to share */
	url?: string;
	/** Files to share (requires canShareFiles check) */
	files?: File[];
}

export interface UseShareReturn {
	/** Whether the Web Share API is supported */
	canShare: boolean;
	/** Whether sharing files is supported */
	canShareFiles: boolean;
	/** Share content using native share dialog. Returns true if successful */
	share: (data: ShareData) => Promise<boolean>;
	/** Check if specific data can be shared */
	checkCanShare: (data: ShareData) => boolean;
}

/**
 * Hook to use the Web Share API
 *
 * @example
 * ```tsx
 * function ShareButton({ calendar }) {
 *   const { canShare, share } = useShare();
 *
 *   const handleShare = async () => {
 *     const success = await share({
 *       title: calendar.name,
 *       text: `Check out my calendar: ${calendar.name}`,
 *       url: `${window.location.origin}/share/${calendar.shareToken}`,
 *     });
 *
 *     if (!success) {
 *       // Fallback to clipboard
 *       await navigator.clipboard.writeText(url);
 *     }
 *   };
 *
 *   return <button onClick={handleShare}>Share</button>;
 * }
 * ```
 */
export function useShare(): UseShareReturn {
	const canShare = useMemo(() => {
		return typeof navigator !== "undefined" && "share" in navigator;
	}, []);

	const canShareFiles = useMemo(() => {
		if (!canShare || !("canShare" in navigator)) {
			return false;
		}
		// Test with a dummy file to check if file sharing is supported
		try {
			const testFile = new File(["test"], "test.txt", { type: "text/plain" });
			return navigator.canShare({ files: [testFile] });
		} catch {
			return false;
		}
	}, [canShare]);

	const checkCanShare = useCallback(
		(data: ShareData): boolean => {
			if (!canShare) {
				return false;
			}
			if (!("canShare" in navigator)) {
				// If canShare method doesn't exist, assume basic sharing works
				return !data.files || data.files.length === 0;
			}
			try {
				return navigator.canShare(data);
			} catch {
				return false;
			}
		},
		[canShare],
	);

	const share = useCallback(
		async (data: ShareData): Promise<boolean> => {
			if (!canShare) {
				return false;
			}

			try {
				await navigator.share(data);
				return true;
			} catch (error) {
				// AbortError means user cancelled - not a failure
				if (error instanceof Error && error.name === "AbortError") {
					return false;
				}
				// Other errors (NotAllowedError, TypeError) indicate actual failures
				console.warn("Share failed:", error);
				return false;
			}
		},
		[canShare],
	);

	return {
		canShare,
		canShareFiles,
		share,
		checkCanShare,
	};
}

/**
 * Share content directly without hook (for use outside components)
 */
export async function shareContent(data: ShareData): Promise<boolean> {
	if (!("share" in navigator)) {
		return false;
	}

	try {
		await navigator.share(data);
		return true;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			return false;
		}
		console.warn("Share failed:", error);
		return false;
	}
}

/**
 * Share a file with automatic fallback
 */
export async function shareFile(
	file: File,
	options?: { title?: string; text?: string },
): Promise<boolean> {
	if (!("share" in navigator) || !("canShare" in navigator)) {
		return false;
	}

	const data = {
		files: [file],
		title: options?.title,
		text: options?.text,
	};

	if (!navigator.canShare(data)) {
		return false;
	}

	try {
		await navigator.share(data);
		return true;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			return false;
		}
		console.warn("Share file failed:", error);
		return false;
	}
}
