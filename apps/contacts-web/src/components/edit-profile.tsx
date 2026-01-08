import { authClient } from "@appstandard/react-utils";
import { EditProfileForm } from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";

export default function EditProfile() {
	const navigate = useNavigate();

	return (
		<EditProfileForm
			authClient={authClient}
			navigate={navigate}
			showBackgroundEffects={true}
			accountRoute="/account"
		/>
	);
}
