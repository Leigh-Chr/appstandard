import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/account")({
	head: () => ({
		meta: [
			{ title: "My account - AppStandard Contacts" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: { mode: "signin", redirect: "/account" },
				throw: true,
			});
		}
		return { session };
	},
});
