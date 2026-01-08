import { authClient } from "@appstandard/react-utils";
import { CheckEmailPage } from "@appstandard/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";

export default function CheckEmail() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/check-email" });

	return (
		<CheckEmailPage
			authClient={authClient}
			navigate={navigate}
			email={(search.email as string | undefined) || ""}
			redirect={(search.redirect as string | undefined) || ""}
			icon={<CheckSquare className="size-7 text-primary" />}
			showBackgroundEffects={true}
			loginRoute="/login"
		/>
	);
}
