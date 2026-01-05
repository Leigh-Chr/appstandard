import { ForgotPasswordForm } from "@appstandard/ui";
import { useNavigate } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPassword() {
	const navigate = useNavigate();

	return (
		<ForgotPasswordForm
			authClient={authClient}
			navigate={navigate}
			icon={<Calendar className="size-7 text-primary" />}
			showBackgroundEffects={true}
			loginRoute="/login"
		/>
	);
}
