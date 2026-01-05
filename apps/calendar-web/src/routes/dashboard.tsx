import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
	period: z.enum(["today", "week", "month", "year"]).default("week"),
});

export const Route = createFileRoute("/dashboard")({
	validateSearch: searchSchema,
	head: () => ({
		meta: [
			{ title: "Dashboard - AppStandard Calendar" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
