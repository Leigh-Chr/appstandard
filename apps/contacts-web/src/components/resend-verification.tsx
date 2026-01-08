import { authClient } from "@appstandard/react-utils";
import { ResendVerificationForm } from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";

export default function ResendVerification() {
	const navigate = useNavigate();

	return (
		<ResendVerificationForm
			authClient={authClient}
			navigate={navigate}
			icon={<Users className="size-7 text-primary" />}
			showBackgroundEffects={true}
			loginRoute="/login"
			verifyEmailRoute="/verify-email"
		/>
	);
}
