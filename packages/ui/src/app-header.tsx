/**
 * Shared application header component
 * Uses AppConfig context for app-specific configuration
 */

import { cn, useIsMobile } from "@appstandard/react-utils";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { HelpCircle, Menu, Search } from "lucide-react";
import { useAppConfig } from "./app-context";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import { ModeToggle } from "./mode-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/**
 * Custom event name for opening the command palette
 * Used to decouple the header button from the command palette component
 */
export const OPEN_COMMAND_PALETTE_EVENT = "appstandard:open-command-palette";

/**
 * Custom event name for opening the keyboard shortcuts help dialog
 */
export const OPEN_KEYBOARD_SHORTCUTS_EVENT =
	"appstandard:open-keyboard-shortcuts";

/**
 * Custom event name for opening the create group dialog
 */
export const OPEN_CREATE_GROUP_EVENT = "appstandard:open-create-group";

/**
 * Dispatch event to open the command palette
 * Can be called from anywhere in the app
 */
export function openCommandPalette(): void {
	window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
}

/**
 * Dispatch event to open the keyboard shortcuts help dialog
 * Can be called from anywhere in the app
 */
export function openKeyboardShortcuts(): void {
	window.dispatchEvent(new CustomEvent(OPEN_KEYBOARD_SHORTCUTS_EVENT));
}

/**
 * Dispatch event to open the create group dialog
 * Can be called from anywhere in the app
 */
export function openCreateGroup(): void {
	window.dispatchEvent(new CustomEvent(OPEN_CREATE_GROUP_EVENT));
}

/**
 * Detect if user is on macOS for showing correct modifier key
 */
function useIsMac(): boolean {
	if (typeof window === "undefined") return false;
	return navigator.platform?.toLowerCase().includes("mac") ?? false;
}

export interface AppHeaderProps {
	/** Auth client for session management */
	authClient: {
		useSession: () => { data: { user: { email: string } } | null };
		signOut: (options: { fetchOptions: { onSuccess: () => void } }) => void;
	};
	/** User menu component to render */
	userMenu?: React.ReactNode;
	/** Callback to start the guided tour */
	onStartTour?: (() => void) | undefined;
}

export function AppHeader({
	authClient,
	userMenu,
	onStartTour,
}: AppHeaderProps) {
	const config = useAppConfig();
	const location = useLocation();
	const navigate = useNavigate();
	const isLandingPage = location.pathname === "/";
	const isMobile = useIsMobile();
	const isMac = useIsMac();
	const { data: session } = authClient.useSession();

	const appLinks = [
		{ to: config.mainRoute, label: config.mainLabel },
		{ to: "/dashboard", label: "Dashboard" },
	] as const;

	const Icon = config.appIcon;

	return (
		<header className="header-glow sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
			<div className="container flex items-center justify-between px-4 py-3">
				<Link
					to="/"
					className="logo-animated group flex items-center gap-2.5 rounded-md font-semibold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					aria-label={`${config.appName} - Home`}
				>
					<div className="relative">
						<Icon
							className="logo-icon size-5 text-primary"
							aria-hidden="true"
						/>
						<div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
					</div>
					<span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
						{config.appName}
					</span>
				</Link>

				{isLandingPage ? (
					<>
						{/* Desktop navigation */}
						<nav
							className="hidden items-center gap-8 sm:flex"
							aria-label="Main navigation"
						>
							<Link
								to={config.mainRoute}
								className="rounded-sm font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								{config.mainLabel}
							</Link>
							<Link
								to="/login"
								search={{ mode: "signin" }}
								className="rounded-sm font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								Sign in
							</Link>
							<Button size="sm" asChild>
								<Link to={`${config.mainRoute}/new` as string}>
									Get started
								</Link>
							</Button>
						</nav>

						{/* Mobile menu */}
						<div className="flex items-center gap-2 sm:hidden">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="min-h-[44px] sm:min-h-0"
										aria-label="Menu"
									>
										<Menu className="size-5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									mobileAlign="start"
									className="w-48"
								>
									<DropdownMenuItem asChild>
										<Link to={config.mainRoute}>{config.mainLabel}</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link to={`${config.mainRoute}/import` as string}>
											{config.importLabel}
										</Link>
									</DropdownMenuItem>
									{session && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuLabel>Account</DropdownMenuLabel>
											<DropdownMenuItem disabled>
												{session.user.email}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => {
													authClient.signOut({
														fetchOptions: {
															onSuccess: () => {
																const currentPath = location.pathname;
																if (
																	currentPath.startsWith("/account") ||
																	currentPath.startsWith(
																		config.protectedRoutePrefix,
																	)
																) {
																	navigate({ to: config.mainRoute });
																} else if (currentPath === "/") {
																	navigate({ to: "/" });
																} else {
																	navigate({ to: "/" });
																}
															},
														},
													});
												}}
												className="text-destructive focus:text-destructive"
											>
												Sign out
											</DropdownMenuItem>
										</>
									)}
									{!session && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem asChild>
												<Link to="/login" search={{ mode: "signin" }}>
													Sign in
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link to="/login" search={{ mode: "signup" }}>
													Create an account
												</Link>
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</>
				) : (
					<>
						{/* Desktop navigation */}
						<nav
							className={cn("flex items-center gap-6", isMobile && "hidden")}
							aria-label="Navigation"
						>
							{appLinks.map(({ to, label }) => (
								<Link
									key={to}
									to={to}
									className="rounded-sm font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								>
									{label}
								</Link>
							))}
						</nav>

						{/* Mobile menu for app */}
						{isMobile && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="min-h-[44px] sm:min-h-0"
										aria-label="Menu"
									>
										<Menu className="size-5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									mobileAlign="start"
									className="w-48"
								>
									<DropdownMenuItem asChild>
										<Link to={config.mainRoute}>{config.mainLabel}</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link to="/dashboard">Dashboard</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link to={`${config.mainRoute}/import` as string}>
											{config.importLabel}
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link to={`${config.mainRoute}/new` as string}>
											{config.newLabel}
										</Link>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</>
				)}

				<div className="flex items-center gap-2">
					{/* Search/Command palette button - visible on app pages */}
					{!isLandingPage && (
						<>
							{/* Desktop: Full search button with shortcut hint */}
							<Button
								variant="outline"
								onClick={openCommandPalette}
								className={cn(
									"hidden h-9 gap-2 px-3 text-muted-foreground sm:flex",
									"hover:bg-accent hover:text-accent-foreground",
								)}
								aria-label="Open command palette"
							>
								<Search className="size-4" />
								<span className="text-sm">Search...</span>
								<kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground md:inline-block">
									{isMac ? "⌘" : "Ctrl"}K
								</kbd>
							</Button>
							{/* Mobile: Icon only */}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={openCommandPalette}
										className="min-h-[44px] sm:hidden"
										aria-label="Open command palette"
									>
										<Search className="size-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Search ({isMac ? "⌘" : "Ctrl"}+K)</p>
								</TooltipContent>
							</Tooltip>
						</>
					)}
					{/* Help button - visible on app pages when tour is available */}
					{!isLandingPage && onStartTour && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={onStartTour}
									className="min-h-[44px] sm:min-h-0"
									aria-label="Start guided tour"
								>
									<HelpCircle className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Start guided tour</p>
							</TooltipContent>
						</Tooltip>
					)}
					<ModeToggle />
					{!isLandingPage && userMenu}
					{isLandingPage && <div className="hidden sm:block">{userMenu}</div>}
				</div>
			</div>
		</header>
	);
}
