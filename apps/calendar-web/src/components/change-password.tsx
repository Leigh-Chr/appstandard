import { authClient } from "@appstandard/react-utils";
import { ChangePasswordForm } from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";

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
