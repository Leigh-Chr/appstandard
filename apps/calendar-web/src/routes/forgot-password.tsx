import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/components/forgot-password";

const BASE_URL = "https://calendar.appstandard.io";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPassword,
	head: () => ({
		meta: [
			{ title: "Forgot Password - AppStandard Calendar" },
			{
				name: "description",
				content:
					"Reset your AppStandard Calendar account password if you've forgotten it.",
			},
			{
				property: "og:title",
				content: "Forgot Password - AppStandard Calendar",
			},
			{ property: "og:url", content: `${BASE_URL}/forgot-password` },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/forgot-password` }],
	}),
});
