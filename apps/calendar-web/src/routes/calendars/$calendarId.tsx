import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import {
	calendarViewDefaults,
	calendarViewSearchSchema,
} from "@/lib/search-params";

export const Route = createFileRoute("/calendars/$calendarId")({
	validateSearch: zodValidator(calendarViewSearchSchema),
	search: {
		middlewares: [stripSearchParams(calendarViewDefaults)],
	},
	head: () => ({
		meta: [
			{ title: "Calendar - AppStandard Calendar" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
