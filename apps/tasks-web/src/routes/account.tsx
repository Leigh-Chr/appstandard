import { authClient } from "@appstandard/react-utils";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
	head: () => ({
		meta: [
			{ title: "My account - AppStandard Tasks" },
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
