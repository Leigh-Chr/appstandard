import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import {
	taskListViewDefaults,
	taskListViewSearchSchema,
} from "@/lib/search-params";

export const Route = createFileRoute("/tasks/$taskListId")({
	validateSearch: zodValidator(taskListViewSearchSchema),
	search: {
		middlewares: [stripSearchParams(taskListViewDefaults)],
	},
	head: () => ({
		meta: [
			{ title: "Task List - AppStandard Tasks" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
