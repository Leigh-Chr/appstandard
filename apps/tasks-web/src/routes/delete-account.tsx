import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

const BASE_URL = "https://tasks.appstandard.app";

export const Route = createFileRoute("/delete-account")({
	head: () => ({
		meta: [
			{ title: "Delete Account - AppStandard Tasks" },
			{
				name: "description",
				content: "Delete your AppStandard Tasks account permanently.",
			},
			{ property: "og:title", content: "Delete Account - AppStandard Tasks" },
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
