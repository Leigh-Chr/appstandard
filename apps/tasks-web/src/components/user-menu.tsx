import { UserMenu as SharedUserMenu } from "@appstandard/ui";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
	return <SharedUserMenu authClient={authClient} />;
}
