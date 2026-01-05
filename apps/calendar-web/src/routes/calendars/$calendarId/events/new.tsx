import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { newEventDefaults, newEventSearchSchema } from "@/lib/search-params";

export const Route = createFileRoute("/calendars/$calendarId/events/new")({
	validateSearch: zodValidator(newEventSearchSchema),
	search: {
		middlewares: [stripSearchParams(newEventDefaults)],
	},
	head: () => ({
		meta: [
			{ title: "New event - AppStandard Calendar" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
