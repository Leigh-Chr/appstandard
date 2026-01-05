import { createFileRoute, redirect } from "@tanstack/react-router";
import EditProfile from "@/components/edit-profile";
import { authClient } from "@/lib/auth-client";

const BASE_URL = "https://contacts.appstandard.app";

export const Route = createFileRoute("/edit-profile")({
	component: EditProfile,
	head: () => ({
		meta: [
			{ title: "Edit Profile - AppStandard Contacts" },
			{
				name: "description",
				content: "Edit your AppStandard Contacts account profile information.",
			},
			{ property: "og:title", content: "Edit Profile - AppStandard Contacts" },
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
