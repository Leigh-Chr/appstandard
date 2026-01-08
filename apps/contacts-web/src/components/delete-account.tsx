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
				"All your address books and contacts",
				"All your contact groups",
				"All your share links and bundles",
			]}
		/>
	);
}
