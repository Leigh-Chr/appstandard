import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

const BASE_URL = "https://calendar.appstandard.io";

export const Route = createFileRoute("/edit-profile")({
	head: () => ({
		meta: [
			{ title: "Edit Profile - AppStandard Calendar" },
			{
				name: "description",
				content: "Edit your AppStandard Calendar account profile information.",
			},
			{ property: "og:title", content: "Edit Profile - AppStandard Calendar" },
			{ property: "og:url", content: `${BASE_URL}/edit-profile` },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/edit-profile` }],
	}),
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: { mode: "signin", redirect: "/edit-profile" },
				throw: true,
			});
		}
		return { session };
	},
});
