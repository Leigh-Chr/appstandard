import { dequal } from "dequal";
import { useEffect, useState } from "react";

export interface UseFormTrackingOptions<T> {
	/** Initial form data to compare against */
	initialData: T | null;
	/** Current form data */
	currentData: T;
	/** Whether to warn on page unload when there are unsaved changes */
	warnOnUnload?: boolean;
	/** Custom unload message (browser may not display this) */
	unloadMessage?: string;
}

export interface UseFormTrackingReturn {
	/** Whether the form has been modified from its initial state */
	hasModifications: boolean;
	/** Alias for hasModifications - whether there are unsaved changes */
	isDirty: boolean;
	/** Reset the modification tracking (call after successful save) */
	resetTracking: () => void;
}

/**
 * Hook to track form modifications and warn on unsaved changes
 *
 * Features:
 * - Deep equality comparison between initial and current data
 * - Optional beforeunload warning for unsaved changes
 * - Reset function for after successful saves
 *
 * @example
 * ```tsx
 * const { hasModifications, resetTracking } = useFormTracking({
 *   initialData: initialFormData,
 *   currentData: formData,
 *   warnOnUnload: mode === "edit",
 * });
 *
 * const handleSubmit = async () => {
 *   await save(formData);
 *   resetTracking();
 * };
 * ```
 */
export function useFormTracking<T>({
	initialData,
	currentData,
	warnOnUnload = true,
	unloadMessage = "You have unsaved changes. Are you sure you want to leave?",
}: UseFormTrackingOptions<T>): UseFormTrackingReturn {
	const [hasModifications, setHasModifications] = useState(false);
	const [savedData, setSavedData] = useState<T | null>(initialData);

	// Track modifications with optimized comparison
	useEffect(() => {
		if (savedData !== null) {
			const modified = !dequal(currentData, savedData);
			setHasModifications(modified);
		}
	}, [currentData, savedData]);

	// Update savedData when initialData changes (e.g., data loaded from server)
	useEffect(() => {
		if (initialData !== null) {
			setSavedData(initialData);
		}
	}, [initialData]);

	// Prevent data loss on page unload
	useEffect(() => {
		if (!warnOnUnload) return;

		const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
			if (hasModifications) {
				e.preventDefault();
				e.returnValue = unloadMessage;
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [hasModifications, warnOnUnload, unloadMessage]);

	const resetTracking = () => {
		setSavedData(currentData);
		setHasModifications(false);
	};

	return {
		hasModifications,
		isDirty: hasModifications,
		resetTracking,
	};
}
