import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tasks/import")({
	head: () => ({
		meta: [
			{ title: "Import tasks - AppStandard Tasks" },
			{
				name: "description",
				content:
					"Import a task list from an ICS file or URL. Compatible with Apple Reminders, Todoist, and all standard iCalendar formats.",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
