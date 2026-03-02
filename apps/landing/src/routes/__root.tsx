import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	ModeToggle,
	ThemeProvider,
} from "@appstandard/ui";
import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
} from "@tanstack/react-router";
import { Github, Menu } from "lucide-react";
import "../index.css";

const BASE_URL = "https://www.appstandard.io";
const GITHUB_URL = "https://github.com/Leigh-Chr/appstandard";

// Environment-aware URLs - use subdomains in production
const isDev = import.meta.env["DEV"];
const CALENDAR_URL = isDev
	? "http://localhost:3001"
	: "https://calendar.appstandard.io";
const TASKS_URL = isDev
	? "http://localhost:3004"
	: "https://tasks.appstandard.io";
const CONTACTS_URL = isDev
	? "http://localhost:3005"
	: "https://contacts.appstandard.io";

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "AppStandard - Open Source Productivity Apps",
			},
			{
				name: "description",
				content:
					"AppStandard - Free, open-source productivity apps for calendars, contacts, and tasks. Privacy-focused and works offline.",
			},
			{ property: "og:type", content: "website" },
			{ property: "og:url", content: BASE_URL },
			{
				property: "og:title",
				content: "AppStandard - Open Source Productivity Apps",
			},
			{
				property: "og:description",
				content:
					"Free, open-source productivity apps for calendars, contacts, and tasks. Privacy-focused and works offline.",
			},
			{ property: "og:locale", content: "en_US" },
			{ property: "og:site_name", content: "AppStandard" },
			{ name: "twitter:card", content: "summary_large_image" },
			{
				name: "twitter:title",
				content: "AppStandard - Open Source Productivity Apps",
			},
			{
				name: "twitter:description",
				content:
					"Free, open-source productivity apps for calendars, contacts, and tasks. Privacy-focused and works offline.",
			},
			{ name: "theme-color", content: "#18181b" },
		],
		links: [{ rel: "canonical", href: BASE_URL }],
		scripts: [
			{
				type: "application/ld+json",
				children: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "Organization",
					name: "AppStandard",
					url: BASE_URL,
					description:
						"Open-source productivity apps for calendars, contacts, and tasks. Free forever, privacy first.",
					sameAs: [GITHUB_URL],
				}),
			},
		],
	}),
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem={true}
				disableTransitionOnChange
				storageKey="appstandard-theme"
			>
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				>
					Skip to main content
				</a>
				<div className="flex min-h-svh flex-col">
					<Header />
					<main id="main-content" className="flex-1" tabIndex={-1}>
						<Outlet />
					</main>
					<Footer />
				</div>
			</ThemeProvider>
		</>
	);
}

function Header() {
	return (
		<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
			<div className="flex items-center justify-between py-3 content-column">
				<Link
					to="/"
					className="flex items-center gap-2 rounded-md font-semibold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					aria-label="AppStandard - Home"
				>
					<img src="/logo.png" alt="" className="size-7" aria-hidden="true" />
					<span>AppStandard</span>
				</Link>

				<nav
					className="hidden items-center gap-6 md:flex"
					aria-label="Main navigation"
				>
					<a
						href={CALENDAR_URL}
						className="flex items-center gap-2 rounded-sm text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<img
							src="/calendar-icon.png"
							alt=""
							className="size-5"
							aria-hidden="true"
						/>
						Calendar
					</a>
					<a
						href={TASKS_URL}
						className="flex items-center gap-2 rounded-sm text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<img
							src="/tasks-icon.png"
							alt=""
							className="size-5"
							aria-hidden="true"
						/>
						Tasks
					</a>
					<a
						href={CONTACTS_URL}
						className="flex items-center gap-2 rounded-sm text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<img
							src="/contacts-icon.png"
							alt=""
							className="size-5"
							aria-hidden="true"
						/>
						Contacts
					</a>
					<div className="mx-2 h-4 w-px bg-border" />
					<a
						href={GITHUB_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 rounded-sm text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<Github className="size-4" aria-hidden="true" />
						GitHub
					</a>
				</nav>

				<div className="flex items-center gap-2">
					<ModeToggle />

					<div className="md:hidden">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Open menu">
									<Menu className="size-5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem asChild>
									<a href={CALENDAR_URL} className="flex items-center gap-2">
										<img
											src="/calendar-icon.png"
											alt=""
											className="size-5"
											aria-hidden="true"
										/>
										Calendar
									</a>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<a href={TASKS_URL} className="flex items-center gap-2">
										<img
											src="/tasks-icon.png"
											alt=""
											className="size-5"
											aria-hidden="true"
										/>
										Tasks
									</a>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<a href={CONTACTS_URL} className="flex items-center gap-2">
										<img
											src="/contacts-icon.png"
											alt=""
											className="size-5"
											aria-hidden="true"
										/>
										Contacts
									</a>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<a
										href={GITHUB_URL}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2"
									>
										<Github className="size-4" aria-hidden="true" />
										GitHub
									</a>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</header>
	);
}

function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-t">
			<div className="py-8 content-column">
				<div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
					<div className="max-w-sm">
						<div className="mb-2 flex items-center gap-2">
							<img
								src="/logo.png"
								alt=""
								className="size-5"
								aria-hidden="true"
							/>
							<p className="font-medium text-sm">AppStandard</p>
						</div>
						<p className="text-muted-foreground text-sm">
							Open-source productivity apps. Free forever, privacy first.
						</p>
					</div>

					<nav
						className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
						aria-label="Footer navigation"
					>
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							GitHub<span className="sr-only"> (opens in new tab)</span>
						</a>
						<Link
							to="/privacy"
							className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							Privacy
						</Link>
						<a
							href={`${GITHUB_URL}/blob/master/LICENSE`}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							License<span className="sr-only"> (opens in new tab)</span>
						</a>
						<a
							href="https://ko-fi.com/leigh_chr"
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							Support<span className="sr-only"> (opens in new tab)</span>
						</a>
					</nav>
				</div>

				<div className="mt-6 border-t pt-4">
					<p className="text-muted-foreground text-xs">
						© {currentYear} AppStandard
					</p>
				</div>
			</div>
		</footer>
	);
}
