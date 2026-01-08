import { authClient } from "@appstandard/react-utils";
import { DeleteAccountForm } from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";

export default function DeleteAccount() {
	const navigate = useNavigate();

	return (
		<DeleteAccountForm
			authClient={authClient}
			navigate={navigate}
			showBackgroundEffects={true}
			accountRoute="/account"
			homeRoute="/"
			warningItems={[
				"Your account and profile information",
				"All your calendars and events",
				"All your calendar groups",
				"All your share links and bundles",
			]}
		/>
	);
}
