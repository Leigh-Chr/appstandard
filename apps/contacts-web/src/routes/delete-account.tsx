import { authClient } from "@appstandard/react-utils";
import { createFileRoute, redirect } from "@tanstack/react-router";

const BASE_URL = "https://contacts.appstandard.io";

export const Route = createFileRoute("/delete-account")({
	head: () => ({
		meta: [
			{ title: "Delete Account - AppStandard Contacts" },
			{
				name: "description",
				content: "Delete your AppStandard Contacts account permanently.",
			},
			{
				property: "og:title",
				content: "Delete Account - AppStandard Contacts",
			},
			{ property: "og:url", content: `${BASE_URL}/delete-account` },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/delete-account` }],
	}),
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: { mode: "signin", redirect: "/delete-account" },
				throw: true,
			});
		}
		return { session };
	},
});
