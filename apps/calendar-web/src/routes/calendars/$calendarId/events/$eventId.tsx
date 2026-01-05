import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/calendars/$calendarId/events/$eventId")({
	head: () => ({
		meta: [
			{ title: "Edit event - AppStandard Calendar" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
