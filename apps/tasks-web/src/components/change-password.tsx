import { ChangePasswordForm } from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export default function ChangePassword() {
	const navigate = useNavigate();

	return (
		<ChangePasswordForm
			authClient={authClient}
			navigate={navigate}
			showBackgroundEffects={true}
			accountRoute="/account"
		/>
	);
}
