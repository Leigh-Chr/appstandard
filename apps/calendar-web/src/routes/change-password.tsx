import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

const BASE_URL = "https://calendar.appstandard.io";

export const Route = createFileRoute("/change-password")({
	head: () => ({
		meta: [
			{ title: "Change Password - AppStandard Calendar" },
			{
				name: "description",
				content: "Change your AppStandard Calendar account password.",
			},
			{
				property: "og:title",
				content: "Change Password - AppStandard Calendar",
			},
			{ property: "og:url", content: `${BASE_URL}/change-password` },
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
