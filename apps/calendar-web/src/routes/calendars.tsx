import { Button } from "@appstandard/ui";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import {
	calendarsListDefaults,
	calendarsListSearchSchema,
} from "@/lib/search-params";

const BASE_URL = "https://calendar.appstandard.io";

export const Route = createFileRoute("/calendars")({
	validateSearch: zodValidator(calendarsListSearchSchema),
	search: {
		middlewares: [stripSearchParams(calendarsListDefaults)],
	},
	errorComponent: ({ error }) => {
		if (import.meta.env.DEV) {
			console.error("Route error:", error);
		}
		return (
			<div className="container mx-auto max-w-2xl px-4 py-10">
				<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
					<h2 className="font-semibold text-destructive text-lg">
						An error occurred
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						{error?.message ||
							"An unexpected error occurred. Please try again."}
					</p>
					<Button
						type="button"
						onClick={() => window.location.reload()}
						className="mt-4"
					>
						Reload page
					</Button>
				</div>
			</div>
		);
	},
	head: () => ({
		meta: [
			{ title: "My calendars - AppStandard Calendar" },
			{
				name: "description",
				content:
					"Manage all your ICS calendars in one place. Create, edit, merge, and export your calendars easily.",
			},
			{ property: "og:title", content: "My calendars - AppStandard Calendar" },
			{
				property: "og:description",
				content: "Manage all your ICS calendars in one place.",
			},
			{ property: "og:url", content: `${BASE_URL}/calendars` },
			{ name: "robots", content: "noindex, nofollow" }, // Private page
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/calendars` }],
	}),
});
