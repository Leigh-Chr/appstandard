/**
 * GlobalFeatures - Global keyboard shortcuts for the application
 *
 * Available shortcuts:
 * - Cmd+K : Open command palette
 * - ? : Show keyboard shortcuts help
 * - N : New calendar
 * - I : Import a .ics file
 * - M : Merge calendars
 * - / : Focus search
 * - G D : Go to dashboard
 * - G C : Go to calendars
 * - G A : Go to account
 */

import {
	buildCommonShortcuts,
	groupShortcutsByCategory,
	KeyboardShortcutsDialog,
	OPEN_CREATE_GROUP_EVENT,
	OPEN_KEYBOARD_SHORTCUTS_EVENT,
	useKeyboardShortcuts,
} from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCreateGroupDialog } from "./calendar-list/create-group-dialog";
import { CommandPalette, useCommandPalette } from "./command-palette";
import { CalendarTour, useCalendarTour } from "./tour";

export function GlobalFeatures() {
	const navigate = useNavigate();
	const { open, setOpen } = useCommandPalette();
	const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
	const [showCreateGroup, setShowCreateGroup] = useState(false);
	const { startTour } = useCalendarTour();

	// Listen for custom events from command palette
	useEffect(() => {
		const handleOpenShortcuts = () => setShowShortcutsHelp(true);
		const handleOpenCreateGroup = () => setShowCreateGroup(true);

		window.addEventListener(OPEN_KEYBOARD_SHORTCUTS_EVENT, handleOpenShortcuts);
		window.addEventListener(OPEN_CREATE_GROUP_EVENT, handleOpenCreateGroup);

		return () => {
			window.removeEventListener(
				OPEN_KEYBOARD_SHORTCUTS_EVENT,
				handleOpenShortcuts,
			);
			window.removeEventListener(
				OPEN_CREATE_GROUP_EVENT,
				handleOpenCreateGroup,
			);
		};
	}, []);

	const shortcuts = useMemo(() => {
		// Common shortcuts using the shared builder
		const common = buildCommonShortcuts({
			onNew: () => navigate({ to: "/calendars/new" }),
			onGoToList: () => navigate({ to: "/calendars" }),
			onGoToDashboard: () => navigate({ to: "/dashboard" }),
			onGoToAccount: () => navigate({ to: "/account" }),
			onImport: () => navigate({ to: "/calendars/import" }),
			onMerge: () => navigate({ to: "/calendars/merge" }),
			onSearch: () => {
				const searchInput = document.querySelector<HTMLInputElement>(
					'input[type="search"], input[placeholder*="Search"]',
				);
				if (searchInput) {
					searchInput.focus();
					searchInput.select();
				}
			},
		});

		return common;
	}, [navigate]);

	useKeyboardShortcuts({
		enabled: true,
		shortcuts,
		onShowHelp: () => setShowShortcutsHelp(true),
	});

	const helpCategories = useMemo(
		() => groupShortcutsByCategory(shortcuts),
		[shortcuts],
	);

	return (
		<>
			<CommandPalette
				open={open}
				onOpenChange={setOpen}
				onStartTour={startTour}
			/>
			<KeyboardShortcutsDialog
				open={showShortcutsHelp}
				onOpenChange={setShowShortcutsHelp}
				categories={helpCategories}
				title="Keyboard Shortcuts"
				description="Use these shortcuts to navigate AppStandard Calendar faster."
			/>
			<CalendarCreateGroupDialog
				open={showCreateGroup}
				onOpenChange={setShowCreateGroup}
			/>
			<CalendarTour />
		</>
	);
}
