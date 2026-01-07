import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tasks/merge")({
	head: () => ({
		meta: [
			{ title: "Merge task lists - AppStandard Tasks" },
			{
				name: "description",
				content:
					"Merge multiple task lists into one with automatic duplicate detection.",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
