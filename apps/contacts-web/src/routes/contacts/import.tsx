import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contacts/import")({
	head: () => ({
		meta: [
			{ title: "Import contacts - AppStandard Contacts" },
			{
				name: "description",
				content:
					"Import an address book from a vCard file or URL. Compatible with Google Contacts, Apple Contacts, Outlook, and all standard vCard formats.",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
