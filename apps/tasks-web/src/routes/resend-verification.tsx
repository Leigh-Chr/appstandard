import { createFileRoute } from "@tanstack/react-router";
import ResendVerification from "@/components/resend-verification";

const BASE_URL = "https://tasks.appstandard.io";

export const Route = createFileRoute("/resend-verification")({
	component: ResendVerification,
	head: () => ({
		meta: [
			{ title: "Resend Verification Email - AppStandard Tasks" },
			{
				name: "description",
				content:
					"Resend the verification email for your AppStandard Tasks account if you didn't receive it.",
			},
			{
				property: "og:title",
				content: "Resend Verification Email - AppStandard Tasks",
			},
			{ property: "og:url", content: `${BASE_URL}/resend-verification` },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "canonical", href: `${BASE_URL}/resend-verification` }],
	}),
});
