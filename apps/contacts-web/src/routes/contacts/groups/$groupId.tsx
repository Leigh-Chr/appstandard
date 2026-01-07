import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contacts/groups/$groupId")({
	head: () => ({
		meta: [
			{ title: "Group - AppStandard Contacts" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
