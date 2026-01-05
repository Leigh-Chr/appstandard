/**
 * KeyboardShortcutsDialog - Help dialog showing available keyboard shortcuts
 * Consistent shortcut help across all AppStandard apps
 */

import { Keyboard, X } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./dialog";
import type { ShortcutHelpCategory } from "./hooks/use-keyboard-shortcuts";

export interface KeyboardShortcutsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	categories: ShortcutHelpCategory[];
	title?: string | undefined;
	description?: string | undefined;
}

/**
 * Format a shortcut key for display
 */
function formatShortcutKey(key: string): string {
	return key
		.replace("Ctrl+", "Ctrl + ")
		.replace("Alt+", "Alt + ")
		.replace("Shift+", "Shift + ")
		.replace("Space", "Space");
}

/**
 * Render a keyboard key badge
 */
function KeyBadge({ keyStr }: { keyStr: string }) {
	const parts = formatShortcutKey(keyStr).split(" ");

	return (
		<span className="flex items-center gap-1">
			{parts.map((part, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Parts can have duplicates (e.g., "+"), index needed for uniqueness
				<span key={`${part}-${index}`}>
					{part === "+" ? (
						<span className="text-muted-foreground">+</span>
					) : (
						<Badge
							variant="outline"
							className="min-w-[24px] justify-center font-mono text-xs"
						>
							{part}
						</Badge>
					)}
				</span>
			))}
		</span>
	);
}

export function KeyboardShortcutsDialog({
	open,
	onOpenChange,
	categories,
	title = "Keyboard Shortcuts",
	description = "Use these shortcuts to navigate and interact with the application faster.",
}: KeyboardShortcutsDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Keyboard className="h-5 w-5" />
						{title}
					</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{categories.map((category) => (
						<div key={category.name}>
							<h3 className="mb-3 font-medium text-muted-foreground text-sm">
								{category.name}
							</h3>
							<div className="space-y-2">
								{category.shortcuts.map((shortcut) => (
									<div
										key={shortcut.key}
										className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
									>
										<span className="text-sm">{shortcut.description}</span>
										<KeyBadge keyStr={shortcut.key} />
									</div>
								))}
							</div>
						</div>
					))}
				</div>

				<div className="mt-4 flex justify-between border-t pt-4">
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						<KeyBadge keyStr="?" />
						<span>to show this dialog</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
					>
						<X className="mr-1.5 h-4 w-4" />
						Close
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
