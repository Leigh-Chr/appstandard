import { authClient } from "@appstandard/react-utils";
import { ResetPasswordForm } from "@appstandard/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";

export default function ResetPassword() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/reset-password" });
	const token = (search.token as string | undefined) || "";
	const error = (search.error as string | undefined) || "";

	return (
		<ResetPasswordForm
			authClient={authClient}
			navigate={navigate}
			showBackgroundEffects={true}
			token={token}
			error={error}
			loginRoute="/login"
			forgotPasswordRoute="/forgot-password"
		/>
	);
}
