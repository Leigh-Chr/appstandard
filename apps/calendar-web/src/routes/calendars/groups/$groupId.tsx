import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/calendars/groups/$groupId")({
	head: () => ({
		meta: [
			{ title: "Group - AppStandard Calendar" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
