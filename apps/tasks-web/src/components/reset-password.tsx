import { authClient } from "@appstandard/react-utils";
import { ResetPasswordForm } from "@appstandard/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";

export default function ResetPassword() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/reset-password" });

	return (
		<ResetPasswordForm
			authClient={authClient}
			navigate={navigate}
			token={(search.token as string | undefined) || ""}
			error={(search.error as string | undefined) || ""}
			showBackgroundEffects={true}
			loginRoute="/login"
			forgotPasswordRoute="/forgot-password"
		/>
	);
}
