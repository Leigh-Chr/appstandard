import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/calendars/groups/$groupId")({
	/**
	 * PERF-010: Prefetch group details on navigation
	 */
	loader: async ({ context, params }) => {
		const { groupId } = params;
		// Prefetch group details with calendars and members
		void context.queryClient.prefetchQuery(
			context.trpc.calendar.group.getById.queryOptions({ id: groupId }),
		);
	},
	head: () => ({
		meta: [
			{ title: "Group - AppStandard Calendar" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
