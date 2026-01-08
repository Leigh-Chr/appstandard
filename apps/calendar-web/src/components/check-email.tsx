import { authClient } from "@appstandard/react-utils";
import { CheckEmailPage } from "@appstandard/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";

export default function CheckEmail() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/check-email" });
	const email = (search.email as string | undefined) || "";
	const redirect = (search.redirect as string | undefined) || "";

	return (
		<CheckEmailPage
			authClient={authClient}
			navigate={navigate}
			showBackgroundEffects={true}
			email={email}
			redirect={redirect}
			loginRoute="/login"
			verifyEmailRoute="/verify-email"
			redirectStorageKey="signup_redirect"
		/>
	);
}
