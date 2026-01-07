import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
	head: () => ({
		meta: [
			{ title: "Dashboard - AppStandard Contacts" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
