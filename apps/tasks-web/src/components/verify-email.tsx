import { authClient } from "@appstandard/react-utils";
import { VerifyEmailPage } from "@appstandard/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";

export default function VerifyEmail() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/verify-email" });

	return (
		<VerifyEmailPage
			authClient={authClient}
			navigate={navigate}
			error={search.error as string | undefined}
			redirect={search.redirect as string | undefined}
			showBackgroundEffects={true}
			defaultRedirect="/tasks"
			loginRoute="/login"
			checkEmailRoute="/check-email"
			homeRoute="/"
		/>
	);
}
