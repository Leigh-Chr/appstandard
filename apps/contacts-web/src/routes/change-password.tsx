import { createFileRoute, redirect } from "@tanstack/react-router";
import ChangePassword from "@/components/change-password";
import { authClient } from "@/lib/auth-client";

const BASE_URL = "https://contacts.appstandard.app";

export const Route = createFileRoute("/change-password")({
	component: ChangePassword,
	head: () => ({
		meta: [
			{ title: "Change Password - AppStandard Contacts" },
			{
				name: "description",
				content: "Change your AppStandard Contacts account password.",
			},
			{
				property: "og:title",
				content: "Change Password - AppStandard Contacts",
			},
			{ property: "og:url", content: `${BASE_URL}/change-password` },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/change-password` }],
	}),
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: { mode: "signin", redirect: "/change-password" },
				throw: true,
			});
		}
		return { session };
	},
});
