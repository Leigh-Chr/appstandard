import { VerifyEmailPage } from "@appstandard/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmail() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/verify-email" });
	const error = search.error as string | undefined;
	const redirect = search.redirect as string | undefined;

	return (
		<VerifyEmailPage
			authClient={authClient}
			navigate={navigate}
			showBackgroundEffects={true}
			error={error}
			redirect={redirect}
			loginRoute="/login"
			checkEmailRoute="/check-email"
			homeRoute="/"
			defaultRedirect="/calendars"
			redirectStorageKey="signup_redirect"
		/>
	);
}
