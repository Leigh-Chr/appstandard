import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BASE_URL = "https://calendar.appstandard.io";

const subscribeSearchSchema = z.object({
	url: z.string().optional(),
});

export const Route = createFileRoute("/calendars/subscribe")({
	validateSearch: subscribeSearchSchema,
	head: () => ({
		meta: [
			{ title: "Subscribe to calendar - AppStandard Calendar" },
			{
				name: "description",
				content:
					"Subscribe to a calendar URL (webcal://). The calendar will be automatically updated.",
			},
			{
				property: "og:title",
				content: "Subscribe to calendar - AppStandard Calendar",
			},
			{
				property: "og:description",
				content: "Subscribe to a calendar URL and stay synchronized.",
			},
			{ property: "og:url", content: `${BASE_URL}/calendars/subscribe` },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/calendars/subscribe` }],
	}),
});
