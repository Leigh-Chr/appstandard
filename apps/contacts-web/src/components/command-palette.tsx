/**
 * Command Palette - Quick navigation and actions via Cmd+K
 * Inspired by Notion, Linear, Figma
 */

import { authClient } from "@appstandard/react-utils";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
	OPEN_COMMAND_PALETTE_EVENT,
	openCreateGroup,
	openKeyboardShortcuts,
	useTheme,
} from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";
import {
	Contact,
	FileUp,
	Folder,
	GitMerge,
	HelpCircle,
	Keyboard,
	LayoutDashboard,
	Moon,
	Plus,
	Search,
	Settings,
	Sun,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAddressBooks } from "@/hooks/use-address-books";

interface CommandPaletteProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onStartTour?: (() => void) | undefined;
}

type CommandAction = {
	id: string;
	label: string;
	icon: React.ReactNode;
	shortcut?: string;
	action: () => void;
	keywords?: string[];
	group: "navigation" | "actions" | "addressBooks" | "settings";
};

export function CommandPalette({
	open,
	onOpenChange,
	onStartTour,
}: CommandPaletteProps) {
	const navigate = useNavigate();
	const { addressBooks } = useAddressBooks();
	const { theme, setTheme } = useTheme();
	const { data: session } = authClient.useSession();
	const [search, setSearch] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	// Reset search when closing
	useEffect(() => {
		if (!open) {
			setSearch("");
		}
	}, [open]);

	const closeAndNavigate = useCallback(
		(to: string) => {
			onOpenChange(false);
			navigate({ to });
		},
		[navigate, onOpenChange],
	);

	const closeAndAction = useCallback(
		(action: () => void) => {
			onOpenChange(false);
			action();
		},
		[onOpenChange],
	);

	// Define all available commands
	const commands: CommandAction[] = useMemo(
		() => [
			// Navigation
			{
				id: "contacts",
				label: "My contacts",
				icon: <Contact className="h-4 w-4" />,
				shortcut: "G B",
				action: () => closeAndNavigate("/contacts"),
				keywords: ["contacts", "list", "address", "book"],
				group: "navigation",
			},
			// Actions
			{
				id: "new-address-book",
				label: "New address book",
				icon: <Plus className="h-4 w-4" />,
				shortcut: "N",
				action: () => closeAndNavigate("/contacts/new"),
				keywords: ["new", "create", "address", "book"],
				group: "actions",
			},
			{
				id: "import",
				label: "Import contacts",
				icon: <FileUp className="h-4 w-4" />,
				shortcut: "I",
				action: () => closeAndNavigate("/contacts/import"),
				keywords: ["import", "vcard", "vcf", "file", "upload"],
				group: "actions",
			},
			{
				id: "merge",
				label: "Merge address books",
				icon: <GitMerge className="h-4 w-4" />,
				shortcut: "M",
				action: () => closeAndNavigate("/contacts/merge"),
				keywords: ["merge", "combine", "contacts"],
				group: "actions",
			},
			{
				id: "create-group",
				label: "Create group",
				icon: <Folder className="h-4 w-4" />,
				shortcut: "G G",
				action: () => closeAndAction(openCreateGroup),
				keywords: ["group", "folder", "organize", "create"],
				group: "actions",
			},

			// Settings
			...(session
				? [
						{
							id: "dashboard",
							label: "Dashboard",
							icon: <LayoutDashboard className="h-4 w-4" />,
							shortcut: "G D",
							action: () => closeAndNavigate("/dashboard"),
							keywords: [
								"dashboard",
								"analytics",
								"stats",
								"overview",
								"insights",
							],
							group: "navigation" as const,
						},
						{
							id: "account",
							label: "Account settings",
							icon: <Settings className="h-4 w-4" />,
							shortcut: "G A",
							action: () => closeAndNavigate("/account"),
							keywords: [
								"account",
								"settings",
								"profile",
								"user",
								"password",
								"delete",
							],
							group: "settings" as const,
						},
					]
				: []),
			{
				id: "toggle-theme",
				label: theme === "dark" ? "Light mode" : "Dark mode",
				icon:
					theme === "dark" ? (
						<Sun className="h-4 w-4" />
					) : (
						<Moon className="h-4 w-4" />
					),
				action: () =>
					closeAndAction(() => setTheme(theme === "dark" ? "light" : "dark")),
				keywords: ["theme", "dark", "light", "mode"],
				group: "settings",
			},
			{
				id: "keyboard-shortcuts",
				label: "Keyboard shortcuts",
				icon: <Keyboard className="h-4 w-4" />,
				shortcut: "?",
				action: () => closeAndAction(openKeyboardShortcuts),
				keywords: ["keyboard", "shortcuts", "help", "keys", "hotkeys"],
				group: "settings",
			},
			...(onStartTour
				? [
						{
							id: "start-tour",
							label: "Start guided tour",
							icon: <HelpCircle className="h-4 w-4" />,
							action: () => closeAndAction(onStartTour),
							keywords: ["tour", "guide", "help", "onboarding", "tutorial"],
							group: "settings" as const,
						},
					]
				: []),

			// Individual address books
			...addressBooks.map((addressBook) => ({
				id: `addressBook-${addressBook.id}`,
				label: addressBook.name,
				icon: (
					<div
						className="h-3 w-3 rounded-full"
						style={{ backgroundColor: addressBook.color || "#3B82F6" }}
					/>
				),
				action: () => closeAndNavigate(`/contacts/${addressBook.id}`),
				keywords: [
					addressBook.name.toLowerCase(),
					"contact",
					"address",
					"book",
				],
				group: "addressBooks" as const,
			})),
		],
		[
			addressBooks,
			theme,
			closeAndNavigate,
			closeAndAction,
			setTheme,
			session,
			onStartTour,
		],
	);

	// Group commands
	const navigationCommands = commands.filter((c) => c.group === "navigation");
	const actionCommands = commands.filter((c) => c.group === "actions");
	const addressBookCommands = commands.filter(
		(c) => c.group === "addressBooks",
	);
	const settingsCommands = commands.filter((c) => c.group === "settings");

	return (
		<CommandDialog open={open} onOpenChange={onOpenChange}>
			<CommandInput
				ref={inputRef}
				placeholder="Search or type a command..."
				value={search}
				onValueChange={setSearch}
			/>
			<CommandList>
				<CommandEmpty>
					<div className="py-6 text-center">
						<Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
						<p className="text-muted-foreground text-sm">
							No results for "{search}"
						</p>
					</div>
				</CommandEmpty>

				{/* Quick actions */}
				{actionCommands.length > 0 && (
					<CommandGroup heading="Quick actions">
						{actionCommands.map((command) => (
							<CommandItem
								key={command.id}
								value={`${command.label} ${command.keywords?.join(" ")}`}
								onSelect={command.action}
							>
								{command.icon}
								<span className="ml-2">{command.label}</span>
								{command.shortcut && (
									<CommandShortcut>{command.shortcut}</CommandShortcut>
								)}
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{/* Address Books */}
				{addressBookCommands.length > 0 && (
					<>
						<CommandSeparator />
						<CommandGroup heading="Address Books">
							{addressBookCommands.map((command) => (
								<CommandItem
									key={command.id}
									value={`${command.label} ${command.keywords?.join(" ")}`}
									onSelect={command.action}
								>
									{command.icon}
									<span className="ml-2">{command.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</>
				)}

				{/* Navigation */}
				<CommandSeparator />
				<CommandGroup heading="Navigation">
					{navigationCommands.map((command) => (
						<CommandItem
							key={command.id}
							value={`${command.label} ${command.keywords?.join(" ")}`}
							onSelect={command.action}
						>
							{command.icon}
							<span className="ml-2">{command.label}</span>
							{command.shortcut && (
								<CommandShortcut>{command.shortcut}</CommandShortcut>
							)}
						</CommandItem>
					))}
				</CommandGroup>

				{/* Settings */}
				<CommandSeparator />
				<CommandGroup heading="Settings">
					{settingsCommands.map((command) => (
						<CommandItem
							key={command.id}
							value={`${command.label} ${command.keywords?.join(" ")}`}
							onSelect={command.action}
						>
							{command.icon}
							<span className="ml-2">{command.label}</span>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>

			{/* Footer with help */}
			<div className="border-t px-3 py-2">
				<div className="flex flex-col items-start justify-between gap-2 text-muted-foreground text-xs sm:flex-row sm:items-center sm:gap-0">
					<div className="flex flex-wrap items-center gap-2 sm:gap-3">
						<span>
							<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
								↑↓
							</kbd>{" "}
							navigate
						</span>
						<span>
							<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
								↵
							</kbd>{" "}
							select
						</span>
						<span>
							<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
								esc
							</kbd>{" "}
							close
						</span>
					</div>
				</div>
			</div>
		</CommandDialog>
	);
}

/**
 * Hook to open/close the Command Palette
 * Listens for both Cmd+K keyboard shortcut and custom event from header button
 */
export function useCommandPalette() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const down = (e: KeyboardEvent): void => {
			// Cmd+K or Ctrl+K
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		// Listen for custom event from header search button
		const handleOpenEvent = () => {
			setOpen(true);
		};

		document.addEventListener("keydown", down);
		window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);

		return () => {
			document.removeEventListener("keydown", down);
			window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
		};
	}, []);

	return { open, setOpen };
}
