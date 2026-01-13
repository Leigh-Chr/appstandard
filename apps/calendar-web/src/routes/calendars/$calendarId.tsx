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
	/**
	 * PERF-010: Prefetch calendar details and events on navigation
	 */
	loader: async ({ context, params }) => {
		const { calendarId } = params;
		// Prefetch calendar details
		void context.queryClient.prefetchQuery(
			context.trpc.calendar.getById.queryOptions({ id: calendarId }),
		);
		// Prefetch events for this calendar
		void context.queryClient.prefetchQuery(
			context.trpc.event.list.queryOptions({ calendarId }),
		);
		// Prefetch groups this calendar belongs to
		void context.queryClient.prefetchQuery(
			context.trpc.calendar.group.getByCalendarId.queryOptions({ calendarId }),
		);
	},
	head: () => ({
		meta: [
			{ title: "Calendar - AppStandard Calendar" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
