import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import {
	mergeCalendarsDefaults,
	mergeCalendarsSearchSchema,
} from "@/lib/search-params";

export const Route = createFileRoute("/calendars/merge")({
	validateSearch: zodValidator(mergeCalendarsSearchSchema),
	search: {
		middlewares: [stripSearchParams(mergeCalendarsDefaults)],
	},
	head: () => ({
		meta: [
			{ title: "Merge calendars - AppStandard Calendar" },
			{
				name: "description",
				content:
					"Merge multiple ICS calendars into one with automatic duplicate detection.",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
