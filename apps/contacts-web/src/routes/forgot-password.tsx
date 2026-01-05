import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/components/forgot-password";

const BASE_URL = "https://contacts.appstandard.app";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPassword,
	head: () => ({
		meta: [
			{ title: "Forgot Password - AppStandard Contacts" },
			{
				name: "description",
				content:
					"Reset your AppStandard Contacts account password if you've forgotten it.",
			},
			{
				property: "og:title",
				content: "Forgot Password - AppStandard Contacts",
			},
			{ property: "og:url", content: `${BASE_URL}/forgot-password` },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/forgot-password` }],
	}),
});
