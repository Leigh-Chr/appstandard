import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contacts/merge")({
	head: () => ({
		meta: [
			{ title: "Merge address books - AppStandard Contacts" },
			{
				name: "description",
				content:
					"Merge multiple address books into one with automatic duplicate detection.",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
