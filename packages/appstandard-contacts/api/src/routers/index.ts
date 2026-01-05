import { publicProcedure, router } from "@appstandard/api-core";
import { addressBookRouter } from "./address-book";
import { contactRouter } from "./contact";
import { dashboardRouter } from "./dashboard";
import { groupRouter } from "./group";
import { importUrlRouter } from "./import-url";
import { mergeDuplicatesRouter } from "./merge-duplicates";
import { shareRouter } from "./share";
import { userRouter } from "./user";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	addressBook: addressBookRouter,
	contact: contactRouter,
	share: shareRouter,
	group: groupRouter,
	import: importUrlRouter,
	merge: mergeDuplicatesRouter,
	dashboard: dashboardRouter,
	user: userRouter,
});

export type AppRouter = typeof appRouter;
