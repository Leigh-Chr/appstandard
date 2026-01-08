import { authClient } from "@appstandard/react-utils";
import { createFileRoute, redirect } from "@tanstack/react-router";

const BASE_URL = "https://contacts.appstandard.io";

export const Route = createFileRoute("/change-password")({
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
