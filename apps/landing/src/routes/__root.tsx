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
import {
	Calendar,
	Contact,
	ExternalLink,
	Github,
	Heart,
	Layers,
	ListChecks,
	Menu,
	Shield,
} from "lucide-react";
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
		<header className="header-glow sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
			<div className="container flex items-center justify-between px-4 py-3">
				{/* Logo */}
				<Link
					to="/"
					className="logo-animated group flex items-center gap-2.5 rounded-md font-semibold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					aria-label="AppStandard - Home"
				>
					<div className="relative">
						<Layers
							className="logo-icon size-5 text-primary"
							aria-hidden="true"
						/>
						<div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
					</div>
					<span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
						AppStandard
					</span>
				</Link>

				{/* Desktop navigation */}
				<nav
					className="hidden items-center gap-6 md:flex"
					aria-label="Main navigation"
				>
					<a
						href={CALENDAR_URL}
						className="flex items-center gap-2 rounded-sm font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<Calendar className="size-4" aria-hidden="true" />
						Calendar
					</a>
					<a
						href={TASKS_URL}
						className="flex items-center gap-2 rounded-sm font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<ListChecks className="size-4" aria-hidden="true" />
						Tasks
					</a>
					<a
						href={CONTACTS_URL}
						className="flex items-center gap-2 rounded-sm font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<Contact className="size-4" aria-hidden="true" />
						Contacts
					</a>
					<div className="mx-2 h-4 w-px bg-border" />
					<a
						href={GITHUB_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 rounded-sm font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<Github className="size-4" aria-hidden="true" />
						GitHub
					</a>
				</nav>

				{/* Right side actions */}
				<div className="flex items-center gap-2">
					<ModeToggle />

					{/* Mobile menu */}
					<div className="md:hidden">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="min-h-[44px] min-w-[44px]"
									aria-label="Open menu"
								>
									<Menu className="size-5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuItem asChild>
									<a href={CALENDAR_URL} className="flex items-center gap-2">
										<Calendar className="size-4" aria-hidden="true" />
										Calendar
									</a>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<a href={TASKS_URL} className="flex items-center gap-2">
										<ListChecks className="size-4" aria-hidden="true" />
										Tasks
										<span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
											Soon
										</span>
									</a>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<a href={CONTACTS_URL} className="flex items-center gap-2">
										<Contact className="size-4" aria-hidden="true" />
										Contacts
										<span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
											Soon
										</span>
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
										<ExternalLink
											className="ml-auto size-3 text-muted-foreground"
											aria-hidden="true"
										/>
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
		<footer className="border-t bg-muted/30">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					{/* Brand section */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Layers className="size-5 text-primary" aria-hidden="true" />
							<p className="font-semibold text-base">AppStandard</p>
						</div>
						<p className="text-muted-foreground text-sm">
							Open-source productivity apps for calendars, contacts, and tasks.
							Free forever, privacy first.
						</p>
						<p className="mt-3 text-muted-foreground text-xs">
							Enjoying AppStandard?{" "}
							<a
								href="https://ko-fi.com/leigh_chr"
								target="_blank"
								rel="noopener noreferrer"
								className="font-medium text-primary hover:underline"
							>
								Support the project
								<span className="sr-only"> (opens in new tab)</span>
							</a>
						</p>
					</div>

					{/* Apps section */}
					<div className="space-y-3">
						<p className="font-semibold text-base">Apps</p>
						<ul className="space-y-2">
							<li>
								<a
									href={CALENDAR_URL}
									className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									<Calendar className="h-4 w-4" aria-hidden="true" />
									Calendar
								</a>
							</li>
							<li>
								<a
									href={TASKS_URL}
									className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									<ListChecks className="h-4 w-4" aria-hidden="true" />
									Tasks
								</a>
							</li>
							<li>
								<a
									href={CONTACTS_URL}
									className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									<Contact className="h-4 w-4" aria-hidden="true" />
									Contacts
								</a>
							</li>
						</ul>
					</div>

					{/* Legal & Links section */}
					<div className="space-y-3">
						<p className="font-semibold text-base">Legal & Links</p>
						<ul className="space-y-2">
							<li>
								<a
									href={GITHUB_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									<Github className="h-4 w-4" aria-hidden="true" />
									GitHub
									<span className="sr-only">(opens in new tab)</span>
								</a>
							</li>
							<li>
								<a
									href="https://ko-fi.com/leigh_chr"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-primary"
								>
									<Heart
										className="h-4 w-4 fill-current text-primary/70"
										aria-hidden="true"
									/>
									Support on Ko-fi
									<span className="sr-only">(opens in new tab)</span>
								</a>
							</li>
							<li>
								<a
									href={`${GITHUB_URL}/blob/master/LICENSE`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									License
									<span className="sr-only"> (opens in new tab)</span>
								</a>
							</li>
							<li>
								<Link
									to="/privacy"
									className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									<Shield className="h-4 w-4" aria-hidden="true" />
									Privacy Policy
								</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* Copyright */}
				<div className="mt-8 border-t pt-6 text-center">
					<p className="text-muted-foreground text-sm">
						© {currentYear} AppStandard. Open source and free to use.
					</p>
				</div>
			</div>
		</footer>
	);
}
