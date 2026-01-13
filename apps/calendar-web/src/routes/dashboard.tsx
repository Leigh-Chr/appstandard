import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
	period: z.enum(["today", "week", "month", "year"]).default("week"),
});

export const Route = createFileRoute("/dashboard")({
	validateSearch: searchSchema,
	/**
	 * PERF-010: Prefetch dashboard stats on navigation
	 * Uses loaderDeps to access search params in the loader
	 */
	loaderDeps: ({ search }) => ({ period: search.period }),
	loader: async ({ context, deps }) => {
		const period = deps.period || "week";
		void context.queryClient.prefetchQuery(
			context.trpc.dashboard.getStats.queryOptions({ period }),
		);
	},
	head: () => ({
		meta: [
			{ title: "Dashboard - AppStandard Calendar" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
