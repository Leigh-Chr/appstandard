import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
	head: () => ({
		meta: [
			{ title: "Dashboard - AppStandard Tasks" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
