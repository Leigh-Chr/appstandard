import { EditProfileForm } from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

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
