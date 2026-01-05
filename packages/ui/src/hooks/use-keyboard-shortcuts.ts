/**
 * useKeyboardShortcuts - Universal keyboard shortcuts hook
 * Provides consistent keyboard navigation across all AppStandard apps
 *
 * Common shortcuts:
 * - n: Create new item
 * - e: Edit selected item
 * - d/Delete: Delete item
 * - /: Focus search
 * - Escape: Close/Deselect
 * - ↑↓: Navigate list
 * - Space: Toggle selection
 * - g c: Go to main list (calendars/contacts/tasks)
 * - g d: Go to dashboard
 * - ?: Show keyboard shortcuts help
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface KeyboardShortcut {
	/** Key or key combination (e.g., "n", "g c", "Escape") */
	key: string;
	/** Description for help dialog */
	description: string;
	/** Handler function */
	handler: () => void;
	/** Whether this shortcut is currently enabled */
	enabled?: boolean | undefined;
	/** Category for grouping in help dialog */
	category?: string | undefined;
}

export interface UseKeyboardShortcutsOptions {
	/** Enable/disable all shortcuts */
	enabled?: boolean | undefined;
	/** Shortcuts configuration */
	shortcuts: KeyboardShortcut[];
	/** Callback when shortcuts help is requested */
	onShowHelp?: (() => void) | undefined;
}

export interface UseKeyboardShortcutsReturn {
	/** Whether shortcuts are currently active */
	isActive: boolean;
	/** Currently pending prefix key (for multi-key shortcuts) */
	pendingKey: string | null;
	/** Reset pending key state */
	resetPendingKey: () => void;
}

/**
 * Check if an element is an input-like element where shortcuts should be disabled
 */
function isInputElement(element: Element | null): boolean {
	if (!element) return false;
	const tagName = element.tagName.toLowerCase();
	return (
		tagName === "input" ||
		tagName === "textarea" ||
		tagName === "select" ||
		element.getAttribute("contenteditable") === "true" ||
		element.getAttribute("role") === "textbox"
	);
}

/**
 * Normalize a keyboard event to a shortcut key string
 */
function normalizeKey(event: KeyboardEvent): string {
	const parts: string[] = [];

	if (event.ctrlKey || event.metaKey) parts.push("Ctrl");
	if (event.altKey) parts.push("Alt");
	if (event.shiftKey) parts.push("Shift");

	// Normalize key names
	let key = event.key;
	if (key === " ") key = "Space";
	if (key === "ArrowUp") key = "↑";
	if (key === "ArrowDown") key = "↓";
	if (key === "ArrowLeft") key = "←";
	if (key === "ArrowRight") key = "→";

	parts.push(key.length === 1 ? key.toLowerCase() : key);

	return parts.join("+");
}

export function useKeyboardShortcuts({
	enabled = true,
	shortcuts,
	onShowHelp,
}: UseKeyboardShortcutsOptions): UseKeyboardShortcutsReturn {
	const [pendingKey, setPendingKey] = useState<string | null>(null);
	const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const resetPendingKey = useCallback(() => {
		setPendingKey(null);
		if (pendingTimeoutRef.current) {
			clearTimeout(pendingTimeoutRef.current);
			pendingTimeoutRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!enabled) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			// Skip if focus is in an input element
			if (isInputElement(document.activeElement)) {
				// Allow Escape to blur the input
				if (event.key === "Escape") {
					(document.activeElement as HTMLElement)?.blur();
					event.preventDefault();
				}
				return;
			}

			// Skip if a dialog is open (unless it's Escape)
			const hasOpenDialog = document.querySelector(
				'[role="dialog"], [data-state="open"]',
			);
			if (hasOpenDialog && event.key !== "Escape") {
				return;
			}

			const normalizedKey = normalizeKey(event);

			// Handle help shortcut
			if (normalizedKey === "?" && onShowHelp) {
				event.preventDefault();
				onShowHelp();
				return;
			}

			// Handle multi-key shortcuts (e.g., "g c")
			if (pendingKey) {
				const combinedKey = `${pendingKey} ${normalizedKey}`;
				const matchingShortcut = shortcuts.find(
					(s) => s.key === combinedKey && s.enabled !== false,
				);

				if (matchingShortcut) {
					event.preventDefault();
					matchingShortcut.handler();
				}
				resetPendingKey();
				return;
			}

			// Check for exact match first
			const exactMatch = shortcuts.find(
				(s) => s.key === normalizedKey && s.enabled !== false,
			);

			if (exactMatch) {
				event.preventDefault();
				exactMatch.handler();
				return;
			}

			// Check if this could be the start of a multi-key shortcut
			const couldBePrefix = shortcuts.some(
				(s) => s.key.startsWith(`${normalizedKey} `) && s.enabled !== false,
			);

			if (couldBePrefix) {
				event.preventDefault();
				setPendingKey(normalizedKey);

				// Clear pending key after 1.5 seconds
				pendingTimeoutRef.current = setTimeout(() => {
					resetPendingKey();
				}, 1500);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			if (pendingTimeoutRef.current) {
				clearTimeout(pendingTimeoutRef.current);
			}
		};
	}, [enabled, shortcuts, pendingKey, resetPendingKey, onShowHelp]);

	return {
		isActive: enabled,
		pendingKey,
		resetPendingKey,
	};
}

// ============================================================================
// Shortcut Categories
// ============================================================================

export const SHORTCUT_CATEGORIES = {
	NAVIGATION: "Navigation",
	ACTIONS: "Actions",
	SELECTION: "Selection",
	VIEW: "View",
} as const;

// ============================================================================
// Common Shortcut Builders
// ============================================================================

export interface CommonShortcutHandlers {
	onNew?: (() => void) | undefined;
	onEdit?: (() => void) | undefined;
	onDelete?: (() => void) | undefined;
	onSearch?: (() => void) | undefined;
	onEscape?: (() => void) | undefined;
	onNavigateUp?: (() => void) | undefined;
	onNavigateDown?: (() => void) | undefined;
	onToggle?: (() => void) | undefined;
	onGoToList?: (() => void) | undefined;
	onGoToDashboard?: (() => void) | undefined;
	onGoToAccount?: (() => void) | undefined;
	onImport?: (() => void) | undefined;
	onMerge?: (() => void) | undefined;
}

/**
 * Build common shortcuts with provided handlers
 */
export function buildCommonShortcuts(
	handlers: CommonShortcutHandlers,
): KeyboardShortcut[] {
	const shortcuts: KeyboardShortcut[] = [];

	if (handlers.onNew) {
		shortcuts.push({
			key: "n",
			description: "Create new item",
			handler: handlers.onNew,
			category: SHORTCUT_CATEGORIES.ACTIONS,
		});
	}

	if (handlers.onEdit) {
		shortcuts.push({
			key: "e",
			description: "Edit selected item",
			handler: handlers.onEdit,
			category: SHORTCUT_CATEGORIES.ACTIONS,
		});
	}

	if (handlers.onDelete) {
		shortcuts.push(
			{
				key: "d",
				description: "Delete selected item",
				handler: handlers.onDelete,
				category: SHORTCUT_CATEGORIES.ACTIONS,
			},
			{
				key: "Delete",
				description: "Delete selected item",
				handler: handlers.onDelete,
				category: SHORTCUT_CATEGORIES.ACTIONS,
			},
		);
	}

	if (handlers.onSearch) {
		shortcuts.push({
			key: "/",
			description: "Focus search",
			handler: handlers.onSearch,
			category: SHORTCUT_CATEGORIES.NAVIGATION,
		});
	}

	if (handlers.onEscape) {
		shortcuts.push({
			key: "Escape",
			description: "Close / Deselect",
			handler: handlers.onEscape,
			category: SHORTCUT_CATEGORIES.NAVIGATION,
		});
	}

	if (handlers.onNavigateUp) {
		shortcuts.push({
			key: "↑",
			description: "Navigate up",
			handler: handlers.onNavigateUp,
			category: SHORTCUT_CATEGORIES.SELECTION,
		});
	}

	if (handlers.onNavigateDown) {
		shortcuts.push({
			key: "↓",
			description: "Navigate down",
			handler: handlers.onNavigateDown,
			category: SHORTCUT_CATEGORIES.SELECTION,
		});
	}

	if (handlers.onToggle) {
		shortcuts.push({
			key: "Space",
			description: "Toggle selection",
			handler: handlers.onToggle,
			category: SHORTCUT_CATEGORIES.SELECTION,
		});
	}

	if (handlers.onGoToList) {
		shortcuts.push({
			key: "g c",
			description: "Go to main list",
			handler: handlers.onGoToList,
			category: SHORTCUT_CATEGORIES.NAVIGATION,
		});
	}

	if (handlers.onGoToDashboard) {
		shortcuts.push({
			key: "g d",
			description: "Go to dashboard",
			handler: handlers.onGoToDashboard,
			category: SHORTCUT_CATEGORIES.NAVIGATION,
		});
	}

	if (handlers.onGoToAccount) {
		shortcuts.push({
			key: "g a",
			description: "Go to account",
			handler: handlers.onGoToAccount,
			category: SHORTCUT_CATEGORIES.NAVIGATION,
		});
	}

	if (handlers.onImport) {
		shortcuts.push({
			key: "i",
			description: "Import",
			handler: handlers.onImport,
			category: SHORTCUT_CATEGORIES.ACTIONS,
		});
	}

	if (handlers.onMerge) {
		shortcuts.push({
			key: "m",
			description: "Merge duplicates",
			handler: handlers.onMerge,
			category: SHORTCUT_CATEGORIES.ACTIONS,
		});
	}

	return shortcuts;
}

// ============================================================================
// Keyboard Shortcuts Help Dialog Data
// ============================================================================

export interface ShortcutHelpItem {
	key: string;
	description: string;
}

export interface ShortcutHelpCategory {
	name: string;
	shortcuts: ShortcutHelpItem[];
}

/**
 * Group shortcuts by category for display in help dialog
 */
export function groupShortcutsByCategory(
	shortcuts: KeyboardShortcut[],
): ShortcutHelpCategory[] {
	const categoryMap = new Map<string, ShortcutHelpItem[]>();

	for (const shortcut of shortcuts) {
		if (shortcut.enabled === false) continue;

		const category = shortcut.category || "Other";
		const existing = categoryMap.get(category) || [];

		// Avoid duplicates (e.g., both "d" and "Delete" for delete)
		const alreadyHasDescription = existing.some(
			(s) => s.description === shortcut.description,
		);

		if (!alreadyHasDescription) {
			existing.push({
				key: shortcut.key,
				description: shortcut.description,
			});
		}

		categoryMap.set(category, existing);
	}

	// Sort categories in preferred order
	const order = [
		SHORTCUT_CATEGORIES.NAVIGATION,
		SHORTCUT_CATEGORIES.ACTIONS,
		SHORTCUT_CATEGORIES.SELECTION,
		SHORTCUT_CATEGORIES.VIEW,
		"Other",
	];

	return order
		.filter((name) => categoryMap.has(name))
		.map((name) => ({
			name,
			shortcuts: categoryMap.get(name) || [],
		}));
}
