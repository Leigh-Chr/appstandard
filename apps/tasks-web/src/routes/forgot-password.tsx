import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/components/forgot-password";

const BASE_URL = "https://tasks.appstandard.app";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPassword,
	head: () => ({
		meta: [
			{ title: "Forgot Password - AppStandard Tasks" },
			{
				name: "description",
				content: "Reset your AppStandard Tasks account password.",
			},
			{ property: "og:title", content: "Forgot Password - AppStandard Tasks" },
			{ property: "og:url", content: `${BASE_URL}/forgot-password` },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/forgot-password` }],
	}),
});
