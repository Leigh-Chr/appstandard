/**
 * Login route for AppStandard Tasks
 * Uses shared auth forms from @appstandard/ui with AppConfig context
 */

import { Loader, SignInForm, SignUpForm } from "@appstandard/ui";
import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { APP_CONFIG } from "@/lib/app-config";
import { authClient } from "@/lib/auth-client";
import { loginDefaults, loginSearchSchema } from "@/lib/search-params";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
	validateSearch: zodValidator(loginSearchSchema),
	search: {
		middlewares: [stripSearchParams(loginDefaults)],
	},
	head: () => ({
		meta: [
			{ title: `Sign in - ${APP_CONFIG.appName}` },
			{
				name: "description",
				content: `Sign in or create a ${APP_CONFIG.appName} account to access your synchronized ${APP_CONFIG.appSlug}.`,
			},
			{ property: "og:title", content: `Login - ${APP_CONFIG.appName}` },
			{ property: "og:url", content: `${APP_CONFIG.baseUrl}/login` },
		],
		links: [{ rel: "canonical", href: `${APP_CONFIG.baseUrl}/login` }],
	}),
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = useNavigate();

	const handleSwitchToSignUp = () => {
		navigate({ to: ".", search: { ...search, mode: "signup" } });
	};

	const handleSwitchToSignIn = () => {
		navigate({ to: ".", search: { ...search, mode: "signin" } });
	};

	const navAdapter = (opts: {
		to: string;
		search?: Record<string, string | undefined>;
	}) => navigate(opts);

	return search["mode"] === "signin" ? (
		<SignInForm
			authClient={authClient}
			navigate={navAdapter}
			showBackgroundEffects
			showForgotPassword
			showResendVerification
			onSwitchToSignUp={handleSwitchToSignUp}
			redirectTo={search.redirect}
			loader={<Loader />}
		/>
	) : (
		<SignUpForm
			authClient={authClient}
			navigate={navAdapter}
			showBackgroundEffects
			onSwitchToSignIn={handleSwitchToSignIn}
			redirectTo={search.redirect}
			loader={<Loader />}
		/>
	);
}
