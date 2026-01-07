import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

const BASE_URL = "https://appstandard.app";

export const Route = createFileRoute("/delete-account")({
	head: () => ({
		meta: [
			{ title: "Delete Account - AppStandard Calendar" },
			{
				name: "description",
				content: "Delete your AppStandard Calendar account permanently.",
			},
			{
				property: "og:title",
				content: "Delete Account - AppStandard Calendar",
			},
			{ property: "og:url", content: `${BASE_URL}/delete-account` },
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
