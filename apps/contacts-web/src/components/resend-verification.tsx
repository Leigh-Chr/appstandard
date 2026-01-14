import { authClient } from "@appstandard/react-utils";
import { AppLogo, ResendVerificationForm } from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";

export default function ResendVerification() {
	const navigate = useNavigate();

	return (
		<ResendVerificationForm
			authClient={authClient}
			navigate={navigate}
			icon={<AppLogo className="size-10" />}
			showBackgroundEffects={true}
			loginRoute="/login"
			verifyEmailRoute="/verify-email"
		/>
	);
}
