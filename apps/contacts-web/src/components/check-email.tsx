import { CheckEmailPage } from "@appstandard/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function CheckEmail() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/check-email" });

	return (
		<CheckEmailPage
			authClient={authClient}
			navigate={navigate}
			email={(search.email as string | undefined) || ""}
			redirect={(search.redirect as string | undefined) || ""}
			icon={<Users className="size-7 text-primary" />}
			showBackgroundEffects={true}
			loginRoute="/login"
		/>
	);
}
