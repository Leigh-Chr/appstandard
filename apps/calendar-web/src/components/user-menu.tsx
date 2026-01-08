import { authClient } from "@appstandard/react-utils";
import { UserMenu as SharedUserMenu } from "@appstandard/ui";

export default function UserMenu() {
	return <SharedUserMenu authClient={authClient} showDashboardLink={true} />;
}
