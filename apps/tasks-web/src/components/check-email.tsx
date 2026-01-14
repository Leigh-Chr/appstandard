import { authClient } from "@appstandard/react-utils";
import { AppLogo, CheckEmailPage } from "@appstandard/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";

export default function CheckEmail() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/check-email" });

	return (
		<CheckEmailPage
			authClient={authClient}
			navigate={navigate}
			email={(search.email as string | undefined) || ""}
			redirect={(search.redirect as string | undefined) || ""}
			icon={<AppLogo className="size-10" />}
			showBackgroundEffects={true}
			loginRoute="/login"
		/>
	);
}
