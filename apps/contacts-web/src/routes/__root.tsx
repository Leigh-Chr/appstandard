import {
	AppFooter,
	AppHeader,
	AppProvider,
	ErrorBoundary,
	ThemeProvider,
	Toaster,
	TourProvider,
} from "@appstandard/ui";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { GlobalFeatures } from "@/components/global-features";
import { PWAUpdatePrompt } from "@/components/pwa-update-prompt";
import { useContactsTour } from "@/components/tour";
import UserMenu from "@/components/user-menu";
import { APP_CONFIG } from "@/lib/app-config";
import { authClient } from "@/lib/auth-client";
import { logger } from "@/lib/logger";
import type { trpc } from "@/utils/trpc";
import "../index.css";

export interface RouterAppContext {
	trpc: typeof trpc;
	queryClient: QueryClient;
}

const BASE_URL = "https://contacts.appstandard.app";

/**
 * App layout with tour integration
 * Must be inside TourProvider to use the tour hook
 */
function AppLayout() {
	const { startTour } = useContactsTour();
	return (
		<div className="flex min-h-svh flex-col">
			<AppHeader
				authClient={authClient}
				userMenu={<UserMenu />}
				onStartTour={startTour}
			/>
			<main id="main-content" className="flex-1" tabIndex={-1}>
				<Outlet />
			</main>
			<AppFooter />
		</div>
	);
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "AppStandard Contacts - Contact management simplified",
			},
			{
				name: "description",
				content:
					"Free, open-source contact manager. Import, edit, organize your vCard files in seconds. No account required, works offline.",
			},
			// Open Graph
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:url",
				content: BASE_URL,
			},
			{
				property: "og:title",
				content: "AppStandard Contacts - Manage your vCard contacts simply",
			},
			{
				property: "og:description",
				content:
					"Import, create, edit, and organize your vCard contacts in a few clicks. Free and open-source PWA application.",
			},
			{
				property: "og:image",
				content: `${BASE_URL}/og-image.png`,
			},
			{
				property: "og:locale",
				content: "en_US",
			},
			{
				property: "og:site_name",
				content: "AppStandard Contacts",
			},
			// Twitter Card
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "AppStandard Contacts - Manage your vCard contacts simply",
			},
			{
				name: "twitter:description",
				content:
					"Import, create, edit, and organize your vCard contacts in a few clicks. Free and open-source PWA application.",
			},
			{
				name: "twitter:image",
				content: `${BASE_URL}/og-image.png`,
			},
			// Theme
			{
				name: "theme-color",
				content: "#18181b",
			},
		],
		links: [
			{
				rel: "canonical",
				href: BASE_URL,
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				sizes: "48x48",
			},
			{
				rel: "icon",
				href: "/pwa-192x192.png",
				type: "image/png",
				sizes: "192x192",
			},
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon-180x180.png",
			},
		],
	}),
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<AppProvider config={APP_CONFIG}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem={true}
					disableTransitionOnChange
					storageKey="appstandard-contacts-theme"
				>
					{/* Skip to main content link for keyboard navigation */}
					<a
						href="#main-content"
						className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					>
						Skip to main content
					</a>
					<TourProvider storageKeyPrefix="appstandard-contacts-">
						<ErrorBoundary logger={logger}>
							<AppLayout />
						</ErrorBoundary>
						<GlobalFeatures />
					</TourProvider>
					<Toaster richColors />
					<PWAUpdatePrompt />
				</ThemeProvider>
			</AppProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</>
	);
}
