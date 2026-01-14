import { authClient } from "@appstandard/react-utils";
import { AppLogo, ForgotPasswordForm } from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";

export default function ForgotPassword() {
	const navigate = useNavigate();

	return (
		<ForgotPasswordForm
			authClient={authClient}
			navigate={navigate}
			icon={<AppLogo className="size-10" />}
			showBackgroundEffects={true}
			loginRoute="/login"
		/>
	);
}
