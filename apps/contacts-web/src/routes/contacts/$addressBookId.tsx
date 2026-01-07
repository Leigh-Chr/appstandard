import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import {
	addressBookViewDefaults,
	addressBookViewSearchSchema,
} from "@/lib/search-params";

export const Route = createFileRoute("/contacts/$addressBookId")({
	validateSearch: zodValidator(addressBookViewSearchSchema),
	search: {
		middlewares: [stripSearchParams(addressBookViewDefaults)],
	},
	head: () => ({
		meta: [
			{ title: "Address Book - AppStandard Contacts" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
