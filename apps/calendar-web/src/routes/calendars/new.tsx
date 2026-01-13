/**
 * PERF-001: Route definition only - component is lazy loaded from new.lazy.tsx
 */
import { Card, CardContent, CardHeader, CardTitle } from "@appstandard/ui";
import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://calendar.appstandard.io";

export const Route = createFileRoute("/calendars/new")({
	head: () => ({
		meta: [
			{ title: "Create a calendar - AppStandard Calendar" },
			{
				name: "description",
				content:
					"Create a new calendar in seconds. Then add your events and export to any calendar app—Google Calendar, Apple Calendar, Outlook, and more.",
			},
			{
				property: "og:title",
				content: "Create a calendar - AppStandard Calendar",
			},
			{
				property: "og:description",
				content: "Create a new calendar in seconds.",
			},
			{ property: "og:url", content: `${BASE_URL}/calendars/new` },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/calendars/new` }],
	}),
	errorComponent: ({ error }) => {
		if (import.meta.env.DEV) {
			console.error("Route error:", error);
		}
		return (
			<div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<Card className="border-destructive/50 bg-destructive/5">
					<CardHeader>
						<CardTitle className="text-destructive">Loading error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							{error?.message || "An error occurred"}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	},
});
