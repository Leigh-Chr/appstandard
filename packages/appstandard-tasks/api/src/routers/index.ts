import { publicProcedure, router } from "@appstandard/api-core";
import { dashboardRouter } from "./dashboard";
import { groupRouter } from "./group";
import { importUrlRouter } from "./import-url";
import { mergeDuplicatesRouter } from "./merge-duplicates";
import { shareRouter } from "./share";
import { taskRouter } from "./task";
import { taskListRouter } from "./task-list";
import { userRouter } from "./user";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	taskList: taskListRouter,
	task: taskRouter,
	share: shareRouter,
	group: groupRouter,
	import: importUrlRouter,
	merge: mergeDuplicatesRouter,
	dashboard: dashboardRouter,
	user: userRouter,
});

export type AppRouter = typeof appRouter;
