import { authClient } from "@appstandard/react-utils";
import { createFileRoute, redirect } from "@tanstack/react-router";

const BASE_URL = "https://tasks.appstandard.io";

export const Route = createFileRoute("/edit-profile")({
	head: () => ({
		meta: [
			{ title: "Edit Profile - AppStandard Tasks" },
			{
				name: "description",
				content: "Edit your AppStandard Tasks account profile information.",
			},
			{ property: "og:title", content: "Edit Profile - AppStandard Tasks" },
			{ property: "og:url", content: `${BASE_URL}/edit-profile` },
			{ name: "robots", content: "noindex, nofollow" },
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
