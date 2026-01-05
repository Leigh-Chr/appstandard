import { ResendVerificationForm } from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function ResendVerification() {
	const navigate = useNavigate();

	return (
		<ResendVerificationForm
			authClient={authClient}
			navigate={navigate}
			icon={<Calendar className="size-7 text-primary" />}
			showBackgroundEffects={true}
			loginRoute="/login"
			verifyEmailRoute="/verify-email"
		/>
	);
}
