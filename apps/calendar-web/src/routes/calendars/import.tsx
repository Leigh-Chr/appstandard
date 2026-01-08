import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://calendar.appstandard.io";

export const Route = createFileRoute("/calendars/import")({
	head: () => ({
		meta: [
			{ title: "Import a calendar - AppStandard Calendar" },
			{
				name: "description",
				content:
					"Import an ICS calendar file from your device or from a URL. Compatible with exports from Google Calendar, Apple Calendar, Outlook, and all standard iCalendar formats.",
			},
			{
				property: "og:title",
				content: "Import a calendar - AppStandard Calendar",
			},
			{
				property: "og:description",
				content: "Import an ICS calendar file from your device or a URL.",
			},
			{ property: "og:url", content: `${BASE_URL}/calendars/import` },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/calendars/import` }],
	}),
});
