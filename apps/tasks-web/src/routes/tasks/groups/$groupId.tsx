import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tasks/groups/$groupId")({
	head: () => ({
		meta: [
			{ title: "Group - AppStandard Tasks" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
